---
tags: [sprint/S-08, status/in-progress, priority/high]
sprint: S-08
weeks: 20–23
status: in-progress
updated: 2026-05-07
---

# S-08 — Testing & Security

**Duration:** Weeks 20–23  
**Status:** 🔵 In progress — 123 tests passing, department isolation complete, Playwright scaffold added  
**Goal:** Production-grade quality gate. Nothing ships untested.

---

## Tasks

### Unit tests (Jest)
- [ ] MRP calculation engine — all edge cases (zero stock, partial, over-allocated)
- [ ] Job costing variance calculations — budget vs actual vs forecast
- [ ] OEE calculation — A × P × Q formula
- [ ] COPQ categorisation logic
- [x] NCR state machine — illegal transitions rejected
- [x] WPQ expiry date calculation
- [x] JWT token generation and validation
- [x] RBAC permission matrix — all roles tested

### Integration tests (Supertest)
- [x] Auth: login, refresh, logout flow — **updated for HttpOnly cookie** (2026-05-06)
- [x] Project: full CRUD + phase transitions
- [ ] BOM: create tree, add children, MRP calculation
- [x] ITP: add steps, sign off, H-point enforcement
- [x] NCR: full lifecycle raised → closed
- [x] Invoice: create from milestone, mark paid
- [x] All endpoints return correct HTTP status codes
- [x] All endpoints enforce department isolation — **`requireDepartment` on all 20+ route groups** (2026-05-06)

### E2E tests (Cypress)
- [x] New project: create → assign → plan → procurement → QC → dispatch
- [x] Quote to project: CRM opportunity → won → project entity created
- [x] NCR workflow: raise → review → disposition → close
- [x] Weld joint: create → assign welder → NDE → accept → logged in MRB
- [x] Invoice: milestone triggered → invoice created → paid
- [x] **Dept isolation matrix** (`06-dept-isolation.cy.js`) — 3 axes, all 8 departments (2026-05-06)
  - Axis 1: DOM segregation — restricted nav items absent per dept
  - Axis 2: Forced navigation — `navigate()` to blocked page renders 403 screen
  - Axis 3: API boundary — 8×7 cross-dept 403 matrix + GM bypass + unauthenticated 401
- [x] **Playwright cross-role starter** (`e2e/dept-isolation.spec.js`) — 4 axes, 7 test cases (2026-05-07)
  - Axis 1: DOM visibility — sidebar does NOT contain cross-dept nav links
  - Axis 2: Forced navigation — `navigate()` to blocked page renders 403
  - Axis 3: API boundary — QC/Finance tokens rejected by cross-dept dashboard endpoints
  - Axis 4: State purge — AppState fully reset after logout

### Load testing (k6)
- [ ] 50 concurrent users: Dashboard, Projects, QC module
- [ ] Response time: P95 < 500ms for all read endpoints
- [ ] Response time: P95 < 1000ms for all write endpoints
- [ ] WebSocket: 50 concurrent connections stable for 10 minutes

### Security audit (OWASP)
- [x] SQL injection: all inputs parameterised (Knex prevents, but verify)
- [x] XSS: all output escaped
- [ ] CSRF: tokens on state-changing requests
- [x] Auth: JWT secret in env, not code; refresh token rotation
- [x] **Refresh token moved to HttpOnly cookie** — XSS cannot read `nf_rt` (2026-05-06)
- [x] **Client-side auth bypass removed** — `DEPT_ACCOUNTS` local map deleted; all logins go through backend JWT (2026-05-06)
- [x] **BOLA / Broken Access Control fixed** — `requireDepartment` enforced server-side on all dept-specific routes (2026-05-06)
- [x] **Dashboard aggregate BOLA closed** — `/dashboard/production`, `/qc`, `/finance`, `/store` now require dept guard (2026-05-07)
- [x] **Frontend 403 handling** — `apiFetch()` shows user-friendly toast on 403 instead of raw error (2026-05-07)
- [x] **State purge on logout** — `_purgeSessionState()` clears AppState + localStorage + sessionStorage (2026-05-07)
- [x] Rate limiting: login endpoint (10 req/min), API (500 req/min)
- [ ] HTTPS enforced: HTTP redirects to HTTPS
- [ ] Secrets: no credentials in git history (gitleaks scan)

---

## UAT Security Findings — Resolved (2026-05-06)

Issues raised in `UAT Comments 1.md` and fixed this session:

| Finding | Fix | File(s) |
|---|---|---|
| Client-side dept auth bypass (`DEPT_ACCOUNTS` map) | Removed; all logins hit backend | `login.js` |
| Live backend login path missing sidebar permissions | `_bootDeptSession(data.user, false)` called on live login | `login.js` |
| Refresh token in `sessionStorage` (XSS-readable) | Moved to `HttpOnly; Secure; SameSite=Strict` cookie (`nf_rt`) | `auth.js`, `app.js`, `api.js` |
| BOLA — dept data routes missing `requireDepartment` | Added to all 20+ route mount points in `app.js`; HR guard inside `hr.js` | `app.js`, `hr.js` |
| Auth integration tests expected `refresh_token` in body | Updated to assert `nf_rt` cookie attributes; send cookie in refresh/logout tests | `auth.integration.test.js` |
| Integration test JWTs missing `department` claim | `makeToken(role, dept)` — all 4 integration test files updated | `*.integration.test.js` |
| No cross-dept E2E isolation tests | `06-dept-isolation.cy.js` — 8-dept matrix, 3 axes | `cypress/e2e/` |

### UAT Comments 1 — Phase 2 Hardening (2026-05-07)

| Finding | Fix | File(s) |
|---|---|---|
| Dashboard aggregate endpoints (`/production`, `/qc`, `/finance`, `/store`) had no dept guard — BOLA vulnerability | Added `requireDepartment()` to all 4 routes | `dashboardAggregates.js` |
| Frontend showed raw error on 403 | Added 403-specific branch in `apiFetch()` with user-friendly toast | `api.js` |
| AppState not purged on logout — stale dept data could leak across sessions | New `_purgeSessionState()` function clears AppState, localStorage, sessionStorage, auth tokens | `app.js` |
| No state purge before new session boot | `_bootDeptSession()` calls `_purgeSessionState()` before re-init | `login.js` |
| No Playwright cross-role test framework | Starter matrix: 4 axes, 7 tests in `e2e/dept-isolation.spec.js` | `playwright.config.js`, `e2e/dept-isolation.spec.js` |

---

## Definition of done

- [ ] Jest coverage ≥ 80% on all business logic files
- [x] All Supertest integration tests passing — **123/123** (2026-05-06)
- [ ] All Cypress E2E workflows passing on staging environment
- [ ] k6 load test: 50 users, P95 < 500ms, zero errors
- [ ] OWASP checklist signed off
- [ ] No critical or high vulnerabilities in dependency audit (`npm audit`)
