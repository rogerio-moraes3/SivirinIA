// Real isolated startup check; removes only its own fresh Compose project and fixtures.
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { createServer } from "node:net";
import { parseEnv } from "node:util";
import { setTimeout } from "node:timers/promises";
import assert from "node:assert/strict";
const project = "sivirinia-cold-" + randomUUID().replaceAll("-", "");
const work = mkdtempSync(".local/cold-check-");
const config = parseEnv(readFileSync(".local/runtime.env", "utf8"));
async function freePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
const authPort = await freePort(),
  restPort = await freePort();
const override = `${work}/ports.yml`;
writeFileSync(
  override,
  `services:\n  db:\n    ports: !reset []\n  mail:\n    ports: !reset []\n  auth:\n    ports: !override [\"127.0.0.1:${authPort}:9999\"]\n  rest:\n    ports: !override [\"127.0.0.1:${restPort}:3000\"]\n`,
  { mode: 0o600 },
);
const args = [
  "compose",
  "--project-name",
  project,
  "--env-file",
  ".local/runtime.env",
  "-f",
  "infra/compose.yml",
  "-f",
  override,
];
const run = (extra, options = {}) =>
  execFileSync("docker", [...args, ...extra], {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    ...options,
  });
const sql = (input) =>
  run(
    [
      "exec",
      "-T",
      "db",
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-Atq",
    ],
    { input },
  );
let succeeded = false;
try {
  run(["up", "-d", "--wait"], { timeout: 180000 });
  let healthy = false;
  for (let i = 0; i < 60; i++) {
    try {
      healthy = (
        await fetch(`http://127.0.0.1:${authPort}/health`, {
          signal: AbortSignal.timeout(2000),
        })
      ).ok;
    } catch {}
    if (healthy) break;
    await setTimeout(1000);
  }
  assert(healthy, "Supabase Auth não ficou saudável na instalação limpa.");
  sql(readFileSync("infra/auth-compat.sql", "utf8"));
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    sql(
      `begin;\n${readFileSync("supabase/migrations/" + file, "utf8")}\ncommit;`,
    );
  sql("notify pgrst,'reload schema';");
  const signup = await fetch(`http://127.0.0.1:${authPort}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: config.ANON_KEY },
    body: JSON.stringify({
      email: `cold-${Date.now()}@example.test`,
      password: "SivirinIA-cold-test-password-2026",
    }),
  });
  assert(signup.ok, "Cadastro real não funcionou na instalação limpa.");
  const session = await signup.json();
  assert(session.access_token, "Auth não emitiu uma sessão real.");
  async function rpc(name, body) {
    const response = await fetch(`http://127.0.0.1:${restPort}/rpc/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });
    assert(
      response.ok,
      `RPC ${name} falhou na instalação limpa (HTTP ${response.status}).`,
    );
    return response.json();
  }
  const org = await rpc("create_organization", {
    org_name: "Inicialização limpa de teste",
  });
  const agent = await rpc("save_agent", {
    org,
    agent_name: "Agente de teste isolado",
  });
  const content = "A política de reembolso prevê sete dias.";
  await rpc("ingest_source", {
    org,
    source_title: "Política de teste",
    source_kind: "text",
    source_url: null,
    hash: createHash("sha256").update(content).digest("hex"),
    pages: 1,
    chars: content.length,
    chunks: [{ content, page: null }],
  });
  const evidence = await rpc("search_agent_knowledge", {
    org,
    agent,
    query: "reembolso",
    query_embedding: null,
    model_name: null,
  });
  assert.equal(
    evidence[0]?.content,
    content,
    "Busca não recuperou o texto real indexado.",
  );
  assert.equal(
    sql("select count(*) from public.organizations;").trim(),
    "1",
    "A verificação não atingiu o banco isolado correto.",
  );
  assert.equal(
    sql("select count(*) from auth.users;").trim(),
    "1",
    "Cadastro não foi persistido no Auth isolado.",
  );
  succeeded = true;
  console.log(
    "Inicialização limpa passou: bootstrap, Auth real, 9 migrations, cadastro, organização, agente, indexação e busca com JWT/RLS.",
  );
} catch (error) {
  writeFileSync(
    `${work}/failure.log`,
    String(error.stderr || error.stack || error),
    { mode: 0o600 },
  );
  console.error(
    `Falha na inicialização limpa. Diagnóstico privado em ${work}/failure.log`,
  );
  process.exitCode = 1;
} finally {
  try {
    run(["down", "--volumes", "--remove-orphans"], { timeout: 60000 });
  } catch {
    console.error(
      `Limpeza do projeto de teste ${project} precisa ser verificada.`,
    );
    process.exitCode = 1;
  }
  if (succeeded) rmSync(work, { recursive: true, force: true });
}
