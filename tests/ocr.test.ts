import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { PDFDocument } from "pdf-lib";
import { extractInChild } from "../lib/document-pipeline";
import { validateRaster, ocrAvailable } from "../lib/ocr";
const extract = (
  filename: string,
  ocr = true,
  bytes = readFileSync("tests/fixtures/" + filename),
) =>
  extractInChild({
    id: "test",
    token: "test",
    mode: "file",
    filename,
    ocr,
    base64: bytes.toString("base64"),
  });
describe("OCR real Tesseract em português, sem provedor externo", () => {
  it("verifica modelo oficial e extrai PDF composto exclusivamente por imagens com páginas físicas", async () => {
    expect(await ocrAvailable()).toBe(true);
    const result = await extract("scanned-ptbr.pdf");
    expect(result.kind).toBe("pdf");
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0].text).toMatch(/sete dias/);
    expect(result.pages[1].text).toMatch(/segundo fator/);
    expect(result.pages.map((p) => p.page)).toEqual([1, 2]);
    expect(result.pages[0].ocr?.language).toBe("por");
    expect(result.pages[0].ocr?.confidence).toBeGreaterThan(60);
  }, 30000);
  it("preserva página nativa e recupera página digitalizada do mesmo PDF", async () => {
    const result = await extract("mixed-ptbr.pdf");
    expect(result.pages[0].text).toContain("dois dias úteis");
    expect(result.pages[1].text).toContain("segundo fator");
    expect(result.pages[1].page).toBe(2);
  }, 30000);
  it("reconhece PNG/JPEG e rejeita imagem sem opt-in", async () => {
    expect((await extract("ocr-ptbr-1.png")).pages[0].text).toContain(
      "comprovante",
    );
    expect((await extract("ocr-ptbr.jpg")).pages[0].text).toContain(
      "comprovante",
    );
    await expect(extract("ocr-ptbr-1.png", false)).rejects.toThrow(
      "ocr_required",
    );
  }, 20000);
  it("extrai imagem embutida referenciada em DOCX sem inventar página física", async () => {
    const result = await extract("images-ptbr.docx");
    expect(
      result.pages.some(
        (p) =>
          p.text.includes("segundo fator") &&
          p.page === null &&
          p.method === "ocr",
      ),
    ).toBe(true);
  }, 20000);
  it("rejeita seis páginas sem processar parcialmente o documento", async () => {
    const pdf = await PDFDocument.create();
    for (let i = 0; i < 6; i++) pdf.addPage();
    await expect(
      extract("limit.pdf", true, Buffer.from(await pdf.save())),
    ).rejects.toThrow("ocr_page_limit");
  }, 15000);
  it("bloqueia dimensões hostis antes de chamar Tesseract", () => {
    const png = Buffer.from(readFileSync("tests/fixtures/ocr-ptbr-1.png"));
    png.writeUInt32BE(100000, 16);
    expect(() => validateRaster(png)).toThrow("ocr_image_limit");
  });
  it("limpa diretório privado após falha de extração", async () => {
    const before = readdirSync(tmpdir()).filter((n) =>
      n.startsWith("sivirinia-extract-"),
    );
    await expect(
      extract("broken.pdf", true, Buffer.from("not PDF")),
    ).rejects.toThrow("invalid_document");
    const after = readdirSync(tmpdir()).filter((n) =>
      n.startsWith("sivirinia-extract-"),
    );
    expect(after.filter((n) => !before.includes(n))).toEqual([]);
  });
});
