import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { EnvHttpProxyAgent } from "undici";
export function verifyMercadoPagoSignature(input: {
  signature: string;
  requestId: string;
  resourceId: string;
  secret: string;
  now?: number;
}) {
  if (
    !input.secret ||
    !/^[A-Za-z0-9-]{1,128}$/.test(input.resourceId) ||
    !/^[A-Za-z0-9-]{1,128}$/.test(input.requestId)
  )
    return false;
  const fields = input.signature.split(",").map((s) => s.trim().split("="));
  if (fields.length !== 2 || new Set(fields.map((f) => f[0])).size !== 2)
    return false;
  const ts = fields.find((f) => f[0] === "ts")?.[1],
    v1 = fields.find((f) => f[0] === "v1")?.[1];
  if (!ts || !/^\d{10,13}$/.test(ts) || !v1 || !/^[a-f0-9]{64}$/i.test(v1))
    return false;
  const timestamp = Number(ts) * (ts.length === 10 ? 1000 : 1),
    now = input.now ?? Date.now();
  if (
    !Number.isSafeInteger(timestamp) ||
    timestamp > now + 30000 ||
    now - timestamp > 300000
  )
    return false;
  const manifest = `id:${input.resourceId.toLowerCase()};request-id:${input.requestId};ts:${ts};`;
  const expected = createHmac("sha256", input.secret).update(manifest).digest();
  return timingSafeEqual(expected, Buffer.from(v1, "hex"));
}
export async function readSandboxPayment(id: string) {
  if (
    process.env.MP_SANDBOX_ENABLED !== "true" ||
    !process.env.MP_ACCESS_TOKEN?.startsWith("TEST-")
  )
    throw new Error(
      "Mercado Pago sandbox não configurado. Credenciais de produção são recusadas.",
    );
  if (!/^\d{1,20}$/.test(id)) throw new Error("Pagamento inválido.");
  const dispatcher = new EnvHttpProxyAgent();
  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${id}`,
      {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
        signal: AbortSignal.timeout(15000),
        dispatcher,
      } as RequestInit,
    );
    if (!response.ok)
      throw new Error("Não foi possível reconciliar pagamento sandbox.");
    const payment = z
      .object({
        id: z.union([z.string(), z.number().int().safe()]),
        live_mode: z.literal(false),
        external_reference: z.uuid(),
        currency_id: z.literal("BRL"),
        transaction_amount: z.number().finite().positive(),
        status: z.enum([
          "pending",
          "in_process",
          "approved",
          "rejected",
          "cancelled",
          "refunded",
          "charged_back",
        ]),
      })
      .parse(await response.json());
    if (
      String(payment.id) !== id ||
      Math.abs(
        payment.transaction_amount * 100 -
          Math.round(payment.transaction_amount * 100),
      ) > 0.00001
    )
      throw new Error("Pagamento sandbox incompatível.");
    return {
      resourceId: id,
      intentId: payment.external_reference,
      amountCents: Math.round(payment.transaction_amount * 100),
      currency: payment.currency_id,
      status: payment.status,
    };
  } finally {
    await dispatcher.close();
  }
}
