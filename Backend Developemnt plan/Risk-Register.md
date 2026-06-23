---
tags: [risks, status/active]
updated: 2026-05-06
---

# Risk Register

| ID | Risk | Severity | Likelihood | Sprint | Status |
|---|---|---|---|---|---|
| R-01 | Legacy data migration from spreadsheets | Critical | High | S-01 | Open |
| R-02 | IIoT machine connectivity & protocol variance | High | Medium | S-06 | Open |
| R-03 | CAD file format inconsistency | High | Medium | S-05 | Open |
| R-04 | User adoption — shop-floor resistance | High | High | S-09 | Open |
| R-05 | RBAC misconfiguration exposing sensitive data | High | Low | S-01, S-08 | ✅ Mitigated |
| R-06 | API performance under concurrent users | Medium | Medium | S-08 | Open |
| R-07 | Third-party API reliability (labs, accounting) | Medium | Medium | S-05 | Open |
| R-08 | Scope creep from stakeholder requests | Medium | High | All | Open |
| R-09 | Regulatory standard drift (ASME/API updates) | Low | Medium | S-03 | Open |
| R-10 | Single developer bottleneck | Low | High | All | Open |

---

## R-01 — Legacy data migration
**Severity:** Critical | **Status:** Open

**Mitigation:**
- Data audit before schema design (week 1)
- Migration scripts with validation checkpoints
- Parallel-run period: old + new system simultaneously for 4 weeks
- Department managers validate their data before cutover

---

## R-02 — IIoT machine connectivity
**Severity:** High | **Status:** Open

**Mitigation:**
- Decouple IIoT as optional module (system works without it)
- MQTT broker with retry queues and circuit breakers
- Mock MQTT publisher for dev/testing without hardware
- Graceful degradation: manual entry fallback always available

---

## R-04 — User adoption
**Severity:** High | **Status:** Open

**Mitigation:**
- Role-specific UX designed for task, not job title
- Large-format tablet interfaces for shop-floor bays
- Champion-led rollout: one enthusiastic user per department
- 6-dept training programme with laminated quick-reference cards

---

## R-05 — RBAC misconfiguration
**Severity:** High | **Status:** ✅ Mitigated (2026-05-06)

**Mitigation:**
- Row-level security in PostgreSQL (DB enforces, not just API layer)
- OWASP pentest in S-08 before go-live
- Principle of least privilege from day one in S-01
- Quarterly access review process documented
- **`requireDepartment` middleware applied to all 20+ dept-specific route groups in `app.js`** — server enforces dept isolation independent of frontend UI (ADR-006)
- **Refresh token moved to `HttpOnly` cookie** — XSS cannot steal session tokens (ADR-005 rev.)
- **Client-side `DEPT_ACCOUNTS` auth bypass removed** — all logins go through backend JWT
- **Cypress 8×7 dept isolation matrix** (`06-dept-isolation.cy.js`) — catches regression automatically
- **123/123 integration tests passing** including dept claim in every JWT fixture

---

## Add a risk with Claude Code

```bash
claude "Add a new high risk to Risk-Register.md: Cloud cost overrun — TimescaleDB storage growing faster than budgeted. Owner: Tech lead. Sprint impact: S-06. Mitigation: set retention policy 90 days, monitor weekly."
```
