import { describe, it, expect, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({ page: vi.fn(), sitemap: vi.fn() }));
vi.mock("../lib/crawler", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/crawler")>()),
  importUrl: mocks.page,
  importSitemap: mocks.sitemap,
}));
import { crawlSite, diffCrawls } from "../lib/site-crawler";
beforeEach(() => {
  mocks.page.mockReset();
  mocks.sitemap.mockReset();
});
describe("orquestração de crawler; transporte simulado apenas neste teste", () => {
  it("percorre links da mesma origem e limita profundidade, sem seguir endereço privado externo", async () => {
    mocks.page.mockImplementation(async (url: string) => ({
      url,
      title: url,
      pages: [{ text: url, page: null }],
      links: url.endsWith("/")
        ? ["https://docs.example.test/a", "https://127.0.0.1/"]
        : ["https://docs.example.test/b"],
    }));
    const result = await crawlSite("https://docs.example.test/", {
      maxDepth: 1,
    });
    expect(result.pages).toHaveLength(2);
    expect(mocks.page.mock.calls.map((c) => c[0])).not.toContain(
      "https://127.0.0.1/",
    );
  });
  it("consome sitemap index limitado e evita duplicatas", async () => {
    mocks.sitemap.mockImplementation(async (url: string) =>
      url.endsWith("index.xml")
        ? { isIndex: true, urls: ["https://docs.example.test/pages.xml"] }
        : {
            isIndex: false,
            urls: [
              "https://docs.example.test/a",
              "https://docs.example.test/a",
            ],
          },
    );
    mocks.page.mockImplementation(async (url: string) => ({
      url,
      title: "Teste",
      pages: [{ text: url, page: null }],
      links: [],
    }));
    expect(
      (
        await crawlSite("https://docs.example.test/", {
          sitemap: "https://docs.example.test/index.xml",
        })
      ).pages,
    ).toHaveLength(2);
  });
  it("não autoriza exclusão quando há falha ou limite de páginas", async () => {
    mocks.page.mockImplementation(async (url: string) => ({
      url,
      title: "Teste",
      pages: [{ text: url, page: null }],
      links: ["https://docs.example.test/a"],
    }));
    const previous = await crawlSite("https://docs.example.test/");
    const current = await crawlSite("https://docs.example.test/", {
      maxPages: 1,
    });
    expect(current.complete).toBe(false);
    expect(diffCrawls(previous, current).removed).toEqual([]);
  });
  it("identifica alterações e exclusões somente para a mesma varredura completa", async () => {
    mocks.page.mockImplementation(async (url: string) => ({
      url,
      title: "Teste",
      pages: [{ text: "versão um", page: null }],
      links: [],
    }));
    const previous = await crawlSite("https://docs.example.test/");
    mocks.page.mockImplementation(async (url: string) => ({
      url,
      title: "Teste",
      pages: [{ text: "versão dois", page: null }],
      links: [],
    }));
    const current = await crawlSite("https://docs.example.test/");
    expect(diffCrawls(previous, current).changed).toEqual([
      "https://docs.example.test/",
    ]);
  });
  it("recusa sitemap de outra origem antes da rede", async () => {
    await expect(
      crawlSite("https://docs.example.test/", {
        sitemap: "https://127.0.0.1/sitemap.xml",
      }),
    ).rejects.toThrow("mesma origem");
    expect(mocks.sitemap).not.toHaveBeenCalled();
  });
});
