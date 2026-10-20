import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd(), false);
const required = [
  "AI_API_KEY",
  "AI_CHAT_MODEL",
  "AI_INPUT_USD_PER_MILLION",
  "AI_OUTPUT_USD_PER_MILLION",
];
const missing = required.filter((key) => !process.env[key]);
console.log(
  `IA: ${process.env.AI_ENABLED === "true" ? "ativada por configuração" : "desativada"}.`,
);
console.log(
  missing.length
    ? `Configurações ausentes: ${missing.join(", ")}.`
    : "Configuração básica presente; não implica modelo homologado.",
);
if (process.env.AI_EMBEDDING_MODEL && !process.env.AI_EMBEDDING_USD_PER_MILLION)
  console.log("Embeddings exigem AI_EMBEDDING_USD_PER_MILLION.");
console.log(
  "Nenhuma chamada de rede executada. Exija autorização de custos antes da avaliação externa.",
);
