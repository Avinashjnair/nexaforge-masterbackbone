# NexaForge ERP — Quick Reference: Marketing & CRM Team

**Login:** your work email  **Role:** `manager`

---

## Key tasks

| Task | Where | Steps |
|---|---|---|
| View pipeline | Marketing → CRM | Kanban-style pipeline by stage |
| Add new client | Marketing → Clients → New Client | Name, industry, country, tier (A/B/C) |
| Create opportunity | Marketing → Opportunities → New | Client, title, estimated value, stage, close date |
| Move opportunity stage | Opportunities → open opportunity → change Stage | See stage flow below |
| Create a quote | Marketing → Quotes → New Quote | Link to opportunity, enter line items + total |
| Mark opportunity Won | Opportunity → Stage → Won | Creates a link ready to convert to project |
| Convert to project | Won opportunity → Create Project | Opens project creation form pre-filled |
| View tender pipeline | Marketing → Analytics | Win rate, pipeline value by stage |

---

## Opportunity stage flow

```
Lead → Prospect → Qualified → Proposal → Negotiation → Won ✓
                                                       ↘ Lost ✗
```

- Moving to **Won** does not automatically create a project — you must click **Create Project** on the won opportunity
- Moving to **Lost** archives the opportunity (still visible in filters)
- Probability % is suggested per stage but can be overridden

---

## Client tiers

| Tier | Meaning |
|---|---|
| A | Strategic — major recurring revenue |
| B | Established — regular business |
| C | New / occasional |

Tier affects priority flagging in the pipeline view.

---

## Creating a quote

1. Go to **Marketing → Quotes → New Quote**
2. Select the linked opportunity
3. Enter quote title and valid-until date
4. Enter total amount (line item detail can be in notes)
5. Click **Save** — quote is linked to the opportunity
6. When client accepts: go back to opportunity → mark **Won**

---

## Common issues

| Problem | Fix |
|---|---|
| Can't find a client | Use the search bar — clients are searchable by name, short code, or country |
| Opportunity not appearing in pipeline | Check stage — Lost opportunities are hidden by default. Use "Show All" filter |
| Quote total not matching | Quote amount is manually entered — update it if scope changes |
| Create Project button not visible | Opportunity must be in **Won** stage first |
