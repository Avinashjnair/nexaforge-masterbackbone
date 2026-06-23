# Welding & WPS Module

**Purpose**: Ensuring technical compliance and traceability for heavy fabrication.

## Key Features
- **WPS Library**: Central repository of approved Welding Procedure Specifications.
- **PQR Tracking**: Linkage between procedures and qualification records.
- **Weld Register**: Real-time status of every joint in a project.
- **IIoT Telemetry**: Live monitoring of welding machine parameters (Current, Voltage, Heat Input).

## Technical Components
- [welding.js](file:///d:/Claude%20Projects/ERP/Sprint%201/js/welding.js): Procedure data and joint register logic.
- [welding2.js](file:///d:/Claude%20Projects/ERP/Sprint%201/js/welding2.js): Live telemetry UI and detail views.
- [welding.css](file:///d:/Claude%20Projects/ERP/Sprint%201/css/welding.css): Module-specific styling.

## Links
- Part of [[Sprint 1 — Core Integration]]
- Validates [[Welder Passport & WPQ]] against approved procedures.
- Feeds live data to [[OEE (Overall Equipment Effectiveness)]] in Analytics.
