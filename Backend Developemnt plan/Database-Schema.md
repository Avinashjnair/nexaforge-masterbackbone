---
tags: [architecture, database, status/planning]
updated: 2025-05-03
---

# Database Schema

Full DDL to be generated in S-01. This file is the design spec.

## Key entities (45 tables)

| Table | Key | Description |
|---|---|---|
| `projects` | UUID | Central entity. Every module links here. |
| `bom_items` | UUID | Self-referential (parent_id). Multi-level BOM tree. |
| `work_centres` | UUID | Physical production areas |
| `routing_steps` | UUID | Ordered steps per project |
| `material_requests` | UUID | RM requests from production |
| `itp_steps` | UUID | Per-project ITP with hold type (H/W/R) |
| `itp_sign_offs` | UUID | Sign-off records per ITP step |
| `ncrs` | UUID | Non-conformance reports |
| `ncr_comments` | UUID | Activity log per NCR |
| `wps` | UUID | Welding procedure specifications |
| `pqr` | UUID | Procedure qualification records |
| `wpq` | UUID | Welder performance qualifications |
| `weld_joints` | UUID | Joint register per project |
| `nde_records` | UUID | NDE results per joint |
| `consumable_lots` | UUID | Welding consumable heat traceability |
| `opportunities` | UUID | CRM pipeline |
| `quotes` | UUID | Quote per opportunity |
| `quote_lines` | UUID | Line items per quote |
| `clients` | UUID | Client database |
| `crm_activities` | UUID | Call/email/meeting log |
| `purchase_orders` | UUID | PO per project |
| `grn` | UUID | Goods received notes |
| `inventory_items` | UUID | Stock items with heat numbers |
| `invoices` | UUID | AR invoices |
| `ap_invoices` | UUID | AP vendor invoices |
| `milestones` | UUID | Billing milestones per project |
| `job_cost_lines` | UUID | Cost entries per project |
| `employees` | UUID | HR directory |
| `hr_certs` | UUID | Certifications with expiry |
| `training_records` | UUID | Training sessions and results |
| `iiot_readings` | TIMESTAMPTZ | TimescaleDB hypertable (machine telemetry) |
| `audit_log` | BIGSERIAL | Every mutation: who, what, when |
| `files` | UUID | File metadata (bytes in S3/MinIO) |
| `users` | UUID | System users linked to employees |

## Critical design patterns

### BOM tree — self-referential
```sql
CREATE TABLE bom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  parent_id UUID REFERENCES bom_items(id), -- NULL = top-level assembly
  pn VARCHAR(100),
  description TEXT NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  unit VARCHAR(20),
  material VARCHAR(100),
  item_type VARCHAR(20) CHECK (item_type IN ('assembly','part','material')),
  stock_status VARCHAR(20) DEFAULT 'unknown'
);
```

### IIoT time-series — TimescaleDB
```sql
CREATE TABLE iiot_readings (
  time TIMESTAMPTZ NOT NULL,
  machine_id UUID NOT NULL,
  joint_id UUID REFERENCES weld_joints(id),
  current_a DECIMAL(6,2),
  voltage_v DECIMAL(5,2),
  heat_input_kj_mm DECIMAL(6,3),
  interpass_temp_c DECIMAL(5,1)
);
SELECT create_hypertable('iiot_readings', 'time');
```

### Audit log — append only
```sql
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- REVOKE UPDATE, DELETE ON audit_log FROM api_user;
```

## Claude Code command to generate DDL

```bash
claude "Read Database-Schema.md and generate complete PostgreSQL 16 DDL with all constraints, indexes, and TimescaleDB hypertable configuration"
```
