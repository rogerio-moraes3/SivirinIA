import { crawlSite, diffCrawls, type CrawlResult } from "../lib/site-crawler";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const input = process.argv[2];
if (!input) throw new Error("Informe uma URL HTTPS pública.");
const option = (name: string) =>
  process.argv
    .find((a) => a.startsWith(`--${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");
const result = await crawlSite(input, {
  maxPages: option("pages") ? Number(option("pages")) : 10,
  maxDepth: option("depth") ? Number(option("depth")) : 2,
  sitemap: option("sitemap"),
});
await mkdir(".local/crawls", { recursive: true, mode: 0o700 });
const file =
  ".local/crawls/" +
  createHash("sha256").update(result.scope).digest("hex").slice(0, 24) +
  ".json";
let previous: CrawlResult | undefined;
try {
  previous = JSON.parse(await readFile(file, "utf8")).result;
} catch {}
const changes = diffCrawls(previous, result);
// An incomplete attempt never replaces the last complete reference used for deletion detection.
await writeFile(
  file + (result.complete ? "" : ".incomplete"),
  JSON.stringify({ result, changes }, null, 2),
  { mode: 0o600 },
);
console.log(
  `Crawler: ${result.pages.length} páginas; ${result.failures.length} falhas; varredura ${result.complete ? "completa" : "incompleta"}. Relatório privado em .local/crawls/.`,
);
if (!result.complete) process.exitCode = 1;
