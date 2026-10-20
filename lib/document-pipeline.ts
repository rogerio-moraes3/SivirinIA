import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { chunkPages, contentHash, type Page } from "./knowledge";
export type DocumentInput = {
  id: string;
  token: string;
  filename: string;
  mode: "text" | "file";
  base64: string;
  ocr?: boolean;
};
export async function extractInChild(
  task: DocumentInput,
  timeout = 60_000,
): Promise<{ pages: Page[]; kind: string }> {
  const work = await mkdtemp(path.join(tmpdir(), "sivirinia-extract-"));
  let closed: Promise<void> = Promise.resolve();
  try {
    return await new Promise<{ pages: Page[]; kind: string }>(
      (resolve, reject) => {
        const child = spawn(
          process.execPath,
          [
            "--max-old-space-size=512",
            "--conditions=react-server",
            "--import",
            "tsx",
            "scripts/extract-document.ts",
          ],
          {
            cwd: process.cwd(),
            detached: process.platform !== "win32",
            env: {
              PATH: process.env.PATH,
              NODE_ENV: "production",
              OCR_WORK_DIR: work,
            },
            stdio: ["pipe", "pipe", "pipe"],
          },
        );
        closed = new Promise<void>((resolve) =>
          child.once("close", () => resolve()),
        );
        let output = "",
          diagnostic = "";
        let settled = false;
        const fail = (code: string) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            try {
              if (process.platform !== "win32" && child.pid)
                process.kill(-child.pid, "SIGKILL");
              else child.kill("SIGKILL");
            } catch {}
            reject(new Error(code));
          }
        };
        const timer = setTimeout(() => fail("worker_timeout"), timeout);
        child.on("error", () => fail("internal_error"));
        child.stdout.on("data", (bytes: Buffer) => {
          output += bytes.toString();
          if (output.length > 12_000_000) fail("invalid_document");
        });
        child.stderr.on("data", (bytes: Buffer) => {
          diagnostic = (diagnostic + bytes.toString()).slice(0, 128);
        });
        child.on("close", (code) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (code !== 0) {
            reject(
              new Error(
                diagnostic.match(
                  /ocr_(unavailable|failed|no_text|page_limit|image_limit|required)/,
                )?.[0] ||
                  (diagnostic.includes("invalid_document")
                    ? "invalid_document"
                    : "internal_error"),
              ),
            );
            return;
          }
          try {
            resolve(JSON.parse(output));
          } catch {
            reject(new Error("invalid_document"));
          }
        });
        child.stdin.on("error", () => fail("internal_error"));
        child.stdin.end(
          JSON.stringify({
            filename: task.filename,
            mode: task.mode,
            base64: task.base64,
            ocr: task.ocr === true,
          }),
        );
      },
    );
  } finally {
    await closed;
    await rm(work, { recursive: true, force: true });
  }
}
export function prepareIndex(pages: Page[]) {
  return { chunks: chunkPages(pages), hash: contentHash(pages) };
}
export function classifyTaskFailure(error: unknown): {
  code: string;
  retryable: boolean;
} {
  const message = error instanceof Error ? error.message : "";
  if (
    /^ocr_(unavailable|failed|no_text|page_limit|image_limit|required)$/.test(
      message,
    )
  )
    return { code: message, retryable: false };
  if (message.includes("worker_timeout"))
    return { code: "worker_timeout", retryable: true };
  if (/duplicad|duplicate key/i.test(message))
    return { code: "duplicate", retryable: false };
  if (/Limite|quota/i.test(message))
    return { code: "quota_exceeded", retryable: false };
  if (/alterada/.test(message))
    return { code: "version_conflict", retryable: false };
  if (/permissão/.test(message))
    return { code: "access_revoked", retryable: false };
  if (/invalid_document|Documento|documento|vazio|fragmentos/.test(message))
    return { code: "invalid_document", retryable: false };
  return { code: "internal_error", retryable: true };
}
