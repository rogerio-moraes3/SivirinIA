import type { Citation } from "./knowledge";
export type AnswerRecord = {
  id: string;
  reply_to: string | null;
  mode: string | null;
  status: string;
  created_at: string;
  citations: Citation[];
  input_tokens: number;
  output_tokens: number;
  cost_usd: number | null;
  model: string | null;
};
export function analyzeKnowledge(
  answers: AnswerRecord[],
  questions: { id: string; content: string }[],
) {
  const byId = new Map(questions.map((q) => [q.id, q.content]));
  const repeated = new Map<string, { question: string; count: number }>();
  const sourceUsage = new Map<
    string,
    { sourceId: string; title: string; count: number }
  >();
  const unresolved: { question: string; reason: string; date: string }[] = [];
  const daily = new Map<string, number>();
  const models = new Map<
    string,
    { model: string; tokens: number; measuredCost: number; unmeasured: number }
  >();
  for (const answer of answers) {
    const day = new Date(answer.created_at).toLocaleDateString("sv-SE", {
      timeZone: "America/Sao_Paulo",
    });
    daily.set(day, (daily.get(day) || 0) + 1);
    const question = answer.reply_to ? byId.get(answer.reply_to) : undefined;
    if (question) {
      const key = question
        .toLocaleLowerCase("pt-BR")
        .normalize("NFKD")
        .replace(/\p{M}/gu, "")
        .replace(/[^\p{L}\p{N}\s]/gu, "")
        .replace(/\s+/g, " ")
        .trim();
      const current = repeated.get(key);
      if (current) current.count++;
      else repeated.set(key, { question, count: 1 });
    }
    if (
      answer.status === "failed" ||
      (answer.status === "complete" && answer.mode === "abstention")
    )
      unresolved.push({
        question: question || "Pergunta indisponível no recorte",
        reason:
          answer.status === "failed"
            ? "Falha operacional"
            : "Sem evidência suficiente",
        date: day,
      });
    const seen = new Set<string>();
    for (const citation of answer.citations) {
      if (seen.has(citation.source_id)) continue;
      seen.add(citation.source_id);
      const current = sourceUsage.get(citation.source_id);
      if (current) current.count++;
      else
        sourceUsage.set(citation.source_id, {
          sourceId: citation.source_id,
          title: citation.title,
          count: 1,
        });
    }
    const model = answer.model || "Busca documental";
    const current = models.get(model) || {
      model,
      tokens: 0,
      measuredCost: 0,
      unmeasured: 0,
    };
    current.tokens += answer.input_tokens + answer.output_tokens;
    if (answer.cost_usd === null) current.unmeasured++;
    else current.measuredCost += Number(answer.cost_usd);
    models.set(model, current);
  }
  return {
    frequent: [...repeated.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    sources: [...sourceUsage.values()].sort((a, b) => b.count - a.count),
    unresolved,
    daily: [...daily.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, count]) => ({ day, count })),
    models: [...models.values()],
  };
}
