import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
// Real parser and native OCR inside the exact constrained runtime, no network or credentials.
for (const filename of ["policy.pdf", "scanned-ptbr.pdf"]) {
  const input = JSON.stringify({
    id: "image-smoke",
    token: "test",
    mode: "file",
    filename,
    ocr: filename.startsWith("scanned"),
    base64: readFileSync(`tests/fixtures/${filename}`).toString("base64"),
  });
  const output = execFileSync(
    "docker",
    [
      "run",
      "--rm",
      "-i",
      "--network=none",
      "--read-only",
      "--cap-drop=ALL",
      "--security-opt=no-new-privileges:true",
      "--memory=2g",
      "--pids-limit=128",
      "--tmpfs=/tmp:size=256m,mode=1777",
      "--entrypoint=node",
      "sivirinia-worker:staging",
      "--conditions=react-server",
      "--import=tsx",
      "--input-type=module",
      "-e",
      `import { extractInChild } from './lib/document-pipeline.ts'; let input=''; for await (const chunk of process.stdin) input+=chunk; if(process.getuid()===0) throw new Error('root forbidden'); console.log(JSON.stringify(await extractInChild(JSON.parse(input))));`,
    ],
    {
      input,
      encoding: "utf8",
      timeout: 65000,
      maxBuffer: 4 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  const result = JSON.parse(output);
  assert.equal(result.kind, "pdf");
  assert(result.pages.some((page) => page.text.length > 20));
  if (filename.startsWith("scanned")) {
    assert.deepEqual(
      result.pages.map((page) => page.page),
      [1, 2],
    );
    assert.match(result.pages[0].text, /sete dias/);
    assert.match(result.pages[1].text, /segundo fator/);
    assert.equal(result.pages[0].ocr.language, "por");
  }
  console.log(
    `${filename}: imagem sem root/rede, parser real e páginas verificados.`,
  );
}
