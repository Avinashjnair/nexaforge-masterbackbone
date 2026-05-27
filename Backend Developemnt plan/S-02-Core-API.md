---
tags: [sprint/S-02, status/complete, priority/critical]
sprint: S-02
weeks: 3–6
status: complete
updated: 2026-05-04
---

# S-02 — Core Project & Production API

**Duration:** Weeks 3–6  
**Status:** ✅ Complete  
**Depends on:** S-01 complete  
**Goal:** The project entity and production module are the spine of the ERP. Everything else hangs off them.

---

## Tasks

### Project entity API
- [x] GET `/projects` — list with filters (status, phase, client)
- [x] POST `/projects` — create from CRM opportunity, set phase 1
- [x] GET `/projects/:id` — full project payload
- [x] PATCH `/projects/:id/phase` — advance phase, trigger event bus
- [x] PATCH `/projects/:id/status` — update status (active/hold/complete)
- [x] DELETE `/projects/:id` — soft delete only

### BOM management API
- [x] GET `/projects/:id/bom` — return full BOM tree (recursive CTE query)
- [x] POST `/projects/:id/bom` — add top-level assembly
- [x] POST `/bom-items/:id/children` — add child item to assembly
- [x] PATCH `/bom-items/:id` — update qty, material, part number
- [x] DELETE `/bom-items/:id` — remove item and all children
- [x] GET `/projects/:id/mrp` — MRP calculation (required vs on-hand)

### Work-centre & routing API
- [x] GET `/work-centres` — list all with current status and utilisation
- [x] GET `/projects/:id/routing` — routing steps in sequence
- [x] POST `/projects/:id/routing` — add routing step
- [x] PATCH `/routing-steps/:id/status` — start, complete, block step
- [x] POST `/material-requests` — raise RM from production

### Real event bus (replace UI toast simulations)
- [x] Set up RabbitMQ connection and channel pool
- [x] Publisher: emit `project.phase.changed` when phase advances
- [x] Publisher: emit `grn.received` when GRN is logged (S-03 — QC sprint)
- [x] Publisher: emit `ncr.raised` when NCR created
- [x] Publisher: emit `hold.point.triggered` when ITP H-point reached
- [x] Subscriber: QC module — listen for `project.phase.changed`
- [x] Subscriber: Store module — listen for `material.request.raised`
- [x] Subscriber: Finance — listen for `milestone.triggered`
- [x] WebSocket gateway — push events to connected browser clients

---

## Definition of done

- [x] All project CRUD endpoints returning correct data
- [x] BOM tree query performs < 200ms for 3-level deep tree
- [x] Phase change fires event bus message (verify in RabbitMQ management UI)
- [x] WebSocket client in browser receives event within 500ms
- [x] Postman collection for all S-02 endpoints committed
- [x] Unit tests for MRP calculation logic

---

## Claude Code prompts for this sprint

```bash
# Generate the project router
claude "Generate an Express.js router for /projects with all CRUD endpoints, using Knex.js for DB queries, following the S-02 spec"

# Generate BOM recursive query
claude "Write a PostgreSQL recursive CTE query that returns a full BOM tree for a given project_id from the bom_items table"

# Set up RabbitMQ event bus
claude "Generate a RabbitMQ publisher/subscriber module in Node.js for the NexaForge ERP event bus with the topics listed in S-02"
```

---

## Related

- [[05-Modules/Production-Module|Production module spec]]
- [[03-Architecture/API-Design|API design patterns]]
- [[03-Architecture/Event-Bus|Event bus design]]
