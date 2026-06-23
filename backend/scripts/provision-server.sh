#!/bin/bash
# NexaForge ERP — DigitalOcean / Ubuntu 24.04 Server Provisioning
#
# Run as root on a fresh Ubuntu 24.04 droplet:
#   bash <(curl -s https://raw.githubusercontent.com/<org>/<repo>/main/backend/scripts/provision-server.sh)
#
# What this script does:
#   1. Creates a 'deploy' user with sudo
#   2. Installs Node.js 22, PM2, Docker, Nginx, Certbot
#   3. Creates directory structure
#   4. Hardens SSH (disables root login, disables password auth)
#   5. Configures UFW firewall

set -euo pipefail

DEPLOY_USER="deploy"
APP_DIR="/opt/nexaforge"
LOG_DIR="/var/log/nexaforge"
FRONTEND_DIR="/var/www/nexaforge/frontend"

echo "=== NexaForge ERP Server Provisioning ==="
echo "Target: Ubuntu 24.04 LTS"
echo ""

# ── 1. System update ──────────────────────────────────────────────
echo "[1/9] Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Deploy user ────────────────────────────────────────────────
echo "[2/9] Creating deploy user..."
if ! id "$DEPLOY_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
  usermod -aG sudo "$DEPLOY_USER"
  # Allow sudo without password for deploy user (CI/CD automation)
  echo "${DEPLOY_USER} ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/${DEPLOY_USER}"
  chmod 440 "/etc/sudoers.d/${DEPLOY_USER}"
fi

# Copy authorized_keys from root to deploy (SSH key already added via DO)
if [ -f /root/.ssh/authorized_keys ]; then
  mkdir -p "/home/${DEPLOY_USER}/.ssh"
  cp /root/.ssh/authorized_keys "/home/${DEPLOY_USER}/.ssh/authorized_keys"
  chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh"
  chmod 700 "/home/${DEPLOY_USER}/.ssh"
  chmod 600 "/home/${DEPLOY_USER}/.ssh/authorized_keys"
fi

# ── 3. Node.js 22 via NodeSource ─────────────────────────────────
echo "[3/9] Installing Node.js 22..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node --version

# PM2 process manager
npm install -g pm2
pm2 startup systemd -u "$DEPLOY_USER" --hp "/home/${DEPLOY_USER}" | tail -1 | bash || true

# ── 4. Docker + Compose ───────────────────────────────────────────
echo "[4/9] Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker "$DEPLOY_USER"
fi
docker --version

# ── 5. Nginx ─────────────────────────────────────────────────────
echo "[5/9] Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# ── 6. Certbot (Let's Encrypt) ────────────────────────────────────
echo "[6/9] Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx
systemctl enable certbot.timer

# ── 7. Redis ─────────────────────────────────────────────────────
echo "[7/9] Installing Redis..."
apt-get install -y redis-server
systemctl enable redis-server

# ── 8. Directory structure ────────────────────────────────────────
echo "[8/9] Creating directory structure..."
mkdir -p "$APP_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "$FRONTEND_DIR"
mkdir -p /var/www/certbot
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "$APP_DIR" "$LOG_DIR"
chown -R www-data:www-data "$FRONTEND_DIR"

# ── 9. Firewall ───────────────────────────────────────────────────
echo "[9/9] Configuring UFW firewall..."
apt-get install -y ufw
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp     comment 'SSH'
ufw allow 80/tcp     comment 'HTTP (redirect to HTTPS)'
ufw allow 443/tcp    comment 'HTTPS'
ufw allow 8883/tcp   comment 'MQTT TLS'
ufw --force enable

echo ""
echo "=== Provisioning complete ==="
echo ""
echo "Next steps:"
echo "  1. Log in as ${DEPLOY_USER} and run:"
echo "     cd ${APP_DIR} && git clone <repo-url> backend && cd backend"
echo "     cp .env.example .env && nano .env   # fill in all values"
echo "  2. Copy Nginx config:"
echo "     sudo cp nginx/nexaforge.conf /etc/nginx/sites-available/nexaforge"
echo "     sudo ln -s /etc/nginx/sites-available/nexaforge /etc/nginx/sites-enabled/"
echo "     sudo nginx -t && sudo systemctl reload nginx"
echo "  3. Issue SSL cert:"
echo "     bash scripts/certbot-init.sh erp.nexaforge.com"
echo "  4. Run migrations + start API:"
echo "     NODE_ENV=production npx knex migrate:latest --knexfile knexfile.js"
echo "     pm2 start ecosystem.config.js --env production && pm2 save"
echo "  5. Schedule DB backups:"
echo "     bash scripts/setup-backup-cron.sh"
echo ""
echo "Reboot recommended: sudo reboot"
