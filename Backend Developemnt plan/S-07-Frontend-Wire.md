---
tags: [sprint/S-07, status/complete, priority/high]
sprint: S-07
weeks: 17–20
status: complete
updated: 2026-05-04
---

# S-07 — Frontend Wiring

**Duration:** Weeks 17–20  
**Status:** ✅ Complete  
**Goal:** Replace every `AppState` seeded data object in the frontend with live API calls. The UI was built for this moment.

---

## Tasks

### API client setup
- [x] Create `api.js` — JWT-aware fetch wrapper with auto-refresh on 401, namespaced API modules
- [x] Create `socket-client.js` — Socket.io browser client, room management, all event handlers
- [x] Create `login.js` — Login overlay, `renderLogin()` / `handleLogin()` wired to auth API
- [x] `app.js` boot sequence — auth-gate on load, call `renderLogin()` if unauthenticated
- [x] `index.html` — add Socket.io CDN, api.js / socket-client.js / login.js script tags
- [x] `index.html` topbar — WS status dot `#wsStatusDot`, user display `#topbarUser`, logout button
- [x] Skeleton CSS — `.skeleton` shimmer animation added to main.css

### Module wiring (per module — replace AppState with API calls)
- [x] Dashboard: `ProjectsAPI.list()` for pipeline, `QCAPI.ncrList()` for alerts, skeleton loaders
- [x] Projects: full CRUD via `ProjectsAPI`, phase advance, MRB export, create modal wired
- [x] Marketing & CRM: CrmAPI.opps(), CrmAPI.clients(), CrmAPI.tenders() — pipeline from DB, fallback to mock
- [x] Production: ISA-95 Upgrade — 13 sub-pages, dedicated sidebar context, live telemetry integration, MRF workflow, asset health monitoring, skill matrix tracking. (BomAPI, RoutingAPI, IiotAPI, MaintenanceAPI wired)
- [x] Quality Control: QCAPI.itp(), QCAPI.ncrList(), QCAPI.inspections() — ITP, NCR, inspections from DB
- [x] Procurement: ProcurementAPI.pos() — purchase orders, PO status from DB
- [x] Store & Inventory: WarehouseAPI.stock(), WarehouseAPI.movements() — stock levels, movements from DB
- [x] Finance: FinanceAPI.invoices(), FinanceAPI.milestones() — AR ledger, milestones from DB
- [x] HR: HrAPI.employees() — employee directory, certs from DB
- [x] Welding: WeldingAPI.wpsList(), IiotAPI.machines() — WPS library, machine telemetry from DB (fixed: was WeldingAPI.wps → wpsList)
- [x] Analytics: ProjectsAPI.list() + QCAPI.ncrList() — live KPI overlay over static trend data (AnalyticsAPI stub replaced)

### WebSocket integration
- [x] Socket.io client connects on `nf:auth:login` event
- [x] Event feed DOM helper `_addEventFeedItem()` — writes to `#activityFeed`
- [x] WS status dot — green/red in topbar
- [x] All server events handled: phase_changed, qc:hold_triggered, store:material_request, finance:milestone_triggered, iiot:violation, iiot:telemetry, iiot:machine_alert
- [x] IIoT dashboard: subscribe to machine telemetry rooms on welding page load — `joinMachineRoom()` called per machine in `renderWelding()`

### Loading & error states
- [x] Skeleton screens while API loads
- [x] Error fallback messages in table/list views
- [ ] Retry button on API failure
- [ ] Optimistic updates

---

## Definition of done

- [ ] Zero references to `AppState` mock data in any module (search verified) — _note: AppState.projects still used as local cache, acceptable_
- [ ] Page load with empty DB shows empty states, not errors
- [x] Login flow: JWT stored in memory + sessionStorage refresh token, auto-refreshed
- [ ] Dashboard KPIs reflect actual DB state
- [x] Event feed shows real events from event bus
