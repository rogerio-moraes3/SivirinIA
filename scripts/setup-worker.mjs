import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { execFileSync } from "node:child_process";
const path = ".local/worker.env";
let password;
if (existsSync(path)) {
  const config = parseEnv(readFileSync(path, "utf8"));
  const url = new URL(config.WORKER_DATABASE_URL);
  if (url.hostname !== "127.0.0.1" || url.username !== "sivirinia_worker")
    throw new Error("Configuração local de worker inválida.");
  password = url.password;
} else {
  password = randomBytes(32).toString("hex");
  writeFileSync(
    path,
    `WORKER_DATABASE_URL=postgres://sivirinia_worker:${password}@127.0.0.1:54322/postgres\n`,
    { mode: 0o600, flag: "wx" },
  );
}
if (!/^[a-f0-9]{64}$/.test(password))
  throw new Error("Credencial local inesperada; não foi alterada.");
// Send the password through stdin, never command arguments or output.
execFileSync(
  "docker",
  [
    "compose",
    "--env-file",
    ".local/runtime.env",
    "-f",
    "infra/compose.yml",
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
    "-q",
  ],
  {
    input: `alter role sivirinia_worker login password '${password}';`,
    stdio: ["pipe", "pipe", "pipe"],
  },
);
console.log(
  "Worker local provisionado com papel restrito; credencial privada preservada.",
);
