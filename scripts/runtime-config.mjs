import { randomBytes, createHmac } from "node:crypto";
import { mkdirSync, chmodSync, existsSync, writeFileSync } from "node:fs";
mkdirSync(".local", { recursive: true, mode: 0o700 });
chmodSync(".local", 0o700);
if (existsSync(".local/runtime.env")) {
  console.log("Configuração local preservada.");
  process.exit(0);
}
const secret = randomBytes(48).toString("hex");
const encode = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const head = encode({ alg: "HS256", typ: "JWT" });
const payload = encode({
  iss: "sivirinia-local",
  role: "anon",
  aud: "authenticated",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 10 * 365 * 86400,
});
const signature = createHmac("sha256", secret)
  .update(`${head}.${payload}`)
  .digest("base64url");
const values = {
  DB_PASSWORD: randomBytes(24).toString("hex"),
  AUTH_DB_PASSWORD: randomBytes(24).toString("hex"),
  REST_DB_PASSWORD: randomBytes(24).toString("hex"),
  JWT_SECRET: secret,
  ANON_KEY: `${head}.${payload}.${signature}`,
};
writeFileSync(
  ".local/runtime.env",
  Object.entries(values)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n",
  { flag: "wx", mode: 0o600 },
);
console.log(
  "Segredos locais gerados em arquivo ignorado e privado. Valores omitidos.",
);
