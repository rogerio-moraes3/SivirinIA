export function checkStaging(env) {
  if (env.APP_ENV !== "staging") throw new Error("APP_ENV deve ser staging.");
  const ref = env.STAGING_SUPABASE_PROJECT_REF;
  if (!/^[a-z]{20}$/.test(ref || ""))
    throw new Error("Configure STAGING_SUPABASE_PROJECT_REF.");
  if (ref === env.PRODUCTION_SUPABASE_PROJECT_REF)
    throw new Error("Projeto de produção não permitido.");
  const app = new URL(env.APP_URL);
  if (
    app.protocol !== "https:" ||
    app.username ||
    app.password ||
    app.search ||
    app.hash ||
    app.pathname !== "/" ||
    /localhost|127\.0\.0\.1/.test(app.hostname)
  )
    throw new Error("APP_URL exige origem HTTPS pública canônica.");
  if (env.NEXT_PUBLIC_SUPABASE_URL !== `https://${ref}.supabase.co`)
    throw new Error("URL Supabase deve corresponder ao projeto de testes.");
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  if (!key.startsWith("sb_publishable_")) {
    let payload;
    try {
      payload = JSON.parse(
        Buffer.from(key.split(".")[1], "base64url").toString(),
      );
    } catch {
      throw new Error("Configure chave pública Supabase.");
    }
    if (payload.role !== "anon" || payload.ref !== ref)
      throw new Error("Chave deve ser anon do projeto de testes.");
  }
  if (env.AI_ENABLED !== "false" || env.MP_SANDBOX_ENABLED !== "false")
    throw new Error("IA paga e pagamentos devem permanecer desativados.");
  if (!["true", "false"].includes(env.OCR_WORKER_ENABLED))
    throw new Error("Declare OCR_WORKER_ENABLED.");
  for (const name of Object.keys(env)) {
    if (
      env[name] &&
      /SERVICE_ROLE|SECRET_KEY|DATABASE_URL|AI_API_KEY|MERCADO_PAGO.*TOKEN|MP_ACCESS_TOKEN/.test(
        name,
      )
    )
      throw new Error(`Segredo de serviço não permitido no frontend: ${name}.`);
  }
}
if (
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href
) {
  try {
    checkStaging(process.env);
    console.log(
      "Configuração de homologação validada; conectividade e isolamento remoto ainda exigem testes.",
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
