---
tags: [modules, status/active]
updated: 2026-05-10
---

# Module Registry

All ERP modules with frontend and backend status.

| Module | JS files | UI status | API status | DB tables |
|---|---|---|---|---|
| Dashboard | dashboard.js | ✅ Complete | ✅ Wired | projects, ncrs |
| Projects | projects.js | ✅ Complete | ✅ Wired | projects, milestones |
| Marketing & CRM | marketing.js, marketing2.js | ✅ Complete | ✅ Wired | opportunities, quotes, clients |
| Production / MRP | production.js | ✅ ISA-95 (S-12 active) | ✅ Wired | bom_items, routing_steps, work_centres, machines, logs, mrf |
| Quality Control | quality.js, quality2.js | ✅ Complete | ✅ Wired | itp_steps, ncrs, inspections |
| Procurement | procurement.js | ✅ Complete | ✅ Wired | material_requests, grn |
| Store & Inventory | inventory.js | ✅ Complete | ✅ Wired | inventory_items, movements |
| Finance | finance.js, finance2.js | ✅ Complete | ✅ Wired | invoices, milestones, job_cost_lines |
| HR & Workforce | hr.js, hr2.js | ✅ Complete | ✅ Wired | employees, hr_certs |
| Welding / WPS | welding.js, welding2.js | ✅ Complete | ✅ Wired | wps, pqr, wpq, weld_joints |
| Analytics & KPIs | analytics.js, analytics2.js | ✅ Complete | ✅ Wired | aggregates from all tables |

---

## Production module sub-pages (ISA-95 sidebar)

| Sub-page | Route key | Renderer | Status |
|---|---|---|---|
| Control Centre | `control-centre` | `renderProdOverview` | ✅ 3-col cc-grid: WOs · Pipeline · WC/IIoT/Materials |
| Manufacturing | `manufacturing` | `renderProdManufacturing` | ✅ |
| BOM Management | `bom` | `renderProdBOM` | ✅ SVG hierarchy tree + cost treemap |
| Master Schedule | `schedule` | `renderProdSchedule` | ✅ Gantt + CPM + zoom |
| Work Centres | `workcentres` | `renderProdWorkCentres` | ✅ |
| Routing Steps | `routing` | `renderProdRouting` | ✅ Project switcher strip + per-project RBAC matrix |
| MRP / Materials | `mrp` | `renderProdMRP` | ✅ |
| Assets & Tooling | `assets` | `renderProdAssets` | ✅ prod-asset-card layout |
| Maintenance (MOM) | `maintenance` | `renderProdMaintenance` | ✅ prod-kpi-card + maint log |
| Inventory (MRF) | `mrf` | `renderProdInventory` | ✅ MRF→PR pipeline |
| Quality Gates | `quality` | `renderProdQuality` | ✅ Read-only dashboard → navigateTo('quality') |
| Skill Matrix | `skills` | `renderProdSkillMatrix` | ✅ Competency heat map + cert chip register |
| Analytics | `analytics` | `renderProdAnalytics` | ✅ |
| Schedule Builder | `schedule-builder` | `renderProdScheduleBuilder` | ✅ |

---

## Quality Control module sub-pages (QC sidebar)

| Sub-page | Route key | Renderer | Status |
|---|---|---|---|
| Control Centre | `control-centre` | `renderQC_control_centre` | ✅ CC-grid: Yield · NCRs · Cal Alert · Pareto Defect Chart |
| QC Projects | `projects` | `renderQC_projects` | ✅ |
| ITP & Control Plan | `itp` | `renderQC_itp` | ✅ |
| Inspection Request | `inspections` | `renderQC_inspections` | ✅ |
| Audit Management | `audits` | `renderQC_audits` | ✅ |
| Calibration | `calibration` | `renderQC_calibration` | ✅ |
| Document Control | `documents` | `renderQC_documents` | ✅ |
| NCR Management | `ncr` | `renderQC_ncr` | ✅ 8D Workflow + Fishbone SVG |
| Incoming QC | `incoming` | `renderQC_incoming` | ✅ MTC Verification (Chem/Mech properties) |
| Skill Matrix | `skills` | `renderQC_skills` | ✅ |
| Training Records | `training` | `renderQC_training` | ✅ |
| Quality Analytics | `analytics` | `renderQC_analytics` | ✅ COPQ Trends |
