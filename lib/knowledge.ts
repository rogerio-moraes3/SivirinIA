import { createHash } from "node:crypto";
export type Page = {
  text: string;
  page: number | null;
  method?: "native" | "ocr" | "hybrid";
  ocr?: {
    engine: "tesseract";
    language: "por";
    confidence: number | null;
    image?: number;
  };
};
export type Chunk = {
  content: string;
  page: number | null;
  embedding?: number[];
  embedding_model?: string;
};
export type Evidence = {
  id: string;
  source_id: string;
  content: string;
  page: number | null;
  title: string;
  origin_url: string | null;
  version: number;
  score: number;
};
export type Citation = {
  number: number;
  chunk_id: string;
  source_id: string;
  title: string;
  page: number | null;
  quote: string;
  url: string | null;
  version: number;
};
export const MAX_CHARS = 2_000_000;
export function normalize(text: string) {
  return text
    .normalize("NFKC")
    .replace(/\u0000/g, "")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
export function chunkPages(pages: Page[], size = 1400, overlap = 180): Chunk[] {
  if (size < 100 || overlap < 0 || overlap >= size)
    throw new Error("Configuração de fragmentação inválida");
  const chunks: Chunk[] = [];
  for (const page of pages) {
    const text = normalize(page.text);
    for (let start = 0; start < text.length;) {
      let end = Math.min(start + size, text.length);
      if (end < text.length) {
        const boundary = text.lastIndexOf(" ", end);
        if (boundary > start + size / 2) end = boundary;
      }
      const content = text.slice(start, end).trim();
      if (content) chunks.push({ content, page: page.page });
      if (end === text.length) break;
      start = end - overlap;
    }
  }
  if (!chunks.length)
    throw new Error("O documento está vazio ou precisa de OCR.");
  if (chunks.length > 2000)
    throw new Error("Documento muito extenso: limite de 2.000 fragmentos.");
  return chunks;
}
export function contentHash(pages: Page[]) {
  return createHash("sha256")
    .update(
      JSON.stringify(
        pages.map((p) => ({ page: p.page, text: normalize(p.text) })),
      ),
    )
    .digest("hex");
}
export function citationsFrom(evidence: Evidence[]): Citation[] {
  return evidence.map((e, i) => ({
    number: i + 1,
    chunk_id: e.id,
    source_id: e.source_id,
    title: e.title,
    page: e.page,
    quote: e.content,
    url: e.origin_url,
    version: e.version,
  }));
}
export function extractiveAnswer(evidence: Evidence[]) {
  if (!evidence.length)
    return {
      text: "Não encontrei uma resposta confiável na documentação disponível. Adicione uma fonte sobre este assunto ou consulte sua equipe.",
      mode: "abstention" as const,
      citations: [],
    };
  const selected = evidence.slice(0, 4);
  return {
    text:
      "Trechos encontrados na sua base (busca documental, sem geração por IA):\n\n" +
      selected.map((e, i) => `${e.content} [${i + 1}]`).join("\n\n"),
    mode: "extractive" as const,
    citations: citationsFrom(selected),
  };
}
export function validateGeneratedAnswer(text: string, citations: Citation[]) {
  const ids = [...text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
  return (
    text.length > 0 &&
    text.length <= 16000 &&
    ids.length > 0 &&
    ids.every((id) => citations.some((c) => c.number === id))
  );
}
