# Quality Control Module

**Purpose**: Ensuring product integrity and compliance with engineering standards (ASME, API).

## Key Features
- **Digital ITP**: Interactive Inspection and Test Plans.
- **Inspection Reporting System (NEW)**: Comprehensive suite of 8 unique report types:
    - **Incoming (IR-MAT)**: Searchable material grade directory & specification matching.
    - **Dimensional (IR-DIM)**: Precision survey with ovality/linear checks & photo attachments.
    - **Fabrication (IR-FIT, IR-VT)**: Joint identification, WPS traceability, and welder stamp linking.
    - **NDT Suite (RT, UT, MT, PT)**: Technical examination records with dual attachment support (Photos + Certificates).
    - **Pressure Testing (IR-HT)**: Hydrostatic test documentation with gauge/calibration tracking.
- **QC Dossier / MDR Builder**: Automated compilation of project-specific technical reports into a single handover package.
- **NCR Workflow**: Tracking and resolution of Non-Conformance Reports.

## Technical Components
- [qc-reports.js](file:///d:/Claude%20Projects/ERP/Sprint%201/js/qc-reports.js): Central controller for report registry, interactive forms, and MDR building logic.
- [qc-reports.css](file:///d:/Claude%20Projects/ERP/Sprint%201/css/qc-reports.css): Print-optimized styling and glassmorphism UI for inspection forms.
- [quality.js](file:///d:/Claude%20Projects/ERP/Sprint%201/js/quality.js): ITP and NCR data management.
- [app.js](file:///d:/Claude%20Projects/ERP/Sprint%201/js/app.js): Routing and sidebar integration for QC modules.

## Links
- Part of [[Sprint 1 — Core Integration]]
- Integrated with [[Welding & WPS Module]] for joint inspection.
- Crucial for [[Analytics & KPI Module]] via [[COPQ (Cost of Poor Quality)]] tracking.
- Manages [[Non-Conformance Reports (NCR)]].
- Validates [[Material Traceability & Heat Numbers]].
- Feeds into [[Project Handover & MDR]].
