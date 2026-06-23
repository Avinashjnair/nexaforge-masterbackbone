---
tags: [sprint/S-09, status/in-progress, priority/critical]
sprint: S-09
weeks: 23–26
status: in-progress
updated: 2026-05-04
---

# S-09 — UAT, Training & Go-Live

**Duration:** Weeks 23–26  
**Status:** 🔵 In progress  
**Goal:** Departments sign off. System goes live. No more spreadsheets.

---

## Tasks

### UAT (User Acceptance Testing)
- [x] UAT plan document prepared (`docs/uat-plan.md`) — 9 modules × step-by-step scenarios with pass/fail columns
- [ ] Marketing: create opportunity → generate quote → win → project entity (scenario ready, awaiting execution)
- [ ] Production: BOM review, raise RM, update routing step status (scenario ready)
- [ ] QC: sign off ITP steps, raise NCR, generate MRB PDF (scenario ready)
- [ ] Store: log GRN, set quarantine, clear to stock (scenario ready)
- [ ] Finance: review job cost, raise invoice from milestone (scenario ready)
- [ ] HR: add employee, log training, check cert expiry alerts (scenario ready)
- [ ] Welding: review WPS, log NDE result, view live machine telemetry (scenario ready)
- [ ] Sign-off from each department manager in writing

### Training
- [x] Quick reference card: GM / Plant Manager (`docs/quick-ref-gm.md`)
- [x] Quick reference card: Production team (`docs/quick-ref-production.md`)
- [x] Quick reference card: QC team (`docs/quick-ref-qc.md`)
- [x] Quick reference card: Finance team (`docs/quick-ref-finance.md`)
- [x] Quick reference card: Store team (`docs/quick-ref-store.md`)
- [x] Quick reference card: Welding team (`docs/quick-ref-welding.md`)
- [x] HR quick reference card (`docs/quick-ref-hr.md`)
- [x] Marketing / CRM quick reference card (`docs/quick-ref-marketing.md`)
- [ ] Training sessions scheduled with each department

### Production deployment
- [x] Deployment runbook documented (`docs/production-deployment.md`) — full step-by-step for DigitalOcean
- [x] PM2 ecosystem config (`ecosystem.config.js`) — cluster mode, log rotation, auto-restart
- [x] Nginx config (`nginx/nexaforge.conf`) — SSL termination, WebSocket proxy, static SPA serving
- [x] `entrypoint.sh` — auto-migrate + optional seed on container start
- [x] DB backup script in runbook (daily cron, 30-day retention)
- [ ] Provision cloud server (DigitalOcean Droplet)
- [ ] Set up managed PostgreSQL
- [ ] Configure S3/MinIO bucket
- [ ] DNS + SSL certificate
- [ ] Run migrations on production database
- [ ] Production smoke test all 11 modules

### CI/CD pipeline (GitHub Actions)
- [x] `.github/workflows/ci.yml` — PR/push: Jest unit + integration tests
- [x] `.github/workflows/deploy-staging.yml` — merge to main: SSH deploy → migrate → PM2 reload + Slack notify
- [x] `.github/workflows/deploy-production.yml` — tag `v*`: manual-approval gate → SSH deploy → smoke test + Slack notify
- [ ] Add GitHub repository secrets (STAGING_HOST, PROD_HOST, SSH keys, SLACK_WEBHOOK_URL)
- [ ] Test CI pipeline with a test PR

### Monitoring & alerting
- [x] Sentry error monitoring integrated in `src/app.js` — enabled when `SENTRY_DSN` env var is set
- [ ] Create Sentry project and add DSN to production `.env`
- [ ] UptimeRobot monitor: `GET /health` every 5 minutes
- [ ] Alert: API response > 1s for 5 consecutive minutes
- [ ] Alert: Error rate > 1% for 5 minutes
- [ ] Backup: automated daily DB backup verified (restore test)

### Go-live checklist
- [ ] All UAT sign-offs received
- [ ] All training sessions completed
- [ ] Production smoke test passed
- [ ] Monitoring alerts configured and tested
- [ ] Backup verified (restore test)
- [ ] Rollback plan documented (in runbook)
- [ ] Support contact communicated to all departments
- [ ] Go-live date confirmed with GM

---

## Definition of done

- [ ] All 6 departments sign off UAT in writing
- [ ] Production URL live and accessible
- [ ] All monitoring alerts firing to correct contacts
- [ ] First real project created in production (not test data)
- [ ] Post-launch 24-hour observation period complete with no critical issues
