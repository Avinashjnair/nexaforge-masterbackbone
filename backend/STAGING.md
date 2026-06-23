# Staging Environment & Test Execution Guide

## Prerequisites

- Docker Desktop running
- Node.js 22 installed locally (for Cypress)

---

## 1. Boot staging

```bash
npm run staging:up
```

This runs `docker compose -f docker-compose.yml -f docker-compose.staging.yml up --build -d`.

On first boot the API container will:
1. Run all Knex migrations against PostgreSQL
2. Seed the database (3 projects, 4 users, 3 clients, 2 WPS)
3. Start the Express API on port 3000

Watch logs until the API is ready:

```bash
npm run staging:logs
# Look for: "NexaForge API listening on port 3000"
```

**Seeded credentials** (all passwords: `Password123!`):

| Email | Role |
|---|---|
| gm@nexaforge.com | gm |
| pm@nexaforge.com | manager |
| qc@nexaforge.com | senior |
| welder@nexaforge.com | user |

---

## 2. Run Jest unit + integration tests

These mock the DB and run without staging:

```bash
npm test
# 114 tests, ~7s
```

---

## 3. Run Cypress E2E tests

Requires staging to be up and healthy (step 1):

```bash
npm run e2e
# Runs all 5 specs in cypress/e2e/ against http://localhost:3000
```

Open interactive runner:

```bash
npm run e2e:open
```

**Specs:**

| File | Workflow |
|---|---|
| `01-new-project.cy.js` | Create project → advance phase → add BOM item |
| `02-quote-to-project.cy.js` | Client → opportunity → quote → won → project |
| `03-ncr-workflow.cy.js` | NCR full lifecycle: open → under_review → rework → re-inspect → accepted → closed, 422 on reopen |
| `04-weld-joint.cy.js` | Weld joint → NDE accepted → MRB PDF reachable |
| `05-invoice-lifecycle.cy.js` | Milestone → invoice → paid → AR ledger verified |
| `06-dept-isolation.cy.js` | Cross-dept 403 matrix (8×8), unauthenticated 401, GM bypass |
| `07-mrp-replenishment.cy.js` | BOM item → MRP report → replenish trigger → idempotency → 403 wrong dept |

---

## 4. Run k6 load test

Requires [k6 installed](https://k6.io/docs/get-started/installation/) and staging up:

```bash
npm run load:test
# or against staging server:
npm run load:test:staging
```

Thresholds: P95 < 500ms reads, P95 < 1000ms writes, error rate < 1%.  
Covers: projects, NCR, WPS, machines, dashboard, material-requests, finance, MRP endpoints at 50 VUs.

---

## 5. Tear down

```bash
npm run staging:down
```

Add `-v` to also delete volumes (wipes the database):

```bash
docker compose -f docker-compose.yml -f docker-compose.staging.yml down -v
```
