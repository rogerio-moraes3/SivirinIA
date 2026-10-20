import { describe, it, expect } from "vitest";
import { PDFParse } from "pdf-parse";
import { reportPeriod } from "../lib/report-period";
import { knowledgeReportPdf } from "../lib/report-pdf";
import { analyzeKnowledge, type AnswerRecord } from "../lib/analytics";
describe("períodos de relatório", () => {
  it("mantém recorte sem datas explícito e sem filtro oculto", () => {
    expect(reportPeriod(undefined, undefined)).toEqual({
      from: undefined,
      to: undefined,
      fromISO: undefined,
      untilISO: undefined,
      label: "Todo o histórico disponível (até 1.000 respostas)",
      query: "",
    });
  });
  it("usa meia-noite de São Paulo e fim exclusivo no dia seguinte", () => {
    const result = reportPeriod("2026-10-01", "2026-10-31");
    expect(result.fromISO).toBe("2026-10-01T03:00:00.000Z");
    expect(result.untilISO).toBe("2026-11-01T03:00:00.000Z");
    expect(result.query).toBe("?from=2026-10-01&to=2026-10-31");
  });
  it.each([
    ["2026-02-30", "2026-03-02"],
    ["2026-10-03", "2026-10-01"],
    [["2026-10-01"], "2026-10-02"],
    ["2000-01-01", undefined],
    ["x", undefined],
  ])("rejeita datas inválidas ou intervalo invertido: %s", (start, end) => {
    expect(reportPeriod(start, end).error).toBeTruthy();
  });
  it("aceita dia bissexto válido e datas parciais", () => {
    expect(reportPeriod("2028-02-29", undefined).error).toBeUndefined();
    expect(reportPeriod(undefined, "2026-10-19").fromISO).toBeUndefined();
  });
});
it("gera PDF real com texto extraível, acentos e custo desconhecido explícito", async () => {
  const rows: AnswerRecord[] = [
    {
      id: "a",
      reply_to: "q",
      mode: "abstention",
      status: "complete",
      created_at: "2026-10-19T14:00:00Z",
      citations: [],
      input_tokens: 0,
      output_tokens: 0,
      cost_usd: null,
      model: null,
    },
  ];
  const report = analyzeKnowledge(rows, [
    { id: "q", content: "Qual a política de férias? 🧪 " + "W".repeat(200) },
  ]);
  const bytes = await knowledgeReportPdf(
    "Organização de teste",
    "Período de teste",
    rows,
    report,
  );
  expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe("%PDF-");
  const parser = new PDFParse({ data: bytes });
  try {
    const { text } = await parser.getText();
    expect(text).toContain("Organização de teste");
    expect(text).toContain("política de férias");
    expect(text).toContain("1 consultas sem custo conhecido");
    expect(text).toContain("Sem evidência: 1");
  } finally {
    await parser.destroy();
  }
});
