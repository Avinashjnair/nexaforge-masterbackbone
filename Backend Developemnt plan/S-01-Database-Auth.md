---
tags: [sprint/S-01, status/complete, priority/critical]
sprint: S-01
weeks: 1–3
status: complete
updated: 2026-05-04
---

# S-01 — Database & Auth Foundation

**Duration:** Weeks 1–3  
**Status:** ✅ Complete  
**Goal:** Lay the foundation — every other sprint depends on this schema and auth being correct.

---

## Tasks

### Database schema
- [x] Design ERD for all 11 modules (review with team before writing DDL)
- [x] Write PostgreSQL DDL — `projects` table with lifecycle state machine
- [x] Write PostgreSQL DDL — `bom_items` (self-referential for multi-level tree)
- [x] Write PostgreSQL DDL — `wps`, `pqr`, `wpq`, `weld_joints`, `nde_records`
- [x] Write PostgreSQL DDL — `ncrs`, `itp_steps`, `itp_sign_offs`
- [x] Write PostgreSQL DDL — `invoices`, `milestones`, `job_cost_lines`
- [x] Write PostgreSQL DDL — `employees`, `hr_certs`, `training_records`
- [x] Write PostgreSQL DDL — `opportunities`, `quotes`, `tenders`
- [x] Write PostgreSQL DDL — `purchase_orders`, `grn`, `inventory_items`
- [x] Write PostgreSQL DDL — `iiot_readings` (TimescaleDB hypertable)
- [x] Write PostgreSQL DDL — `audit_log` (every action logged)
- [x] Knex.js migration files for all tables
  > migrations/20250503_001_initial_schema.js — all 45 tables in dependency order
- [x] Seed script from existing UI mock data
  > seeds/01_initial_data.js — 3 projects, 4 users, 3 clients, WPS/WPQ data

### Authentication
- [x] Install: `express`, `jsonwebtoken`, `bcrypt`, `knex`, `pg`
  > package.json created with all dependencies
- [x] POST `/auth/login` — validate credentials, return JWT + refresh token
- [x] POST `/auth/refresh` — issue new access token from valid refresh token
- [x] DELETE `/auth/logout` — revoke refresh token
- [x] JWT middleware — validate token on every protected route
- [x] RBAC middleware — role hierarchy: GM > Manager > Senior > User

### Infrastructure
- [x] Docker Compose file: API + PostgreSQL + Redis + RabbitMQ
  > docker-compose.yml includes PostgreSQL 16 (TimescaleDB), Redis 7, RabbitMQ 3, MinIO, API
- [x] Environment variables: `.env.example` documented
- [x] Health check endpoint: `GET /health`
- [x] Audit log middleware — every mutation logged to `audit_log`

---

## Definition of done

- [x] All migrations run cleanly on fresh database
- [x] Seed data loads without errors
- [x] JWT login/logout/refresh flow working end-to-end
- [x] RBAC blocks wrong-role access (tested with curl)
- [x] Docker Compose starts all services with one command
- [x] Code merged to `main`

---

## Notes

> Add notes here during the sprint

---

## Claude Code prompts for this sprint

```bash
# Generate the full schema DDL
claude "Read S-01-Database-Auth.md and generate the complete PostgreSQL schema DDL for all tables listed"

# Generate Knex migrations
claude "Generate Knex.js migration files for the NexaForge ERP schema"

# Generate seed data
claude "Read the ERP frontend JS files in D:\Claude Projects\ERP\js\ and extract all AppState and mock data, then generate a PostgreSQL seed script"

# Generate Docker Compose
claude "Generate a docker-compose.yml for NexaForge ERP with PostgreSQL 16, Redis 7, RabbitMQ 3, and Node.js API service"
```

---

## Related

- [[03-Architecture/Database-Schema|Full schema reference]]
- [[03-Architecture/System-Architecture|System architecture]]
- [[07-Decisions/Decision-Log|Decision log]]
