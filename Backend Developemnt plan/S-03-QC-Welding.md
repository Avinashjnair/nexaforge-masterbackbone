---
tags: [sprint/S-03, status/complete, priority/critical]
sprint: S-03
weeks: 6–9
status: complete
updated: 2026-05-03
---

# S-03 — QC & Welding Engine

**Duration:** Weeks 6–9  
**Status:** ✅ Complete  
**Depends on:** S-02 complete  
**Goal:** The QC and welding modules carry compliance weight — ASME IX, API 650. The logic must be exact.

---

## Tasks

### ITP (Inspection & Test Plan) API
- [x] GET `/projects/:id/itp` — all ITP steps with status
- [x] POST `/projects/:id/itp` — add ITP step with hold type (H/W/R)
- [x] POST `/itp-steps/:id/signoff` — sign off step (pass/fail + inspector)
- [x] GET `/itp-steps/:id` — single step detail
- [x] Business rule: H (hard hold) blocks next step until cleared
- [x] Event: emit `itp.hold.triggered` on H-point failure

### NCR lifecycle API
- [x] POST `/ncr` — raise NCR (severity, area, project, drawing ref)
- [x] GET `/ncr` — list with filters (project, status, severity)
- [x] GET `/ncr/:id` — full NCR with activity log
- [x] PATCH `/ncr/:id/disposition` — record disposition
- [x] PATCH `/ncr/:id/status` — advance: raised → review → disposition → closed
- [x] POST `/ncr/:id/comments` — add activity log entry
- [x] Event: emit `ncr.raised` and `ncr.closed`

### Incoming inspection API
- [x] POST `/inspections` — create inspection record from GRN
- [x] GET `/inspections` — list pending inspections
- [x] PATCH `/inspections/:id/checks/:checkId` — mark individual check done (S-13 expansion)
- [x] POST `/inspections/:id/result` — log pass/fail + trigger quarantine if fail

### WPS / PQR / WPQ API (welding)
- [x] GET `/wps` — list all WPS with status
- [x] POST `/wps` — create new WPS (all parameters)
- [x] GET `/wps/:ref` — full WPS detail
- [x] PATCH `/wps/:ref/approve` — approve WPS, log approver
- [x] GET `/pqr` — list all PQR records
- [x] POST `/pqr` — create PQR linked to WPS
- [x] GET `/wpq/:welder_id` — all qualifications for a welder
- [x] POST `/wpq` — add WPQ qualification
- [x] Scheduler: daily job — flag WPQ within 90 days of expiry → alert

### Weld joint register & NDE
- [x] GET `/projects/:id/weld-joints` — all joints with status
- [x] POST `/projects/:id/weld-joints` — add joint, assign WPS
- [x] PATCH `/weld-joints/:id/welder` — assign welder stamp
- [x] PATCH `/weld-joints/:id/status` — update status
- [x] POST `/nde-records` — log NDE result (accept/reject)
- [x] Business rule: Reject → auto-raise NCR
- [x] GET `/projects/:id/mrb` — compile MRB document list

---

## Definition of done

- [x] H-point enforcement blocks routing step advance (tested)
- [x] NCR state machine follows defined workflow (no skip states)
- [x] WPQ expiry scheduler runs and creates alerts
- [x] NDE reject auto-creates NCR (verified end-to-end)
- [x] MRB endpoint returns correct document list for P-2401 seed data
- [x] Integration tests for all state machines

---

## Claude Code prompts for this sprint

```bash
# Generate ITP state machine
claude "Generate a Node.js state machine for the ITP hold point workflow in S-03, with H-point enforcement that blocks phase advancement"

# Generate WPQ scheduler
claude "Write a Node.js cron job using node-cron that queries the wpq table daily and creates alerts for certifications expiring within 90 days"

# Generate NCR workflow
claude "Generate an Express.js router for the NCR lifecycle API in S-03 with state machine validation"
```

---

## Related

- [[05-Modules/QC-Module|QC module spec]]
- [[05-Modules/Welding-Module|Welding module spec]]
