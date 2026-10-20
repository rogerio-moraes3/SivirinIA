import { EventEmitter } from "node:events";
import type { ClientRequest, IncomingMessage } from "node:http";
import type { RequestOptions } from "node:https";
import { describe, it, expect, vi, beforeEach } from "vitest";
const transport = vi.hoisted(() => ({ lookup: vi.fn(), get: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup: transport.lookup }));
vi.mock("node:https", () => ({ default: { get: transport.get } }));
import { importUrl } from "../lib/crawler";
beforeEach(() => {
  transport.lookup.mockReset();
  transport.get.mockReset();
  transport.lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  transport.get.mockImplementation(
    (
      url: URL,
      _options: RequestOptions,
      callback: (response: IncomingMessage) => void,
    ) => {
      const request = new EventEmitter() as ClientRequest;
      request.destroy = vi.fn(() => request);
      const response = new EventEmitter() as IncomingMessage;
      response.statusCode = 200;
      response.headers = { "content-type": "text/html" };
      queueMicrotask(() => {
        callback(response);
        response.emit(
          "data",
          Buffer.from(
            url.pathname === "/robots.txt"
              ? "User-agent: *\nAllow: /"
              : "<title>Política</title><main>O reembolso ocorre em sete dias.</main>",
          ),
        );
        response.emit("end");
      });
      return request;
    },
  );
});
describe("transporte do crawler — simulado somente em testes", () => {
  it("fixa IP e família de conexão, preserva hostname TLS e não desativa verificação", async () => {
    const result = await importUrl("https://docs.example.test/policy");
    expect(result.pages[0].text).toContain("sete dias");
    expect(transport.get).toHaveBeenCalledTimes(2);
    for (const call of transport.get.mock.calls) {
      const [url, options] = call as [URL, RequestOptions];
      expect(url.hostname).toBe("docs.example.test");
      expect(url.protocol).toBe("https:");
      expect(options.family).toBe(4);
      expect(options.rejectUnauthorized).not.toBe(false);
      const callback = vi.fn();
      options.lookup!("docs.example.test", {}, callback);
      expect(callback).toHaveBeenCalledWith(null, "93.184.216.34", 4);
    }
  });
  it("bloqueia mudança do DNS para endereço privado antes da segunda requisição", async () => {
    transport.lookup
      .mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
      .mockResolvedValueOnce([{ address: "127.0.0.1", family: 4 }]);
    await expect(importUrl("https://docs.example.test/policy")).rejects.toThrow(
      "rede não permitida",
    );
    expect(transport.get).toHaveBeenCalledTimes(1);
  });
});
