# NexaForge ERP — Quick Reference: HR Team

**Login:** your work email  **Role:** `manager`

---

## Key tasks

| Task | Where | Steps |
|---|---|---|
| View all employees | HR → Employees | List with department, position, status |
| Add new employee | HR → Employees → New Employee | Fill name, employee no., department, hire date |
| View employee detail | HR → Employees → click name | Profile, qualifications, training history |
| Log a training record | HR → employee → Training → Add Record | Course name, date, expiry (if applicable) |
| Check cert / WPQ expiry | HR → Employees → filter by "Expiring Soon" | Red = expired, amber = expiring within 90 days |
| View shift schedule | HR → Workforce | Calendar view of shifts |
| Update employee status | HR → employee → Edit → Status | Active / On Leave / Terminated |

---

## WPQ expiry alerts

The system automatically flags welder qualifications:

| Badge | Meaning | Action |
|---|---|---|
| 🔴 Expired | WPQ expiry date has passed | Welder must NOT weld on live jobs — arrange re-qual immediately |
| 🟡 Expiring Soon | Expiry within 90 days | Schedule re-qualification test before expiry |
| ✅ Active | Valid | No action needed |

WPQ status is updated nightly by the scheduler. If a card is wrong, check the `expiry_date` in the employee's WPQ record.

---

## Adding a new employee — required fields

| Field | Notes |
|---|---|
| Employee No. | Format: EMP-XXX or WLD-XXX for welders |
| Full Name | As per passport / Emirates ID |
| Department | Production / QC / Finance / HR / Store / Management |
| Position | Job title |
| Hire Date | DD/MM/YYYY |
| Nationality | Required for labour reporting |
| Email | Must match their system login email |

---

## Common issues

| Problem | Fix |
|---|---|
| Employee cannot log in | Check their `email` in the employee record matches their user account |
| WPQ not showing on employee profile | WPQ must be linked via `employee_id` — check the WPQ record directly |
| Training record not saving | Expiry date must be in the future if entered |
| Wrong department showing | Edit employee → update Department field |
