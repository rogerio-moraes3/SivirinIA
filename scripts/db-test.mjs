import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
const args = [
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
  "-Atq",
];
const helpers = readFileSync("infra/test-assertions.sql", "utf8");
let total = 0;
for (const file of readdirSync("supabase/tests")
  .filter((f) => f.endsWith(".sql"))
  .sort()) {
  const test = readFileSync(`supabase/tests/${file}`, "utf8");
  try {
    const output = execFileSync("docker", args, {
      input: test.replace("begin;", () => `begin;\n${helpers}`),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    const count = Number(output.match(/ASSERTIONS=(\d+)/)?.[1]);
    if (!count) throw new Error("Nenhuma asserção executada.");
    total += count;
    console.log(`${file}: ${count} asserções reais de PostgreSQL passaram.`);
  } catch (error) {
    if (error.stderr)
      process.stderr.write(
        String(error.stderr).replace(/[A-Za-z0-9_-]{32,}/g, "[valor omitido]"),
      );
    throw new Error(`Falha na suíte SQL ${file}`);
  }
}
if (!total) throw new Error("Suíte SQL vazia.");
console.log(
  `Banco: ${total} asserções passaram. Todas as fixtures foram revertidas por rollback.`,
);
