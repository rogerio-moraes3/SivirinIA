import "server-only";
import path from "node:path";
import { pdfOcr, imageOcr, OCR_MAX_PAGES } from "./ocr";
import { unzipSync } from "fflate";
import { load } from "cheerio";
import { MAX_CHARS, normalize, type Page } from "./knowledge";
export const MAX_BYTES = 10 * 1024 * 1024;
export async function extractDocument(
  name: string,
  buffer: Buffer,
  options: { ocr?: boolean; workDir?: string } = {},
): Promise<{ pages: Page[]; kind: string }> {
  if (!buffer.length || buffer.length > MAX_BYTES)
    throw new Error("Envie um arquivo entre 1 byte e 10 MB.");
  const ext = name.toLowerCase().split(".").pop();
  let pages: Page[];
  let kind: string;
  if (ext === "pdf") {
    if (!buffer.subarray(0, 5).equals(Buffer.from("%PDF-")))
      throw new Error("Assinatura PDF inválida.");
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      pages = result.pages.map((p) => ({ text: p.text, page: p.num }));
    } finally {
      await parser.destroy();
    }
    if (options.ocr) {
      if (!options.workDir) throw new Error("ocr_unavailable");
      pages = await pdfOcr(buffer, options.workDir, pages);
    }
    kind = "pdf";
  } else if (ext === "docx") {
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b)
      throw new Error("Arquivo DOCX inválido.");
    // Refuse ZIP expansion bombs before parsing the document.
    let expanded = 0;
    for (let offset = 0; offset + 46 < buffer.length; offset++)
      if (buffer.readUInt32LE(offset) === 0x02014b50)
        expanded += buffer.readUInt32LE(offset + 24);
    if (expanded > 40 * 1024 * 1024)
      throw new Error("DOCX excede o tamanho descompactado permitido.");
    let images = 0;
    const files = unzipSync(buffer, {
      filter: (entry) => {
        if (
          entry.name === "word/document.xml" ||
          (options.ocr && entry.name === "word/_rels/document.xml.rels")
        )
          return entry.originalSize <= 20 * 1024 * 1024;
        if (
          options.ocr &&
          /^word\/media\/[^/]+\.(png|jpe?g)$/i.test(entry.name)
        ) {
          if (++images > OCR_MAX_PAGES || entry.originalSize > MAX_BYTES)
            throw new Error("ocr_page_limit");
          return true;
        }
        return false;
      },
    });
    const xml = files["word/document.xml"];
    if (!xml) throw new Error("DOCX inválido ou conteúdo excede o limite.");
    const $ = load(Buffer.from(xml).toString("utf8"), { xmlMode: true });
    const text = $("w\\:body")
      .children()
      .map((_index, element) => {
        const block = $(element);
        if (element.type === "tag" && element.name === "w:tbl")
          return block
            .find("w\\:tr")
            .map((_i, row) =>
              $(row)
                .find("w\\:tc")
                .map((_j, cell) => $(cell).find("w\\:t").text())
                .get()
                .join(" | "),
            )
            .get()
            .join("\n");
        return block.find("w\\:t").text();
      })
      .get()
      .join("\n");
    pages = [{ text, page: null }];
    if (options.ocr) {
      if (!options.workDir) throw new Error("ocr_unavailable");
      const references = new Set(
        $("a\\:blip")
          .map((_i, e) => $(e).attr("r:embed"))
          .get(),
      );
      const rels = files["word/_rels/document.xml.rels"];
      if (rels) {
        const rel = load(Buffer.from(rels).toString("utf8"), { xmlMode: true });
        let image = 0;
        for (const entry of rel("Relationship").toArray()) {
          const el = rel(entry);
          if (
            el.attr("TargetMode") === "External" ||
            !references.has(el.attr("Id") || "")
          )
            continue;
          const target = path.posix.normalize(
            path.posix.join("word", el.attr("Target") || ""),
          );
          if (!/^word\/media\/[^/]+\.(png|jpe?g)$/i.test(target)) continue;
          if (files[target])
            pages.push(
              await imageOcr(
                Buffer.from(files[target]),
                options.workDir,
                ++image,
                null,
              ),
            );
        }
      }
    }
    kind = "docx";
  } else if (["png", "jpg", "jpeg"].includes(ext || "")) {
    if (!options.ocr || !options.workDir) throw new Error("ocr_required");
    pages = [await imageOcr(buffer, options.workDir, 1, 1)];
    kind = "image";
  } else if (["txt", "md", "csv", "html"].includes(ext || "")) {
    let text = buffer.toString("utf8");
    if (text.includes("\u0000"))
      throw new Error("O arquivo não é texto UTF-8 válido.");
    if (ext === "html") {
      const $ = load(text);
      $("script,style,nav,footer,iframe").remove();
      text = $("body").text();
    }
    pages = [{ text, page: null }];
    kind = ext === "md" ? "markdown" : ext === "txt" ? "text" : ext!;
  } else
    throw new Error(
      "Formato não suportado. Use PDF, DOCX, TXT, Markdown, CSV ou HTML.",
    );
  pages = pages
    .map((p) => ({ ...p, text: normalize(p.text) }))
    .filter((p) => p.text);
  if (!pages.length)
    throw new Error(
      "Documento sem texto. Ative OCR para PDFs digitalizados ou imagens.",
    );
  if (pages.reduce((n, p) => n + p.text.length, 0) > MAX_CHARS)
    throw new Error("Limite de 2 milhões de caracteres excedido.");
  return { pages, kind };
}
