import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd(), false);
if (process.env.NEXT_PUBLIC_SUPABASE_URL !== "http://127.0.0.1:54321")
  throw new Error(
    "E2E exige a instância local. Bancos remotos são recusados para proteger dados reais.",
  );
if (process.env.AI_ENABLED === "true")
  throw new Error("Desative a IA paga antes de executar as fixtures E2E.");
import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  retries: 0,
  expect: { timeout: 15000 },
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm start",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: false,
    timeout: 180000,
  },
});
