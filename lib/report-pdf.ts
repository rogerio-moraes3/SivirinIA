import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { AnswerRecord, analyzeKnowledge } from "./analytics";
export async function knowledgeReportPdf(
  organization: string,
  period: string,
  rows: AnswerRecord[],
  report: ReturnType<typeof analyzeKnowledge>,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle("SivirinIA — relatório privado de conhecimento");
  pdf.setAuthor("SivirinIA");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  let page = pdf.addPage([595, 842]),
    y = 790;
  const clean = (input: string) =>
    [...input.replace(/[\r\n\t]/g, " ")]
      .map((c) => {
        try {
          font.encodeText(c);
          return c;
        } catch {
          return "?";
        }
      })
      .join("");
  function line(text: string, size = 11) {
    const words = clean(text).split(/\s+/);
    let current = "";
    function draw(value: string) {
      if (y < 55) {
        page = pdf.addPage([595, 842]);
        y = 790;
      }
      page.drawText(value, {
        x: 44,
        y,
        size,
        font,
        color: rgb(0.04, 0.1, 0.2),
      });
      y -= size + 7;
    }
    for (let word of words) {
      // Bound unusually long tokens as well as ordinary prose.
      while (font.widthOfTextAtSize(word, size) > 500) {
        let cut = Math.min(word.length, 60);
        while (
          cut > 1 &&
          font.widthOfTextAtSize(word.slice(0, cut), size) > 500
        )
          cut--;
        const prefix = word.slice(0, cut);
        if (current) {
          draw(current);
          current = "";
        }
        draw(prefix);
        word = word.slice(cut);
      }
      const next = current ? current + " " + word : word;
      if (font.widthOfTextAtSize(next, size) > 500) {
        draw(current);
        current = word;
      } else current = next;
    }
    if (current) draw(current);
  }
  line("SivirinIA", 22);
  line("Relatório de conhecimento", 17);
  line(organization, 13);
  line(period);
  line(
    "Escopo: histórico privado do usuário autenticado. Até 1.000 respostas.",
  );
  line("Fontes atuais podem ser posteriores ao período selecionado.");
  const complete = rows.filter((r) => r.status === "complete"),
    cited = complete.filter(
      (r) => r.mode === "extractive" || r.mode === "generative",
    );
  line(
    `Consultas: ${rows.length} | Com evidência: ${cited.length} | Sem evidência: ${complete.filter((r) => r.mode === "abstention").length} | Falhas: ${rows.filter((r) => r.status === "failed").length}`,
  );
  line("Evidência citada não comprova correção factual nem resolução.", 10);
  y -= 10;
  line("Perguntas frequentes (texto normalizado)", 14);
  for (const item of report.frequent) line(`${item.count}x — ${item.question}`);
  if (!report.frequent.length) line("Sem perguntas no recorte.");
  y -= 10;
  line("Fontes citadas (até 30)", 14);
  for (const source of report.sources.slice(0, 30))
    line(`${source.count} consultas — ${source.title}`);
  if (!report.sources.length) line("Nenhuma fonte citada.");
  y -= 10;
  line("Perguntas sem resposta / falhas (até 30)", 14);
  for (const item of report.unresolved.slice(0, 30))
    line(`${item.date} | ${item.reason} | ${item.question}`);
  if (!report.unresolved.length) line("Nenhuma ocorrência no recorte.");
  y -= 10;
  line("Consumo observado", 14);
  for (const model of report.models)
    line(
      `${model.model}: ${model.tokens} tokens; US$ ${model.measuredCost.toFixed(6)} medidos; ${model.unmeasured} consultas sem custo conhecido.`,
    );
  line(
    "Custos de embeddings e infraestrutura não incluídos. Valores desconhecidos não são zero.",
    10,
  );
  return pdf.save();
}
