# NexaForge ERP — Quick Reference: Store / Inventory Team

**Login:** your work email  **Role:** `senior`

---

## Key tasks

| Task | Where | Steps |
|---|---|---|
| Log a GRN (goods received) | Store → Inventory → New GRN | Item, qty, unit, PO ref, received date |
| View current stock | Store → Inventory | List with qty on hand, unit, location |
| Set item to Quarantine | Inventory → select item → Status → Quarantine | Flags item; production cannot use it |
| Release quarantine to stock | Inventory → select item → Status → In Stock | Item becomes available to MRP |
| View pending Material Requests | Store → Material Requests | Shows MRs raised by Production |
| Issue materials against MR | Material Requests → open MR → Issue | Reduces stock qty |

---

## GRN workflow

1. Receive physical goods from supplier
2. Open **Store → New GRN**
3. Enter: item description, quantity, unit (sheet / kg / m / pcs), PO number
4. Set status to **Quarantine** if QC inspection needed
5. Once QC clears, update to **In Stock**
6. Stock is now visible to MRP

---

## Things to watch

- **Quarantine items** are excluded from MRP — production will see a shortage even if the stock exists
- **Issue against MR** — always issue via the Material Request so production knows materials are allocated
- Stock levels update in **real time** — if MRP still shows a shortage after GRN, check quarantine status

---

## Common issues

| Problem | Fix |
|---|---|
| MRP shows shortage but GRN was logged | Check item is not in Quarantine status |
| Duplicate item in inventory | Search before creating — use part number / description filter |
