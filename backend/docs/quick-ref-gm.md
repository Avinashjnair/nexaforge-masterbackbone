# NexaForge ERP — Quick Reference: General Manager

**Login:** `gm@nexaforge.com`  **Role:** Full access (all modules)

---

## What you can do

| Task | Where | How |
|---|---|---|
| View overall project health | Dashboard | Loads on login — KPIs, pipeline, alerts |
| See all projects & statuses | Projects → list | Filter by status, phase, client |
| Advance a project phase | Projects → open project → Phase bar → click next phase | Requires manager role minimum |
| Approve NCRs / close them | Quality → NCR list → open NCR → change status | Disposition: Rework / Accept As-Is / Reject |
| Review job costs vs budget | Finance → select project → Job Cost | Gross margin % shown automatically |
| Create an invoice | Finance → Invoices → New Invoice | Link to project + milestone |
| View live machine data | IIoT → Machine Room | WebSocket feed — updates live |
| Generate MRB PDF | Projects → open project → Export MRB | Downloads PDF with weld log & cert index |

---

## Key things to know

- **JWT session** — you are logged in for 15 minutes of inactivity, then auto-refreshed. You will only be asked to re-login if you close the browser or the refresh token (7 days) expires.
- **NCR closed = permanent** — closed NCRs cannot be reopened. Raise a new NCR if rework is needed again.
- **Phase advancement** — cannot skip phases. Must go 1 → 2 → 3 … in order.
- **Invoice → milestone** — marking an invoice "Paid" automatically marks the linked milestone as complete.

---

## If something looks wrong

1. Hard-refresh the page (Ctrl+Shift+R)
2. Check the top-right connection dot — grey = WebSocket disconnected (data may be stale)
3. Call IT support: ext 201
