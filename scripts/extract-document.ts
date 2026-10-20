// Runs in a bounded child process, without application/provider/database credentials.
import { extractDocument } from "../lib/documents";
import { normalize, MAX_CHARS } from "../lib/knowledge";
let input = "";
for await (const part of process.stdin) {
  input += part;
  if (input.length > 14_100_000) process.exit(2);
}
try {
  const data = JSON.parse(input) as {
    filename: string;
    mode: string;
    base64: string;
  };
  const bytes = Buffer.from(data.base64, "base64");
  const result =
    data.mode === "text"
      ? {
          kind: "text",
          pages: [{ text: normalize(bytes.toString("utf8")), page: null }],
        }
      : await extractDocument(data.filename, bytes);
  if (
    !result.pages.some((p) => p.text) ||
    result.pages.reduce((n, p) => n + p.text.length, 0) > MAX_CHARS
  )
    throw new Error("invalid_document");
  process.stdout.write(JSON.stringify(result));
} catch {
  process.stderr.write("invalid_document");
  process.exitCode = 2;
}
