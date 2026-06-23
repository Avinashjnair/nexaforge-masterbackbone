# ERP Module Feature Catalog — Cylindrical Fabrication Company

**Document version:** 2.0  
**Date:** May 27, 2026  
**Scope:** 9 departmental modules, 83 sidebar pages, 430+ individual functions  
**Change:** DocMgmt_V1 — Document management module dissolved. 4 pages moved to QC, 2 pages moved to Production.

---

## Module summary

| # | Module | Sidebar pages | Functions | Status |
|---|--------|--------------|-----------|--------|
| 1 | Project management | 9 | 58 | Existing |
| 2 | Procurement & vendor management | 8 | 52 | Existing |
| 3 | Stores & inventory | 8 | 48 | Existing |
| 4 | Quality control & assurance | 13 | 110 | Existing + DocMgmt_V1 (+4 pages: MDR, Drawings, Procedures, Transmittals) |
| 5 | Production & manufacturing | 13 | 100 | Existing + DocMgmt_V1 (+2 pages: Approval Workflows, Document Archive) |
| 6 | Finance & job costing | 7 | 40 | New |
| 7 | ~~Document management~~ | ~~7~~ **0** | ~~38~~ **0** | **Dissolved** — pages redistributed into QC and Production |
| 8 | HSE & compliance | 8 | 48 | New |
| 9 | Maintenance & calibration | 7 | 42 | New |
| 10 | Analytics dashboard | 8 | 36 | New |

> **DocMgmt_V1 redistribution:** MDR → QC `/quality-control/mdr` · Drawing management → QC `/quality-control/drawings` · Procedure library → QC `/quality-control/procedures` · Transmittals → QC `/quality-control/transmittals` · Approval workflows → Production `/production/approvals` · Document archive → Production `/production/archive`

---

## Module 1: Project management

### 1.1 Dashboard
**Purpose:** Real-time overview of all active projects with health indicators.

**Overview widgets:**
- Active project count with status breakdown (on-track / at-risk / delayed)
- Upcoming milestones in next 7/14/30 days
- Budget utilization gauge per project
- Unresolved change orders count
- Resource allocation heatmap (over/under-loaded teams)

**Quick actions:**
- Create new project
- Jump to any project by code/name search
- View pending approvals queue
- Export dashboard as PDF snapshot

---

### 1.2 Project register
**Purpose:** Master list of all projects with lifecycle tracking from award to closeout.

**Project listing:**
- Sortable, filterable table: project code, client, vessel type, status, % complete, PM assigned
- Status filters: tendering, awarded, in-progress, on-hold, completed, closed
- Bulk export to Excel with all project metadata

**Project creation:**
- New project wizard: client details, contract value, vessel specs, delivery date
- Auto-generate project code (format: YYYY-VTYPE-SEQ)
- Assign project manager and core team members
- Set project category: new build, repair, modification
- Upload signed contract / LOI as reference document

**Project detail view:**
- Header: project code, client, vessel type, contract value, timeline
- Progress tracker: stage indicators with completion %
- Linked records: BOM, MRs, POs, job cards, NCRs, invoices — all accessible from one screen
- Activity log: chronological feed of all actions taken on this project

---

### 1.3 Process flow builder
**Purpose:** Define the fabrication sequence for each project type.

**Template management:**
- Pre-built templates: pressure vessel, heat exchanger, storage tank, column/tower, piping spool
- Clone and customize templates per project-specific requirements
- Define mandatory QC hold points within the flow
- Set estimated hours per process stage

**Flow editor:**
- Drag-and-drop stage sequencing
- Add/remove/reorder fabrication stages
- Define parallel vs sequential operations
- Link each stage to required resources (machines, welders, inspectors)
- Mark stages as critical path or non-critical

---

### 1.4 Bill of materials (BOM)
**Purpose:** Multi-level BOM with full material specification and tracking.

**BOM creation:**
- Multi-level BOM: parent assembly → sub-assembly → component → raw material
- Import BOM from Excel template or from drawing extraction
- Auto-populate material specs from material master database
- Specify material grade (SA-516 Gr.70, SA-240-304, etc.), dimensions, quantity, UOM
- Add bought-out items: flanges, nozzles, gaskets, fasteners, lifting lugs

**BOM management:**
- Revision control with change history and reason log
- Compare BOM revisions side-by-side
- Cost roll-up: calculate total material cost from item-level pricing
- Shortage analysis: compare BOM requirements vs current stock
- Auto-generate material requisition from approved BOM

**Consumables tracking:**
- Welding consumables: electrodes, wires, flux, shielding gas — linked to WPS requirements
- Painting consumables: primer, topcoat, thinner — linked to paint spec
- Misc: grinding discs, PPE, marking materials

---

### 1.5 Material requisitions
**Purpose:** Raise, track, and approve material requests from BOM to procurement.

**MR creation:**
- Auto-generate from BOM (one-click MR from approved BOM)
- Manual MR for ad-hoc requirements
- Set priority: urgent / normal / low
- Specify required-by date linked to project schedule
- Attach reference drawings or specs

**Approval workflow:**
- Configurable approval chain: engineer → project manager → procurement head
- Email/push notification at each approval stage
- Approve, reject (with reason), or send back for revision
- Bulk approval for multiple MR lines

**MR tracking:**
- Status pipeline: draft → submitted → approved → PO raised → delivered
- Link MR lines to PO numbers once procurement acts
- Overdue MR alerts when procurement hasn't acted within SLA

---

### 1.6 Project schedule (Gantt)
**Purpose:** Gantt chart with milestones, dependencies, and critical path tracking.

**Schedule builder:**
- Interactive Gantt chart with drag-to-resize task bars
- Define task dependencies: finish-to-start, start-to-start, finish-to-finish
- Set milestones: material arrival, rolling start, shell completion, hydro test, dispatch
- Auto-calculate critical path and highlight it
- Baseline schedule capture for actual-vs-planned comparison

**Progress tracking:**
- Update % complete per task from production floor data
- Actual start/finish dates vs planned dates
- Earned value analysis: CPI and SPI indicators
- Delay alerts when actual exceeds planned by threshold
- Auto-reschedule downstream tasks when a predecessor slips

**Resource view:**
- Resource-loaded schedule: see who is assigned to what and when
- Identify over-allocation conflicts across concurrent projects
- Shift-wise capacity view: morning / afternoon / night

---

### 1.7 Resource allocation
**Purpose:** Assign and track manpower, equipment, and skills across projects.

**Manpower planning:**
- Assign welders, fitters, helpers, QC inspectors to project and stage
- View welder qualification matrix (6G, TIG, SMAW, SAW) before assignment
- Capacity planner: total available hours vs committed hours per week
- Cross-project resource sharing with transfer logging

**Skill matrix:**
- Employee skill database: certifications, qualifications, expiry dates
- Auto-suggest qualified welders for a given WPS requirement
- Training gap analysis: which certifications expire in next 90 days
- Block assignment of personnel with expired qualifications

---

### 1.8 Change orders
**Purpose:** Track scope changes, assess cost/schedule impact, and get client approval.

**Change order creation:**
- Raise CO against project: describe change, reason, originator
- Link to affected BOM items, drawings, schedule tasks
- Cost impact calculator: additional material + labor + overhead
- Schedule impact: how many days added to critical path

**Approval and tracking:**
- Internal approval: engineering → PM → management
- Client approval with digital signature capture
- CO register: all changes per project with cumulative cost/schedule impact
- Amendment to contract value after CO approval

---

### 1.9 Project closeout
**Purpose:** Formal closure with punch-list resolution, handover, and lessons learned.

**Closeout checklist:**
- Punch-list items: outstanding work, snags, observations
- Assign and track resolution of each punch item
- Client sign-off on final inspection
- Release reserved materials back to stores
- Close all job cards and production orders

**Handover:**
- Generate final data book (auto-compiled from document management)
- Handover certificate with digital signatures
- Archive all project documents
- Capture lessons learned for future projects
- Final cost reconciliation and margin report

---

## Module 2: Procurement & vendor management

### 2.1 Dashboard
**Purpose:** Procurement performance overview with pending actions.

**Key metrics:**
- Open PO value and count by status
- Overdue deliveries count and aging
- Vendor performance snapshot (top 5 / bottom 5)
- Pending GRNs awaiting receipt
- MR queue: unactioned requisitions

**Quick actions:**
- Create new PO
- View MR queue
- Approve pending POs
- Generate RFQ

---

### 2.2 MR queue
**Purpose:** Incoming material requisitions from project management awaiting procurement action.

**Queue management:**
- Filterable list of approved MRs pending PO creation
- Priority flags: urgent (red), normal (amber), low (green)
- Group MR lines by material type for bulk PO creation
- Auto-suggest preferred vendor from AVL based on past orders
- Link to BOM and project schedule to see required-by dates

**Actions:**
- Convert MR to RFQ (for new/large items)
- Convert MR directly to PO (for repeat/standard items)
- Split MR across multiple vendors
- Reject MR back to project with reason

---

### 2.3 Vendor master
**Purpose:** Approved vendor list with contact details, capabilities, and performance history.

**Vendor database:**
- Vendor card: company name, contact person, phone, email, address
- Capability tags: plate rolling, forging, machining, painting, NDE services
- Material types supplied: plates, pipes, flanges, fittings, fasteners
- Bank details for payment processing
- Tax registration: GST/VAT number, PAN

**Qualification:**
- Vendor approval workflow: commercial eval → quality audit → management sign-off
- Upload vendor quality certificates (ISO 9001, ASME stamps, PED approval)
- Approved vendor list (AVL) with validity period
- Vendor re-qualification schedule and alerts
- Blacklist management with reason tracking

**Performance:**
- Vendor scorecard: quality score, delivery score, price score, compliance score
- Historical rejection rate by vendor
- On-time delivery percentage trending
- Price trend analysis: has this vendor gotten more expensive over time?
- Comparative ranking across vendors for same material category

---

### 2.4 RFQ management
**Purpose:** Request for quotation creation, distribution, and comparison.

**RFQ creation:**
- Auto-populate from MR line items
- Select 3+ vendors from AVL for quote
- Set response deadline and terms
- Attach drawings, specs, and inspection requirements
- Email RFQ directly to vendors from system

**Quotation comparison:**
- Side-by-side comparison matrix: unit price, total price, delivery, MOQ, payment terms
- Highlight lowest price, earliest delivery, best terms
- Historical price reference from past POs for same material
- Calculate landed cost including freight, insurance, taxes
- Recommend vendor with justification notes

**Negotiation tracking:**
- Log negotiation rounds with revised pricing
- Counter-offer recording
- Final negotiated price capture
- Award notification generation

---

### 2.5 Purchase orders
**Purpose:** Create, approve, track, and amend purchase orders.

**PO creation:**
- Auto-populate from awarded RFQ or directly from MR
- Multi-line PO with item descriptions, specs, quantities, unit prices
- Terms and conditions template library (payment, delivery, penalty, warranty)
- Inspection requirements per item (stage inspection, final inspection, third-party)
- Delivery schedule with split shipments if applicable
- Auto-calculate totals with tax (GST/VAT) computation

**Approval workflow:**
- Approval matrix based on PO value: <₹1L auto-approve, ₹1-5L manager, >₹5L director
- Digital signature on approved PO
- Amendment/revision workflow for scope changes on existing PO
- PO cancellation with reason and vendor notification

**PO tracking:**
- Status pipeline: draft → approved → sent to vendor → acknowledged → in-production → dispatched → received → closed
- Vendor acknowledgment capture with expected delivery date
- Dispatch alert when vendor ships
- Overdue PO alerts with escalation to procurement head
- Partial delivery tracking with balance quantity monitoring

---

### 2.6 Goods receipt (GRN)
**Purpose:** Record material arrival, verify against PO, trigger QC inspection.

**GRN creation:**
- Select PO and record received quantities per line item
- Capture: delivery challan number, transporter, vehicle number, date
- Record heat numbers and batch numbers at receipt
- Weighbridge integration for weight verification
- Auto-trigger QC inspection request on GRN creation

**Three-way match:**
- Match GRN quantity vs PO quantity vs vendor invoice quantity
- Flag mismatches: over-delivery, short-delivery, wrong material
- Accept/reject with reason for each line item
- Generate debit note for rejections or short deliveries

**MTC capture:**
- Upload mill test certificate (MTC) at receipt
- Cross-verify heat numbers on MTC vs physical material marking
- Flag MTC discrepancies for QC review

---

### 2.7 PO expediting
**Purpose:** Track and accelerate overdue or at-risk deliveries.

**Expediting dashboard:**
- Visual timeline of all open POs with expected vs today's date
- Aging buckets: on-time, 1-7 days overdue, 8-14 days, 15+ days
- Auto-generated expediting emails to vendors
- Follow-up log: record each call/email with vendor response
- Escalation workflow: buyer → procurement manager → vendor management head

**Risk assessment:**
- Flag POs on critical path (delay impacts project delivery)
- Alternative vendor suggestions if primary vendor fails
- Cost impact analysis of delays on project

---

### 2.8 Reports
**Purpose:** Procurement analytics and compliance reports.

**Standard reports:**
- PO register: all POs with status, value, vendor, project
- Vendor-wise purchase summary
- Material-wise price comparison across vendors and time periods
- Outstanding PO report (open items)
- GRN register with pending inspections
- Procurement cycle time analysis (MR to material receipt)

---

## Module 3: Stores & inventory

### 3.1 Dashboard
**Purpose:** Inventory health overview with critical alerts.

**Stock alerts:**
- Items below reorder level
- Items below safety stock (critical)
- Slow-moving stock aging beyond 90 days
- Near-expiry items (for consumables, paints, chemicals)
- Pending QC clearance items in quarantine

**Summary metrics:**
- Total inventory value by category
- Stock turnover ratio
- Quarantine bay occupancy
- Issued vs returned material ratio

---

### 3.2 Material receipt
**Purpose:** Dock scheduling, physical receipt, and quarantine management.

**Receipt process:**
- Dock scheduling: expected delivery date from PO, slot allocation
- Unloading checklist: condition check, quantity verification, marking verification
- Auto-generate unique material tag (format: HeatNo-PONo-LineItem-BatchSeq)
- Print barcode/QR label for each received item
- Photograph upload for receipt condition documentation

**Quarantine management:**
- All received material auto-placed in quarantine status
- Physical quarantine bay assignment
- Material not issuable until QC clearance received
- Auto-notification to QC team on new quarantine arrival
- Quarantine aging report: how long has material been waiting for inspection

---

### 3.3 Inventory register
**Purpose:** Real-time stock ledger with full traceability.

**Stock view:**
- Filter by: material type, grade, thickness, width, project, status
- Stock status: available, quarantined, reserved, issued, rejected
- Batch/heat number level traceability
- Location tracking: warehouse, bay, rack, level
- Current stock value at weighted average cost

**Stock operations:**
- Physical stock count / cycle count entry
- Stock adjustment with reason (damage, miscounting, etc.)
- Stock reservation against project BOM
- Min/max/reorder level configuration per item
- ABC analysis classification (A = high value, C = low value)

---

### 3.4 Material issue
**Purpose:** Job-wise material issue to production floor.

**Issue process:**
- Select project and job card for material issue
- System validates: is item in BOM? Is quantity within BOM limit?
- FIFO enforcement: oldest cleared stock issued first
- Issue slip generation with material tag, quantity, receiver signature
- Auto-deduct from inventory on issue confirmation
- Barcode scan for issue verification

**Controls:**
- Block issue if material not QC-cleared
- Block issue if quantity exceeds BOM requirement (requires override approval)
- Block issue for projects on hold
- Excess issue request workflow: engineer justification → PM approval

---

### 3.5 Stock transfers
**Purpose:** Inter-project and inter-location material movements.

**Transfer types:**
- Project-to-project transfer (surplus material reallocation)
- Location-to-location transfer (warehouse to shop floor staging area)
- Return to stores from production (unused material)
- Transfer request and approval workflow
- Full traceability maintained: original heat number, PO, project trail preserved

---

### 3.6 Scrap & offcuts
**Purpose:** Track usable offcuts and scrapped material.

**Offcut management:**
- Log offcuts with dimensions (length × width × thickness)
- Material grade and heat number retained
- Offcut availability search: find usable pieces for new jobs
- Nesting optimization suggestions: which offcuts can fill upcoming BOM items
- Offcut utilization rate tracking

**Scrap tracking:**
- Categorize: production scrap, rejected material, damaged goods
- Scrap weight recording for disposal
- Scrap value calculation at current market rate
- Scrap sale management: buyer, quantity, price, challan
- Monthly scrap analysis: which processes generate most scrap

---

### 3.7 Bin location map
**Purpose:** Warehouse layout with rack/bay/level assignments.

**Warehouse setup:**
- Define warehouse zones: raw material, consumables, bought-outs, offcuts, scrap yard
- Define rack-bay-level structure per zone
- Assign material to specific bin locations
- Visual warehouse map with occupied/empty indicators
- Search: where is heat number XXXXX located?

**Movement tracking:**
- Log every physical movement between locations
- Forklift/crane assignment for heavy plates
- Staging area management for materials queued for production

---

### 3.8 Reports
**Purpose:** Inventory analytics and compliance reports.

**Standard reports:**
- Stock register with current quantities and values
- Material receipt register (GRN log)
- Material issue register (job-wise consumption)
- Aging analysis: stock older than 30/60/90/180 days
- Reorder report: items at or below reorder level
- Consumption trend: monthly usage by material type
- Stock reconciliation: system vs physical count discrepancy

---

## Module 4: Quality control & assurance

### 4.1 Dashboard
**Purpose:** Inspection workload, pending actions, and quality health indicators.

**Inspection queue:**
- Pending incoming inspections (material in quarantine)
- Pending in-process inspections (production hold points)
- Pending NDE scheduling
- Overdue inspections highlighted in red
- Inspector workload distribution

**Quality KPIs:**
- First-pass yield rate (trending)
- Open NCR count by severity
- Vendor rejection rate (top 5 worst performers)
- NDE repair rate per project
- Average inspection turnaround time

---

### 4.2 Incoming inspection
**Purpose:** Raw material testing against specifications and code requirements.

**Inspection planning:**
- Auto-generate test matrix from material specification (e.g., SA-516 Gr.70 requires: chemical composition, tensile, yield, elongation, impact, UT)
- Assign inspector to each inspection request
- Set inspection priority based on project schedule urgency
- Link to PO inspection requirements

**Test execution:**
- Record test results per parameter with pass/fail status
- Chemical composition entry: C, Mn, P, S, Si, Cr, Ni, Mo — compare vs code limits
- Mechanical properties: tensile strength, yield strength, elongation %, impact values at specified temperature
- UT scanning for plates: record any indications, map locations
- Dimensional verification: thickness, width, length vs PO requirements
- Visual inspection: surface condition, edge condition, marking legibility

**MTC review:**
- Upload and parse mill test certificate
- Auto-compare MTC values vs code minimum/maximum requirements
- Verify heat number on MTC matches physical marking on material
- Flag discrepancies with auto-generated discrepancy report
- Accept, reject, or conditional accept with remarks

**Verdict and disposition:**
- Accept: material cleared for stores (status → available)
- Reject: material quarantined, NCR auto-raised, vendor notified
- Conditional accept: accepted with deviation note (requires engineering concession)
- Generate inspection report with all test results and verdict
- Digital sign-off by QC engineer and QC manager

---

### 4.3 In-process inspection (IPI)
**Purpose:** Stage-gate inspections during production with hold/release authority.

**IPI stages:**
- Post-rolling inspection: thickness check, ovality measurement, surface condition
- Pre-welding fit-up inspection: joint alignment, root gap, tack weld quality
- Post-welding inspection: visual examination, dimensional check, distortion measurement
- Post-PWHT inspection: hardness testing at weld and HAZ
- Pre-hydro test inspection: all NDE cleared, all NCRs closed, dimensional final check
- Post-painting inspection: DFT measurement, adhesion test, visual finish

**Hold and release:**
- Production STOP at each defined hold point until QC releases
- Inspector records observations, measurements, and photographs
- Accept: production resumes (next stage unlocked in job card)
- Hold: defect identified, NCR raised, production paused until disposition
- Release with conditions: proceed with rework instructions attached

**Witness points:**
- Define client witness points (stages where client inspector must be present)
- Third-party inspection (TPI) coordination and scheduling
- Record witness/review/hold status per inspection point
- Notification to client/TPI 48 hours before witness point

---

### 4.4 NDE management
**Purpose:** Non-destructive examination scheduling, execution, and result tracking.

**NDE planning:**
- NDE requirement matrix per joint (derived from code and drawing): RT, UT, MT, PT, PWHT
- Map each weld joint to its required NDE methods
- Calculate total film/RT shots required for the project
- Schedule NDE sequence respecting prerequisite order (welding → VT → RT → repair if needed → re-RT)
- Third-party NDE agency coordination: booking, availability, mobilization

**NDE execution:**
- Radiographic testing (RT): film reader report entry, indication mapping, accept/reject per code
- Ultrasonic testing (UT): scan results, indication characterization, grid mapping
- Magnetic particle testing (MT): indication log with location and disposition
- Liquid penetrant testing (PT): indication log, bleed-out time, result photos
- Record NDE operator certification number and validity

**Repair tracking:**
- If NDE reveals defect: auto-link to NCR, define repair procedure
- Track repair execution: gouging → re-welding → re-NDE
- Repair rate calculation per welder, per joint type, per project
- Maximum repair attempt limit (usually 2) — escalate to engineering beyond that

---

### 4.5 Welding management
**Purpose:** WPS/PQR registry, welder qualification tracking, and joint-wise weld log.

**WPS/PQR register:**
- Welding procedure specification (WPS) database: process, material, position, thickness range, preheat, interpass temp, PWHT requirements
- Procedure qualification record (PQR): test results backing each WPS
- WPS revision control and validity tracking
- Auto-suggest applicable WPS for a given joint based on material + thickness + position

**Welder qualification:**
- Welder performance qualification (WPQ) register: welder ID, qualified processes, positions, material groups
- Qualification test results with certificate upload
- Expiry tracking: re-qualification due date alerts (typically 6-month continuity or 2-year renewal)
- Auto-block welder assignment to joints outside their qualified range

**Weld log / weld map:**
- Joint-wise weld log: joint number, WPS used, welder ID, date, welding parameters (amps, volts, speed, heat input)
- Visual weld map on vessel drawing showing all joint locations
- Color-coded joint status: not started / in-progress / NDE pending / cleared / repair
- Consumable consumption per joint: electrode type, batch number, quantity
- Heat input calculation and verification against WPS limits

---

### 4.6 NCR management
**Purpose:** Non-conformance reporting, investigation, and corrective action.

**NCR creation:**
- Raise NCR against: incoming material, in-process defect, final inspection finding, vendor quality issue
- Categorize: material non-conformance, dimensional non-conformance, welding defect, documentation error
- Severity classification: critical (safety/code), major (affects function), minor (cosmetic)
- Attach photographs, NDE reports, dimensional records as evidence
- Auto-notify: QC manager, project manager, engineering team

**Investigation:**
- Root cause analysis tools: fishbone/Ishikawa diagram builder, 5-why template
- Assign investigation team with deadline
- Contributing factors: man, machine, material, method, measurement, environment
- Investigation report with findings and evidence

**Disposition:**
- Use-as-is (with engineering concession and client approval if required)
- Repair (with approved repair procedure, re-inspect after repair)
- Reject / scrap (material returned or scrapped with cost impact logged)
- Rework (rework instruction issued, re-inspect after rework)
- Concession request to client for deviation acceptance

**CAPA (corrective and preventive action):**
- Corrective action: what will be done to fix this specific instance
- Preventive action: what will change to prevent recurrence
- Assign CAPA owner with target completion date
- CAPA effectiveness verification after implementation
- Close NCR only after CAPA verified effective

---

### 4.7 Test reports and certificates
**Purpose:** Standardized test report generation and archival.

**Report templates:**
- Incoming material inspection report
- Dimensional inspection report
- Welding inspection report (visual + NDE summary)
- Hydrostatic test report
- PWHT report (time-temperature chart)
- Surface preparation and painting inspection report

**Report workflow:**
- Prepared by → checked by → approved by → client/TPI sign-off
- Digital signature at each stage
- Revision tracking if report is amended
- Auto-archive to project document register
- Export as PDF with company letterhead

---

### 4.8 Data book compiler
**Purpose:** Assemble manufacturing data book from linked project documents.

**Compilation:**
- Auto-pull all linked documents: MTCs, inspection reports, NDE reports, WPS/PQR, PWHT charts, hydro test cert, dimensional reports
- Custom data book index builder: drag-and-drop section ordering
- Auto-generate table of contents with page numbers
- Bookmarked PDF generation for digital submission
- Print-ready format for hardcopy data books
- Tab/section divider pages auto-inserted

**Review:**
- Completeness checker: flag any missing mandatory documents
- QA review and sign-off before client submission
- Transmittal generation for data book submission
- Client comment receipt and incorporation tracking

---

### 4.9 Document register (MDR) *(moved from Document management — DocMgmt_V1)*
**Purpose:** Master document register tracking all project deliverables.

**MDR management:**
- Complete deliverable list per project: drawings, procedures, reports, certificates, data books
- Document numbering: ProjectCode-DocType-SeqNo-RevNo
- Status tracking: not started → in-progress → internal review → submitted → client approved
- Planned vs actual submission date with overdue highlighting
- Responsibility assignment per deliverable
- Filter by type, status, discipline, responsible, due date

**MDR templates:**
- Pre-built templates by vessel type (pressure vessel, heat exchanger, etc.)
- Export MDR to Excel for client submission (colour-coded status)
- MDR completeness gauge on QC dashboard

**Backend:** `GET/POST/PATCH /api/qc/mdr/:projectId` · `GET /api/qc/mdr/:projectId/completeness` · `GET /api/qc/mdr/:projectId/export`

---

### 4.10 Drawing management *(moved from Document management — DocMgmt_V1)*
**Purpose:** Shop drawings with revision control and shop floor notification.

**Drawing register:**
- Upload drawings: GA, fabrication detail, nozzle detail, nameplate, isometric, P&ID
- Drawing numbering: ProjectCode-DRG-SeqNo
- Link drawings to BOM items and MDR entries
- PDF viewer integration

**Revision control:**
- New revision upload with change description
- Side-by-side comparison of any two revisions (file_key metadata)
- Latest approved revision auto-supersedes previous
- Auto-notification to production shop floor on new revision release
- Superseded stamps + full revision history log

**Backend:** `/api/qc/drawings/:projectId` · `/api/qc/drawings/:id/revisions` · `/api/qc/drawings/:id/notify-shop-floor` · `/api/qc/drawings/compare`

---

### 4.11 Procedure library *(moved from Document management — DocMgmt_V1)*
**Purpose:** Standard operating procedures, work instructions, and method statements.

**Procedure management:**
- Categories: quality procedures (QP), work instructions (WI), specifications
- Version control via `doc_register` + `doc_revisions` tables
- Periodic review scheduling with overdue-review alerts
- Employee acknowledgment recording (read & accepted)
- Filter by type, status, review due date

**Backend:** `GET/POST /api/qc/procedures` · `POST /api/qc/procedures/:id/acknowledge` · `GET /api/qc/procedures/due-for-review`

---

### 4.12 Transmittals *(moved from Document management — DocMgmt_V1)*
**Purpose:** Formal document submission and receipt tracking.

**Outgoing transmittals:**
- Create transmittal: select MDR entries, drawings, or procedures; set purpose (for approval / for information / for construction)
- Auto-generate PDF cover sheet with full document list and project header
- Track: draft → sent → received → under review → comments received → approved/rejected
- Overdue response alerts on QC dashboard

**Incoming transmittals:**
- Log received transmittals from client or TPI
- Distribute to relevant team members
- Acknowledgment generation

**Backend:** `/api/qc/transmittals/:projectId` · `POST /api/qc/transmittals` · `PATCH /api/qc/transmittals/:id/status` · `GET /api/qc/transmittals/:id/cover-sheet`

---

### 4.13 Reports
**Purpose:** Quality analytics and trend reports.

**Standard reports:**
- Inspection register: all inspections with verdict and date
- NCR register: all NCRs with status, severity, aging
- Vendor rejection report: rejection count and rate by vendor
- Welder performance report: repair rate by welder
- NDE summary: total joints, inspected, accepted, rejected, repair rate
- First-pass yield trending by month/quarter
- Cost of poor quality (COPQ): scrap + rework + delays from NCRs

---

## Module 5: Production & manufacturing

### 5.1 Dashboard
**Purpose:** Shop floor overview with active jobs, capacity, and bottlenecks.

**Production status:**
- Active job cards with current stage and % complete
- Work center utilization gauge (rolling machines, welding bays, PWHT furnace)
- Jobs waiting for material (blocked by stores/procurement)
- Jobs waiting for QC clearance (blocked by inspection)
- Today's production plan vs actual output

**Alerts:**
- Overdue job cards
- Equipment breakdown notifications
- Upcoming PWHT furnace bookings
- Pending dispatch items

---

### 5.2 Job cards
**Purpose:** Create, assign, and track fabrication job cards linked to project schedule.

**Job card creation:**
- Auto-generate from project process flow
- Define operations sequence: cutting → rolling → fit-up → welding → NDE → PWHT → hydro → painting
- Assign work center and operator per operation
- Set planned start/finish dates per operation
- Link to BOM items (materials required for this job)
- Print shop-floor job card with traveler sheet

**Execution tracking:**
- Operator starts/stops timer per operation (actual hours capture)
- Record actual material consumed vs planned
- Update operation status: not started → in-progress → QC hold → completed
- Auto-trigger QC inspection at defined hold points
- Photograph upload at each stage completion

**Job card management:**
- Split job card (when one vessel becomes two sub-assemblies)
- Merge operations
- Rework job card creation (linked to NCR)
- Job card closure after all operations completed and QC cleared
- Cost summary per job card: material + labor + overhead

---

### 5.3 Work centers
**Purpose:** Machine and work station master with capacity and scheduling.

**Work center register:**
- Define work centers: plate rolling machine, welding bay 1-4, PWHT furnace, hydro test pit, blast and paint booth
- Specifications: capacity (max plate thickness/width), working dimensions, power rating
- Operating hours: shifts per day, days per week, planned downtime
- Hourly operating cost for job costing allocation

**Capacity planning:**
- Gantt-style capacity view: which jobs are on which machine and when
- Identify bottleneck machines (queue length analysis)
- Planned maintenance windows blocked out
- Capacity vs demand: can we accept this new project given current loading?

---

### 5.4 Production schedule
**Purpose:** Sequencing and scheduling of all active jobs across work centers.

**Scheduling:**
- Drag-and-drop job sequencing on each work center
- Priority-based scheduling: which project ships first?
- Material availability check before scheduling (is stock cleared?)
- Machine changeover time consideration
- Shift allocation: which welder works which joint on which shift

**Progress board:**
- Kanban-style board: planned → in-progress → QC hold → completed → dispatched
- Real-time status update from shop floor
- Color-coded by project for multi-project visibility
- Drag cards between columns as status changes

---

### 5.5 Shop floor tracking
**Purpose:** Real-time production status capture from the shop floor.

**Data capture:**
- Tablet/kiosk interface for operators (simplified, large-button UI)
- Scan job card barcode to start/stop operations
- Record: start time, end time, operator, machine, material batch used
- Record welding parameters: amps, volts, travel speed, gas flow rate
- Downtime logging: reason code (material wait, machine breakdown, QC hold, no operator)

**Visibility:**
- Live shop floor map showing which machine is running what
- Real-time OEE (overall equipment effectiveness) calculation
- Operator time utilization report
- Shift handover summary auto-generated

---

### 5.6 Welding log
**Purpose:** Joint-by-joint welding parameter recording and traceability.

**Joint tracking:**
- Weld joint register per vessel: joint ID, type (long seam, circ seam, nozzle), WPS reference
- Pass-by-pass recording: root, hot, fill, cap — with parameters per pass
- Consumable batch traceability per joint
- Welder ID and qualification verification per joint
- Heat input calculation and WPS compliance check
- Fit-up sheet (FS) sign-off at defined completion milestones (80%, 60% as in original flow)

---

### 5.7 PWHT management
**Purpose:** Post-weld heat treatment planning, execution, and recording.

**PWHT execution:**
- PWHT requirement determination from code and WPS
- Furnace booking and scheduling
- Thermocouple placement plan (number, locations per code requirements)
- Time-temperature chart recording (digital chart recorder integration)
- Heating rate, holding temperature, holding time, cooling rate — all verified against code limits
- Hardness testing after PWHT: record values at weld, HAZ, base metal
- PWHT certificate generation with chart attachment

---

### 5.8 Hydrostatic testing
**Purpose:** Pressure test execution and certification.

**Test execution:**
- Test pressure calculation per code (typically 1.3× design pressure for ASME VIII)
- Pre-test checklist: all NDE cleared, all NCRs closed, safety valves removed, blind flanges installed
- Pressure gauge calibration certificate verification
- Fill, pressurize, hold (minimum 30 minutes), inspect for leaks
- Record: test pressure, hold time, temperature, medium (water), gauge serial numbers
- Leak/no-leak verdict with inspector sign-off
- Hydrostatic test certificate generation

**Safety:**
- Barricade area during pressurization
- Safety officer present during test
- Emergency depressurization procedure documented
- Incident reporting if test fails (burst, leak, deformation)

---

### 5.9 Surface treatment
**Purpose:** Blasting, painting, and coating management.

**Surface prep:**
- Blast profile specification: SA 2.5 / SA 3 as per client spec
- Abrasive type and consumption tracking
- Environmental conditions check: temperature, humidity, dew point
- Surface cleanliness verification before painting

**Painting:**
- Paint system: primer → intermediate → topcoat with product codes and colors
- Batch number tracking for each coat
- Wet film thickness (WFT) and dry film thickness (DFT) measurements
- Inter-coat interval monitoring
- Adhesion test (cross-cut or pull-off)
- Touch-up and repair areas documentation
- Painting inspection report generation

---

### 5.10 Dispatch
**Purpose:** Final packaging, documentation, and shipping management.

**Pre-dispatch:**
- Final dimensional check report
- Nameplate verification: design data matches stamped plate
- Shipping saddle fabrication and fit-up
- Lifting lug proof load test certificate
- Packing list generation with weights and dimensions

**Dispatch execution:**
- Transport mode selection: trailer, lowbed, special transport for OD cargo
- Route survey for oversized loads
- Load-out plan: crane capacity, rigging plan, tie-down points
- Delivery challan and e-way bill generation
- GPS tracking of in-transit shipment
- Proof of delivery capture at client site
- Project status auto-updated to "delivered"

---

### 5.11 Approval workflows *(moved from Document management — DocMgmt_V1)*
**Purpose:** Configurable document review and approval chains triggered by production stages.

**Workflow engine:**
- Define approval chains per document type: sequential or parallel
- Steps specify approver by user, role, or department
- SLA tracking per step with escalation on breach
- Approve, reject (with reason), or escalate
- Full approval history with timestamps

**My approvals queue:**
- Filtered to documents awaiting the current user's action
- SLA-breached items highlighted
- Approve or reject inline with comments

**Integration:**
- Job card completion triggers approval chain submission
- PWHT chart upload auto-submits for QC → Production approval
- Dispatch stage triggers final documentation sign-off chain

**Backend:** `GET /api/production/approvals/pending` · `POST /api/production/approvals/submit` · `PUT /api/production/approvals/:id/approve` · `PUT /api/production/approvals/:id/reject` · `PUT /api/production/approvals/:id/escalate`

---

### 5.12 Document archive *(moved from Document management — DocMgmt_V1)*
**Purpose:** Full-text search across all project documents, and long-term archive management.

**Search & retrieval:**
- Search across MDR entries, drawings, and doc register simultaneously
- Filter by project, type, date range, status
- Bulk download manifest (pre-signed MinIO URLs for selected files)

**Archive management:**
- Archive completed project documents with a single action
- Retention policy reference (drawings 10yr, procedures 7yr, NCRs 5yr, financial 7yr)
- Recently archived projects list on Production dashboard

**Backend:** `GET /api/production/archive/search` · `POST /api/production/archive/:projectId` · `GET /api/production/archive/recent` · `POST /api/production/archive/bulk-download` · `GET /api/production/archive/retention`

---

## Module 6: Finance & job costing (NEW)

### 6.1 Dashboard
**Purpose:** Financial health overview with cash flow, receivables, and project profitability.

**Financial KPIs:**
- Monthly revenue vs target
- Outstanding receivables and payables aging
- Cash flow forecast (next 30/60/90 days)
- Project-wise profitability snapshot (margin %)
- Budget utilization across all active projects

---

### 6.2 Job costing
**Purpose:** Real-time cost accumulation and variance analysis per project.

**Cost accumulation:**
- Material cost: auto-captured from every material issue (qty × unit cost)
- Labor cost: auto-captured from job card time bookings (hours × rate)
- Consumable cost: welding rods, gases, grinding discs — per job card
- Subcontract cost: NDE services, PWHT services, transport
- Overhead allocation: factory overhead rate applied per labor hour
- All costs post automatically — zero manual data entry

**Variance analysis:**
- Budget vs actual comparison per cost element
- Variance flags: green (<5%), amber (5-15%), red (>15%)
- Drill-down: which material line item caused the overrun?
- Earned value metrics: CPI (cost performance index), CV (cost variance)
- Forecast at completion: estimated final cost based on current burn rate

**Cost reports:**
- Project cost summary: one-page cost breakdown
- Cost comparison across similar past projects
- Material cost as % of total cost trending
- Labor productivity: hours per ton of fabrication

---

### 6.3 Accounts payable
**Purpose:** Vendor invoice processing, matching, and payment scheduling.

**Invoice processing:**
- Vendor invoice entry: invoice number, date, amount, tax details
- Three-way match: PO → GRN → invoice — auto-flag mismatches
- Advance payment tracking against PO advance terms
- Retention amount holding and release scheduling
- TDS (tax deducted at source) calculation and deduction

**Payment management:**
- Payment due date calendar
- Aging analysis: current, 30 days, 60 days, 90+ days
- Payment batch creation for bank processing
- Payment authorization workflow: accounts → finance manager → director
- Record payment: cheque/NEFT/RTGS with reference number
- Vendor ledger: complete transaction history per vendor

---

### 6.4 Accounts receivable
**Purpose:** Client invoicing, collection tracking, and revenue recognition.

**Invoicing:**
- Milestone-based invoice generation (linked to project milestones)
- Pro-forma invoice for advance payments
- Tax invoice with GST computation
- Credit note and debit note management
- Invoice approval workflow before dispatch to client

**Collection:**
- Payment follow-up calendar with reminders
- Client ledger: invoice-wise outstanding
- Aging analysis: current, 30, 60, 90+ days overdue
- Receipt recording: cheque/NEFT/RTGS with bank details
- Retention release tracking (typically released after warranty period)
- Bank guarantee management: BG number, validity, value, renewal alerts

---

### 6.5 Milestone billing
**Purpose:** Define and trigger billing milestones linked to project progress.

**Billing schedule:**
- Define billing milestones per contract (e.g., 30% on material procurement, 20% on rolling complete, 30% on hydro test, 20% on delivery)
- Link milestones to production stages — invoice auto-triggered when stage completes
- Partial billing for partially completed milestones
- Milestone certificate generation for client sign-off before invoice
- Track billing vs contract value: billed to date, balance to bill

---

### 6.6 Budget management
**Purpose:** Project budget creation, approval, and monitoring.

**Budget creation:**
- Estimate material cost from BOM with current pricing
- Estimate labor cost from process flow hours × labor rates
- Add consumables, subcontracting, freight, insurance, overheads
- Margin target setting
- Budget approval workflow: estimator → PM → management
- Budget revision management with change order linkage

**Monitoring:**
- Real-time budget vs actual tracker
- Early warning alerts when cost reaches 80% of budget
- What-if analysis: if current spend rate continues, will we exceed budget?
- Budget reforecast based on actual performance

---

### 6.7 Reports
**Purpose:** Financial reports and management summaries.

**Standard reports:**
- Project-wise profit and loss statement
- Monthly revenue report
- Vendor payment summary
- Client receivables aging
- Cash flow statement
- Tax computation summary (GST/VAT returns data)
- Bank guarantee register
- Cost comparison: budget vs estimated vs actual per project

---

## ~~Module 7: Document management~~ — DISSOLVED (DocMgmt_V1)

> **This module has been dissolved.** All pages and functions have been redistributed into QC (§4) and Production (§5).
> See the redistribution table in the Module summary above.
> The sections below are retained for historical reference only.

### ~~7.1 Dashboard~~
~~**Purpose:** Document actions overview — pending approvals, overdue submissions, transmittals.~~

**Action items:**
- Documents pending my approval
- Documents pending client review
- Overdue document submissions (past due date)
- Recent transmittals awaiting acknowledgment
- Documents approaching revision deadline

---

### 7.2 Document register (MDR)
**Purpose:** Master document register tracking all project deliverables.

**MDR management:**
- Complete deliverable list per project: drawings, procedures, reports, certificates, data books
- Document numbering convention: ProjectCode-DocType-SeqNo-RevNo
- Status tracking per document: not started → in-progress → internal review → submitted → client approved
- Planned vs actual submission date tracking
- Responsibility assignment: who is preparing each document
- Filter and sort by: type, status, discipline, responsible person, due date

**MDR templates:**
- Pre-built MDR templates by vessel type (pressure vessel, heat exchanger, etc.)
- Customize template per project requirements
- Client-specific MDR format adaptation
- Export MDR to Excel for client submission

---

### 7.3 Drawing management
**Purpose:** Shop drawings with revision control.

**Drawing register:**
- Upload drawings: general arrangement (GA), fabrication details, nozzle details, name plate details
- Drawing numbering: ProjectCode-DRG-SeqNo-Rev
- Link drawings to BOM items and job cards
- View drawing directly in browser (PDF viewer integration)
- Red-line markup tools for review comments

**Revision control:**
- New revision upload with change description
- Side-by-side comparison of revisions (old vs new)
- Only latest approved revision available for production (older revisions archived but visible)
- Auto-notification to shop floor when new revision released
- Superseded stamp on old revisions
- Revision history log: who changed what, when, why

---

### 7.4 Procedure library
**Purpose:** Standard operating procedures, work instructions, and method statements.

**Procedure management:**
- Categorize: welding procedures (WPS), QC procedures, safety procedures, work instructions
- Version control with approval workflow
- Periodic review scheduling (annual review reminders)
- Link procedures to relevant job cards and work centers
- Employee acknowledgment tracking: who has read and accepted each procedure

---

### 7.5 Transmittals
**Purpose:** Formal document submission and receipt tracking.

**Outgoing transmittals:**
- Create transmittal: select documents, set purpose (for approval / for information / for construction)
- Auto-generate transmittal cover sheet with document list
- Email transmittal directly to client from system
- Track: sent → received → under review → comments received → approved / rejected
- Reminder automation for overdue client responses

**Incoming transmittals:**
- Log received transmittals from client or third parties
- Distribute received documents to relevant team members
- Comment incorporation tracking
- Acknowledgment of receipt generation

---

### 7.6 Approval workflows
**Purpose:** Configurable document review and approval chains.

**Workflow engine:**
- Define approval chains per document type (e.g., drawing: designer → checker → approver → client)
- Sequential or parallel approval options
- Email and in-app notifications at each stage
- Approve, reject (with comments), or request revision
- Approval history with timestamps and digital signatures
- SLA tracking: time spent at each approval stage
- Escalation if approval pending beyond SLA

---

### 7.7 Archive and search
**Purpose:** Full-text document search and long-term archival.

**Search and retrieval:**
- Full-text search across all uploaded documents
- Filter by: project, type, date range, author, status
- Tag-based organization
- Favorites and recently viewed
- Bulk download for project handover

**Archival:**
- Automatic archival of completed project documents
- Retention policy management (how long to keep each doc type)
- Compressed archive storage for older projects
- Retrieval from archive on demand

---

## Module 8: HSE & compliance (NEW)

### 8.1 Dashboard
**Purpose:** Safety performance metrics and compliance status.

**Safety KPIs:**
- Days without lost-time incident (LTI) counter
- LTIR (lost time incident rate) and TRIR (total recordable incident rate)
- Open safety findings count
- Permit compliance rate (valid permits vs total active work)
- Near-miss reporting trend (higher reporting = better safety culture)
- Training compliance rate

---

### 8.2 Permit to work
**Purpose:** Digital work permit system for hazardous activities.

**Permit types:**
- Hot work permit (welding, grinding, cutting in non-designated areas)
- Confined space entry permit (inside vessels during fabrication)
- Working at height permit (above 2 meters)
- Electrical isolation permit
- Excavation permit
- General work permit

**Permit lifecycle:**
- Request: operator/supervisor requests permit for specific job and duration
- Approve: safety officer verifies precautions, issues permit with conditions
- Activate: physical inspection of site conditions before work begins
- Monitor: periodic checks during permit validity (every 4 hours)
- Close: work completed, area restored, permit closed
- Auto-expire: permits expire at end of shift or defined duration
- Extension request workflow for ongoing work
- Emergency permit revocation

---

### 8.3 Code compliance
**Purpose:** Regulatory code tracking and compliance verification.

**Compliance matrix:**
- Applicable codes per project: ASME VIII Div.1/2, PED 2014/68/EU, IBR, IS 2825, PESO
- Code requirement checklist: design, material, fabrication, inspection, testing, documentation
- Compliance status per requirement: compliant, non-compliant, not applicable, pending verification
- Auto-flag when inspection results or material properties fall outside code limits
- Regulatory body registration tracking (ASME U-stamp, R-stamp, NB registration)

**Certification:**
- Company certification register: ISO 9001, ISO 14001, ISO 45001, ASME stamps
- Certification validity and renewal tracking
- Audit preparation checklist per certification standard
- Surveillance audit scheduling

---

### 8.4 Welder qualifications
**Purpose:** Centralized welder certification tracking with auto-blocking.

**Qualification register:**
- Welder ID with photo, name, trade, experience
- Qualified processes: SMAW, GTAW (TIG), GMAW (MIG), SAW, FCAW
- Qualified positions: 1G, 2G, 3G, 4G, 5G, 6G, 6GR
- Material group qualifications: P1, P4, P5, P8, etc.
- Thickness range qualified
- Certificate upload with issuing body and date

**Validity management:**
- Expiry date tracking with 30/60/90 day advance alerts
- Continuity log: welder must have welded in qualified process within 6 months to maintain qualification
- Auto-block: system prevents assigning an expired/lapsed welder to production
- Re-qualification test scheduling and result recording
- Welder performance history: repair rate, productivity, NCRs attributed

---

### 8.5 Incident reporting
**Purpose:** Near-miss, first-aid, and lost-time incident logging and investigation.

**Incident capture:**
- Report type: near-miss, first-aid case, medical treatment, restricted work, lost-time injury, fatality
- Incident details: date, time, location, people involved, description, immediate actions taken
- Photograph and video upload
- Witness statements
- Immediate notification to: safety officer, department head, management (for LTI)

**Investigation:**
- Investigation team assignment
- Root cause analysis: direct cause, contributing factors, root cause
- Investigation timeline and methodology (5-Why, fault tree, etc.)
- Corrective and preventive actions (CAPA)
- Follow-up verification of CAPA effectiveness
- Investigation report with lessons learned

**Statistics:**
- Monthly safety statistics: incidents by type, location, department
- Trend analysis: are we getting better or worse?
- Benchmark against industry standards
- Safety performance review for management meetings

---

### 8.6 Audit management
**Purpose:** Internal and external audit scheduling, execution, and finding closure.

**Audit planning:**
- Annual audit calendar: internal audits, surveillance audits, client audits, regulatory inspections
- Audit team assignment and competency verification
- Audit checklist preparation per standard/clause
- Pre-audit document readiness check

**Finding management:**
- Finding log: observation, minor NC, major NC, opportunity for improvement
- Assign finding owner with corrective action deadline
- Evidence upload for closure
- Verification of corrective action effectiveness
- Audit report generation
- Finding closure rate tracking and aging analysis

---

### 8.7 Training records
**Purpose:** Employee safety and skills training tracking.

**Training management:**
- Training matrix: which roles require which training modules
- Training record per employee: completed, due, overdue
- Mandatory safety induction for all new employees
- Job-specific training: crane operation, forklift, working at height, first aid
- Training effectiveness assessment (post-training quiz scores)
- Training certificate upload and validity tracking
- Auto-alert when mandatory training is overdue

---

### 8.8 Reports
**Purpose:** HSE performance reports and regulatory submissions.

**Standard reports:**
- Monthly safety report: incidents, near-misses, permits issued, training completed
- Quarterly management review data pack
- Annual safety statistics for regulatory submission
- Permit register: all permits issued with status
- Audit finding register and closure status
- Environmental monitoring report: emissions, waste disposal, water discharge

---

## Module 9: Maintenance & calibration (NEW)

### 9.1 Dashboard
**Purpose:** Equipment health overview and upcoming maintenance schedule.

**Maintenance KPIs:**
- Overall equipment uptime %
- PM (preventive maintenance) compliance rate: completed on time vs total due
- Open breakdown work orders count
- Calibration due in next 7/14/30 days
- Monthly maintenance cost trending
- MTBF (mean time between failures) by equipment category

---

### 9.2 Equipment register
**Purpose:** Master asset register for all fabrication equipment.

**Asset database:**
- Equipment card: name, type, make/model, serial number, location, department
- Specifications: capacity, dimensions, power rating, year of manufacture
- Purchase details: vendor, date, cost, warranty period
- Depreciation tracking: original cost, book value, depreciation method
- Photo gallery per equipment
- Linked maintenance history, calibration records, and spare parts list

**Asset lifecycle:**
- Status: operational, under maintenance, breakdown, decommissioned
- Utilization tracking: operating hours meter reading
- Performance degradation tracking (efficiency loss over time)
- Replacement planning based on age and repair cost trends

---

### 9.3 Preventive maintenance
**Purpose:** Scheduled maintenance planning and execution.

**PM scheduling:**
- PM schedules based on: calendar interval (monthly, quarterly), running hours, or condition-based triggers
- Auto-generate PM work orders based on schedule
- Maintenance checklist per equipment type (lubrication, inspection, replacement items)
- Assign maintenance technician per work order
- Parts and consumables pre-kitting for scheduled PM

**PM execution:**
- Checklist completion with pass/fail per item
- Record: technician, start time, end time, findings, actions taken
- Spare parts consumed (auto-deduct from spare parts inventory)
- Equipment condition rating after PM: good, acceptable, needs attention, critical
- Next PM date auto-calculated based on completion date
- PM completion report generation

---

### 9.4 Breakdown maintenance
**Purpose:** Unplanned breakdown logging, repair, and root cause analysis.

**Breakdown logging:**
- Log breakdown: equipment, date/time, failure description, impact on production
- Priority classification: critical (production stopped), high (reduced capacity), medium (workaround available), low
- Assign repair team with urgency notification
- Estimated repair time entry

**Repair execution:**
- Repair actions log: what was done, parts replaced, time taken
- Root cause analysis: wear, electrical fault, operator error, material fatigue, lack of PM
- Spare parts consumed tracking
- Equipment return to service sign-off (safety + quality check)
- Total downtime calculation and production loss quantification

**Analysis:**
- MTBF (mean time between failures) per equipment
- MTTR (mean time to repair) per equipment
- Repeat failure tracking (same equipment, same failure type)
- Breakdown cost analysis: parts + labor + production loss
- Decision support: repair vs replace based on cost trend

---

### 9.5 Calibration management
**Purpose:** Instrument calibration scheduling, execution, and certificate management.

**Instrument register:**
- All measurable instruments: pressure gauges, temperature recorders, ammeters, voltmeters, UT/RT equipment, DFT gauges, torque wrenches, micrometers, calipers
- Calibration parameters: range, accuracy, calibration method
- Calibration agency: internal or external (NABL accredited lab)
- Last calibration date and next due date

**Calibration management:**
- Calibration schedule with advance alerts (30/15/7 days before due)
- Auto-block: instruments past calibration due date cannot be used for inspection (QC integration)
- Calibration work order generation
- Record calibration results: as-found readings, as-left readings, adjustment made
- Calibration certificate upload and linking to instrument
- Calibration sticker/label generation with due date
- Out-of-calibration impact assessment: which inspections used this instrument while it was out of cal?

---

### 9.6 Spare parts inventory
**Purpose:** Maintenance spare parts inventory management.

**Spare parts inventory:**
- Spare parts master: part number, description, compatible equipment, vendor, unit cost
- Current stock level with min/max/reorder levels
- Auto-reorder trigger when stock hits reorder point
- Consumption history per part
- Critical spares identification (breakdown without this part = extended downtime)
- Bin location assignment in maintenance stores

**Procurement link:**
- Auto-generate purchase requisition for reorder items
- Link to approved vendor for each spare part
- Lead time tracking for delivery planning
- Emergency procurement workflow for critical spares

---

### 9.7 Reports
**Purpose:** Maintenance analytics and equipment performance reports.

**Standard reports:**
- Equipment maintenance history (full timeline per asset)
- PM compliance report: scheduled vs completed on time
- Breakdown analysis: frequency, duration, cost by equipment
- Calibration status report: all instruments with next due dates
- Spare parts consumption report
- Monthly maintenance cost by equipment category
- Equipment availability and uptime report

---

## Module 10: Analytics dashboard (NEW)

### 10.1 Executive summary
**Purpose:** One-page company performance overview for management.

**Summary panels:**
- Total active projects with aggregate progress
- Monthly revenue and billing status
- Order backlog value and delivery pipeline
- Company-wide quality index (first-pass yield, NCR rate)
- Safety record: LTI-free days, TRIR
- Resource utilization: overall manpower and equipment utilization
- Cash position: receivables, payables, bank balance summary

---

### 10.2 Project tracker
**Purpose:** Multi-project monitoring with health indicators.

**Project portfolio view:**
- All projects in single view: stage, % complete, budget health, schedule health
- Traffic light indicators: green (on track), amber (at risk), red (delayed/over-budget)
- Drill-down: click any project to see detailed status
- Filter by: status, project manager, client, vessel type, date range
- S-curve: planned vs actual progress overlay
- Milestone achievement tracker

---

### 10.3 Actual vs estimated
**Purpose:** Comprehensive variance analysis expanding on the original concept.

**Comparison metrics:**
- Cycle time: estimated vs actual days per project
- Inspection time: estimated vs actual days
- Total project hours: estimated vs actual
- Material cost: budgeted vs actual
- Labor cost: budgeted vs actual
- Overall project cost: budgeted vs actual
- Variance as % and absolute value
- Trend analysis: are we getting better at estimating?

**Benchmarking:**
- Compare across similar projects (same vessel type, size range)
- Rolling average of estimation accuracy
- Identify systematic biases (e.g., always underestimate welding hours by 15%)
- Feed learnings back to project estimation module

---

### 10.4 Production throughput
**Purpose:** Manufacturing output and efficiency analytics.

**Output metrics:**
- Vessels completed per month/quarter/year
- Tonnage fabricated per month
- Welding inches deposited per month
- Work center utilization by machine
- OEE (overall equipment effectiveness) trending
- Throughput by vessel type and size range

**Efficiency analysis:**
- Labor productivity: hours per ton of fabrication
- Welding productivity: inches per welder-shift
- Material utilization rate: consumed vs purchased (waste %)
- Capacity bottleneck identification
- Shift-wise productivity comparison

---

### 10.5 Quality metrics
**Purpose:** Quality performance trending and Pareto analysis.

**Quality KPIs:**
- First-pass yield rate by month (target: >95%)
- NCR count and severity trend
- Vendor rejection rate ranking
- NDE repair rate by project, welder, joint type
- Cost of poor quality (COPQ): scrap + rework + inspection delays
- Customer complaint count and resolution time

**Analysis tools:**
- Pareto chart: top defect types by frequency
- Pareto chart: top defect causes by cost impact
- Trend charts with control limits (SPC approach)
- Vendor quality comparison matrix
- Welder performance ranking

---

### 10.6 Resource utilization
**Purpose:** Manpower and equipment utilization heatmaps.

**Manpower:**
- Welder utilization: productive hours vs available hours per welder
- Fitter utilization: same metric
- Inspector utilization: inspections per day, turnaround time
- Overtime trend: total OT hours per department per month
- Absenteeism tracking
- Skill availability matrix: how many 6G welders are available next week?

**Equipment:**
- Machine utilization heatmap: by hour of day, by day of week
- Idle time analysis: why is machine sitting unused?
- Queue time: how long do jobs wait before a machine is available?
- Energy consumption per machine per month
- Maintenance downtime as % of available hours

---

### 10.7 Custom report builder
**Purpose:** Ad-hoc report creation with drag-and-drop fields.

**Report builder:**
- Drag-and-drop field selection from any module
- Filter and grouping options
- Chart type selection: bar, line, pie, table, pivot table
- Calculated fields: ratios, percentages, running totals
- Save report templates for recurring use
- Schedule report generation: daily, weekly, monthly auto-email
- Export to PDF, Excel, or PowerPoint

---

### 10.8 Export and scheduling
**Purpose:** Automated report distribution and data export.

**Distribution:**
- Email distribution lists per report
- Scheduled delivery: daily morning summary, weekly review pack, monthly management report
- Role-based visibility: each recipient sees only their authorized data
- Bulk export: all project data in structured Excel format for offline analysis
- API endpoint for integration with external BI tools (Power BI, Tableau)

---

## Cross-module integration map

| From → To | Data exchanged |
|-----------|---------------|
| Project mgmt → Procurement | Material requisitions with BOM items and required-by dates |
| Procurement → Stores | PO details for GRN matching, vendor and delivery info |
| Stores → QC | Inspection requests for quarantined material |
| QC → Stores | Clearance/rejection verdict, material status update |
| Stores → Production | Material issue against job card and BOM |
| Production → QC | In-process inspection calls at hold points |
| QC → Production | Hold/release decisions, NCR disposition |
| Production → Finance | Labor hours, material consumption, overhead allocation |
| Procurement → Finance | PO values, GRN for invoice matching, vendor payments |
| Finance → Project mgmt | Budget vs actual, cost alerts, billing status |
| All modules → Document mgmt | Reports, certificates, drawings — archived and version-controlled |
| Production → Maintenance | Equipment breakdown reports, utilization data |
| Maintenance → Production | Equipment availability, PM schedule blocking |
| QC → Maintenance | Calibration status for inspection instruments |
| HSE → Production | Permit status, welder qualification blocks |
| All modules → Analytics | Real-time data feed for KPIs and dashboards |
| All modules → Audit log | Every action logged with user ID, timestamp, IP |

---

*End of document*
