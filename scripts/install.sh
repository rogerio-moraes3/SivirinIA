#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export npm_config_cache="${npm_config_cache:-/tmp/sivirinia-npm}"
npm ci --no-audit --no-fund
node scripts/install-ocr.mjs
node scripts/runtime-config.mjs
docker compose --env-file .local/runtime.env -f infra/compose.yml pull --quiet
