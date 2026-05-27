# NexaForge ERP — Quick Reference: Welding Team

**Login:** `welder@nexaforge.com`  **Role:** `user`

---

## Key tasks

| Task | Where | Steps |
|---|---|---|
| View WPS list | Welding → WPS | All approved welding procedure specs |
| View your WPQ (qualifications) | Welding → WPQ | Your stamps, expiry dates, positions |
| Log a weld joint | Projects → open project → Weld Joints → Add Joint | Joint no., process, material, thickness, position |
| Update joint status | Weld Joints → select joint → Update Status | Pending → In Progress → NDE → Accepted / Rejected |
| Log NDE result | Weld Joints → select joint → Log NDE | Method (RT/UT/PT/MT), result (Accept/Reject) |
| View live machine data | IIoT → Machine Room | Live temperature, pressure, alerts |

---

## Weld joint status flow

```
Pending → In Progress → NDE Pending → Accepted ✓
                                    ↘ Rejected → (repair weld, re-NDE)
```

- **Accepted joints** appear in the MRB PDF automatically
- **Rejected joints** require a new NDE attempt — log as a separate NDE record

---

## WPS — what it tells you

| Field | Meaning |
|---|---|
| Process | GTAW / SMAW / FCAW / SAW |
| Base Metal | Material you are welding |
| Filler Metal | Wire / electrode to use |
| Position | Qualified positions (1G, 2G, 3G, 4G, 5G, 6G) |
| Standard | ASME IX / AWS D1.1 |

**Only use a WPS that covers your joint's material, thickness, and position.**

---

## WPQ expiry

Your WPQ expires if you have not welded in the qualifying process for **6 months**.  
The system will flag your card as **Expiring Soon** (90 days before) and **Expired**.  
Contact QC to arrange a re-qualification test before your card expires.

---

## Common issues

| Problem | Fix |
|---|---|
| Can't see a project in Weld Joints | Ask PM to add you to the project |
| WPQ showing as expired | Contact QC to arrange re-qual — you cannot weld on live jobs until renewed |
| NDE result not saving | Check joint is in "In Progress" or "NDE Pending" status first |
