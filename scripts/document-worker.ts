import pg from "pg";
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { setTimeout } from "node:timers/promises";
import {
  extractInChild,
  prepareIndex,
  classifyTaskFailure,
  type DocumentInput,
} from "../lib/document-pipeline";
const local = existsSync(".local/worker.env")
  ? parseEnv(readFileSync(".local/worker.env", "utf8"))
  : {};
const connectionString =
  process.env.WORKER_DATABASE_URL || local.WORKER_DATABASE_URL;
if (!connectionString)
  throw new Error(
    "Configure WORKER_DATABASE_URL de forma segura ou execute npm run worker:setup localmente.",
  );
const db = new pg.Client({
  connectionString,
  application_name: "sivirinia-document-worker",
  statement_timeout: 15000,
});
await db.connect();
const identity = await db.query("select current_user");
if (identity.rows[0].current_user !== "sivirinia_worker") {
  await db.end();
  throw new Error("Worker exige papel restrito sivirinia_worker.");
}
console.log("Worker pronto.");
let stopping = false;
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => {
    stopping = true;
  });
const once = process.argv.includes("--once");
try {
  do {
    const result = await db.query(
      "select sivirinia_internal.claim_document() as task",
    );
    const task = result.rows[0].task as DocumentInput | null;
    if (!task) {
      if (once) break;
      await setTimeout(1000);
      continue;
    }
    try {
      const extracted = await extractInChild(task);
      const index = prepareIndex(extracted.pages);
      await db.query(
        "select sivirinia_internal.finish_document($1,$2,$3,$4,$5,$6)",
        [
          task.id,
          task.token,
          JSON.stringify(extracted.pages),
          extracted.kind,
          JSON.stringify(index.chunks),
          index.hash,
        ],
      );
      console.log(`Tarefa ${task.id}: concluída.`);
    } catch (error) {
      const failure = classifyTaskFailure(error);
      await db.query("select sivirinia_internal.fail_document($1,$2,$3,$4)", [
        task.id,
        task.token,
        failure.code,
        failure.retryable,
      ]);
      console.log(`Tarefa ${task.id}: ${failure.code}.`);
    }
  } while (!stopping && !once);
} finally {
  await db.end();
}
