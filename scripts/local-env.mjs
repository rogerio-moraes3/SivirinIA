import { parseEnv } from "node:util";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
if (existsSync(".env.local")) {
  console.log(".env.local preservado.");
  process.exit(0);
}
const config = parseEnv(readFileSync(".local/runtime.env", "utf8"));
const status = { API_URL: "http://127.0.0.1:54321", ANON_KEY: config.ANON_KEY };
if (!status.ANON_KEY)
  throw new Error("Execute npm run db:start antes de configurar o aplicativo.");
writeFileSync(
  ".env.local",
  `NEXT_PUBLIC_SUPABASE_URL=${status.API_URL}\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${status.ANON_KEY}\nAI_ENABLED=false\n`,
  { mode: 0o600, flag: "wx" },
);
console.log(
  ".env.local criado com a configuração pública da instância local. Valores omitidos. IA paga desativada.",
);
