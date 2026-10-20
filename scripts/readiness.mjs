import { existsSync } from "node:fs";
import assert from "node:assert/strict";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const api = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert(api && key, "Configure o Supabase antes da verificação.");
const health = await fetch("http://127.0.0.1:3000/api/health", {
  signal: AbortSignal.timeout(10000),
});
assert(health.ok, "Aplicação não respondeu ao health check.");
assert.equal((await health.json()).application, "SivirinIA");
const plans = await fetch(`${api}/rest/v1/plans?select=id`, {
  headers: { apikey: key },
  signal: AbortSignal.timeout(10000),
});
assert(plans.ok, "Banco/API não respondeu com a chave pública configurada.");
assert(
  (await plans.json()).some((plan) => plan.id === "free"),
  "Migration de planos não foi aplicada.",
);
const auth = await fetch(`${api}/auth/v1/settings`, {
  headers: { apikey: key },
  signal: AbortSignal.timeout(10000),
});
assert(auth.ok, "Serviço de autenticação indisponível.");
console.log(
  "Readiness: aplicação, API SQL com RLS/catálogo e serviço Auth responderam. O fluxo completo é validado separadamente pelos testes E2E.",
);
