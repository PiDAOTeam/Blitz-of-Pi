#!/bin/bash

set -euo pipefail

export PATH=/www/server/nodejs/v20.20.2/bin:$PATH

PROJECT_ROOT="${PROJECT_ROOT:-/www/wwwroot/blitzapi.hashpi.app}"
LOG_DIR="$PROJECT_ROOT/logs"
LOG_FILE="$LOG_DIR/auto-payout-cron.log"

mkdir -p "$LOG_DIR"
cd "$PROJECT_ROOT"

if [ -f "$PROJECT_ROOT/.env.production" ]; then
  ENV_MODE="$(stat -c '%a' "$PROJECT_ROOT/.env.production")"
  ENV_PERM=$((8#$ENV_MODE))
  if (( ENV_PERM & 077 )); then
    echo "[$(date '+%F %T')] .env.production 权限过宽，请执行 chmod 600 $PROJECT_ROOT/.env.production" >> "$LOG_FILE"
    exit 1
  fi
fi

echo "[$(date '+%F %T')] auto payout cron start" >> "$LOG_FILE"
npm --workspace services/api run start:auto-payout-once >> "$LOG_FILE" 2>&1
echo "[$(date '+%F %T')] auto payout cron end" >> "$LOG_FILE"
