import { describe, it, expect } from "vitest";
import { resolveAppOrigin } from "../lib/origin";
describe("origem segura de callbacks de autenticação", () => {
  it("usa a URL pública configurada sem confiar em host encaminhado", () =>
    expect(resolveAppOrigin("https://app.example.com/", "internal:3000")).toBe(
      "https://app.example.com",
    ));
  it("corrige o caso de bind interno 0.0.0.0 usando somente host local permitido", () =>
    expect(resolveAppOrigin(undefined, "127.0.0.1:3000")).toBe(
      "http://127.0.0.1:3000",
    ));
  it("aceita localhost explicitamente no desenvolvimento", () =>
    expect(resolveAppOrigin(undefined, "localhost:3000")).toBe(
      "http://localhost:3000",
    ));
  it.each(["evil.example", "127.0.0.1:3000.evil.example", "0.0.0.0:3000"])(
    "recusa host não configurado %s",
    (host) => expect(() => resolveAppOrigin(undefined, host)).toThrow(),
  );
  it.each([
    "http://app.example.com",
    "https://user:pass@app.example.com",
    "https://app.example.com/path",
    "https://app.example.com/?next=evil",
  ])("recusa configuração insegura %s", (origin) =>
    expect(() => resolveAppOrigin(origin, null)).toThrow(),
  );
});
