import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const prefix = [
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
function sql(input) {
  return execFileSync("docker", prefix, {
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}
const applied = new Map(
  sql("select version,sha256 from sivirinia_internal.migrations;")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("|")),
);
for (const file of readdirSync("supabase/migrations")
  .filter((f) => f.endsWith(".sql"))
  .sort()) {
  const content = readFileSync(`supabase/migrations/${file}`, "utf8");
  const hash = createHash("sha256").update(content).digest("hex");
  if (applied.has(file)) {
    if (applied.get(file) !== hash)
      throw new Error(`Migration já aplicada foi alterada: ${file}`);
    continue;
  }
  try {
    sql(
      `begin;\n${content}\ninsert into sivirinia_internal.migrations(version,sha256) values('${file.replaceAll("'", "''")}','${hash}');\ncommit;\nnotify pgrst,'reload schema';`,
    );
    console.log(`Migration aplicada: ${file}`);
  } catch (error) {
    process.stderr.write(
      String(error.stderr).replace(/[A-Za-z0-9_-]{64,}/g, "[valor omitido]"),
    );
    throw new Error(`Falha na migration ${file}`);
  }
}
console.log("Migrations verificadas.");
