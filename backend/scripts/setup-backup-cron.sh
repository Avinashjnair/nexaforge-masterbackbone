#!/bin/bash
# Register the daily backup cron job for the current user.
# Run once after provisioning: bash scripts/setup-backup-cron.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup.sh"
LOG_FILE="/var/log/nexaforge/backup.log"

chmod +x "$BACKUP_SCRIPT"

CRON_LINE="0 2 * * * ${BACKUP_SCRIPT} >> ${LOG_FILE} 2>&1"

# Add only if not already registered
if crontab -l 2>/dev/null | grep -qF "$BACKUP_SCRIPT"; then
  echo "Backup cron already registered:"
  crontab -l | grep "$BACKUP_SCRIPT"
else
  (crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -
  echo "Backup cron registered: $CRON_LINE"
fi

echo "Done. Verify with: crontab -l"
