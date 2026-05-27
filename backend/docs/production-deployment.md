# NexaForge ERP — Production Deployment Runbook

## Server setup (DigitalOcean Droplet — Ubuntu 24.04)

### 1. Provision server

Minimum spec: **4 vCPU / 8 GB RAM / 80 GB SSD** (DO General Purpose $48/mo).

```bash
# Connect as root, then create deploy user
adduser deploy
usermod -aG sudo deploy
# Copy your SSH key to deploy user, then disable root SSH login
```

### 2. Install dependencies

```bash
# Node.js 22 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22 && nvm use 22 && nvm alias default 22

# PM2
npm install -g pm2

# Nginx
sudo apt update && sudo apt install -y nginx

# Certbot (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
```

### 3. Clone and configure API

```bash
sudo mkdir -p /opt/nexaforge && sudo chown deploy:deploy /opt/nexaforge
cd /opt/nexaforge
git clone <repo-url> backend
cd backend
npm ci --omit=dev

# Create .env from template
cp .env.example .env
nano .env   # fill in all values — DB, Redis, JWT_SECRET, SENTRY_DSN, etc.
```

### 4. Database — DigitalOcean Managed PostgreSQL

- Create a Managed PostgreSQL 16 cluster (smallest: $15/mo)
- Add the Droplet to the trusted sources
- Copy the connection string into `.env`:
  ```
  DB_HOST=<managed-db-host>
  DB_PORT=25060
  DB_NAME=nexaforge
  DB_USER=nexaforge_api
  DB_PASSWORD=<generated-password>
  DB_SSL=true
  ```
- Run migrations:
  ```bash
  NODE_ENV=production npx knex migrate:latest --knexfile knexfile.js
  ```

### 5. Redis

```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server

# Set password in /etc/redis/redis.conf:
# requirepass <strong-password>
sudo systemctl restart redis-server
```

### 6. RabbitMQ

```bash
curl -s https://packagecloud.io/install/repositories/rabbitmq/rabbitmq-server/script.deb.sh | sudo bash
sudo apt install -y rabbitmq-server
sudo systemctl enable rabbitmq-server
sudo rabbitmq-plugins enable rabbitmq_management
sudo rabbitmqctl add_user nexaforge <password>
sudo rabbitmqctl set_permissions -p / nexaforge ".*" ".*" ".*"
```

### 7. MinIO (file storage)

```bash
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio && sudo mv minio /usr/local/bin/

sudo useradd -r minio-user -s /sbin/nologin
sudo mkdir -p /opt/minio/data && sudo chown minio-user:minio-user /opt/minio/data

# Create systemd service at /etc/systemd/system/minio.service
# Set MINIO_ROOT_USER and MINIO_ROOT_PASSWORD in /etc/default/minio
sudo systemctl enable --now minio

# Create the bucket
mc alias set local http://localhost:9000 <user> <pass>
mc mb local/nexaforge-docs
```

### 8. Start API with PM2

```bash
cd /opt/nexaforge/backend
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # follow the printed command to enable auto-start on reboot
sudo mkdir -p /var/log/nexaforge && sudo chown deploy:deploy /var/log/nexaforge
```

### 9. Nginx + SSL

```bash
# Copy config
sudo cp nginx/nexaforge.conf /etc/nginx/sites-available/nexaforge
sudo ln -s /etc/nginx/sites-available/nexaforge /etc/nginx/sites-enabled/nexaforge
sudo nginx -t && sudo systemctl reload nginx

# SSL certificate
sudo certbot --nginx -d erp.nexaforge.com

# Auto-renew
sudo systemctl enable certbot.timer
```

### 10. Copy frontend SPA

```bash
sudo mkdir -p /var/www/nexaforge/frontend
sudo cp -r /path/to/Sprint1/* /var/www/nexaforge/frontend/
sudo chown -R www-data:www-data /var/www/nexaforge/frontend
```

---

## Go-live checklist

Run through this list on go-live day before announcing to users:

- [ ] `curl https://erp.nexaforge.com/health` returns `{"status":"ok"}`
- [ ] Login with GM account works
- [ ] Dashboard loads with real project data
- [ ] Create a test project and delete it
- [ ] Upload a PDF and confirm it saves to MinIO
- [ ] Check Sentry dashboard — no unexpected errors
- [ ] PM2 shows all instances as `online` (`pm2 status`)
- [ ] Nginx access log shows 200s (`sudo tail -f /var/log/nginx/access.log`)
- [ ] UptimeRobot alert configured and receiving pings
- [ ] First DB backup scheduled (`crontab -l` shows backup job)

---

## Automated DB backup

```bash
# /opt/nexaforge/backup.sh
#!/bin/bash
set -e
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/opt/nexaforge/backups/nexaforge_${TIMESTAMP}.sql.gz"
mkdir -p /opt/nexaforge/backups
pg_dump $DATABASE_URL | gzip > "$BACKUP_FILE"
# Delete backups older than 30 days
find /opt/nexaforge/backups -name "*.sql.gz" -mtime +30 -delete
echo "Backup complete: $BACKUP_FILE"
```

```bash
chmod +x /opt/nexaforge/backup.sh
# Add to crontab (daily at 02:00):
(crontab -l; echo "0 2 * * * /opt/nexaforge/backup.sh >> /var/log/nexaforge/backup.log 2>&1") | crontab -
```

---

## Rollback procedure

```bash
cd /opt/nexaforge/backend
git log --oneline -10          # find last good tag/commit
git checkout <previous-tag>
npm ci --omit=dev
pm2 reload nexaforge-api --update-env
# If migration needs reverting:
NODE_ENV=production npx knex migrate:rollback --knexfile knexfile.js
```
