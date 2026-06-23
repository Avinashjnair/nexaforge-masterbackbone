#!/bin/bash
# NexaForge ERP — PostgreSQL daily backup script.
# Intended to run via cron at 02:00 daily.
#
# Usage:  bash scripts/backup.sh
# Setup:  bash scripts/setup-backup-cron.sh
#
# Environment variables read from /opt/nexaforge/backend/.env

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"

# Load .env if present
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

BACKUP_DIR="${BACKUP_DIR:-/opt/nexaforge/backups}"
RETAIN_DAYS="${BACKUP_RETAIN_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/nexaforge_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[backup] Starting PostgreSQL backup at $(date)"

# Build pg_dump connection flags
PG_OPTS="-h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-nexaforge_api} ${DB_NAME:-nexaforge}"
if [ "${DB_SSL:-false}" = "true" ]; then
  export PGSSLMODE=require
fi

export PGPASSWORD="${DB_PASSWORD:-}"
pg_dump $PG_OPTS | gzip > "$BACKUP_FILE"
unset PGPASSWORD

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[backup] Written: $BACKUP_FILE ($BACKUP_SIZE)"

# Remove backups older than RETAIN_DAYS
DELETED=$(find "$BACKUP_DIR" -name "nexaforge_*.sql.gz" -mtime "+${RETAIN_DAYS}" -print -delete | wc -l)
echo "[backup] Pruned $DELETED backup(s) older than ${RETAIN_DAYS} days"

echo "[backup] Complete at $(date)"
