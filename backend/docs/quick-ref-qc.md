# NexaForge ERP — Quick Reference: QC Team

**Login:** `qc@nexaforge.com`  **Role:** `senior`

---

## Daily tasks

| Task | Where | Steps |
|---|---|---|
| Review open NCRs | Quality → NCR | Filter by status: Open / Under Review |
| Raise a new NCR | Quality → NCR → New NCR | Project + Title + Severity required |
| Move NCR status | Quality → open NCR → Change Status | See valid transitions below |
| Sign off ITP step | Projects → open project → ITP → click step → Sign Off | Enter outcome (Accept/Reject/Hold) + your name |
| Add ITP step | Projects → ITP → Add Step | Activity, hold type (W=Witness, H=Hold, R=Review) |
| Log weld inspection | Welding → Weld Joints → select joint → Update | NDE method + result |
| Generate MRB PDF | Projects → open project → Export MRB | PDF includes weld log, NCR list, ITP sign-offs |

---

## NCR status flow

```
Open → Under Review → Rework → Pending Closure → Closed
                    ↘ Accept As-Is → Closed
                    ↘ Reject → Closed
```

- **Closed is permanent** — you cannot reopen a closed NCR
- Only `senior` and above can change NCR status
- A `user` can raise (create) an NCR, not close it

---

## ITP hold types

| Code | Meaning | Effect |
|---|---|---|
| **H** | Hold Point | Work CANNOT proceed past this step without QC sign-off |
| **W** | Witness Point | QC should witness — work can proceed if QC not available (notify first) |
| **R** | Review | Document review only — no physical presence needed |

---

## Common issues

| Problem | Fix |
|---|---|
| Can't close NCR directly from Open | Must pass through Under Review first |
| ITP sign-off button greyed out | Previous H-point step must be signed off before this one |
| MRB PDF is blank | Weld joints need at least one accepted NDE result to appear |
