import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  extractInChild,
  prepareIndex,
  classifyTaskFailure,
  type DocumentInput,
} from "../lib/document-pipeline";
const input = (
  filename: string,
  bytes: Buffer,
  mode: "file" | "text" = "file",
): DocumentInput => ({
  id: "test",
  token: "test",
  filename,
  mode,
  base64: bytes.toString("base64"),
});
describe("parser real em processo separado", () => {
  it("extrai duas páginas de PDF e preserva hash/indexação determinísticos", async () => {
    const result = await extractInChild(
      input("policy.pdf", readFileSync("tests/fixtures/policy.pdf")),
    );
    expect(result.kind).toBe("pdf");
    expect(result.pages.map((p) => p.page)).toEqual([1, 2]);
    expect(prepareIndex(result.pages).hash).toBe(
      prepareIndex(result.pages).hash,
    );
    expect(prepareIndex(result.pages).chunks).toHaveLength(2);
  });
  it("preserva texto de DOCX real", async () => {
    const result = await extractInChild(
      input("policy.docx", readFileSync("tests/fixtures/policy.docx")),
    );
    expect(result.pages[0].text.length).toBeGreaterThan(10);
  });
  it("aceita texto e recusa arquivo inválido sem propagar detalhes do parser", async () => {
    expect(
      (
        await extractInChild(
          input(
            "conteudo.txt",
            Buffer.from("Política de reembolso em sete dias."),
            "text",
          ),
        )
      ).kind,
    ).toBe("text");
    await expect(
      extractInChild(input("x.pdf", Buffer.from("invalido"))),
    ).rejects.toThrow("invalid_document");
  });
  it("termina processo que excede o orçamento de tempo", async () => {
    await expect(
      extractInChild(input("x.txt", Buffer.from("teste")), 1),
    ).rejects.toThrow("worker_timeout");
  });
  it.each([
    ["invalid_document", "invalid_document", false],
    ["worker_timeout", "worker_timeout", true],
    ["Documento duplicado", "duplicate", false],
    ["Limite de páginas", "quota_exceeded", false],
    ["Fonte alterada ou sem permissão", "version_conflict", false],
    ["Sem permissão", "access_revoked", false],
    ["segredo não pode aparecer", "internal_error", true],
  ])(
    "classifica falha sem guardar diagnóstico bruto: %s",
    (message, code, retryable) => {
      expect(classifyTaskFailure(new Error(message))).toEqual({
        code,
        retryable,
      });
    },
  );
});
