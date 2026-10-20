import type { Evidence } from "./knowledge";
const numbers: Record<string, number> = {
  um: 1,
  dois: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  quatorze: 14,
  catorze: 14,
  quinze: 15,
  trinta: 30,
  sessenta: 60,
  noventa: 90,
};
export type NumericConflict = {
  topic: string;
  values: number[];
  sourceIds: string[];
};
export function numericEvidenceConflicts(rows: Evidence[]): NumericConflict[] {
  const facts = new Map<
    string,
    { values: Set<number>; sources: Set<string> }
  >();
  for (const row of rows) {
    const text = row.content
      .toLocaleLowerCase("pt-BR")
      .normalize("NFKD")
      .replace(/\p{M}/gu, "");
    for (const match of text.matchAll(
      /prazo de (reembolso|devolucao|entrega|expedicao|cancelamento)\s+(?:e\s+(?:de\s+)?|sera\s+(?:de\s+)?)?(\d+|um|dois|tres|quatro|cinco|seis|sete|oito|nove|dez|quatorze|catorze|quinze|trinta|sessenta|noventa)\s+dias?(?:\s+(uteis|corridos))?/g,
    )) {
      const value = numbers[match[2]] ?? Number(match[2]);
      const topic = match[1] + " / dias" + (match[3] ? " " + match[3] : "");
      const fact = facts.get(topic) || {
        values: new Set<number>(),
        sources: new Set<string>(),
      };
      fact.values.add(value);
      fact.sources.add(row.source_id);
      facts.set(topic, fact);
    }
  }
  return [...facts.entries()]
    .filter(([, f]) => f.values.size > 1 && f.sources.size > 1)
    .map(([topic, f]) => ({
      topic,
      values: [...f.values].sort((a, b) => a - b),
      sourceIds: [...f.sources],
    }));
}
