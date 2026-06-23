# NexaForge ERP — Development Hub

Central index for the NexaForge ERP project. All modules complete through S-16. Active work is S-12 Production module feature expansion.

---

## Status & Planning
- [[Project-Status|Project Status Dashboard]]
- [[Module-Registry|Module Registry]]
- [[Decision-Log|Architecture Decision Log]]

## Architecture
- [[System-Architecture|System Architecture]]
- [[Database-Schema|Database Schema]]

## Sprint Docs
- [[S-01-Database-Auth|S-01 — Database & Auth]]
- [[S-02-Core-API|S-02 — Core API]]
- [[S-03-QC-Welding|S-03 — QC & Welding]]
- [[S-04-CRM-Finance-HR|S-04 — CRM, Finance & HR]]
- [[S-05-Files-Docs|S-05 — File Storage & Documents]]
- [[S-06-IIoT|S-06 — IIoT Telemetry]]
- [[S-07-Frontend-Wire|S-07 — Frontend Wiring]]
- [[S-08-Testing|S-08 — Testing & QA]]
- [[S-09-UAT-GoLive|S-09 — UAT & Go-Live]]
- [[S16-UI-Design-System|S-16 — UI Design System]]

## Reference
- [[Risk-Register|Risk Register]]
- [[Claude-Code-Instructions|Claude Code Instructions]]

---

## Current Sprint: S-12 — Production Module (ISA-95)

**Status:** 🔵 In progress — ~90%

### Completed features
- 13-item ISA-95 sidebar navigation (context-switching, replaces global ERP sidebar when in Production)
- MRF → Purchase Request pipeline (approve MRF auto-creates PR in `AppState.purchaseRequests`)
- URL hash state persistence (`#/production/<subpage>`) + browser back/forward support
- Alt+1–9 keyboard shortcuts for sidebar navigation within Production
- **Master Schedule Gantt** — CPM (Critical Path Method) calculation, critical path highlighting, slack/float bars
- New Schedule Builder modal — create schedules with task dependencies, CPM auto-calculated on save
- Gantt view switcher — Daily / Weekly / Monthly column modes
- Gantt zoom slider — smooth 0.4×–3× column width scaling with refined range input UI
- Blank scroll fix — dynamic column count ensures bars never extend into empty space

### Remaining
- MRP auto-replenishment trigger (low-stock → RFQ)
- Quality Gates → auto-NCR generation on fail
- Full E2E test coverage for Production sub-pages

---

*Updated: 2026-05-10*
