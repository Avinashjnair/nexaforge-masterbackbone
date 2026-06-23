# Material Traceability & Heat Numbers

**Description**: The process of tracking the pedigree of raw materials from the supplier's mill to the final weld joint.

## Data Flow
- **Input**: Received from [[Procurement Module]] via MTCs (Mill Test Certificates).
- **Automated Directory (NEW)**: Searchable database of common material grades (e.g., 316L, A36, S31803) with auto-specification matching (ASTM/ASME).
- **Storage**: Logged in [[Store & Inventory Module]] with unique Heat Numbers.
- **Verification**: Validated by [[Quality Control Module]] via the **IR-MAT** report.
- **Consumption**: Assigned to specific parts in [[Production Module]] and tracked in [[Fit-up Inspection Report (IR-FIT)]].
- **Final Output**: Compiled into the [[QC Dossier / MDR Builder]].

## Key Entities
- **MTC**: Mill Test Certificate.
- **Heat Number**: The unique identifier for a batch of metal.
- **Material Type**: Classification (Plate, Pipe, Flange, etc.) used for inventory and testing grouping.
- **Traceability Matrix**: The final report mapping materials to project components.

## Implementation
- Managed in [qc-reports.js](file:///d:/Claude%20Projects/ERP/Sprint%201/js/qc-reports.js) through the `MATERIAL_GRADES` and `MATERIAL_TYPES` constants.
