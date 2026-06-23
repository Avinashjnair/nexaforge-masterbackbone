# Production Module

**Purpose**: Core manufacturing operations, scheduling, and resource management.

## Key Features
- **BOM Management**: Handling of complex Bill of Materials for engineering projects.
- **Shop Floor Scheduling**: Task allocation and progress tracking.
- **MRP Engine**: Material Requirements Planning linked to inventory.
- **MES Integration**: Manufacturing Execution System for real-time progress updates.

## Technical Components
- [production.js](file:///d:/Claude%20Projects/ERP/Sprint%201/js/production.js): Main production logic and scheduling algorithms.
- [production.css](file:///d:/Claude%20Projects/ERP/Sprint%201/css/production.css): Styling for Gantt charts and task boards.

## Links
- Part of [[Sprint 1 — Core Integration]]
- Consumes materials from [[Store & Inventory Module]].
- Performance tracked in [[Analytics & KPI Module]] via [[OEE (Overall Equipment Effectiveness)]].
- Governed by [[MRP & BOM Management]].
- Quality validated via [[Non-Conformance Reports (NCR)]].
