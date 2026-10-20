// Development-only Supabase-compatible routing. Authorization stays with GoTrue and PostgREST/RLS.
import http from "node:http";
import { parseEnv } from "node:util";
import { readFileSync } from "node:fs";
const config = parseEnv(readFileSync(".local/runtime.env", "utf8"));
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end('{"gateway":"sivirinia-local"}');
    return;
  }
  const auth = req.url?.startsWith("/auth/v1/");
  const rest = req.url?.startsWith("/rest/v1/");
  if (!auth && !rest) {
    res.writeHead(404);
    res.end();
    return;
  }
  if (req.headers.apikey && req.headers.apikey !== config.ANON_KEY) {
    res.writeHead(401);
    res.end();
    return;
  }
  let bytes = 0;
  const proxy = http.request(
    {
      hostname: "127.0.0.1",
      port: auth ? 54325 : 54326,
      path: req.url.slice(8),
      method: req.method,
      headers: {
        ...req.headers,
        host: "127.0.0.1",
        authorization: req.headers.authorization || `Bearer ${config.ANON_KEY}`,
      },
    },
    (response) => {
      res.writeHead(response.statusCode || 502, response.headers);
      response.pipe(res);
    },
  );
  req.on("data", (chunk) => {
    bytes += chunk.length;
    if (bytes > 12 * 1024 * 1024) {
      proxy.destroy();
      res.writeHead(413);
      res.end();
      req.destroy();
    }
  });
  proxy.on("error", () => {
    if (!res.headersSent) res.writeHead(502);
    res.end();
  });
  req.on("aborted", () => proxy.destroy());
  req.pipe(proxy);
});
server.requestTimeout = 60000;
server.listen(54321, "127.0.0.1", () =>
  console.log("Gateway local ativo. Credenciais omitidas."),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => server.close(() => process.exit(0)));
