import "server-only";
import { importUrl, importSitemap, validatePublicUrl } from "./crawler";
import { contentHash } from "./knowledge";
export type CrawlOptions = {
  maxPages?: number;
  maxDepth?: number;
  sitemap?: string;
};
export type CrawlResult = {
  seed: string;
  scope: string;
  complete: boolean;
  pages: {
    url: string;
    title: string;
    pages: { text: string; page: null }[];
    hash: string;
  }[];
  failures: { url: string; code: string }[];
};
export async function crawlSite(
  input: string,
  options: CrawlOptions = {},
): Promise<CrawlResult> {
  const seed = validatePublicUrl(input);
  seed.hash = "";
  const maxPages = options.maxPages ?? 10,
    maxDepth = options.maxDepth ?? 2;
  if (
    !Number.isInteger(maxPages) ||
    maxPages < 1 ||
    maxPages > 50 ||
    !Number.isInteger(maxDepth) ||
    maxDepth < 0 ||
    maxDepth > 5
  )
    throw new Error("Limite inválido de páginas/profundidade.");
  const sitemap = options.sitemap ? validatePublicUrl(options.sitemap) : null;
  if (sitemap && sitemap.origin !== seed.origin)
    throw new Error("Sitemap precisa pertencer à mesma origem.");
  const result: CrawlResult = {
    seed: seed.href,
    scope: JSON.stringify({
      seed: seed.href,
      maxPages,
      maxDepth,
      sitemap: sitemap?.href || null,
    }),
    complete: true,
    pages: [],
    failures: [],
  };
  const queue = [{ url: seed.href, depth: 0 }],
    seen = new Set<string>();
  const scheduled = new Set<string>([seed.href]);
  function enqueue(url: string, depth: number) {
    if (scheduled.has(url)) return;
    if (queue.length >= 2000) {
      result.complete = false;
      return;
    }
    scheduled.add(url);
    queue.push({ url, depth });
  }
  const started = Date.now();
  let totalChars = 0;
  if (sitemap) {
    const maps = [{ url: sitemap.href, depth: 0 }],
      visited = new Set<string>();
    while (maps.length) {
      const next = maps.shift()!;
      if (visited.has(next.url)) continue;
      visited.add(next.url);
      if (visited.size > 10 || next.depth > 2) {
        result.complete = false;
        break;
      }
      try {
        const map = await importSitemap(next.url);
        if (map.isIndex)
          maps.push(...map.urls.map((url) => ({ url, depth: next.depth + 1 })));
        else for (const url of map.urls) enqueue(url, 0);
      } catch {
        result.failures.push({
          url: next.url,
          code: "sitemap_network_or_policy_error",
        });
        result.complete = false;
      }
    }
  }
  while (queue.length && seen.size < maxPages) {
    if (Date.now() - started > 90000) {
      result.complete = false;
      break;
    }
    const next = queue.shift()!;
    if (seen.has(next.url)) continue;
    seen.add(next.url);
    try {
      const page = await importUrl(next.url);
      if (new URL(page.url).origin !== seed.origin)
        throw new Error("Origem inesperada.");
      const chars = page.pages.reduce((n, p) => n + p.text.length, 0);
      totalChars += chars;
      if (totalChars > 2_000_000) {
        result.failures.push({ url: next.url, code: "site_character_limit" });
        result.complete = false;
        break;
      }
      result.pages.push({
        url: page.url,
        title: page.title,
        pages: page.pages,
        hash: contentHash(page.pages),
      });
      if (next.depth < maxDepth)
        for (const link of page.links) {
          const url = validatePublicUrl(link);
          url.hash = "";
          if (url.origin === seed.origin && !seen.has(url.href))
            enqueue(url.href, next.depth + 1);
        }
    } catch {
      result.failures.push({
        url: next.url,
        code: "page_network_or_policy_error",
      });
      result.complete = false;
    }
  }
  if (queue.some((item) => !seen.has(item.url))) result.complete = false;
  return result;
}
export function diffCrawls(
  previous: CrawlResult | undefined,
  current: CrawlResult,
) {
  const old = new Map(previous?.pages.map((p) => [p.url, p.hash]) || []),
    now = new Map(current.pages.map((p) => [p.url, p.hash]));
  return {
    added: current.pages.filter((p) => !old.has(p.url)).map((p) => p.url),
    changed: current.pages
      .filter((p) => old.has(p.url) && old.get(p.url) !== p.hash)
      .map((p) => p.url),
    unchanged: current.pages
      .filter((p) => old.get(p.url) === p.hash)
      .map((p) => p.url),
    removed:
      current.complete && previous?.scope === current.scope
        ? [...old.keys()].filter((url) => !now.has(url))
        : [],
    deletionsAllowed: Boolean(
      current.complete && previous?.scope === current.scope,
    ),
  };
}
