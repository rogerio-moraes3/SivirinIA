import { describe, it, expect, vi } from "vitest";
import { uploadLimitBytes, remoteOcrConfigured } from "../lib/upload-policy";
import { workerConnection } from "../lib/worker-connection";
import { checkStaging } from "../scripts/check-staging.mjs";
const ref = "abcdefghijklmnopqrst";
const frontend = () => ({
  APP_ENV: "staging",
  APP_URL: "https://test.example.org",
  STAGING_SUPABASE_PROJECT_REF: ref,
  NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: `e30.${Buffer.from(JSON.stringify({ role: "anon", ref })).toString("base64url")}.example`,
  AI_ENABLED: "false",
  MP_SANDBOX_ENABLED: "false",
  OCR_WORKER_ENABLED: "false",
});
describe("homologação", () => {
  it("valida configuração pública sem executar serviços", () =>
    expect(() => checkStaging(frontend())).not.toThrow());
  it.each([
    { APP_URL: "http://test.example.org" },
    { NEXT_PUBLIC_SUPABASE_URL: "https://outro.supabase.co" },
    { PRODUCTION_SUPABASE_PROJECT_REF: ref },
    { AI_ENABLED: "true" },
    { MP_SANDBOX_ENABLED: "true" },
    { WORKER_DATABASE_URL: "secret" },
    { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_example" },
  ])("rejeita mistura de ambientes/custos/segredos %o", (changes) =>
    expect(() => checkStaging({ ...frontend(), ...changes })).toThrow(),
  );
  it("limita uploads Vercel e mantém parser local", () => {
    expect(uploadLimitBytes({ VERCEL: "1" })).toBe(3 * 1024 ** 2);
    expect(uploadLimitBytes({ APP_ENV: "staging" })).toBe(3 * 1024 ** 2);
    expect(uploadLimitBytes({})).toBe(10 * 1024 ** 2);
    expect(
      remoteOcrConfigured({ APP_ENV: "staging", OCR_WORKER_ENABLED: "true" }),
    ).toBe(true);
    expect(remoteOcrConfigured({ OCR_WORKER_ENABLED: "true" })).toBe(false);
  });
  it("exige TLS validado no banco remoto", () => {
    const config = workerConnection(
      `postgresql://sivirinia_worker:example@db.${ref}.supabase.co:5432/postgres?sslmode=require`,
      { APP_ENV: "staging", STAGING_SUPABASE_PROJECT_REF: ref },
    );
    expect(config.ssl).toMatchObject({
      rejectUnauthorized: true,
      servername: `db.${ref}.supabase.co`,
    });
    expect(config.connectionString).not.toContain("sslmode");
  });
  it.each([
    "postgresql://sivirinia_worker:x@localhost:5432/postgres",
    `postgresql://postgres:x@db.${ref}.supabase.co/postgres`,
    `postgresql://sivirinia_worker:x@db.${ref}.supabase.co/postgres?sslmode=disable`,
    `postgresql://sivirinia_worker.${ref}:x@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
  ])("nega conexão insegura ou privilegiada", (url) =>
    expect(() =>
      workerConnection(url, {
        APP_ENV: "staging",
        STAGING_SUPABASE_PROJECT_REF: ref,
      }),
    ).toThrow(),
  );
  it("aceita pooler de sessão com papel restrito", () =>
    expect(
      workerConnection(
        `postgresql://sivirinia_worker.${ref}:x@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`,
        { APP_ENV: "staging", STAGING_SUPABASE_PROJECT_REF: ref },
      ).ssl,
    ).toMatchObject({ rejectUnauthorized: true }));
  it("bloqueia transporte de IA paga mesmo com flag ligada", async () => {
    vi.stubEnv("APP_ENV", "staging");
    vi.stubEnv("AI_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "example");
    vi.stubEnv("AI_EMBEDDING_MODEL", "example");
    const fetch = vi.spyOn(globalThis, "fetch");
    try {
      const { embedTexts } = await import("../lib/ai");
      await expect(embedTexts(["teste"])).rejects.toThrow("desativada");
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
