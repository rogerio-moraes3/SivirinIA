import { describe, it, expect } from "vitest";
import { analyzeKnowledge, type AnswerRecord } from "../lib/analytics";
const base: AnswerRecord = {
  id: "a",
  reply_to: "q1",
  mode: "extractive",
  status: "complete",
  created_at: "2026-10-19T12:00:00Z",
  citations: [],
  input_tokens: 0,
  output_tokens: 0,
  cost_usd: null,
  model: null,
};
describe("inteligência com dados observados", () => {
  it("não inventa indicadores em uma base vazia", () => {
    const report = analyzeKnowledge([], []);
    expect(report.frequent).toEqual([]);
    expect(report.unresolved).toEqual([]);
    expect(report.daily).toEqual([]);
  });
  it("agrupa perguntas equivalentes por normalização sem fingir análise semântica", () => {
    const report = analyzeKnowledge(
      [base, { ...base, id: "b", reply_to: "q2" }],
      [
        { id: "q1", content: "Qual é o prazo?" },
        { id: "q2", content: "Qual e o prazo" },
      ],
    );
    expect(report.frequent[0].count).toBe(2);
  });
  it("separa falta de evidência de falha operacional", () => {
    const report = analyzeKnowledge(
      [
        { ...base, mode: "abstention" },
        { ...base, id: "b", status: "failed" },
      ],
      [{ id: "q1", content: "Pergunta sem artigo" }],
    );
    expect(report.unresolved.map((r) => r.reason)).toEqual([
      "Sem evidência suficiente",
      "Falha operacional",
    ]);
  });
  it("conta uma fonte apenas uma vez por resposta e registra custo desconhecido separadamente", () => {
    const citation = {
      number: 1,
      chunk_id: "c",
      source_id: "s",
      title: "Política",
      page: 1,
      quote: "Texto",
      url: null,
      version: 1,
    };
    const report = analyzeKnowledge(
      [{ ...base, citations: [citation, { ...citation, number: 2 }] }],
      [{ id: "q1", content: "Prazo?" }],
    );
    expect(report.sources[0].count).toBe(1);
    expect(report.models[0].unmeasured).toBe(1);
    expect(report.models[0].tokens).toBe(0);
  });
});
