import { describe, it, expect, vi, afterEach } from "vitest";
import { authorizeAiRequest, tokenUpperBound } from "../lib/ai-budget";
import { numericEvidenceConflicts } from "../lib/evidence-conflicts";
import type { Evidence } from "../lib/knowledge";
afterEach(() => vi.unstubAllEnvs());
describe("controle financeiro anterior à chamada", () => {
  it("bloqueia tarifa desconhecida em vez de assumir custo zero", () => {
    vi.stubEnv("AI_INPUT_USD_PER_MILLION", "");
    expect(() => authorizeAiRequest("generation", { text: "x" }, 1000)).toThrow(
      "tarifa",
    );
  });
  it("bloqueia custo conservador acima do teto", () => {
    vi.stubEnv("AI_INPUT_USD_PER_MILLION", "100");
    vi.stubEnv("AI_OUTPUT_USD_PER_MILLION", "100");
    vi.stubEnv("AI_MAX_REQUEST_USD", "0.01");
    expect(() => authorizeAiRequest("generation", { text: "x" }, 1000)).toThrow(
      "Limite financeiro",
    );
  });
  it("limita tokens inclusive texto UTF-8 e orçamento de embeddings", () => {
    vi.stubEnv("AI_MAX_INPUT_TOKENS", "512");
    expect(() =>
      authorizeAiRequest("generation", { text: "á".repeat(1000) }, 1000),
    ).toThrow("tokens");
    expect(tokenUpperBound("á")).toBeGreaterThan(tokenUpperBound("a"));
    vi.stubEnv("AI_EMBEDDING_USD_PER_MILLION", "1");
    expect(
      authorizeAiRequest("embedding", { input: ["texto"] }),
    ).toHaveProperty("upperCost");
  });
});
const row = (source_id: string, content: string): Evidence => ({
  id: source_id,
  source_id,
  content,
  page: 1,
  title: source_id,
  origin_url: null,
  version: 1,
  score: 1,
});
describe("sinalização determinística e limitada de divergências", () => {
  it("sinaliza valores divergentes para o mesmo prazo em fontes diferentes", () => {
    expect(
      numericEvidenceConflicts([
        row("a", "O prazo de cancelamento é de sete dias."),
        row("b", "O prazo de cancelamento é de 30 dias."),
      ])[0],
    ).toMatchObject({ values: [7, 30], sourceIds: ["a", "b"] });
  });
  it("não confunde dias úteis com corridos, valores iguais ou tópicos distintos", () => {
    expect(
      numericEvidenceConflicts([
        row("a", "Prazo de reembolso é de 7 dias úteis."),
        row("b", "Prazo de reembolso é de 30 dias corridos."),
        row("c", "Prazo de entrega é de 7 dias úteis."),
      ]),
    ).toEqual([]);
  });
});
