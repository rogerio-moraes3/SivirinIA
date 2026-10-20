import "server-only";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { normalize, type Page } from "./knowledge";
const run = promisify(execFile);
export const OCR_MAX_PAGES = 5;
export const OCR_MODEL_SHA =
  "c4932b937207a9514b7514d518b931a99938c02a28a5a5a553f8599ed58b7deb";
export async function ocrAvailable() {
  try {
    return (
      createHash("sha256")
        .update(await readFile(path.resolve(".cache/ocr/por.traineddata")))
        .digest("hex") === OCR_MODEL_SHA
    );
  } catch {
    return false;
  }
}
async function native(binary: string, args: string[], timeout = 10000) {
  try {
    return await run(
      "prlimit",
      ["--as=805306368", "--cpu=10", "--", binary, ...args],
      {
        timeout,
        maxBuffer: 4 * 1024 * 1024,
        encoding: "utf8",
        env: {
          PATH: process.env.PATH,
          NODE_ENV: "production",
          LANG: "C.UTF-8",
          OMP_THREAD_LIMIT: "1",
        },
      },
    );
  } catch {
    throw new Error("ocr_failed");
  }
}
async function recognize(
  file: string,
): Promise<{ text: string; confidence: number | null }> {
  const { stdout } = await native("tesseract", [
    file,
    "stdout",
    "--tessdata-dir",
    path.resolve(".cache/ocr"),
    "-l",
    "por",
    "--psm",
    "3",
    "-c",
    "tessedit_create_tsv=1",
  ]);
  const rows = stdout
    .trim()
    .split("\n")
    .slice(1)
    .map((row) => row.split("\t"));
  const lines = new Map<string, string[]>();
  let score = 0,
    words = 0;
  for (const row of rows) {
    if (row[0] !== "5" || !row[11]?.trim()) continue;
    const key = row.slice(1, 5).join(":");
    const line = lines.get(key) || [];
    line.push(row.slice(11).join("\t"));
    lines.set(key, line);
    const confidence = Number(row[10]);
    if (confidence >= 0) {
      score += confidence;
      words++;
    }
  }
  return {
    text: normalize(
      [...lines.values()].map((words) => words.join(" ")).join("\n"),
    ),
    confidence: words ? Math.round(score / words) : null,
  };
}
export function validateRaster(bytes: Buffer) {
  let width = 0,
    height = 0;
  if (
    bytes.length >= 24 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    width = bytes.readUInt32BE(16);
    height = bytes.readUInt32BE(20);
  } else if (bytes[0] === 255 && bytes[1] === 216) {
    let pos = 2;
    while (pos + 9 < bytes.length) {
      if (bytes[pos++] !== 255) break;
      while (bytes[pos] === 255) pos++;
      const marker = bytes[pos++];
      if (marker === 0xda || marker === 0xd9) break;
      const size = bytes.readUInt16BE(pos);
      if (size < 2 || pos + size > bytes.length) break;
      if ([0xc0, 0xc1, 0xc2].includes(marker)) {
        height = bytes.readUInt16BE(pos + 3);
        width = bytes.readUInt16BE(pos + 5);
        break;
      }
      pos += size;
    }
  }
  if (
    !width ||
    !height ||
    width > 4096 ||
    height > 4096 ||
    width * height > 12_000_000
  )
    throw new Error("ocr_image_limit");
  return { width, height };
}
export async function imageOcr(
  bytes: Buffer,
  work: string,
  index: number,
  page: number | null,
): Promise<Page> {
  if (!(await ocrAvailable())) throw new Error("ocr_unavailable");
  validateRaster(bytes);
  const file = path.join(work, `image-${index}.bin`);
  await writeFile(file, bytes, { mode: 0o600 });
  const result = await recognize(file);
  if (!result.text) throw new Error("ocr_no_text");
  return {
    text: result.text,
    page,
    method: "ocr",
    ocr: {
      engine: "tesseract",
      language: "por",
      confidence: result.confidence,
      image: index,
    },
  };
}
export async function pdfOcr(
  bytes: Buffer,
  work: string,
  nativePages: Page[],
): Promise<Page[]> {
  if (!(await ocrAvailable())) throw new Error("ocr_unavailable");
  const file = path.join(work, "input.pdf");
  await writeFile(file, bytes, { mode: 0o600 });
  const info = await native("pdfinfo", [file]);
  const count = Number(info.stdout.match(/^Pages:\s+(\d+)/m)?.[1]);
  if (!count || count > OCR_MAX_PAGES) throw new Error("ocr_page_limit");
  const pages: Page[] = [];
  for (let page = 1; page <= count; page++) {
    const prefix = path.join(work, `page-${page}`);
    await native("pdftoppm", [
      "-f",
      String(page),
      "-l",
      String(page),
      "-singlefile",
      "-scale-to",
      "1800",
      "-r",
      "180",
      "-gray",
      "-png",
      file,
      prefix,
    ]);
    if ((await stat(prefix + ".png")).size > 10 * 1024 * 1024)
      throw new Error("ocr_image_limit");
    const recognized = await recognize(prefix + ".png");
    const original = normalize(
      nativePages.find((p) => p.page === page)?.text || "",
    );
    const existing = new Set(
      original
        .toLocaleLowerCase("pt-BR")
        .split("\n")
        .map((s) => s.trim()),
    );
    const extra = recognized.text
      .split("\n")
      .filter((line) => !existing.has(line.toLocaleLowerCase("pt-BR").trim()))
      .join("\n");
    const text = normalize(original + (original && extra ? "\n" : "") + extra);
    if (text)
      pages.push({
        text,
        page,
        method: original ? "hybrid" : "ocr",
        ocr: {
          engine: "tesseract",
          language: "por",
          confidence: recognized.confidence,
        },
      });
  }
  if (!pages.length) throw new Error("ocr_no_text");
  return pages;
}
