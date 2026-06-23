---
tags: [sprint/S-04, status/complete, priority/high]
sprint: S-04
weeks: 9–11
status: complete
updated: 2026-05-03
---

# S-04 — CRM / Finance / HR APIs

**Duration:** Weeks 9–11  
**Status:** ✅ Complete  
**Depends on:** S-02 complete  
**Goal:** Revenue engine (CRM), financial accuracy (Finance), and people compliance (HR).

---

## Tasks

### CRM & Marketing API
- [x] GET `/opportunities` — pipeline with stage filter
- [x] POST `/opportunities` — create opportunity with stage
- [x] PATCH `/opportunities/:id/stage` — advance/change stage
- [x] POST `/opportunities/:id/won` — convert to project entity (fires S-02 project creation)
- [x] POST `/quotes` — create quote linked to opportunity
- [x] GET `/quotes/:id/lines` — quote line items
- [x] POST `/quotes/:id/lines` — add line item
- [x] PATCH `/quote-lines/:id` — update qty, unit cost, markup
- [x] GET `/clients` — client database
- [x] POST `/clients` — add client
- [x] POST `/activities` — log CRM activity (call, email, site visit)
- [x] GET `/tenders` — active tender list
- [x] POST `/tenders` — log new ITT/RFQ

### Finance API
- [x] GET `/projects/:id/job-cost` — full cost breakdown by category
- [x] POST `/job-cost-lines` — add actual cost entry
- [x] PATCH `/job-cost-lines/:id` — update actual or committed
- [x] GET `/invoices` — AR ledger with status filter
- [x] POST `/invoices` — create invoice from milestone
- [x] PATCH `/invoices/:id/status` — paid, overdue, chase
- [x] GET `/accounts-payable` — AP ledger
- [x] PATCH `/ap/:id/pay` — mark AP invoice paid
- [x] GET `/projects/:id/milestones` — billing schedule
- [x] POST `/projects/:id/milestones` — add milestone
- [x] PATCH `/milestones/:id/invoice` — raise invoice for milestone
- [x] GET `/cash-flow` — monthly inflow/outflow aggregation

### HR API
- [x] GET `/employees` — full directory with cert status
- [x] POST `/employees` — add employee
- [x] GET `/employees/:id` — employee detail + qualifications
- [x] GET `/employees/:id/certs` — all certifications with expiry
- [x] POST `/hr-certs` — add certification record
- [x] PATCH `/hr-certs/:id/renew` — update with new expiry
- [x] GET `/training` — training records
- [x] POST `/training` — log training session
- [x] PATCH `/training/:id/complete` — mark complete with results
- [ ] GET `/shifts` — weekly shift schedule (S-07 frontend wiring deferred)
- [x] GET `/utilisation` — labour utilisation report

---

## Definition of done

- [ ] Opportunity → won → project creation works end-to-end
- [ ] Invoice created from milestone, status updates in AR ledger
- [ ] HR cert expiry triggers same alert system as WPQ (S-03 scheduler)
- [ ] Cash flow aggregation query performs < 300ms
- [ ] All endpoints covered in Postman collection

---

## Claude Code prompts for this sprint

```bash
# Generate quote builder calculation engine
claude "Generate a Node.js function that calculates quote totals (sell price, margin %, COPQ allocation) from quote lines in the database"

# Generate job costing engine
claude "Write a PostgreSQL query that calculates budget vs actual vs committed vs forecast cost variance per category for a given project_id"
```

---

## Related

- [[05-Modules/Finance-Module|Finance module spec]]
- [[05-Modules/Marketing-Module|Marketing & CRM module spec]]
