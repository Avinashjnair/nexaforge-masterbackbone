---
tags: [sprint/S-09, status/in-progress, priority/critical]
sprint: S-09
weeks: 23–26
status: in-progress
updated: 2026-05-06
---

# S-09 — UAT, Training & Go-Live

**Duration:** Weeks 23–26  
**Status:** 🔵 In progress — 55% — UAT security findings resolved; server provisioning pending  
**Goal:** Departments sign off. System goes live. No more spreadsheets.

---

## UAT Security Findings Log

> Source: `UAT Comments 1.md` — received 2026-05-06
> All findings resolved in the same session. See S-08 for full fix details.

| # | Finding | Severity | Status |
|---|---|---|---|
| UAT-01 | Client-side auth bypass — `DEPT_ACCOUNTS` map resolved logins without backend | Critical | ✅ Fixed |
| UAT-02 | Refresh token stored in `sessionStorage` — XSS-readable | High | ✅ Fixed |
| UAT-03 | BOLA — dept data routes missing `requireDepartment` server-side enforcement | Critical | ✅ Fixed |
| UAT-04 | No cross-dept E2E isolation tests | Medium | ✅ Fixed |

---

## Tasks

### UAT (User Acceptance Testing)
- [x] UAT Comments 1 reviewed and all security findings resolved (2026-05-06)
- [ ] UAT plan document prepared and shared with department managers
- [ ] Marketing: create opportunity → generate quote → win → project entity
- [ ] Production: BOM review, raise RM, update routing step status
- [ ] QC: sign off ITP steps, raise NCR, generate MRB PDF
- [ ] Store: log GRN, set quarantine, clear to stock
- [ ] Finance: review job cost, raise invoice from milestone
- [ ] HR: add employee, log training, check cert expiry alerts
- [ ] Welding: review WPS, log NDE result, view live machine telemetry
- [ ] Sign-off from each department manager in writing

### Training
- [ ] Training plan per role (not per department — by what they do)
- [ ] GM / Plant Manager: executive dashboard + project health matrix
- [ ] Production team: BOM, routing steps, material requests
- [ ] QC team: ITP workflow, NCR raising, weld joint inspection
- [ ] Marketing: CRM pipeline, quote builder, tender tracker
- [ ] Finance: job cost review, invoice creation
- [ ] HR: employee management, cert tracking, shift schedule
- [ ] Store: GRN logging, inventory management
- [ ] Quick reference cards: one A4 card per role, laminated

### Production deployment
- [ ] Provision cloud server (DigitalOcean Droplet or AWS EC2)
- [ ] Set up managed PostgreSQL (DigitalOcean Managed DB or RDS)
- [ ] Configure S3 bucket for file storage
- [ ] DNS + SSL certificate (Let's Encrypt)
- [ ] Nginx configuration: reverse proxy + SSL termination
- [ ] PM2 process manager for Node.js API
- [ ] Run migrations on production database
- [ ] Load seed data (approved by each department manager)
- [ ] Smoke test all 11 modules on production URL

### CI/CD pipeline (GitHub Actions)
- [ ] On PR: lint → unit tests → integration tests
- [ ] On merge to `main`: build → deploy to staging
- [ ] On tag `v*`: deploy to production (manual approval gate)
- [ ] Slack / email notification on deploy success or failure

### Monitoring & alerting
- [ ] Uptime monitoring (UptimeRobot or Better Uptime)
- [ ] Error logging (Sentry or Logtail)
- [ ] DB performance monitoring (pg_stat_statements)
- [ ] Alert: API response > 1s for 5 consecutive minutes
- [ ] Alert: Error rate > 1% for 5 minutes
- [ ] Alert: Disk usage > 80%
- [ ] Backup: automated daily DB backup, retain 30 days

### Go-live checklist
- [ ] All UAT sign-offs received
- [ ] All training sessions completed
- [ ] Production smoke test passed
- [ ] Monitoring alerts configured and tested
- [ ] Backup verified (restore test)
- [ ] Rollback plan documented
- [ ] Support contact communicated to all departments
- [ ] Go-live date confirmed with GM

---

## Definition of done

- [ ] All 6 departments sign off UAT in writing
- [ ] Production URL live and accessible
- [ ] All monitoring alerts firing to correct contacts
- [ ] First real project created in production (not test data)
- [ ] Post-launch 24-hour observation period complete with no critical issues
