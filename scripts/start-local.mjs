import { execFileSync, spawn } from "node:child_process";
import { openSync, writeFileSync, readFileSync } from "node:fs";
import { setTimeout } from "node:timers/promises";
execFileSync(process.execPath, ["scripts/runtime-config.mjs"], {
  stdio: "inherit",
});
const compose = [
  "compose",
  "--env-file",
  ".local/runtime.env",
  "-f",
  "infra/compose.yml",
];
try {
  execFileSync("docker", [...compose, "up", "-d", "--wait"], {
    stdio: "inherit",
    timeout: 240000,
  });
} catch {
  throw new Error(
    "Não foi possível iniciar os componentes locais. Consulte docker compose ps/logs sem imprimir segredos.",
  );
}
let running = false;
try {
  const r = await fetch("http://127.0.0.1:54321/health", {
    signal: AbortSignal.timeout(2000),
  });
  running = r.ok && (await r.json()).gateway === "sivirinia-local";
} catch {}
if (!running) {
  const log = openSync(".local/gateway.log", "a", 0o600);
  const child = spawn(process.execPath, ["scripts/gateway.mjs"], {
    stdio: ["ignore", log, log],
    detached: true,
  });
  writeFileSync(".local/gateway.pid", String(child.pid), { mode: 0o600 });
  child.unref();
}
let healthy = false;
for (let attempt = 0; attempt < 60; attempt++) {
  try {
    const [gateway, auth] = await Promise.all([
      fetch("http://127.0.0.1:54321/health", {
        signal: AbortSignal.timeout(2000),
      }),
      fetch("http://127.0.0.1:54321/auth/v1/health", {
        signal: AbortSignal.timeout(2000),
      }),
    ]);
    healthy =
      gateway.ok &&
      (await gateway.json()).gateway === "sivirinia-local" &&
      auth.ok;
  } catch {}
  if (healthy) break;
  await setTimeout(1000);
}
if (!healthy)
  throw new Error(
    "Gateway/Auth não ficaram saudáveis. Verifique a porta 54321 e os logs locais.",
  );
execFileSync(
  "docker",
  [
    ...compose,
    "exec",
    "-T",
    "db",
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
    "-q",
  ],
  {
    input: readFileSync("infra/auth-compat.sql"),
    stdio: ["pipe", "pipe", "pipe"],
  },
);
execFileSync(process.execPath, ["scripts/db-migrate.mjs"], {
  stdio: "inherit",
});
execFileSync(process.execPath, ["scripts/setup-worker.mjs"], {
  stdio: "inherit",
});
console.log(
  "Auth, banco, API e gateway locais em execução. Migrations verificadas.",
);
