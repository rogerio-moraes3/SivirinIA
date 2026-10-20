const localHosts = new Set(["127.0.0.1:3000", "localhost:3000"]);
export function resolveAppOrigin(
  configured: string | undefined,
  host: string | null,
) {
  if (configured) {
    const url = new URL(configured);
    const local = url.hostname === "127.0.0.1" || url.hostname === "localhost";
    if (
      (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/" ||
      url.hostname === "0.0.0.0"
    )
      throw new Error(
        "APP_URL deve ser uma origem HTTPS válida, sem credenciais ou caminho.",
      );
    return url.origin;
  }
  // Never redirect to Next's internal bind address or an arbitrary forwarded host.
  if (host && localHosts.has(host)) return `http://${host}`;
  throw new Error("Configure APP_URL com o endereço público da aplicação.");
}
