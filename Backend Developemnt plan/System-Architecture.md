---
tags: [architecture, status/planning]
updated: 2025-05-03
---

# 🏗 System Architecture

## Stack decision

| Layer | Technology | Rationale |
|---|---|---|
| Runtime | Node.js 22 LTS | Event-driven, matches event bus architecture |
| API | Express.js | Minimal, middleware-first, RBAC fits naturally |
| Database | PostgreSQL 16 | JSONB for BOM, row-level security for RBAC, ACID for finance |
| Migrations | Knex.js | Typed queries + migration versioning |
| Event bus | RabbitMQ | Topic-based pub/sub, durable queues, management UI |
| Cache | Redis 7 | JWT sessions, KPI cache, rate limiting |
| Files | MinIO (dev) / S3 (prod) | MTCs, WPS PDFs, CAD files, MRB dossiers |
| IIoT | MQTT / Mosquitto | Welding machine telemetry |
| Time-series | TimescaleDB extension | IIoT weld readings with compression |
| Real-time | Socket.io | Live dashboard push, machine telemetry |
| Testing | Jest + Supertest + Cypress | Unit, integration, E2E |
| Load test | k6 | 50 concurrent users benchmark |
| Containers | Docker + Compose | Dev/prod parity |
| CI/CD | GitHub Actions | Lint → test → build → deploy |
| Proxy | Nginx | SSL, static files, rate limiting |
| Hosting | DigitalOcean / AWS | Managed Postgres + S3 for low ops overhead |

## 3-tier architecture

```
CLIENT TIER
  Browser SPA (HTML/CSS/JS) — D:\Claude Projects\ERP\
    |
    | HTTPS + WebSocket
    |
APPLICATION TIER
  Nginx → Node.js/Express API
  JWT Auth · RBAC · Audit log
  Socket.io WebSocket server
    |                    |
    | Event pub/sub      | SQL queries
    |                    |
EVENT BUS TIER       DATA TIER
  RabbitMQ             PostgreSQL 16
  Redis                TimescaleDB
    |                  MinIO / S3
    |
INTEGRATION TIER
  MQTT broker (welding machines)
  CAD parser (DXF/STEP/IGES)
  External lab API (SGS/TÜV)
  Email/SMS (SendGrid)
```

## Event bus topic schema

| Topic | Published by | Consumed by |
|---|---|---|
| `project.phase.changed` | Projects API | QC, Production, Finance |
| `grn.received` | Store API | QC (inspection), Finance |
| `ncr.raised` | QC API | Production, Procurement |
| `itp.hold.triggered` | QC API | Production (blocks step) |
| `material.request.raised` | Production API | Store, Procurement |
| `invoice.created` | Finance API | GM dashboard |
| `milestone.triggered` | Finance API | Finance (auto-invoice) |
| `wpq.expiring` | HR scheduler | HR, Welding, GM |
| `wps.violation` | IIoT service | QC, Welding, GM |
| `cert.expiring` | HR scheduler | HR, GM |

## Claude Code command to scaffold the project

```bash
claude "Read System-Architecture.md and generate the initial Node.js/Express project structure with folder layout, package.json dependencies, and Docker Compose file"
```
