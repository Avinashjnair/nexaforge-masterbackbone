# NexaForge ERP — Feature Implementation Roadmap

> Generated: 2026-06-12  
> Branch: `feature/design-v3-frosted-glass`  
> Status tracker — update the phase status badges as work progresses.

---

## Phase Summary

| Phase | Theme | Status | Scope |
|---|---|---|---|
| **Phase 1** | Persistence Wiring + Quick Analytics | ✅ **Complete** | API loaders for QC/Prod/Inv/Welding/HR; NCR Pareto, Welder Repair Rate, Win/Loss, WIP Report |
| **Phase 2** | Production Intelligence | 🔵 **In Progress** | OEE dashboard, BOQ margin simulator, Gantt baseline comparison |
| **Phase 3** | Quality & Welding Depth | ⬜ Queued | MDR compiler, NCR trends, Welding continuity matrix, PWHT log, consumable traceability |
| **Phase 4** | Supply Chain Visibility | ⬜ Queued | Reorder alerts, heat number traceability, GRN inspection workflow |
| **Phase 5** | HR Self-Service | ⬜ Queued | Roster calendar, employee self-service portal, training tracker |
| **Phase 6** | CRM → Finance Pipeline | ⬜ Queued | Auto-create project from deal, milestone invoicing, cashflow forecast |
| **Phase 7** | Cross-Module Analytics Platform | ⬜ Queued | Delivery risk score, alert centre, scheduled reports, global search, live notifications |

---

## Phase 1 — Persistence Wiring + Quick Analytics ✅ Complete

**Goal:** Replace seed data in all remaining frontend modules with live API data; add four quick-win analytics views.

### Completed Work
| Task | File(s) | Notes |
|---|---|---|
| `api.js` — missing methods added | `api.js` | QCAPI calibration/complaints/vendor quality; WarehouseAPI GRN/remnants/MR; full namespace audit |
| QC → API loader | `qc.js` | `_loadQCFromAPI()` — NCR, calibration, complaints; severity remapping `critical→high` |
| Production → API loader | `production.js` | Active projects + work-centres parallel; BOM tree + routing sequential |
| Inventory → API loader | `inventory.js` | Remnants, MRs, GRNs — aggregated into `InvData` |
| Welding → API loader extension | `welding.js` | WPQ qualifications, joints, PQR records added alongside existing WPS/machines load |
| HR → API loader | `hr.js` + `hr2.js` | Employees, leave, attendance, training; `renderHRControlCentre()` made async |
| NCR Pareto (live) | `qc.js` → `renderQC_analytics()` | Derives Pareto from `QCData.ncr` when API returns data |
| Welder repair-rate dashboard | `welding2.js` → `renderWldNDE()` | Per-welder pass/fail/repair rate table; >5% threshold badge |
| Win/loss analysis | `marketing2.js` → `renderCRMOverview()` | Hit rate by account + lost-reason Pareto |
| WIP report | `finance2.js` → `renderFinOverview()` | Cost incurred vs billed per project; under/over-billed status; portfolio footer |

---

## Phase 2 — Production Intelligence 🔵 In Progress

**Goal:** Give the Production module real operational intelligence — live OEE metrics for work centres, a margin simulator for BOQs before commitment, and Gantt baseline tracking to surface schedule slippage.

### Feature 2.1 — OEE Dashboard
**Where:** `production.js` / `welding2.js` (Work Centre tab)  
**What:** Overall Equipment Effectiveness = Availability × Performance × Quality for each work centre.

**Implementation steps:**
1. **Backend** — new route `GET /work-centres/:id/oee?from=&to=` in `backend/src/routes/workCentres.js`. Query `production_logs` (or IIoT readings) to derive:
   - Availability: `(planned_time − downtime) / planned_time`
   - Performance: `(ideal_cycle_time × actual_output) / run_time`
   - Quality: `(good_output) / total_output`
2. **`api.js`** — add to `IiotAPI` (or new `ProductionAPI`):
   ```js
   oee: (id, params) => api.get(`/work-centres/${id}/oee`, params),
   oeeAll: (params)  => api.get('/work-centres/oee/summary', params),
   ```
3. **`production.js`** — extend `_loadProdFromAPI()` to fetch `oeeAll()`; store in `ProdData.oee`.
4. **`welding2.js` or new `renderProdOEE()` tab** — render:
   - Summary strip: Availability / Performance / Quality / OEE % per work centre
   - Colour coding: OEE ≥ 85% green, 65–84% amber, <65% red (World Class = 85%)
   - Trend sparkline (last 7 days) per work centre
   - Drill-down: click work centre → loss breakdown (downtime reasons pie)
5. **Demo fallback** — seed OEE values in `ProdData` for demo mode.

**Dependencies:** `production_logs` table must exist with `work_centre_id`, `downtime_mins`, `good_units`, `total_units` columns. Add migration if missing.

---

### Feature 2.2 — BOQ Margin Simulator
**Where:** `finance2.js` (new sub-tab in Job Costing, or standalone modal)  
**What:** Interactive what-if tool — paste/upload a Bill of Quantities, adjust material/labour/overhead rates, see live margin impact before committing a quote.

**Implementation steps:**
1. **UI** — add "BOQ Simulator" tab button alongside existing Job Costing sub-tabs in `renderFinJobCost()`.
2. **`renderFinBOQSimulator()`** function in `finance2.js`:
   - Input table: rows for material, labour, sub-contract, overhead, contingency
   - Each row: Description | Qty | Unit | Rate (editable `<input>`) | Amount (computed)
   - Live recalculation on `oninput` → update totals + margin %
   - "Load from Project BOM" button — pulls `BomAPI.tree(pid)` and pre-fills rows
   - Export row: "Copy as CSV" + "Add to Quotation" (future)
3. **State** — `FinData.boqDraft` object persisted in `localStorage` so draft survives navigation.
4. **Margin guardrails** — configurable minimum margin % (default 12%); row turns red if contribution drives overall below threshold.

**Dependencies:** None — purely frontend calculation. BOM pull is optional enhancement.

---

### Feature 2.3 — Gantt Baseline Comparison
**Where:** `production.js` → existing Master Schedule Gantt  
**What:** Capture a "baseline" schedule snapshot and overlay it on the live Gantt so slippage is visually obvious.

**Implementation steps:**
1. **Backend** — add `POST /projects/:id/schedule/baseline` (saves current routing steps as a frozen snapshot) and `GET /projects/:id/schedule/baseline` in `backend/src/routes/routing.js`.
2. **`api.js`** — add `RoutingAPI.saveBaseline(pid)` and `RoutingAPI.getBaseline(pid)`.
3. **`production.js`** — on Gantt render, fetch baseline alongside live routing; store in `ProdData.baseline[pid]`.
4. **SVG Gantt** — render baseline bars as thin ghost/outline bars behind the live bars:
   - Live bar: solid, current colour
   - Baseline bar: 3px outline, same colour at 35% opacity, slightly offset vertically
   - Slippage label: if end date > baseline end, show `+Nd` in amber at bar right edge
5. **"Set Baseline" button** — in Gantt toolbar; calls `RoutingAPI.saveBaseline(pid)`.

**Dependencies:** Phase 1 routing loader must be active (it is).

---

## Phase 3 — Quality & Welding Depth ⬜ Queued

**Goal:** Turn the QC and Welding modules from data viewers into operational tools — document packages, trend intelligence, and full weld traceability.

### Feature 3.1 — QC MDR Compiler
**Where:** `qc.js` / `qc-reports.js` (new tab or modal)  
**What:** Material Documentation Record — assembles a project's QC documents (certs, NCRs, inspection reports, ITP records) into a structured, printable/exportable package for client handover.

**Steps:**
1. New `renderQC_mdr()` function — project selector → document checklist
2. Checklist sections: Material certs | Weld maps | NDT reports | NCR register | Pressure test certs | Dimensional reports | ITP sign-offs
3. Each row: document name | status (attached / missing / pending) | link button
4. "Compile PDF" button → opens `window.print()` on a styled print layout (or generates blob)
5. Backend: `GET /projects/:id/mdr-checklist` aggregates across all relevant tables

### Feature 3.2 — NCR Trend Analysis
**Where:** `qc.js` → `renderQC_analytics()`  
**What:** Time-series view of NCR rate — complement the existing Pareto with a monthly trend chart showing volume, closure rate, and repeat-defect ratio.

**Steps:**
1. `api.js`: `QCAPI.ncrTrends(params)` → `GET /ncr/trends?from=&to=&groupBy=month`
2. Backend route: group NCRs by `created_at` month, return `{ month, opened, closed, repeat }`
3. `renderQC_analytics()`: add second chart section below Pareto — bar chart (opened vs closed) + line overlay (repeat ratio)
4. Filter pill: Last 3 / 6 / 12 months

### Feature 3.3 — Welding Continuity Matrix
**Where:** `welding2.js` → new tab or section in WPS tab  
**What:** Grid showing which welders are qualified for which WPS/process combinations — gaps highlighted in red.

**Steps:**
1. Derive from `WeldData.qualifications` (already loaded via Phase 1 WPQ loader) and `WeldData.wps`
2. Render: rows = welders, columns = WPS codes, cell = ✓ (qualified) / ✗ (expired) / — (not qualified)
3. Expiry colouring: expired = red cell, expiring ≤ 30 days = amber
4. "Coverage gaps" summary below: list WPS codes with fewer than 2 qualified welders (risk)

### Feature 3.4 — PWHT Logging
**Where:** `welding2.js` → new "PWHT" tab  
**What:** Post-Weld Heat Treatment records — temperature charts, hold times, furnace ID, witness sign-off.

**Steps:**
1. Backend migration: `pwht_records` table (`joint_id`, `furnace_id`, `heat_rate`, `hold_temp`, `hold_duration_min`, `cool_rate`, `witnessed_by`, `chart_file_path`)
2. `api.js`: `WeldingAPI.pwhtList(pid)`, `WeldingAPI.pwhtCreate(body)`, `WeldingAPI.pwhtGet(id)`
3. Frontend: table list + "Log PWHT" modal form
4. Temperature chart: SVG path from JSON array of `[time, temp]` readings (uploaded or manually entered)

### Feature 3.5 — Consumable Traceability
**Where:** `welding2.js` → NDE/Consumables tab  
**What:** Map welding rod/wire batch numbers to specific joints, enabling full traceability for recall scenarios.

**Steps:**
1. Backend migration: `weld_consumable_batches` + `consumable_usage` (`batch_id`, `joint_id`, `qty_used`, `welder_id`)
2. Lookup both ways: joint → consumables used; batch → all joints it touched
3. Frontend: batch search input → result list of affected joints; joint row → consumable chips

---

## Phase 4 — Supply Chain Visibility ⬜ Queued

**Goal:** Close the loop between warehouse state and procurement triggers; add full material genealogy.

### Feature 4.1 — Reorder Alerts
**Where:** `inventory.js` (Store module)  
**What:** Automatic low-stock alerts when `qty_on_hand` drops below `reorder_point`; surface in the sidebar notification badge.

**Steps:**
1. Backend: `GET /inventory/reorder-alerts` — items where `qty_on_hand ≤ reorder_point`; already filterable from `inventory_items` table
2. `api.js`: `WarehouseAPI.reorderAlerts()`
3. `inventory.js` loader: fetch alerts, store in `InvData.reorderAlerts`
4. Inventory dashboard: red badge on "Items" tab count; dedicated "Alerts" card showing item / current qty / reorder point / suggested PO qty
5. "Raise MR" button per alert → pre-fills `mrCreate()` with the item

### Feature 4.2 — Heat Number Traceability
**Where:** `inventory.js` + `welding2.js`  
**What:** Full chain from material cert → plate/pipe cut → weld joint → pressure test → project. Critical for ASME/PED compliance packages.

**Steps:**
1. Backend: `heat_number_registry` table (`heat_no`, `material_spec`, `cert_file_path`, `supplier`, `grn_id`); link `inventory_items.heat_no` + `weld_joints.heat_no`
2. `api.js`: `WarehouseAPI.heatTrace(heatNo)` → `GET /inventory/heat-trace/:heatNo`
3. Frontend: search input in Store module → timeline view: GRN receipt → item → joints → test records → project
4. Print-ready cert chain for MDR compiler (Phase 3.1 integration)

### Feature 4.3 — GRN Inspection Workflow
**Where:** `inventory.js`  
**What:** Add QC inspection step to Goods Received Notes — inspector sign-off, acceptance/rejection, non-conformance raise.

**Steps:**
1. Backend: `grn_inspections` table (`grn_id`, `inspector_id`, `result`, `notes`, `ncr_id`)
2. `api.js`: `WarehouseAPI.grnInspect(grnId, body)`, `WarehouseAPI.grnInspections(grnId)`
3. GRN detail view: "Pending Inspection" badge → "Inspect" modal → accept / reject / raise NCR
4. Rejected GRNs auto-create NCR via `QCAPI.ncrCreate()` with type `incoming-material`

---

## Phase 5 — HR Self-Service ⬜ Queued

**Goal:** Move HR from a manager-only view to a two-way tool where employees interact directly.

### Feature 5.1 — Roster Calendar
**Where:** `hr2.js` → new "Roster" tab  
**What:** Monthly shift calendar showing who is assigned to which shift, with drag-to-reassign (manager) and view-only (employee).

**Steps:**
1. Backend: `shift_assignments` table (`employee_id`, `shift_id`, `date`); `GET /hr/roster?from=&to=&dept=`
2. `api.js`: `HrAPI.roster(params)`, `HrAPI.rosterAssign(body)`, `HrAPI.rosterRemove(id)`
3. Frontend: month grid, employee rows, colour-coded shift chips (Morning=blue, Evening=amber, Night=purple)
4. Drag-drop reassign (manager role only — check `AppState.user.role`)
5. Conflicts highlighted: same employee double-booked, under-staffed shifts

### Feature 5.2 — Employee Self-Service Portal
**Where:** `hr2.js` → new "Self-Service" view (accessible to all logged-in users)  
**What:** Employees can apply for leave, view their own attendance/payslips, upload certifications.

**Steps:**
1. Backend: scope existing `/hr/leave-requests` to allow employee to submit for `employee_id = self`; `GET /hr/me/summary` — own attendance, leave balance, upcoming shifts
2. Frontend:
   - Leave application form (type, from/to dates, reason, attach doc)
   - My attendance heatmap (last 30 days)
   - My certifications list + upload button (MinIO/S3 pre-signed URL)
   - Payslip list (links to PDF — if finance module exposes them)
3. Role guard: self-service tab visible to all roles; manager tabs (roster, payroll) visible to `hr` / `gm` roles only

### Feature 5.3 — Training Completion Tracker
**Where:** `hr2.js` → Training tab (extend existing)  
**What:** Track mandatory training programmes, completion deadlines, and auto-alert managers when certifications are expiring.

**Steps:**
1. Extend `HrAPI.training()` loader (already in Phase 1) with expiry dates
2. Per-employee training matrix: programme → status → expiry → days remaining
3. Alerts: expiring ≤ 30 days → amber row; expired → red row + action button "Schedule Renewal"
4. Manager view: department rollup — X of Y employees compliant per programme

---

## Phase 6 — CRM → Finance Pipeline ⬜ Queued

**Goal:** Close the quote-to-cash loop — won deals become projects automatically, invoicing ties to milestones, and the team can see cashflow 90 days ahead.

### Feature 6.1 — Auto-Create Project from Won Deal
**Where:** `marketing2.js` → opportunity detail view  
**What:** When an opportunity is marked "Won", a one-click action creates a matching project record, populates key fields from the deal, and opens the Production module for scope entry.

**Steps:**
1. `api.js`: `CrmAPI.convertToProject(oppId, body)` → `POST /crm/opportunities/:id/convert`
2. Backend route: creates `projects` record from opp data (name, client, contract value, target delivery date)
3. Frontend: "Won" status chip → "Convert to Project" button in opportunity card
4. On success: navigate to Production module with new project pre-selected; toast notification

### Feature 6.2 — Milestone-Based Invoicing
**Where:** `finance2.js` → new "Milestones" sub-tab in Job Costing  
**What:** Define billing milestones against project schedule; raise AR invoice when milestone is achieved.

**Steps:**
1. Backend migration: `billing_milestones` (`project_id`, `name`, `trigger_type` — date/completion_pct/manual, `amount`, `invoice_id`, `status`)
2. `api.js`: `FinanceAPI.milestones(pid)`, `FinanceAPI.milestoneCreate(body)`, `FinanceAPI.milestoneInvoice(id)`
3. Frontend: milestones list per project — name / trigger / amount / status (pending/achieved/invoiced)
4. "Raise Invoice" button → pre-fills AR invoice form with milestone amount and project ref
5. Link from Gantt: milestone markers on schedule timeline (Phase 2.3 Gantt extension)

### Feature 6.3 — Cashflow Forecast
**Where:** `finance2.js` → new "Cashflow" tab in Finance overview  
**What:** 13-week rolling cashflow view — committed inflows (AR due dates + billing milestones) vs committed outflows (AP due dates + payroll + sub-contracts).

**Steps:**
1. Backend: `GET /finance/cashflow-forecast?weeks=13` — aggregates AR due dates, billing milestones, AP due dates into weekly buckets
2. `api.js`: `FinanceAPI.cashflowForecast(params)`
3. Frontend: stacked bar chart — inflows (green) vs outflows (red) per week; running balance line overlay
4. Net cash position line: positive = green, negative = red alert
5. "Sensitivity" toggle: pessimistic (slip 30% of inflows by 2 weeks) vs base vs optimistic

---

## Phase 7 — Cross-Module Analytics Platform ⬜ Queued

**Goal:** Surface the intelligence hidden in cross-module data — delivery risk, proactive alerts, and executive reporting — plus the platform features (search, notifications) that tie everything together.

### Feature 7.1 — Delivery Risk Score
**Where:** `analytics2.js` / `dept-dashboards.js` (GM Dashboard)  
**What:** Composite risk score per project, aggregating signals from Schedule (Gantt slippage), Quality (open NCR count), Supply Chain (overdue MRs), and Finance (WIP overbilling).

**Steps:**
1. Backend: `GET /analytics/delivery-risk` — weighted formula:
   - Schedule: days behind baseline / total duration (weight 40%)
   - Quality: open critical NCRs × 10 (weight 30%)
   - Supply: overdue MRs as % of open MRs (weight 20%)
   - Finance: WIP overbilling flag (weight 10%)
2. `api.js`: `AnalyticsAPI.deliveryRisk()`
3. `analytics2.js`: risk score card per project — score 0–100, colour-coded (0–30 green, 31–60 amber, 61–100 red)
4. Drill-down: click project → modal showing which dimensions are pulling the score up

### Feature 7.2 — Cross-Module Alert Centre
**Where:** New `alerts.js` or integrated into `app.js`  
**What:** Unified feed of actionable alerts from all modules — NCR holds blocking production, overdue POs blocking MRs, expiring welder qualifications, overdue AR.

**Steps:**
1. Backend: `GET /alerts` — fan-out query across: NCRs (open critical), calibration (overdue), purchase orders (overdue), welder quals (expiring), AR (overdue), inventory (reorder) — return unified list with `module`, `severity`, `message`, `link`
2. `api.js`: top-level `AlertsAPI.list()`
3. Sidebar notification badge: red dot + count on bell icon
4. `renderAlerts()` page: grouped by severity → module → item; "Acknowledge" per alert; "Go to →" deep-link into the relevant module tab
5. `socket-client.js`: server pushes new alerts via `alert:new` event — badge updates in real-time without page refresh

### Feature 7.3 — Scheduled Reports
**Where:** `analytics2.js` → new "Reports" tab  
**What:** Configure automated reports (daily/weekly/monthly digest) delivered by email, or downloadable on-demand as PDF/CSV.

**Steps:**
1. Backend: `report_schedules` table (`name`, `type`, `frequency`, `recipients`, `last_run`, `config_json`); cron job (node-cron or pg_cron) executes and sends via nodemailer
2. Report types (first pass): Weekly NCR Summary, Monthly Revenue & Margin, Weekly Production Status, Monthly WIP Report
3. `api.js`: `AnalyticsAPI.reportSchedules()`, `AnalyticsAPI.reportCreate(body)`, `AnalyticsAPI.reportRun(id)` (on-demand)
4. Frontend: schedule list + "New Schedule" modal; "Run Now" button → downloads blob

### Feature 7.4 — Global Search
**Where:** `app.js` + header bar  
**What:** `Ctrl+K` command palette — search across projects, NCRs, employees, welding joints, invoices by ID or keyword.

**Steps:**
1. Backend: `GET /search?q=&modules=` — parallel queries across key tables, returns unified result list with `type`, `id`, `title`, `subtitle`, `link`
2. `api.js`: top-level `search(q, modules)` function
3. Frontend: `Ctrl+K` → overlay modal, `<input>` debounced 300ms → API call → grouped results by module
4. Keyboard navigation: ↑↓ to move, Enter to navigate, Esc to close
5. Recent searches persisted in `localStorage`

### Feature 7.5 — Live Notifications (Socket.io)
**Where:** `socket-client.js` (already exists), `app.js`, all module render functions  
**What:** Real-time push for: NCR raised, PO approved, weld joint rejected, leave request approved — visible as toast + badge without refresh.

**Steps:**
1. `socket-client.js` already connects to the backend Socket.io server — verify events are being emitted by backend
2. Add event listeners: `ncr:created`, `po:approved`, `leave:updated`, `joint:rejected`, `alert:new`
3. `app.js`: `showToast(message, type)` helper — slide-in bottom-right toast, auto-dismiss 5s
4. Badge refresh: on relevant events, re-fetch module data and re-render the relevant KPI/count only (not full page)
5. "Mark all read" in notification dropdown

---

## Cross-Phase Dependencies

```
Phase 1 (Complete)
    └── Phase 2 (Production Intelligence) — no hard deps; OEE needs migration
         └── Phase 3.3 (Continuity Matrix) — needs Phase 1 WPQ data ✓
         └── Phase 6.2 (Milestone Invoicing) — Gantt baseline from Phase 2.3
Phase 3.1 (MDR Compiler) 
    └── Phase 4.2 (Heat Trace) — feeds cert chain into MDR
Phase 4.3 (GRN Inspection)
    └── Phase 3.1 (MDR) — inspection records in document package
Phase 6.1 (Auto-create Project)
    └── Phase 6.2 (Milestone Invoicing) — milestones created after project exists
Phase 7.1 (Delivery Risk)
    └── Best after Phase 2.3 (Gantt baseline) + Phase 3.2 (NCR trends) + Phase 4.1 (reorder alerts)
Phase 7.2 (Alert Centre)
    └── Phase 7.5 (Live Notifications) — alerts delivered via Socket.io
```

---

## Conventions (apply across all phases)

| Convention | Rule |
|---|---|
| API loaders | Always use `Promise.allSettled`; silent fallback to seed data; skip if `AppState.isDemoMode` |
| New API methods | Add to existing namespace in `api.js` (never create new files for API methods) |
| New UI sections | Extend existing render functions in existing module files; only create a new file if adding a completely new top-level module |
| Migrations | New file in `backend/migrations/` with next sequential number; run `knex migrate:latest` |
| Demo seed data | Add corresponding seed values in the module's `Data` object for every new data shape |
| Error states | Every new card/section must handle empty-data state with an informative placeholder (not blank space) |
| Auth / RBAC | Check `AppState.user.role` before rendering write actions; read views are open to all authenticated roles |
