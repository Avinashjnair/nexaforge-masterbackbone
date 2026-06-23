# Marketing & CRM Module

**Purpose**: Pipeline management, client relationships, and quoting engine.

## Key Features
- **CRM Pipeline**: Kanban-based tracking of sales opportunities ([[Master Roadmap]]).
- **Quoting Engine**: Dynamic quote builder with material price indexing.
- **Tender Tracker**: Management of RFQs and bid deadlines.
- **BOQ Ingestion**: Automated extraction of Bill of Quantities from CAD files.
- **Client Database**: Detailed history of client interactions and project performance.

## Technical Components
- [marketing.js](file:///d:/Claude%20Projects/ERP/Sprint%201/js/marketing.js): Data store and main tab renderers.
- [marketing2.js](file:///d:/Claude%20Projects/ERP/Sprint%201/js/marketing2.js): Detail views, modals, and sub-tab logic.
- [marketing.css](file:///d:/Claude%20Projects/ERP/Sprint%201/css/marketing.css): Styling for Kanban and quote tables.

## Links
- Part of [[Sprint 1 — Core Integration]]
- Feeds into [[Finance & Job Costing Module]] via won quotes.
- Initiates [[MRP & BOM Management]] via BOQ ingestion.
