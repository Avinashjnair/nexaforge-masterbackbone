---
tags: [resources, claude-code]
updated: 2025-05-03
---

# Claude Code Instructions

> This file tells Claude Code how to work with this vault. Keep it updated as conventions evolve.

## Vault location

```
D:\Claude Projects\ERP-Plan\   (Windows path)
/mnt/d/Claude Projects/ERP-Plan\   (WSL path)
```

## Conventions Claude Code must follow

### When updating status
- Use exact emoji: ⬜ Not started · 🔵 In progress · ✅ Complete · 🔴 Blocked
- Update `updated:` frontmatter date whenever a file is changed
- Never delete rows from tables — only update cells
- Add new rows at the bottom of tables

### When marking tasks complete
- Change `- [ ]` to `- [x]`
- Add a completion note below the task if relevant: `  > Completed 2025-05-15 — see commit abc123`

### When adding risks or decisions
- Follow the existing ADR / risk format exactly
- Increment the ID (ADR-004, R-11, etc.)
- Always include: Date, Status, Decision maker / Owner, Mitigation

### When generating code from sprint files
- Read the sprint file for context
- Generate code that matches the existing ERP codebase style
- Place generated files in `D:\Claude Projects\ERP\` not in this vault
- Update the sprint task to `[x]` after generating

## Common Claude Code commands for this project

### Status updates
```bash
# Mark a sprint task complete
claude "In S-01-Database-Auth.md, mark the task 'Write PostgreSQL DDL — projects table' as complete"

# Start a sprint
claude "Update Project-Status.md to set S-01 status to In Progress"

# Add a blocker
claude "Add a blocker to Project-Status.md: RabbitMQ version conflict with Node.js 22 — owner: Tech lead — sprint: S-02"
```

### Code generation
```bash
# Generate from sprint spec
claude "Read S-01-Database-Auth.md and generate the complete PostgreSQL DDL for all tables listed, saving to D:\Claude Projects\ERP\backend\migrations\"

# Generate API router
claude "Read S-02-Core-API.md and generate an Express.js router for the project entity API"

# Generate tests
claude "Read S-03-QC-Welding.md and generate Jest unit tests for the NCR state machine"
```

### Documentation
```bash
# Log a decision
claude "Add an ADR to Decision-Log.md for our decision to use node-cron over a dedicated job scheduler"

# Add a meeting note
claude "Create a meeting note in 08-Meetings/ for today's sprint review: S-01 is 60% complete, blocker on Redis connection pooling"

# Update architecture
claude "Update System-Architecture.md to add Sentry for error logging under the monitoring section"
```

## File naming conventions

- Sprint files: `S-0N-Short-Name.md`
- Meeting notes: `YYYY-MM-DD-Topic.md`
- Decision records: auto-incremented ADR-NNN in Decision-Log.md
- Risk records: auto-incremented R-NN in Risk-Register.md
