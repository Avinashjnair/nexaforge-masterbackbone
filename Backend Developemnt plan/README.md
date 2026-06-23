# NexaForge ERP — Project Hub

> **Status:** Phase 2 — Backend development  
> **Last updated:** 2026-05-04  
> **Claude Code project:** `D:\Claude Projects\ERP`

---

## Quick navigation

| Section | Description |
|---|---|
| [[00-Overview/Project-Status\|📊 Project status]] | Live status dashboard |
| [[00-Overview/Phase-Summary\|📋 Phase summary]] | Phase 1 done · Phase 2 plan |
| [[02-Phase2-Backend/Roadmap\|🗺 Phase 2 roadmap]] | 26-week delivery plan |
| [[04-Sprints/Sprint-Overview\|🏃 Sprint tracker]] | All 9 sprints with tasks |
| [[03-Architecture/System-Architecture\|🏗 Architecture]] | Tech stack & DB schema |
| [[05-Modules/Module-Registry\|📦 Module registry]] | All 11 modules status |
| [[06-Risks/Risk-Register\|⚠️ Risk register]] | Risks + mitigations |
| [[07-Decisions/Decision-Log\|📝 Decision log]] | Architecture decisions |

---

## Project at a glance

```
Phase 1 ████████████████████ 100% Complete
Phase 2 ██████████████████░░  90% In progress
```

**Phase 1 delivered:** 11 UI modules · 29 files · 676 KB frontend  
**Phase 2 builds:** PostgreSQL DB · Node.js API · Event bus · IIoT · Deployment

---

## How to use this vault with Claude Code

Claude Code can read and update every file in this vault. Common commands:

```bash
# Update sprint status
claude "Mark Sprint S-01 task 3 as complete in the sprint tracker"

# Add a decision record
claude "Log an architecture decision: we chose RabbitMQ over Redis Pub-Sub because..."

# Update a module status
claude "Update the QC module status to backend-connected in the module registry"

# Add a risk
claude "Add a new high risk: Oracle DB licensing — we need to evaluate cost impact"

# Generate code from a sprint
claude "Read Sprint S-01 and generate the PostgreSQL schema DDL for all tables listed"
```

---

## Tags used in this vault

`#status/planning` `#status/active` `#status/complete` `#status/blocked`  
`#priority/critical` `#priority/high` `#priority/medium` `#priority/low`  
`#module/production` `#module/qc` `#module/welding` `#module/finance`  
`#sprint/S-01` through `#sprint/S-09`  
`#risk/critical` `#risk/high` `#risk/medium` `#risk/low`  
`#decision/architecture` `#decision/technology` `#decision/process`

---

*This vault is designed to be updated by Claude Code. Every file follows a consistent structure so Claude can parse, update, and generate content programmatically.*
