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
  maxBytes = MAX_BYTES,
): Promise<{ status: number; body: string; location?: string; type: string }> {
  let resolutionTimer: ReturnType<typeof setTimeout> | undefined;
  const addresses = await Promise.race([
    lookup(url.hostname, { all: true }),
    new Promise<never>((_resolve, reject) => {
      resolutionTimer = setTimeout(
        () => reject(new Error("dns_timeout")),
        5000,
      );
    }),
  ])
    .catch(() => {
      throw new Error(
        "Não foi possível resolver o domínio com segurança neste ambiente. Envie o arquivo ou texto enquanto o DNS público estiver indisponível.",
      );
    })
    .finally(() => clearTimeout(resolutionTimer));
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
          Accept: "text/html,text/plain,application/xml,text/xml",
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
          if (size > maxBytes) {
            res.destroy();
            reject(new Error("Página excede o limite de bytes permitido."));
          } else parts.push(part);
        });
        res.on("end", () => {
          clearTimeout(wallTimer);
          resolve({
            status: res.statusCode || 500,
            body: Buffer.concat(parts).toString("utf8"),
            location: res.headers.location,
            type: res.headers["content-type"] || "",
          });
        });
        res.on("error", reject);
      },
    );
    const wallTimer = setTimeout(
      () => req.destroy(new Error("Tempo total de importação excedido.")),
      15000,
    );
    wallTimer.unref();
    req.on("close", () => clearTimeout(wallTimer));
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
    const links = $("a[href]")
      .toArray()
      .slice(0, 1000)
      .flatMap((element) => {
        try {
          const link = validatePublicUrl(
            new URL($(element).attr("href") || "", url).href,
          );
          link.hash = "";
          return link.origin === url.origin ? [link.href] : [];
        } catch {
          return [];
        }
      });
    return {
      title,
      pages: [{ text, page: null }],
      url: url.href,
      links: [...new Set(links)],
    };
  }
  throw new Error("Limite de redirecionamentos excedido.");
}

export async function importSitemap(input: string) {
  const initial = validatePublicUrl(input);
  let url = initial;
  for (let redirects = 0; redirects <= 3; redirects++) {
    const result = await request(url, 1024 * 1024);
    if ([301, 302, 303, 307, 308].includes(result.status)) {
      if (!result.location)
        throw new Error("Sitemap com redirecionamento inválido.");
      const next = validatePublicUrl(new URL(result.location, url).href);
      if (next.origin !== initial.origin)
        throw new Error("Sitemap redirecionou para outra origem.");
      url = next;
      continue;
    }
    if (result.status !== 200)
      throw new Error(`Sitemap respondeu HTTP ${result.status}.`);
    if (/<!DOCTYPE|<!ENTITY/i.test(result.body))
      throw new Error("Sitemap com entidades XML não permitido.");
    const $ = load(result.body, { xmlMode: true });
    const isIndex = $("sitemapindex").length === 1;
    if (!isIndex && $("urlset").length !== 1)
      throw new Error("Sitemap XML inválido.");
    const nodes = $(isIndex ? "sitemap > loc" : "url > loc").toArray();
    if (nodes.length > 500) throw new Error("Sitemap excede 500 endereços.");
    const urls = nodes.map((node) => {
      const target = validatePublicUrl($(node).text().trim());
      target.hash = "";
      if (target.origin !== initial.origin)
        throw new Error("Sitemap contém endereço de outra origem.");
      return target.href;
    });
    return { isIndex, urls: [...new Set(urls)] };
  }
  throw new Error("Sitemap excedeu redirecionamentos.");
}
