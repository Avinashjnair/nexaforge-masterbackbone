---
tags: [decisions, architecture]
updated: 2026-05-10
---

# Architecture Decision Log

---

## ADR-001 — PostgreSQL over MongoDB

**Date:** 2025-05-03 | **Status:** Final

**Decision:** PostgreSQL 16 + TimescaleDB.  
Financial data requires ACID compliance; complex joins (project → BOM → routing → QC); TimescaleDB handles IIoT time-series without a separate InfluxDB.

---

## ADR-002 — RabbitMQ over Redis Pub-Sub

**Date:** 2025-05-03 | **Status:** Final

**Decision:** RabbitMQ with topic-based durable queues.  
Events (NCR raised, GRN received) must survive subscriber downtime. Redis Pub-Sub is fire-and-forget. Kafka was overkill for SME scale.

---

## ADR-003 — Vanilla JS frontend (no framework)

**Date:** 2026-05-03 | **Status:** Final

**Decision:** Keep the existing vanilla HTML/CSS/JS SPA. Wire API calls via the `apiFetch` wrapper in `api.js`. Each `render*()` function made `async`; AppState mock arrays replaced with live API calls.

Migrating to React was rejected: estimated +4 weeks with no UX difference for the user.

---

## ADR-004 — JWT token storage strategy

**Date:** 2026-05-06 | **Status:** Final

**Decision:** Access token in JS memory only (15-min TTL, lost on page refresh). Refresh token in `HttpOnly; Secure; SameSite=Strict; Path=/auth` cookie (`nf_rt`).

Original `sessionStorage` approach was removed — XSS-readable. All `fetch` calls use `credentials: 'include'`.

---

## ADR-005 — Department isolation via `requireDepartment` middleware

**Date:** 2026-05-06 | **Status:** Final

**Decision:** `requireDepartment(...allowedDepts)` added at the `app.use()` mount point for every dept-specific route group. `hrRouter` (mounted at `/api`, not `/api/hr`) gets an internal router-level guard. GM role bypasses all dept checks.

**Dept → route mapping:**

| Department | Guarded routes |
|---|---|
| `finance` | `/api/finance/*` |
| `marketing` | `/api/clients`, `/api/opportunities`, `/api/quotes`, `/api/field-visits` |
| `procurement` | `/api/material-requests` |
| `store` | `/api/remnants` |
| `procurement`, `store` | `/api/grn`, `/api/bom-items`, `/api/projects/:id/bom` |
| `qc` | `/api/inspections`, `/api/spc`, `/api/calibration`, `/api/projects/:id/itp` |
| `qc`, `welding` | `/api/ncr`, `/api/wps`, `/api/wpq`, `/api/projects/:id/weld-joints` |
| `production` | `/api/projects/:id/routing`, `/api/work-centres`, `/api/schedule`, `/api/machines`, `/api/iot` |
| `hr` | `/api/employees`, `/api/hr-certs`, `/api/training` (via `hr.js` router guard) |
| No guard | `/api/projects`, `/api/kaizen`, `/api/leave-requests`, `/api/attendance` (cross-dept) |

---

## ADR-006 — Frontend state purge on logout

**Date:** 2026-05-07 | **Status:** Final

**Decision:** `_purgeSessionState()` resets all `AppState` properties, clears `localStorage` + `sessionStorage`, and calls `Auth.clearTokens()`. Called at logout, on `nf:auth:logout` event, and at the start of each new `_bootDeptSession()`.

Prevents stale cross-dept data leaking into the next user's session on a shared browser.

---

## ADR-007 — Quick Access Login Grid + Mock Server

**Date:** 2026-05-07 | **Status:** Final

**Decision:**
1. **Quick Access Grid** — 10-icon departmental grid on the login card auto-fills credentials for UAT role-switching.
2. **Mock Server** (`backend/mock-server.js`) — lightweight Express server handling `/auth/login` and `/me/permissions` without PostgreSQL, enabling frontend-only development and UAT.

---

## ADR-008 — Production sidebar context-switching (ISA-95)

**Date:** 2026-05-08 | **Status:** Final

**Decision:** When entering the Production module, the global ERP sidebar is replaced by a Production-exclusive 13-item ISA-95 navigation. A "← Back to ERP" button restores global nav.

Horizontal tabs were rejected — too dense at 13 items and break on mobile. Dropdown sub-menus add clicks and reduce focus.

---

## ADR-009 — Gantt chart: pixel-based positioning + dynamic column count

**Date:** 2026-05-10 | **Status:** Final

**Decision:** Gantt bars use pixel-based `left`/`width` positioning (not percentage) relative to a dynamically-sized timeline. Column count is `max(minCols, ceil(maxEf × factor) + pad)` ensuring bars never extend into blank scroll space.

View modes (Daily / Weekly / Monthly) apply different base column widths and time factors. A zoom slider (`_ganttZoom` 0.4×–3×) multiplies the base `colW`, allowing fine-grained timeline density control without rebuilding the data layer.

Previous approach (percentage-based bars on a fixed 20-week timeline) caused blank space past the last task and had no zoom capability.

---

## ADR-010 — QC 8D Workflow & RCA Engine

**Date:** 2026-05-10 | **Status:** Final

**Decision:** Implemented a multi-stage 8D Corrective Action engine for NCR management. Root Cause Analysis (RCA) is handled via an interactive SVG-based Ishikawa (Fishbone) diagram generator.

**Rationale:** legacy table-based NCR tracking failed to provide the compliance rigor required for ISO 9001:2015. The 8D wizard ensures structured data collection (D1-D8) and visual RCA improves problem-solving transparency for auditors and management.
