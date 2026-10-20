export function integerSetting(
  name: string,
  fallback: number,
  min: number,
  max: number,
) {
  const raw = process.env[name];
  const value = raw === undefined || raw === "" ? fallback : Number(raw);
  if (!Number.isInteger(value) || value < min || value > max)
    throw new Error(`Limite inválido na configuração ${name}.`);
  return value;
}
function tariff(name: string) {
  const raw = process.env[name];
  const value = Number(raw);
  if (raw === undefined || raw === "" || !Number.isFinite(value) || value < 0)
    throw new Error(
      `Configure a tarifa do provedor em ${name} antes de habilitar IA.`,
    );
  return value;
}
// UTF-8 byte count is deliberately conservative; it is not measured token usage.
export function tokenUpperBound(value: unknown) {
  return Buffer.byteLength(JSON.stringify(value), "utf8") + 256;
}
export function generationLimits() {
  return {
    input: integerSetting("AI_MAX_INPUT_TOKENS", 16000, 512, 64000),
    output: integerSetting("AI_MAX_OUTPUT_TOKENS", 1000, 64, 4000),
  };
}
export function authorizeAiRequest(
  kind: "generation" | "embedding",
  body: unknown,
  outputTokens = 0,
) {
  const upperInputTokens = tokenUpperBound(body);
  const inputLimit =
    kind === "generation"
      ? generationLimits().input
      : integerSetting("AI_MAX_EMBEDDING_TOKENS", 16000, 512, 64000);
  if (upperInputTokens > inputLimit)
    throw new Error(
      "Limite de tokens de entrada atingido antes de consultar o provedor.",
    );
  const inputPrice = tariff(
    kind === "generation"
      ? "AI_INPUT_USD_PER_MILLION"
      : "AI_EMBEDDING_USD_PER_MILLION",
  );
  const outputPrice =
    kind === "generation" ? tariff("AI_OUTPUT_USD_PER_MILLION") : 0;
  const upperCost =
    (upperInputTokens * inputPrice + outputTokens * outputPrice) / 1e6;
  const raw = process.env.AI_MAX_REQUEST_USD;
  const maximum = raw === undefined || raw === "" ? 0.01 : Number(raw);
  if (!Number.isFinite(maximum) || maximum <= 0 || maximum > 1)
    throw new Error(
      "Limite financeiro por requisição inválido (máximo US$ 1).",
    );
  if (upperCost > maximum)
    throw new Error(
      "Limite financeiro da requisição atingido antes de consultar o provedor.",
    );
  return { upperInputTokens, upperCost };
}
