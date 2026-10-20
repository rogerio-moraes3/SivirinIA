/** Manual operator command, never run during Vercel build. No reset/bootstrap. */
import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { workerConnection } from "../lib/worker-connection";
const ref = process.env.STAGING_SUPABASE_PROJECT_REF;
if (
  process.env.APP_ENV !== "staging" ||
  !/^[a-z]{20}$/.test(ref || "") ||
  ref === process.env.PRODUCTION_SUPABASE_PROJECT_REF
)
  throw new Error("Exige projeto de homologação separado.");
if (process.env.STAGING_MIGRATION_CONFIRM !== ref)
  throw new Error(
    "Confirme a referência em STAGING_MIGRATION_CONFIRM antes de alterar o banco.",
  );
const url = new URL(process.env.STAGING_DATABASE_URL || "");
const direct =
  url.hostname === `db.${ref}.supabase.co` && url.username === "postgres";
const pooler =
  /^[a-z0-9-]+\.pooler\.supabase\.com$/.test(url.hostname) &&
  url.username === `postgres.${ref}`;
if (!(direct || pooler) || (url.port && url.port !== "5432"))
  throw new Error(
    "Use conexão administrativa direta ou pooler de sessão do projeto de testes.",
  );
// Reuse verified TLS policy without the worker-only identity constraint.
const db = new pg.Client(
  workerConnection(url.toString(), { ...process.env, APP_ENV: "migration" }),
);
try {
  await db.connect();
  await db.query("select pg_advisory_lock(738219040)");
  const prerequisites = await db.query(
    "select to_regclass('auth.users') as auth, to_regclass('sivirinia_internal.migrations') as tracker, to_regclass('public.organizations') as orgs",
  );
  if (!prerequisites.rows[0].auth) throw new Error("Auth Supabase ausente.");
  if (prerequisites.rows[0].orgs && !prerequisites.rows[0].tracker)
    throw new Error("Banco existente sem histórico: pare para revisão manual.");
  const extensions = await db.query(
    "select e.extname,n.nspname from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname in ('vector','pgcrypto')",
  );
  if (extensions.rows.some((r) => r.nspname !== "extensions"))
    throw new Error(
      "Extensões devem estar no schema extensions; revisar sem mover automaticamente.",
    );
  await db.query(
    "create schema if not exists sivirinia_internal; revoke all on schema sivirinia_internal from public; create table if not exists sivirinia_internal.migrations(version text primary key,sha256 text not null,applied_at timestamptz not null default now())",
  );
  const applied = new Map(
    (
      await db.query("select version,sha256 from sivirinia_internal.migrations")
    ).rows.map((r) => [r.version, r.sha256]),
  );
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    const sql = readFileSync(`supabase/migrations/${file}`, "utf8");
    const hash = createHash("sha256").update(sql).digest("hex");
    if (applied.has(file)) {
      if (applied.get(file) !== hash)
        throw new Error("Migration aplicada foi modificada.");
      continue;
    }
    await db.query("begin");
    try {
      await db.query(sql);
      await db.query(
        "insert into sivirinia_internal.migrations(version,sha256) values($1,$2)",
        [file, hash],
      );
      await db.query("commit");
      console.log(`Aplicada: ${file}`);
    } catch {
      await db.query("rollback");
      throw new Error(
        `Migration falhou: ${file}. Nenhum segredo foi registrado.`,
      );
    }
  }
  await db.query("notify pgrst,'reload schema'");
  console.log(
    "Migrations verificadas no projeto de testes. Configure Auth e execute validações remotas antes de liberar acesso.",
  );
} catch {
  console.error(
    "Migração não concluída. Verifique alvo, conectividade, certificado e permissões; credenciais não foram exibidas.",
  );
  process.exitCode = 1;
} finally {
  await db.end();
}
