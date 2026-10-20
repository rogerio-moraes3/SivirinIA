import "server-only";
import https from "node:https";
import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";
import { load } from "cheerio";
import { MAX_BYTES } from "./documents";
export function validatePublicUrl(input: string): URL {
  const url = new URL(input);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443")
  )
    throw new Error(
      "Informe uma URL HTTPS pública, sem credenciais ou porta personalizada.",
    );
  if (
    url.hostname === "localhost" ||
    url.hostname.endsWith(".localhost") ||
    url.hostname.endsWith(".local")
  )
    throw new Error("Endereço interno não permitido.");
  return url;
}
export function isPublicAddress(address: string) {
  try {
    const parsed = ipaddr.process(address);
    return parsed.range() === "unicast";
  } catch {
    return false;
  }
}
async function request(
  url: URL,
): Promise<{ status: number; body: string; location?: string; type: string }> {
  const addresses = await lookup(url.hostname, { all: true }).catch(() => {
    throw new Error(
      "Não foi possível resolver o domínio com segurança neste ambiente. Envie o arquivo ou texto enquanto o DNS público estiver indisponível.",
    );
  });
  if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address)))
    throw new Error("O domínio resolve para uma rede não permitida.");
  const address = addresses[0];
  // Pin validated IP in the socket lookup. TLS still verifies original hostname.
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        // Node passes socket connection options through HTTPS.
        family: address.family,
        headers: {
          "User-Agent": "SivirinIA/0.1 (authorized knowledge import)",
          Accept: "text/html,text/plain",
        },
        lookup: (_host, _options, cb) =>
          cb(null, address.address, address.family),
        timeout: 12000,
      },
      (res) => {
        const parts: Buffer[] = [];
        let size = 0;
        res.on("data", (part: Buffer) => {
          size += part.length;
          if (size > MAX_BYTES) {
            res.destroy();
            reject(new Error("Página excede 10 MB."));
          } else parts.push(part);
        });
        res.on("end", () =>
          resolve({
            status: res.statusCode || 500,
            body: Buffer.concat(parts).toString("utf8"),
            location: res.headers.location,
            type: res.headers["content-type"] || "",
          }),
        );
        res.on("error", reject);
      },
    );
    req.on("timeout", () =>
      req.destroy(new Error("Tempo de importação excedido.")),
    );
    req.on("error", reject);
  });
}
export async function importUrl(input: string) {
  let url = validatePublicUrl(input);
  // Conservative policy: only allow paths not disallowed for any crawler group.
  const robots = await request(new URL("/robots.txt", url));
  if (robots.status !== 404 && robots.status !== 410 && robots.status !== 200)
    throw new Error("Não foi possível verificar robots.txt.");
  const disallowed =
    robots.status === 200
      ? [...robots.body.matchAll(/^\s*Disallow:\s*(\S*)/gim)]
          .map((m) => m[1])
          .filter(Boolean)
      : [];
  for (let redirects = 0; redirects <= 3; redirects++) {
    if (disallowed.some((path) => url.pathname.startsWith(path.split("*")[0])))
      throw new Error(
        "A importação deste caminho é bloqueada pelo robots.txt.",
      );
    const result = await request(url);
    if ([301, 302, 303, 307, 308].includes(result.status)) {
      if (!result.location) throw new Error("Redirecionamento inválido.");
      const next = validatePublicUrl(new URL(result.location, url).href);
      if (next.origin !== url.origin)
        throw new Error(
          "Redirecionamento para outro domínio: importe o endereço final diretamente.",
        );
      url = next;
      continue;
    }
    if (result.status !== 200)
      throw new Error(`A página respondeu HTTP ${result.status}.`);
    if (!/text\/(html|plain)/i.test(result.type))
      throw new Error("A URL deve retornar HTML ou texto.");
    const $ = load(result.body);
    $("script,style,nav,footer,iframe,form,noscript").remove();
    const title =
      $("title").first().text().trim().slice(0, 250) || url.hostname;
    const text = $("main,article").first().text() || $("body").text();
    if (!text.trim()) throw new Error("Página sem texto utilizável.");
    return { title, pages: [{ text, page: null }], url: url.href };
  }
  throw new Error("Limite de redirecionamentos excedido.");
}
