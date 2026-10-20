/** Keep multipart requests below Vercel's function payload limit. */
export function uploadLimitBytes(
  env: Record<string, string | undefined> = process.env,
) {
  return (
    (env.VERCEL === "1" || env.APP_ENV === "staging" ? 3 : 10) * 1024 * 1024
  );
}
export function remoteOcrConfigured(
  env: Record<string, string | undefined> = process.env,
) {
  return env.APP_ENV === "staging" && env.OCR_WORKER_ENABLED === "true";
}
