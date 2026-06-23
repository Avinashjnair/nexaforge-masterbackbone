---
tags: [decisions, architecture]
updated: 2025-05-03
---

# Architecture Decision Log

> One ADR per significant decision. Format: context → decision → alternatives → consequences.

---

## ADR-001 — PostgreSQL over MongoDB

**Date:** 2025-05-03 | **Status:** Decided | **Decision maker:** Tech lead

**Context:** Financial data (invoices, job costs) requires ACID compliance. Complex relational joins (project → BOM → routing → QC). Row-level security needed for RBAC.

**Decision:** PostgreSQL 16 with TimescaleDB extension for IIoT time-series.

**Alternatives rejected:**
- MongoDB: no ACID transactions for financial records
- MySQL: weaker JSONB support, no TimescaleDB

**Consequences:** TimescaleDB avoids a separate InfluxDB service. Slight ops complexity.

---

## ADR-002 — RabbitMQ over Redis Pub-Sub

**Date:** 2025-05-03 | **Status:** Decided | **Decision maker:** Tech lead

**Context:** The spec requires durable events — NCR raised, GRN received — that must not be lost if a subscriber is temporarily offline.

**Decision:** RabbitMQ with topic-based routing and durable queues.

**Alternatives rejected:**
- Redis Pub-Sub: fire-and-forget, no durability
- Kafka: overkill for SME scale, steep operational overhead

**Consequences:** RabbitMQ management UI gives queue visibility. Basic training needed for ops.

---

## ADR-003 — Vanilla JS frontend (pending decision)

**Date:** 2025-05-03 | **Status:** PENDING — decide before S-07

**Context:** Completed frontend is 676KB vanilla HTML/CSS/JS. Migrating to React simplifies S-07 API wiring but adds 3–4 weeks rebuild time.

**Options:**
1. **Keep vanilla JS** — wire Axios calls into existing modules. Fast short-term. Accumulates tech debt.
2. **Migrate to React** — rebuild in React, co-locate API calls. Cleaner long-term. +4 weeks.
3. **Partial** — keep vanilla for stable modules, React for new features. Hybrid complexity.

**Decision:** TBD by GM before Sprint S-07

---

## Add a decision with Claude Code

```bash
claude "Add ADR-004 to Decision-Log.md: we chose Mosquitto over HiveMQ for MQTT because Mosquitto is open source, zero licensing cost, and sufficient for single-facility IIoT scale at < 10 machines"
```

---

## ADR-004 — Strict department isolation (UAT-driven RBAC redesign)

**Date:** 2026-05-04 | **Status:** Decided | **Source:** UAT feedback

**Context:** UAT revealed that all authenticated users could navigate to any module in the sidebar. A welder could open the Finance module. The original RBAC (S-01) protected API endpoints but not frontend routing. Users found this confusing and raised it as a trust and confidentiality issue.

**Decision:** Implement strict department isolation at both the frontend (sidebar generation) and backend (route guards). Each logged-in user has a `department` attribute. The sidebar is dynamically generated server-side. Direct URL access to another department's route returns 403. The GM is the only role exempt — they retain universal view access.

**Alternatives rejected:**
- "Honour system" (just hide buttons, don't block routes): rejected — trivially bypassed, not compliant
- Full React migration to implement per-role routing: rejected — too disruptive while Phase 2 is still finishing; implement as progressive enhancement on vanilla JS

**Consequences:** Requires a new `GET /me/permissions` endpoint. Sidebar must be rebuilt as a server-driven component. Adds 1 sprint to Phase 3 but resolves the biggest single trust issue from UAT.

---

## ADR-005 — Project comments as the exception to dept isolation

**Date:** 2026-05-04 | **Status:** Decided | **Source:** UAT feedback

**Context:** UAT Marketing spec requires cross-departmental Q&A on projects. This conflicts with ARCH-01 (dept isolation). A welder needing to ask Marketing a clarification about a drawing spec has no channel within the ERP — they call or email outside the system.

**Decision:** Project comment threads are the single intentional breach of department isolation. All users with any access to a project (determined by their department's involvement in that project) may read and write to that project's comment thread. Comment authors are identified with their department badge. Mentions (`@engineer`) send a WebSocket push notification to the mentioned user regardless of department.

**Consequences:** `project_comments` table is a new entity. Comments are accessible via the project detail view which all departments can reach. This does NOT mean departments can see each other's dashboards — only the shared project context.

