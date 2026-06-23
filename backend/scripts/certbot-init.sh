#!/bin/bash
# Issue Let's Encrypt SSL certificate for NexaForge ERP.
# Run AFTER Nginx is installed and DNS is pointing to this server.
#
# Usage: bash scripts/certbot-init.sh erp.nexaforge.com [admin@nexaforge.com]

set -euo pipefail

DOMAIN="${1:?Usage: $0 <domain> [email]}"
EMAIL="${2:-admin@nexaforge.com}"

echo "=== Certbot — Let's Encrypt SSL ==="
echo "Domain: $DOMAIN"
echo "Email:  $EMAIL"
echo ""

# Ensure Nginx is running
systemctl is-active nginx || { echo "Nginx is not running. Start it first."; exit 1; }

# Ensure webroot exists for ACME challenge
mkdir -p /var/www/certbot

echo "[1/3] Running Certbot with Nginx plugin..."
certbot --nginx \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$DOMAIN" \
  --redirect

echo "[2/3] Testing certificate renewal (dry run)..."
certbot renew --dry-run

echo "[3/3] Verifying auto-renewal timer..."
systemctl is-enabled certbot.timer && echo "certbot.timer is enabled" || {
  systemctl enable certbot.timer
  systemctl start certbot.timer
  echo "certbot.timer enabled and started"
}

echo ""
echo "=== SSL setup complete ==="
echo "Certificate path: /etc/letsencrypt/live/${DOMAIN}/"
echo "Auto-renewal:     enabled via systemd timer (runs twice daily)"
echo ""
echo "Verify with: curl -I https://${DOMAIN}/health"
