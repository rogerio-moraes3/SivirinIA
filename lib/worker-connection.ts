import { readFileSync } from "node:fs";
import type { ClientConfig } from "pg";
export function workerConnection(
  connectionString: string,
  env: Record<string, string | undefined> = process.env,
): ClientConfig {
  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("Protocolo de banco inválido.");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (env.APP_ENV === "staging") {
    const ref = env.STAGING_SUPABASE_PROJECT_REF;
    if (!ref || !/^[a-z]{20}$/.test(ref))
      throw new Error("Configure a referência do projeto de testes.");
    const direct =
      url.hostname === `db.${ref}.supabase.co` &&
      decodeURIComponent(url.username) === "sivirinia_worker";
    const pooler =
      /^[a-z0-9-]+\.pooler\.supabase\.com$/.test(url.hostname) &&
      decodeURIComponent(url.username) === `sivirinia_worker.${ref}`;
    if (local || !(direct || pooler) || (url.port && url.port !== "5432"))
      throw new Error(
        "Worker exige o banco de testes e conexão direta ou pooler de sessão.",
      );
  }
  if (
    !local &&
    ["disable", "allow", "prefer", "no-verify"].includes(
      url.searchParams.get("sslmode") || "",
    )
  )
    throw new Error("TLS com certificado validado é obrigatório.");
  // pg connection-string SSL parameters otherwise override explicit verification.
  for (const key of ["ssl", "sslmode", "sslcert", "sslkey", "sslrootcert"])
    url.searchParams.delete(key);
  return {
    connectionString: url.toString(),
    ssl: local
      ? false
      : {
          rejectUnauthorized: true,
          servername: url.hostname,
          ...(env.WORKER_CA_FILE
            ? { ca: readFileSync(env.WORKER_CA_FILE, "utf8") }
            : {}),
        },
    application_name: "sivirinia-document-worker",
    connectionTimeoutMillis: 10000,
    statement_timeout: 15000,
  };
}
