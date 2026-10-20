import { describe, it, expect } from "vitest";
import { isPublicAddress, validatePublicUrl } from "../lib/crawler";
describe("proteção SSRF", () => {
  it.each([
    "127.0.0.1",
    "10.0.0.1",
    "172.16.1.1",
    "192.168.0.10",
    "169.254.169.254",
    "0.0.0.0",
    "::1",
    "::",
    "fe80::1",
    "fc00::1",
    "::ffff:127.0.0.1",
    "224.0.0.1",
    "100.64.0.1",
  ])("bloqueia rede especial %s", (address) =>
    expect(isPublicAddress(address)).toBe(false),
  );
  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])(
    "aceita endereço público %s",
    (address) => expect(isPublicAddress(address)).toBe(true),
  );
  it.each([
    "http://example.com",
    "file:///etc/passwd",
    "https://user:password@example.com",
    "https://example.com:8443",
    "https://localhost",
    "https://internal.local",
  ])("recusa URL insegura %s", (url) =>
    expect(() => validatePublicUrl(url)).toThrow(),
  );
  it("aceita HTTPS sem credenciais", () =>
    expect(validatePublicUrl("https://example.com/docs").pathname).toBe(
      "/docs",
    ));
});
