import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { EnvHttpProxyAgent } from "undici";
const sha = "c4932b937207a9514b7514d518b931a99938c02a28a5a5a553f8599ed58b7deb";
for (const binary of ["tesseract", "pdftoppm", "pdfinfo", "prlimit"]) {
  try {
    execFileSync(binary, ["--version"], { stdio: "ignore", timeout: 10000 });
  } catch (error) {
    // Poppler uses -v rather than --version.
    try {
      execFileSync(binary, ["-v"], { stdio: "ignore", timeout: 10000 });
    } catch {
      throw new Error(
        `Instale ${binary} (tesseract-ocr, poppler-utils e util-linux).`,
        { cause: error },
      );
    }
  }
}
await mkdir(".cache/ocr", { recursive: true, mode: 0o700 });
const path = ".cache/ocr/por.traineddata";
let bytes;
try {
  bytes = await readFile(path);
} catch {}
if (!bytes || createHash("sha256").update(bytes).digest("hex") !== sha) {
  const dispatcher = new EnvHttpProxyAgent();
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/4.1.0/por.traineddata",
      { dispatcher, signal: AbortSignal.timeout(30000) },
    );
    if (
      !response.ok ||
      Number(response.headers.get("content-length")) > 3000000
    )
      throw new Error("Falha no download oficial do idioma.");
    const parts = [];
    let length = 0;
    for await (const part of response.body) {
      length += part.length;
      if (length > 3000000)
        throw new Error("Arquivo de idioma excede o limite.");
      parts.push(part);
    }
    bytes = Buffer.concat(parts);
    if (createHash("sha256").update(bytes).digest("hex") !== sha)
      throw new Error("Hash do idioma não confere; OCR não foi instalado.");
    await writeFile(path + ".tmp", bytes, { mode: 0o600 });
    await rename(path + ".tmp", path);
  } finally {
    await dispatcher.close();
  }
}
console.log(
  "OCR local pronto: Tesseract + Poppler, português por, tessdata_fast 4.1.0 com SHA-256 verificado.",
);
