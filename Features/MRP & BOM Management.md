# MRP & BOM Management

**Description**: Planning and tracking the materials required for production based on the engineering design.

## Technical Flow
- **BOM Creation**: Derived from CAD/BOQ ingestion in the [[Marketing & CRM Module]].
- **Requirements Planning**: The MRP engine in the [[Production Module]] checks stock levels in the [[Store & Inventory Module]].
- **Procurement Trigger**: Shortages automatically generate **Purchase Requisitions (PR)** in the [[Procurement Module]].

## Key Concepts
- **BOM (Bill of Materials)**: The hierarchical list of parts.
- **Lead Time**: Time required for procurement and fabrication.
- **Stock Allocation**: Reserving material for specific projects.
