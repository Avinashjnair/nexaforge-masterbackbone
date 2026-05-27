# NexaForge ERP — Masterbackbone

> Single source of truth for all features, modules, and development progress.
> Update this file whenever new features are added or statuses change.

**Product:** NexaForge ERP
**Target Industry:** SME Manufacturing & Heavy Engineering (Tanks, Pressure Vessels, Heat Exchangers)
**Last Updated:** 2026-05-27

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML / CSS / JS (SPA) |
| Backend Runtime | Node.js 22 LTS |
| API Framework | Express.js |
| Database | PostgreSQL 16 + TimescaleDB |
| Migrations | Knex.js |
| Event Bus | RabbitMQ |
| Cache | Redis 7 |
| File Storage | MinIO (dev) / S3 (prod) |
| IIoT Protocol | MQTT / Mosquitto |
| Real-time | Socket.io |
| PDF Engine | pdfkit |
| Testing | Jest + Supertest + Cypress + k6 |
| Containers | Docker + Compose |
| CI/CD | GitHub Actions (planned) |
| Hosting | DigitalOcean / AWS (planned) |

---

## 1. Module Registry

### 1.1 Marketing & CRM

| Feature | Status | Layer | Sprint | Notes |
|---|---|---|---|---|
| CRM Pipeline (Kanban) | Done | Frontend | — | Kanban-based opportunity tracking |
| Quoting Engine | Done | Full-Stack | S-04 | Dynamic quote builder with material price indexing |
| Tender Tracker | Done | Full-Stack | S-04 | RFQ/ITT management with bid deadlines |
| BOQ Ingestion | Done | Full-Stack | S-05 | DXF, XLSX, PDF parsing into BOM items |
| Client Database | Done | Full-Stack | S-04 | Client history and interaction logging |
| CRM Activity Logging | Done | Backend | S-04 | Call, email, site visit records |
| Quote PDF Generation | Done | Backend | S-05 | Server-side PDF via pdfkit |
| Opportunity-to-Project Conversion | Done | Backend | S-04 | Won opportunity auto-creates project entity |

**Frontend:** `marketing.js`, `marketing2.js`, `marketing.css`
**Backend:** `routes/clients.js`, `routes/opportunities.js`, `routes/quotes.js`

---

### 1.2 Procurement

| Feature | Status | Layer | Sprint | Notes |
|---|---|---|---|---|
| PR Automation | Done | Frontend | — | Purchase Requisition generation from Production |
| Supplier Scorecards | Done | Full-Stack | S-04+ | Vendor performance evaluation |
| PO Management | Done | Frontend | — | Full PO lifecycle: draft to approval |
| Approval Workflows | Done | Frontend | — | Multi-level management authorization |
| Vendor Quality Scoring | Done | Backend | S-04+ | Automated vendor scoring engine |
| Frontend-Backend Wiring | Not Started | Full-Stack | S-07 | Connect UI to backend APIs |

**Frontend:** `procurement.js`, `procurement.css`
**Backend:** `routes/vendorQuality.js`, `services/vendorScorer.js`

---

### 1.3 Store & Inventory

| Feature | Status | Layer | Sprint | Notes |
|---|---|---|---|---|
| Heat Number Traceability | Done | Frontend | — | Full material pedigree for pressure parts |
| GRN Processing | Done | Full-Stack | S-02+ | Goods Received Note linked to POs |
| Quarantine Management | Done | Frontend | — | Isolated storage for non-conforming material |
| Remnant Tracking | Done | Full-Stack | S-04+ | Cut plate and unused stock management |
| Material Request from Production | Done | Backend | S-02 | Raises RM from production routing |
| Frontend-Backend Wiring | Not Started | Full-Stack | S-07 | Connect UI to backend APIs |

**Frontend:** `inventory.js`, `inventory.css`
**Backend:** `routes/grn.js`, `routes/inspections.js`, `routes/remnants.js`, `routes/materialRequests.js`

---

### 1.4 Production

| Feature | Status | Layer | Sprint | Notes |
|---|---|---|---|---|
| BOM Management | Done | Full-Stack | S-02 | Multi-level tree with recursive CTE queries |
| Shop Floor Scheduling | Done | Full-Stack | S-02 | Task allocation and progress tracking |
| MRP Engine | Done | Full-Stack | S-02 | Material Requirements Planning with stock check |
| Work Centre Management | Done | Full-Stack | S-02 | Status and utilisation tracking |
| Routing Steps | Done | Full-Stack | S-02 | Sequential routing with start/complete/block |
| Gantt Charts | Done | Frontend | — | Visual scheduling UI |
| Machine Downtime Logging | Done | Backend | S-06 | Tracks downtime events per machine |
| Frontend-Backend Wiring | Not Started | Full-Stack | S-07 | Connect UI to backend APIs |

**Frontend:** `production.js`, `production.css`
**Backend:** `routes/projects.js`, `routes/bom.js`, `routes/bomItems.js`, `routes/routing.js`, `routes/workCentres.js`, `routes/schedule.js`, `routes/machineDowntime.js`

---

### 1.5 Quality Control

| Feature | Status | Layer | Sprint | Notes |
|---|---|---|---|---|
| NCR Workflow | Done | Full-Stack | S-02/S-03 | State machine: Identify > RCA > Dispose > Close |
| ITP Management | Done | Full-Stack | S-04+ | Inspection & Test Plan with hold/witness points |
| Inspection Records | Done | Full-Stack | S-04+ | Incoming, in-process, and final inspection |
| QC Reports | Done | Frontend | — | Report generation and formatting |
| SPC (Statistical Process Control) | Done | Backend | S-04+ | Control charts and capability analysis |
| Calibration Management | Done | Backend | S-04+ | Equipment calibration scheduling |
| Control Plans | Done | Backend | S-04+ | Process control documentation |
| NCR PDF Generation | Done | Backend | S-05 | Formal NCR report PDF |
| ITP PDF Generation | Done | Backend | S-05 | ITP report PDF with sign-off matrix |
| MRB Dossier PDF | Done | Backend | S-05 | 5-section Material Review Board dossier |
| Frontend-Backend Wiring | Not Started | Full-Stack | S-07 | Connect UI to backend APIs |

**Frontend:** `quality.js`, `quality2.js`, `qc-reports.js`, `quality.css`, `qc-reports.css`
**Backend:** `routes/ncr.js`, `routes/itp.js`, `routes/inspections.js`, `routes/spc.js`, `routes/calibration.js`, `routes/controlPlan.js`, `services/ncrStateMachine.js`, `services/itpEngine.js`, `services/spcCalculator.js`, `services/calibrationScheduler.js`

---

### 1.6 Projects

| Feature | Status | Layer | Sprint | Notes |
|---|---|---|---|---|
| Active Project Selector | Done | Full-Stack | S-02 | Global context switching for project data |
| Phase Tracking | Done | Full-Stack | S-02 | Initiation through Dispatch lifecycle |
| Entity Creation from CRM | Done | Full-Stack | S-02/S-04 | Auto-create from won opportunity |
| Project Comments | Done | Backend | S-04+ | Collaboration and notes per project |
| Soft Delete | Done | Backend | S-01 | Projects are soft-deleted, never hard-deleted |
| Phase Change Events | Done | Backend | S-02 | Fires event bus on phase advancement |

**Frontend:** `projects.js`, `app.js`
**Backend:** `routes/projects.js`, `routes/projectComments.js`

---

### 1.7 Finance & Job Costing

| Feature | Status | Layer | Sprint | Notes |
|---|---|---|---|---|
| Job Costing Engine | Done | Full-Stack | S-04 | Budget vs Actual vs Committed vs Forecast |
| Milestone Billing | Done | Full-Stack | S-04 | Auto-invoice from production milestones |
| AR Ledger | Done | Full-Stack | S-04 | Invoice status: paid, overdue, chase |
| AP Ledger | Done | Full-Stack | S-04 | Payables tracking with payment marking |
| Cash Flow Aggregation | Done | Backend | S-04 | Monthly inflow/outflow report |
| Overhead Absorption | Done | Frontend | — | Facility and management cost allocation |
| Invoice PDF Generation | Done | Backend | S-05 | Server-side invoice PDF |
| Frontend-Backend Wiring | Not Started | Full-Stack | S-07 | Connect UI to backend APIs |

**Frontend:** `finance.js`, `finance2.js`, `finance.css`
**Backend:** `routes/finance.js`, `services/jobCosting.js`

---

### 1.8 HR & Workforce

| Feature | Status | Layer | Sprint | Notes |
|---|---|---|---|---|
| Employee Directory | Done | Full-Stack | S-04 | Full directory with cert status |
| Welder Passport / WPQ | Done | Full-Stack | S-03/S-04 | Certification tracking with expiry alerts |
| Skills Matrix | Done | Frontend | — | Visual workforce capabilities |
| Shift Scheduling | Planned | Full-Stack | S-07 | Deferred to frontend wiring sprint |
| Utilisation Tracking | Done | Full-Stack | S-04 | Direct vs indirect labour hours |
| Leave Requests | Done | Backend | S-04+ | Employee leave management |
| Attendance | Done | Backend | S-04+ | Time and attendance tracking |
| Expense Claims | Done | Backend | S-04+ | Employee expense submission and approval |
| Training Records | Done | Full-Stack | S-04 | Log and complete training sessions |
| Cert Renewal | Done | Backend | S-04 | Update certifications with new expiry |
| WPQ Expiry Scheduler | Done | Backend | S-03 | Automated alerts for expiring qualifications |
| Frontend-Backend Wiring | Not Started | Full-Stack | S-07 | Connect UI to backend APIs |

**Frontend:** `hr.js`, `hr2.js`, `hr.css`
**Backend:** `routes/hr.js`, `routes/leaveRequests.js`, `routes/attendance.js`, `routes/expenseClaims.js`, `services/wpqScheduler.js`

---

### 1.9 Welding & WPS

| Feature | Status | Layer | Sprint | Notes |
|---|---|---|---|---|
| WPS Library | Done | Full-Stack | S-03 | Approved Welding Procedure Specifications |
| PQR Tracking | Done | Full-Stack | S-03 | Procedure to qualification record linkage |
| Weld Joint Register | Done | Full-Stack | S-03 | Real-time joint status per project |
| IIoT Telemetry | Done | Full-Stack | S-06 | Live welding machine parameter monitoring |
| Heat Input Validation | Done | Backend | S-06 | Real-time compliance against WPS limits |
| WPS Violation Alerts | Done | Backend | S-06 | Event bus alert on out-of-range readings |
| Frontend-Backend Wiring | Not Started | Full-Stack | S-07 | Connect UI to backend APIs |

**Frontend:** `welding.js`, `welding2.js`, `welding.css`
**Backend:** `routes/wps.js`, `routes/wpq.js`, `routes/weldJoints.js`

---

### 1.10 Analytics & KPI

| Feature | Status | Layer | Sprint | Notes |
|---|---|---|---|---|
| Executive Scorecard | Done | Frontend | — | Headline metrics for full portfolio |
| OEE Engine | Done | Frontend | — | Machine effectiveness calculation |
| COPQ Analysis | Done | Frontend | — | Cost of Poor Quality waterfall chart |
| KPI Heatmap | Done | Frontend | — | 12-week performance visualization |
| Dashboard Aggregates API | Done | Backend | S-04+ | Server-side KPI aggregation |
| Sparkline Charts | Done | Frontend | — | Trend visualisation in compact form |
| Frontend-Backend Wiring | Not Started | Full-Stack | S-07 | Connect UI to backend APIs |

**Frontend:** `analytics.js`, `analytics2.js`, `analytics.css`
**Backend:** `routes/dashboardAggregates.js`

---

## 2. Cross-Cutting Features

| Feature | Status | Modules Involved | Sprint | Notes |
|---|---|---|---|---|
| NCR Workflow | Done | QC, Production, Finance, Analytics | S-02/S-03 | Full state machine with quarantine and disposition |
| Job Costing & P&L | Done | Finance, Procurement, Store, HR | S-04 | Budget vs Actual tracking per project |
| Welder Passport & WPQ | Done | HR, Welding | S-03/S-04 | Certification tracking with expiry scheduler |
| MRP & BOM Management | Done | Production, Store, Procurement, CRM | S-02 | Multi-level BOM with MRP calculation |
| COPQ (Cost of Poor Quality) | Done | Finance, QC, Analytics | S-04 | Internal/external failure cost aggregation |
| OEE (Overall Equipment Effectiveness) | Done | Analytics, Production, Welding | S-06 | Availability x Performance x Quality |
| SPC (Statistical Process Control) | Done | QC | S-04+ | Control charts and process capability |
| Calibration Management | Done | QC | S-04+ | Equipment calibration scheduling |
| Vendor Quality Scoring | Done | Procurement, QC | S-04+ | Automated supplier performance scoring |
| Kaizen / Continuous Improvement | Done | QC, Production | S-04+ | Improvement initiative tracking |
| Customer Complaints | Done | QC, CRM | S-04+ | External complaint management |
| Field Visit Reports | Done | CRM, Projects | S-04+ | On-site visit documentation |
| PDF Document Engine | Done | All modules | S-05 | ITP, NCR, MRB, Quote, Invoice PDFs |
| CAD/BOQ Parser | Done | CRM, Production | S-05 | DXF, XLSX, PDF file parsing to BOM |
| Audit Log | Done | All modules | S-01 | Every mutation logged with user + timestamp |
| RBAC (Role-Based Access) | Done | All modules | S-01 | GM > Manager > Senior > User hierarchy |

---

## 3. Backend Sprint Progress

| Sprint | Name | Weeks | Status | Key Deliverables |
|---|---|---|---|---|
| S-01 | Database & Auth Foundation | 1-3 | Done | 45-table PostgreSQL schema, JWT auth, RBAC, Docker Compose, audit log |
| S-02 | Core Project & Production API | 3-6 | Done | Project CRUD, BOM tree, MRP engine, routing, RabbitMQ event bus, WebSocket gateway |
| S-03 | QC & Welding Logic | 6-9 | Done | NCR state machine, WPS/WPQ/weld joint APIs, ITP engine, WPQ expiry scheduler |
| S-04 | CRM / Finance / HR APIs | 9-11 | Done | Opportunity pipeline, quote builder, job costing, AR/AP ledger, employee directory, certs |
| S-05 | File Storage & Document Engine | 11-14 | Done | MinIO file storage, DXF/XLSX/PDF parsers, PDF generation (ITP, NCR, MRB, Quote, Invoice) |
| S-06 | IIoT & Real-Time Integration | 14-17 | Done | MQTT broker, telemetry ingestion, TimescaleDB, heat input validation, Socket.io push |
| S-07 | Frontend Wiring & Auth Guards | — | Not Started | Connect all frontend modules to backend APIs, auth guards on routes |
| S-08 | System Testing & QA | — | Not Started | Integration tests, E2E Cypress tests, k6 load testing, MQTT TLS hardening |
| S-09 | UAT & Go-Live | — | Not Started | User acceptance testing, production deployment, monitoring setup |

---

## 4. Infrastructure & Platform

| Component | Status | Technology | Notes |
|---|---|---|---|
| Database | Done | PostgreSQL 16 | 45 tables, Knex.js migrations, seed data |
| Time-Series DB | Done | TimescaleDB | IIoT readings hypertable with 7-day compression policy |
| Event Bus | Done | RabbitMQ | 10 topic-based pub/sub channels |
| Cache & Sessions | Done | Redis 7 | JWT sessions, KPI cache, rate limiting |
| File Storage | Done | MinIO (S3-compatible) | File versioning, entity linking, 50MB limit |
| IIoT Broker | Done | Mosquitto (MQTT) | TLS planned for S-08 |
| Real-time Push | Done | Socket.io | Room-based channels per machine/project |
| PDF Generation | Done | pdfkit | ITP, NCR, MRB, Quote, Invoice templates |
| Containerization | Done | Docker + Compose | API + PostgreSQL + Redis + RabbitMQ + MinIO + Mosquitto |
| CI/CD | Not Started | GitHub Actions | Planned: lint > test > build > deploy |
| Hosting | Not Started | DigitalOcean / AWS | Managed Postgres + S3 |
| SSL/Proxy | Not Started | Nginx | SSL termination, static files, rate limiting |

---

## 5. UI / Design System

| Component | Status | Version | Notes |
|---|---|---|---|
| S16 Design System | Legacy | v7.0 | Still loaded but superseded by V2 |
| V2 Soft Neumorphic SaaS | Active | v7.1 | Solid surfaces, lavender bg `#E8E6F0`, neumorphic shadow pairs, no `backdrop-filter` |
| Sidebar | Done | v7.1 | 68px compact (icon-only + tooltips) / 240px expanded (labels + groups), localStorage state |
| Bento Theme | Done | v6.0 | Card-based dashboard layout |
| Module CSS | Done | v6.0 | Per-module stylesheets |
| Department Dashboards | Done | — | Role-based landing pages with dept-specific KPIs |
| Login System | Done | — | JWT-based with test account: `gm@nexaforge.com` |

---

## 6. Testing

| Type | Status | Tool | Notes |
|---|---|---|---|
| Unit Tests | Done | Jest | MRP, NCR state machine, WPQ scheduler, job costing, parsers, telemetry |
| API Integration Tests | Done | Supertest | Auth, route-level endpoint tests |
| Load Testing | Done | k6 | Dashboard load test script (50 concurrent users target) |
| E2E Tests | Not Started | Cypress | Planned for S-08 |
| Code Coverage | Done | Istanbul/nyc | Coverage reports generated in `backend/coverage/` |

---

## 7. Changelog

> Record updates here as features are added or statuses change.

| Date | Change | Updated By |
|---|---|---|
| 2026-05-27 | Initial Masterbackbone created — full feature audit across 10 modules, 6 sprints complete | Avinash |
| | | |
