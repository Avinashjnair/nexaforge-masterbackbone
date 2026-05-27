# NexaForge ERP — UAT Plan

**Version:** 1.0  
**Environment:** Staging — `http://staging.nexaforge.com` (or local Docker)  
**Test credentials:** All passwords `Password123!`

---

## Sign-off tracker

| Department | Sign-off owner | UAT email | Status | Date | Notes |
|---|---|---|---|---|---|
| Management | General Manager | gm@nexaforge.com | ⬜ Pending | | |
| Projects | Project Manager | pm@nexaforge.com | ⬜ Pending | | |
| Quality Control | QC Engineer | qc@nexaforge.com | ⬜ Pending | | |
| Production | Production Lead | production@nexaforge.com | ⬜ Pending | | |
| Finance | Finance Manager | finance@nexaforge.com | ⬜ Pending | | |
| Store | Store Supervisor | store@nexaforge.com | ⬜ Pending | | |
| HR | HR Manager | hr@nexaforge.com | ⬜ Pending | | |
| Welding | Lead Welder | welding@nexaforge.com | ⬜ Pending | | |

**Legend:** ⬜ Pending · 🔵 In Review · ✅ Signed Off · 🔴 Issues Found

---

## UAT scenarios

### Module 1 — Marketing & CRM (sign-off: GM)

| # | Step | Expected result | Pass/Fail | Notes |
|---|---|---|---|---|
| 1.1 | Log in as GM. Navigate to **Marketing** | CRM page loads, pipeline visible | | |
| 1.2 | Add new client: Name = "UAT Client Ltd", Country = UAE, Tier = A | Client appears in client list | | |
| 1.3 | Create opportunity against UAT Client: Title = "UAT Vessel Supply", Value = AED 500,000, Stage = Prospect | Opportunity appears in pipeline | | |
| 1.4 | Move opportunity to **Qualified**, then to **Proposal** | Stage updates, probability adjusts | | |
| 1.5 | Create a quote: total AED 480,000, valid 30 days | Quote linked to opportunity | | |
| 1.6 | Mark opportunity as **Won** | Stage = Won, opportunity highlighted | | |
| 1.7 | Create project from won opportunity | Project entity created in Projects module | | |

---

### Module 2 — Projects (sign-off: Project Manager)

| # | Step | Expected result | Pass/Fail | Notes |
|---|---|---|---|---|
| 2.1 | Navigate to **Projects**. Confirm 3 demo projects visible | P-2401, P-2402, P-2403 listed | | |
| 2.2 | Open P-2401. Review project header, phase progress, milestones | All data correct | | |
| 2.3 | Advance phase on P-2402 from Engineering to Procurement | Phase indicator updates | | |
| 2.4 | Create a new project: P-2501 "UAT Test Tank", Contract = USD 100,000 | Project appears in list, status = Planning | | |
| 2.5 | Add a milestone: "Mobilisation 20%", AED 20,000, due in 30 days | Milestone appears in project detail | | |
| 2.6 | Add BOM root item: "Vessel Shell Assembly", qty 1, type Assembly | BOM node created | | |
| 2.7 | Add 2 child BOM items under Shell Assembly | Child nodes visible in BOM tree | | |

---

### Module 3 — Quality Control (sign-off: QC Engineer)

| # | Step | Expected result | Pass/Fail | Notes |
|---|---|---|---|---|
| 3.1 | Navigate to **Quality**. Review NCR summary | Open NCR count visible | | |
| 3.2 | Raise NCR: project = P-2401, Title = "UAT weld crack", Severity = Major | NCR created, status = Open, NCR no. assigned | | |
| 3.3 | Move NCR to Under Review | Status updates | | |
| 3.4 | Disposition to Rework | Status = Rework | | |
| 3.5 | Close NCR | Status = Closed. Try to reopen — must be rejected | | |
| 3.6 | Navigate to ITP for P-2401. Add ITP step: "Visual Weld Inspection", Hold type = W | Step appears in ITP list | | |
| 3.7 | Sign off ITP step | Step marked complete, inspector name recorded | | |
| 3.8 | Generate MRB PDF for P-2401 | PDF downloads with project header and weld log | | |

---

### Module 4 — Production (sign-off: Production Lead)

| # | Step | Expected result | Pass/Fail | Notes |
|---|---|---|---|---|
| 4.1 | Navigate to **Production**. Review routing steps for P-2401 | Routing steps visible | | |
| 4.2 | Mark first routing step (Cutting) as in_progress | Status updates | | |
| 4.3 | Complete the step — enter actual hours | Step marked complete, hours recorded | | |
| 4.4 | Raise a Material Request for 5mm plate, 10 sheets | MR created, status = pending | | |
| 4.5 | Run MRP for P-2401 BOM | MRP output shows shortages / cover | | |
| 4.6 | Trigger MRP auto-replenishment | Material Request auto-raised for short items, Procurement notified | | |

---

### Module 5 — Finance (sign-off: Finance Manager)

| # | Step | Expected result | Pass/Fail | Notes |
|---|---|---|---|---|
| 5.1 | Navigate to **Finance**. Review invoices for P-2401 | 2 invoiced milestones visible | | |
| 5.2 | Create invoice from triggered milestone (50% completion) | Invoice created, status = Draft, INV-xxxxx number assigned | | |
| 5.3 | Mark invoice as Sent | Status = Sent | | |
| 5.4 | Mark invoice as Paid: amount USD 85,200, paid date today | Status = Paid, paid_amount recorded | | |
| 5.5 | Add job cost line: material, "Steel plates UAT", budget USD 15,000 | Line appears in job cost breakdown | | |
| 5.6 | Review job cost summary: gross margin % is correct | Margin = (contract − forecast) / contract | | |

---

### Module 6 — HR & Workforce (sign-off: HR Manager)

| # | Step | Expected result | Pass/Fail | Notes |
|---|---|---|---|---|
| 6.1 | Navigate to **HR**. Confirm 2 seeded employees visible | Mohammed Al Rashidi and Project Manager listed | | |
| 6.2 | Add new employee: "UAT Employee", department = QC, hire date = today | Employee appears in list | | |
| 6.3 | Log a training record for the new employee | Training linked to employee | | |
| 6.4 | Check WPQ expiry alerts — Mohammed's WPQ is expired | Alert/badge shown on HR module | | |

---

### Module 7 — Store & Inventory (sign-off: Store Supervisor)

| # | Step | Expected result | Pass/Fail | Notes |
|---|---|---|---|---|
| 7.1 | Navigate to **Store**. Review current stock | Inventory list loads | | |
| 7.2 | Log a GRN: item = 316L plate, qty = 5, unit = sheet, PO ref = PO-001 | GRN recorded, stock updated | | |
| 7.3 | Set one item to Quarantine status | Item highlighted, quarantine flag set | | |
| 7.4 | Clear quarantine → moves to stock | Status = In Stock | | |

---

### Module 8 — Welding (sign-off: Lead Welder / QC)

| # | Step | Expected result | Pass/Fail | Notes |
|---|---|---|---|---|
| 8.1 | Navigate to **Welding**. Review WPS list | WPS-GTAW-316L-001 and WPS-SMAW-CS-001 visible | | |
| 8.2 | Open WPS detail | Process, filler, position, standard all shown | | |
| 8.3 | View welder qualifications (WPQ) | Mohammed's WPQ listed (expired) | | |
| 8.4 | Add weld joint on P-2401: Joint J-UAT-01, GTAW, SA-516-70, 12mm, position 2G | Joint created, status = Pending | | |
| 8.5 | Update joint to In Progress, then log NDE result = RT Accept | Status = Accepted | | |

---

### Module 9 — IIoT Dashboard (sign-off: GM / Production Lead)

| # | Step | Expected result | Pass/Fail | Notes |
|---|---|---|---|---|
| 9.1 | Navigate to machine room. Subscribe to a machine | WebSocket connection icon turns green | | |
| 9.2 | Confirm live telemetry updates (or mock data in staging) | Temperature / pressure values updating | | |

---

## UAT sign-off form

Each department manager completes this after running their module scenarios:

> I, **[Name]**, **[Role]**, confirm that the NexaForge ERP system satisfies the functional requirements for the **[Department]** module as tested on **[Date]** in the staging environment.
>
> Outstanding issues noted (if any): _______________
>
> Signature: _______________ Date: _______________

---

## UAT defect log

| ID | Module | Severity | Description | Status |
|---|---|---|---|---|
| — | — | — | No defects logged yet | — |
