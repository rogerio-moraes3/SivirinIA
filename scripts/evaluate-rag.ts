// Actual PostgreSQL retrieval and answer adapter; synthetic fixtures are always rolled back.
import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd(), false);
import pg from "pg";
import { readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { randomUUID } from "node:crypto";
import { answerQuestion, embedTexts, enrichChunks } from "../lib/ai";
import { chunkPages, contentHash, type Evidence } from "../lib/knowledge";
const provider = process.argv.includes("--provider");
if (
  provider &&
  (process.env.AI_EVAL_ALLOW_PAID !== "true" ||
    process.env.AI_ENABLED !== "true" ||
    !process.env.AI_API_KEY ||
    !process.env.AI_CHAT_MODEL)
)
  throw new Error(
    "Validação externa exige autorização de orçamento, AI_EVAL_ALLOW_PAID=true e provedor configurado em segredos.",
  );
if (!provider) process.env.AI_ENABLED = "false"; // No accidental billable calls, even if the app has an enabled key.
if (process.env.NEXT_PUBLIC_SUPABASE_URL !== "http://127.0.0.1:54321")
  throw new Error("Avaliação com fixtures exige instância local.");
const config = parseEnv(readFileSync(".local/runtime.env", "utf8"));
const db = new pg.Client({
  host: "127.0.0.1",
  port: 54322,
  user: "postgres",
  password: config.DB_PASSWORD,
  database: "postgres",
  statement_timeout: 15000,
});
const corpus = JSON.parse(
  readFileSync("tests/fixtures/rag-ptbr.json", "utf8"),
) as {
  documents: { key: string; title: string; text: string; page: number }[];
  cases: { question: string; expected: string[]; contains?: string }[];
};
await db.connect();
const owner = randomUUID(),
  org = randomUUID();
const ids = new Map<string, string>();
const results = [];
try {
  await db.query("begin");
  await db.query(
    "insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())",
    [owner, `eval-${owner}@example.test`],
  );
  await db.query("insert into public.organizations(id,name) values($1,$2)", [
    org,
    "Avaliação sintética com rollback",
  ]);
  await db.query(
    "insert into public.organization_members(organization_id,user_id,role) values($1,$2,$3)",
    [org, owner, "owner"],
  );
  await db.query("set local role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [owner]);
  const agent = (
    await db.query("select public.save_agent($1,$2) as id", [
      org,
      "Agente de avaliação",
    ])
  ).rows[0].id;
  for (const doc of corpus.documents) {
    const pages = [{ text: doc.text, page: doc.page }];
    const chunks = chunkPages(pages);
    if (provider) await enrichChunks(chunks);
    const source = (
      await db.query(
        "select public.ingest_source($1,$2,$3,null,$4,1,$5,$6) as id",
        [
          org,
          doc.title,
          "pdf",
          contentHash(pages),
          doc.text.length,
          JSON.stringify(chunks),
        ],
      )
    ).rows[0].id;
    ids.set(doc.key, source);
  }
  for (const item of corpus.cases) {
    const started = performance.now();
    const embedding = provider
      ? (await embedTexts([item.question]))?.[0]
      : null;
    const rows = (
      await db.query(
        "select * from public.search_agent_knowledge($1,$2,$3,$4,$5)",
        [
          org,
          agent,
          item.question,
          embedding ? JSON.stringify(embedding) : null,
          process.env.AI_EMBEDDING_MODEL || null,
        ],
      )
    ).rows as Evidence[];
    const answer = await answerQuestion(item.question, rows, "");
    const expected = new Set(item.expected.map((k) => ids.get(k)));
    const retrieved = new Set(rows.map((r) => r.source_id));
    const matching = [...retrieved].filter((id) => expected.has(id)).length;
    const refsValid = answer.citations.every((c) =>
      rows.some(
        (r) =>
          r.id === c.chunk_id &&
          r.source_id === c.source_id &&
          r.page === c.page &&
          r.version === c.version &&
          r.content === c.quote,
      ),
    );
    const abstentionCorrect =
      (answer.mode === "abstention") === (expected.size === 0);
    const answerTermPresent =
      !item.contains ||
      answer.text
        .toLocaleLowerCase("pt-BR")
        .includes(item.contains.toLocaleLowerCase("pt-BR"));
    const passed =
      refsValid &&
      abstentionCorrect &&
      answerTermPresent &&
      matching === expected.size &&
      matching === retrieved.size;
    results.push({
      question: item.question,
      passed,
      retrievalPrecision: retrieved.size ? matching / retrieved.size : null,
      retrievalRecall: expected.size ? matching / expected.size : null,
      citationsExact: refsValid,
      abstentionCorrect,
      answerTermPresent,
      mode: answer.mode,
      latencyMs: Math.round(performance.now() - started),
      costUsd: answer.cost,
    });
  }
} finally {
  await db.query("rollback");
  await db.end();
}
const summary = {
  kind: provider
    ? "external-provider-evaluation"
    : "real-postgresql-extractive-evaluation",
  syntheticCorpus: true,
  providerCalled: provider,
  model: provider ? process.env.AI_CHAT_MODEL : null,
  total: results.length,
  passed: results.filter((r) => r.passed).length,
  results,
};
writeFileSync(
  ".local/rag-evaluation.json",
  JSON.stringify(summary, null, 2) + "\n",
  { mode: 0o600 },
);
console.log(
  `Avaliação ${provider ? "com provedor autorizado" : "documental sem IA"}: ${summary.passed}/${summary.total} casos passaram. Relatório privado: .local/rag-evaluation.json. Fixtures revertidas.`,
);
if (summary.passed !== summary.total) process.exitCode = 1;
