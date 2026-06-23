# Sprint S-12: Production Operations

## Status
- **Phase**: 3
- **Sprint**: S-12
- **Objective**: Enhance production execution with shop-floor logging and scheduling.
- **Estimated Completion**: 2025-05-25

## Backlog Items (UAT Phase 3)

### NEW-01: Labour Hour Logging
- **Requirement**: Implement granular labour logging linked to production tasks.
- **Scope**:
    - Database schema for `labour_hours`.
    - UI widget in Production Control Centre.
    - Modal for operator-level entry.
    - Integration with Finance/HR (MFE event signals).

### NEW-02: Daily/Weekly Scheduling Grid
- **Requirement**: Provide a visual grid for task/employee assignment.
- **Scope**:
    - Week-view sub-page in Production module.
    - Employee/Station row allocation.
    - Conflict detection (over-allocation warnings).
    - Drag-and-drop task assignment.

### NEW-03: Deviation Request Workflow
- **Requirement**: Formalise the process for shop-floor deviations.
- **Scope**:
    - Deviation request form (Production side).
    - Workflow tracking (Pending -> QC Review -> GM Approval).
    - Event bus triggers (`deviation.requested`).

### NEW-09: Machine Downtime Logging
- **Requirement**: Real-time logging of downtime for IIoT/OEE metrics.
- **Scope**:
    - "Log Downtime" action on Asset cards.
    - Reason categorization (Mechanical, Electrical, Lack of Material).
    - OEE impact calculation baseline.

## Technical Tasks
- [ ] Create `ProdData` schema extensions.
- [ ] Implement `scheduler-grid` renderer.
- [ ] Implement Labour Log modal and KPI widget.
- [ ] Implement Deviation Request modal and registry.
- [ ] Add Downtime logging to Assets sub-page.
