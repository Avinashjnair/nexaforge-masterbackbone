# NexaForge ERP — Quick Reference: Finance Team

**Login:** your work email  **Role:** `manager`

---

## Key tasks

| Task | Where | Steps |
|---|---|---|
| Review job costs | Finance → select project → Job Cost | Budget vs Actual vs Forecast + margin % |
| Add a cost line | Finance → Job Cost → Add Line | Type: Material / Labour / Overhead / Subcontract |
| View AR invoices | Finance → Invoices | Filter by status: Draft / Sent / Paid / Overdue |
| Create invoice | Finance → Invoices → New Invoice | Link to project + milestone + enter amount |
| Mark invoice sent | Invoices → open invoice → Status → Sent | Sends date is recorded |
| Mark invoice paid | Invoices → open invoice → Status → Paid | Enter paid amount + paid date |

---

## Invoice lifecycle

```
Draft → Sent → Partially Paid → Paid
             ↘ Overdue (auto-flagged when due_date passes)
             ↘ Cancelled
```

---

## Gross margin formula

```
Contract Value − Forecast Cost = Gross Margin
Gross Margin ÷ Contract Value × 100 = Margin %
```

The system calculates this automatically from your cost lines. **Forecast** uses `actual_amount` if entered, otherwise `budgeted_amount`.

---

## Common issues

| Problem | Fix |
|---|---|
| Invoice not linked to milestone | Edit invoice → set milestone_id — milestone will move to "invoiced" |
| Margin % showing 0% | No contract value set on the project — ask PM to update it |
| Can't create invoice (403 error) | Your account needs `manager` role — contact admin |
