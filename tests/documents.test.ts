import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { extractDocument } from "../lib/documents";
describe("extração real de documentos", () => {
  it("extrai PDF com duas páginas e preserva número da página", async () => {
    const result = await extractDocument(
      "policy.pdf",
      readFileSync("tests/fixtures/policy.pdf"),
    );
    expect(result.kind).toBe("pdf");
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0]).toMatchObject({ page: 1 });
    expect(result.pages[0].text).toContain("7 dias");
    expect(result.pages[1].page).toBe(2);
    expect(result.pages[1].text).toContain("97");
  });
  it("extrai texto de DOCX sem renderizar HTML ativo", async () => {
    const result = await extractDocument(
      "policy.docx",
      readFileSync("tests/fixtures/policy.docx"),
    );
    expect(result.pages[0].text).toContain("7 dias");
    expect(result.pages[0].page).toBeNull();
  });
  it("remove scripts de HTML", async () => {
    const result = await extractDocument(
      "policy.html",
      Buffer.from(
        "<html><body><script>secret()</script><main>Prazo de 7 dias</main></body></html>",
      ),
    );
    expect(result.pages[0].text).toBe("Prazo de 7 dias");
  });
  it("recusa assinatura falsa, documento vazio e tipo não suportado", async () => {
    await expect(
      extractDocument("fake.pdf", Buffer.from("nao e pdf")),
    ).rejects.toThrow(/PDF/);
    await expect(
      extractDocument("empty.txt", Buffer.from("   ")),
    ).rejects.toThrow(/sem texto/);
    await expect(
      extractDocument("virus.exe", Buffer.from("MZ")),
    ).rejects.toThrow(/não suportado/);
  });
  it("recusa arquivo acima do tamanho máximo", async () => {
    await expect(
      extractDocument("large.txt", Buffer.alloc(10 * 1024 * 1024 + 1)),
    ).rejects.toThrow(/10 MB/);
  });
});
