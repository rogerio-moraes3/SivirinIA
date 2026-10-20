import { describe, it, expect, vi, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import {
  verifyMercadoPagoSignature,
  readSandboxPayment,
} from "../lib/mercado-pago";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("contratos Mercado Pago preparados; sem homologação externa", () => {
  const now = 1704908010000,
    ts = "1704908010",
    secret = "fixture-only",
    requestId = "request-123",
    resourceId = "123456";
  const signature =
    "ts=" +
    ts +
    ",v1=" +
    createHmac("sha256", secret)
      .update(`id:${resourceId};request-id:${requestId};ts:${ts};`)
      .digest("hex");
  it("verifica assinatura e rejeita adulteração, segredo errado, repetição tardia e assinatura ambígua", () => {
    expect(
      verifyMercadoPagoSignature({
        signature,
        secret,
        requestId,
        resourceId,
        now,
      }),
    ).toBe(true);
    expect(
      verifyMercadoPagoSignature({
        signature,
        secret: "outro",
        requestId,
        resourceId,
        now,
      }),
    ).toBe(false);
    expect(
      verifyMercadoPagoSignature({
        signature,
        secret,
        requestId,
        resourceId: "999",
        now,
      }),
    ).toBe(false);
    expect(
      verifyMercadoPagoSignature({
        signature,
        secret,
        requestId,
        resourceId,
        now: now + 600000,
      }),
    ).toBe(false);
    expect(
      verifyMercadoPagoSignature({
        signature: signature + ",v1=abc",
        secret,
        requestId,
        resourceId,
        now,
      }),
    ).toBe(false);
  });
  it("recusa token real antes da rede", async () => {
    vi.stubEnv("MP_SANDBOX_ENABLED", "true");
    vi.stubEnv("MP_ACCESS_TOKEN", "APP_USR-fixture-only");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(readSandboxPayment("123")).rejects.toThrow("produção");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("aceita somente pagamento confirmado como sandbox e referência emitida pelo servidor", async () => {
    vi.stubEnv("MP_SANDBOX_ENABLED", "true");
    vi.stubEnv("MP_ACCESS_TOKEN", "TEST-fixture-only");
    const body = {
      id: 123,
      live_mode: false,
      external_reference: "b1000000-0000-4000-8000-000000000001",
      currency_id: "BRL",
      transaction_amount: 97,
      status: "approved",
    };
    const fetch = vi.fn().mockResolvedValue(Response.json(body));
    vi.stubGlobal("fetch", fetch);
    expect((await readSandboxPayment("123")).amountCents).toBe(9700);
    fetch.mockResolvedValue(Response.json({ ...body, live_mode: true }));
    await expect(readSandboxPayment("123")).rejects.toThrow();
  });
});
