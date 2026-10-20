export type ReportPeriod = {
  from?: string;
  to?: string;
  fromISO?: string;
  untilISO?: string;
  label: string;
  query: string;
  error?: string;
};
export function reportPeriod(from: unknown, to: unknown): ReportPeriod {
  const valid = (value: unknown) =>
    value == null ||
    value === "" ||
    (typeof value === "string" &&
      /^20[2-9]\d-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value + "T00:00:00Z")) &&
      new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value);
  if (!valid(from) || !valid(to))
    return {
      label: "Período inválido",
      query: "",
      error: "Informe datas válidas no formato ano-mês-dia, a partir de 2020.",
    };
  const start = typeof from === "string" && from ? from : undefined,
    end = typeof to === "string" && to ? to : undefined;
  if (start && end && start > end)
    return {
      label: "Período inválido",
      query: "",
      error: "A data inicial deve ser anterior ou igual à final.",
    };
  const fromISO = start
    ? new Date(start + "T00:00:00-03:00").toISOString()
    : undefined;
  const untilISO = end
    ? new Date(
        new Date(end + "T00:00:00-03:00").getTime() + 86400000,
      ).toISOString()
    : undefined;
  const params = new URLSearchParams();
  if (start) params.set("from", start);
  if (end) params.set("to", end);
  return {
    from: start,
    to: end,
    fromISO,
    untilISO,
    label:
      start || end
        ? `${start || "Início do histórico"} a ${end || "hoje"} (America/Sao_Paulo)`
        : "Todo o histórico disponível (até 1.000 respostas)",
    query: params.toString() ? "?" + params.toString() : "",
  };
}
