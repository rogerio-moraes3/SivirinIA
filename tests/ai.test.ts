import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { answerQuestion, embedTexts } from "../lib/ai";
import type { Evidence } from "../lib/knowledge";
const evidence: Evidence = {
  id: "c",
  source_id: "s",
  content: "O prazo de reembolso é sete dias.",
  page: 1,
  title: "Política",
  origin_url: null,
  version: 1,
  score: 1,
};
beforeEach(() => {
  vi.stubEnv("AI_INPUT_USD_PER_MILLION", "1");
  vi.stubEnv("AI_OUTPUT_USD_PER_MILLION", "2");
  vi.stubEnv("AI_EMBEDDING_USD_PER_MILLION", "1");
  vi.stubEnv("AI_MAX_REQUEST_USD", "0.01");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("adaptador de IA — provedor simulado somente em testes", () => {
  it("não faz chamadas quando a IA está desativada, mesmo com uma chave presente", async () => {
    vi.stubEnv("AI_ENABLED", "false");
    vi.stubEnv("AI_API_KEY", "test-only");
    vi.stubEnv("AI_CHAT_MODEL", "test-model");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect((await answerQuestion("Reembolso?", [evidence], "")).mode).toBe(
      "extractive",
    );
    expect(await embedTexts(["x"])).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("nunca envia pergunta sem evidência ao modelo", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-only");
    vi.stubEnv("AI_CHAT_MODEL", "test-model");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect((await answerQuestion("Desconhecida", [], "")).mode).toBe(
      "abstention",
    );
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejeita citação inventada pelo provedor e usa busca documental", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-only");
    vi.stubEnv("AI_CHAT_MODEL", "test-model");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          choices: [{ message: { content: "O prazo é um ano [999]." } }],
          usage: { prompt_tokens: 20, completion_tokens: 10 },
        }),
      ),
    );
    const result = await answerQuestion("Reembolso?", [evidence], "");
    expect(result.mode).toBe("extractive");
    expect(result.text).not.toContain("um ano");
    expect(result.citations[0].quote).toContain("sete dias");
  });
  it("contabiliza tokens e mantém a referência retornada pela base", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-only");
    vi.stubEnv("AI_CHAT_MODEL", "test-model");
    vi.stubEnv("AI_INPUT_USD_PER_MILLION", "1");
    vi.stubEnv("AI_OUTPUT_USD_PER_MILLION", "2");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          choices: [{ message: { content: "O prazo é sete dias [1]." } }],
          usage: { prompt_tokens: 100, completion_tokens: 20 },
        }),
      ),
    );
    const result = await answerQuestion("Reembolso?", [evidence], "");
    expect(result.mode).toBe("generative");
    expect(result.cost).toBeCloseTo(0.00014);
    expect(result.citations[0].source_id).toBe("s");
  });
  it("falha explicitamente em erro do provedor", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-only");
    vi.stubEnv("AI_CHAT_MODEL", "test-model");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("", { status: 429 })),
    );
    await expect(answerQuestion("Reembolso?", [evidence], "")).rejects.toThrow(
      "HTTP 429",
    );
  });
  it("rejeita embeddings com dimensão inesperada", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-only");
    vi.stubEnv("AI_EMBEDDING_MODEL", "test-embedding");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ data: [{ index: 0, embedding: [1, 2] }] }),
        ),
    );
    await expect(embedTexts(["texto"])).rejects.toThrow();
  });
  it("envia somente perguntas anteriores limitadas como dados não confiáveis", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-only");
    vi.stubEnv("AI_CHAT_MODEL", "test-model");
    const fetch = vi.fn().mockResolvedValue(
      Response.json({
        choices: [{ message: { content: "O prazo é sete dias [1]." } }],
      }),
    );
    vi.stubGlobal("fetch", fetch);
    await answerQuestion("E o prazo?", [evidence], "", [
      "descartar",
      "a".repeat(2000),
      "b",
      "c",
      "d",
    ]);
    const payload = JSON.parse(fetch.mock.calls[0][1].body);
    const data = JSON.parse(payload.messages[1].content);
    expect(data.prior_user_questions).toEqual([
      "a".repeat(1000),
      "b",
      "c",
      "d",
    ]);
    expect(payload.messages).toHaveLength(2);
    expect(payload.messages[0].content).toContain("não constitui evidência");
  });
  it("bloqueia requisição sem tarifa ou acima do orçamento antes do fetch", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-only");
    vi.stubEnv("AI_CHAT_MODEL", "test-model");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    vi.stubEnv("AI_INPUT_USD_PER_MILLION", "");
    await expect(answerQuestion("reembolso", [evidence], "")).rejects.toThrow(
      "tarifa",
    );
    vi.stubEnv("AI_INPUT_USD_PER_MILLION", "100");
    await expect(answerQuestion("reembolso", [evidence], "")).rejects.toThrow(
      "Limite financeiro",
    );
    expect(fetch).not.toHaveBeenCalled();
  });
  it("sinaliza possível divergência com ambas as fontes, sem chamar o modelo", async () => {
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-only");
    vi.stubEnv("AI_CHAT_MODEL", "test-model");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const a = {
      ...evidence,
      content: "O prazo de cancelamento é de sete dias corridos.",
    };
    const b = {
      ...evidence,
      id: "d",
      source_id: "t",
      content: "O prazo de cancelamento é de trinta dias corridos.",
    };
    const result = await answerQuestion(
      "Qual o prazo de cancelamento?",
      [a, b],
      "",
    );
    expect(result.text).toContain("Possíveis divergências");
    expect(result.citations).toHaveLength(2);
    expect(result.mode).toBe("extractive");
    expect(fetch).not.toHaveBeenCalled();
  });
});
