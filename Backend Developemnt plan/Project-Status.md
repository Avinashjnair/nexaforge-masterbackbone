---
tags: [status/active, dashboard]
updated: 2026-05-10
---

# Project Status Dashboard

> Single source of truth for project health. Updated after each sprint.

---

## Sprint tracker

| Sprint | Name | Status | Progress |
|---|---|---|---|
| S-01 | Database & auth | ✅ Complete | 100% |
| S-02 | Project & production API | ✅ Complete | 100% |
| S-03 | QC & welding engine | ✅ Complete | 100% |
| S-04 | CRM / Finance / HR APIs | ✅ Complete | 100% |
| S-05 | File handling & docs | ✅ Complete | 100% |
| S-06 | IIoT integration | ✅ Complete | 100% |
| S-07 | Frontend wiring | ✅ Complete | 100% |
| S-08 | Testing & security | ✅ Complete | 100% |
| S-09 | UAT & go-live | 🔵 In progress | 90% — infra complete, dept sign-offs pending |
| S-10 | RBAC isolation + GM workflows | ✅ Complete | 100% |
| S-11 | Role dashboards | ✅ Complete | 100% |
| S-12 | Production operations (ISA-95) | ✅ Complete | 100% |
| S-13 | QC enhancements | ✅ Complete | 100% |
| S-14 | HR, Finance & Store | ✅ Complete | 100% |
| S-15 | New workflows & modules | ✅ Complete | 100% |
| S-16 | UI design upgrade (Bryzos/Milkinside) | ✅ Complete | 100% |

**Legend:** ⬜ Not started · 🔵 In progress · ✅ Complete · 🔴 Blocked

---

## S-13 QC module — enhancement log

| Feature | Status |
|---|---|
| **Phase 1: Data Architecture** (8D, Fishbone, MTC, Traceability) | ✅ |
| **Phase 2: Visual RCA Engine** (SVG Fishbone Diagram) | ✅ |
| **Phase 2: 8D Reporting Wizard** (D1–D8 step tracking) | ✅ |
| **Phase 2: MTC Material Verification** (Chem/Mech properties) | ✅ |
| **Phase 3: Interactive Workflows** (Dashboard → Sub-page deep links) | ✅ |
| **Phase 3: Real-time Analytics** (Pareto Defect Chart, COPQ Gauge) | ✅ |

---

---

## S-12 Production module — feature log

| Feature | Status |
|---|---|
| 13-item ISA-95 sidebar context-switch | ✅ |
| MRF → Purchase Request pipeline | ✅ |
| URL hash state + browser back/forward | ✅ |
| Alt+1–9 keyboard navigation | ✅ |
| New Schedule Builder modal | ✅ |
| CPM Gantt — critical path, slack, dependencies | ✅ |
| Gantt Daily / Weekly / Monthly view switcher | ✅ |
| Gantt zoom slider (0.4× – 3×) | ✅ |
| Assets & Maintenance UI cleanup (prod-kpi-card, prod-asset-card, prod-maint-log) | ✅ |
| BOM Visual Engine — SVG hierarchy tree + cost treemap | ✅ |
| Routing Steps — per-project access control matrix (4-level RBAC) | ✅ |
| Routing Steps — project switcher strip (all projects, health dots, lock indicator) | ✅ |
| Quality Gates — read-only dashboard, redirects to QC module | ✅ |
| Skill Matrix — competency heat map + cert chip register | ✅ |
| Control Centre — 3-column command dashboard (cc-grid layout) | ✅ |
| MRP auto-replenishment → RFQ trigger | ✅ |
| Quality Gates → auto-NCR on fail | ✅ |

---

## Module wiring status

| Module | UI | API | DB | Notes |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | |
| Projects | ✅ | ✅ | ✅ | |
| Marketing & CRM | ✅ | ✅ | ✅ | |
| Production / MRP | ✅ | ✅ | ✅ | ISA-95 expansion ongoing |
| Quality Control | ✅ | ✅ | ✅ | |
| Procurement | ✅ | ✅ | ✅ | |
| Store & Inventory | ✅ | ✅ | ✅ | |
| Finance | ✅ | ✅ | ✅ | |
| HR & Workforce | ✅ | ✅ | ✅ | |
| Welding / WPS | ✅ | ✅ | ✅ | |
| Analytics & KPIs | ✅ | ✅ | ✅ | |

---

## Open items

| Item | Owner |
|---|---|
| k6 load tests (50 concurrent users) — run `npm run load:test` against live server | Dev |
| S-09 UAT dept sign-offs (8 depts) — tracker in docs/uat-plan.md | Dept heads |
| S-09 run k6 load test against live server (`npm run load:test:staging`) | Dev |
| `me.js` DEPT_COLOURS mismatched vs `s16-design.css` (legacy) | Dev |
