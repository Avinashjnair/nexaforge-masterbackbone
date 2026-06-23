---
tags: [frontend, design-system, status/complete, s16]
updated: 2026-05-10
---

# S-16 — UI Design System

> **Status:** ✅ Complete

---

## Key files

| File | Purpose |
|---|---|
| `Sprint 1/css/s16-design.css` | Dept colours, glassmorphism, animations, drag-reorder, transitions |
| `Sprint 1/css/main.css` | Base reset, typography, layout |
| `Sprint 1/css/bento-theme.css` | Bento grid layout additions |
| `Sprint 1/js/s16-ui.js` | Count-up, drag-reorder, sparkline utilities — exposes `window.S16` |

---

## CSS classes

| Class | Purpose |
|---|---|
| `.metric-card--glass` | Glassmorphism KPI card |
| `.metric-card--hero` | Larger hero variant |
| `.widget-grid` / `.widget-card` | Drag-reorderable dashboard layout |
| `.widget-drag-handle` | Drag handle within a widget card |
| `.dept-badge` | Topbar dept identity pill |
| `.section-heading` | Left-border heading with dept colour |
| `.stagger-in` | Staggered card entrance animation |
| `.chart-line-draw` / `.chart-bar-rise` / `.sparkline-animate` | Chart animation hooks |
| `.card--glass` | Glass card variant |
| `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-sm` | Button system |
| `.badge-green`, `.badge-amber`, `.badge-red`, `.badge-blue` | Status badges |

---

## Dept colour palette (`s16-design.css` is authoritative)

| Dept | `data-dept` | Accent |
|---|---|---|
| GM | `gm` | `#e8622a` Steel orange |
| Production | `production` | `#f97316` Forge amber |
| Quality Control | `qc` | `#14b8a6` Teal |
| Marketing | `marketing` | `#8b5cf6` Violet |
| Procurement | `procurement` | `#84cc16` Lime |
| Store | `store` | `#06b6d4` Cyan |
| Finance | `finance` | `#f59e0b` Gold |
| HR | `hr` | `#f43f5e` Rose |
| Welding | `welding` | `#3b82f6` Blue |
| Analytics | `analytics` | `#6366f1` Indigo |

> `me.js` `DEPT_COLOURS` uses different hex values (legacy). CSS scopes in `s16-design.css` override them when navigating pages.

---

## Dept routing flow

```
login → GET /me/permissions
  → { department, accent, nav: [...allowed pages] }
  → body.dataset.dept = department
  → buildSidebar(nav)
  → navigate('dashboard')
```

When the user clicks a nav item, `navigate(page)` sets `body.dataset.dept` from the page map, applying that dept's colour scope.

---

## S16 JS public API

```js
S16.countUp(el, target, options)    // animate a number element
S16.initCountUps(root?)             // observe [data-countup] in root
S16.initWidgetGrid(selector, id)    // enable drag-reorder on a .widget-grid
S16.triggerSparklines(container?)   // apply sparkline-animate delays
S16.triggerChartLines(container?)   // set SVG path draw-in lengths
```

### Count-up HTML usage
```html
<span data-countup data-target="1234" data-prefix="$" data-suffix="%" data-decimals="1" data-duration="1200" data-delay="80">0</span>
```

---

## Test credentials — all use `Password123!`

| Email | Dept |
|---|---|
| `gm@nexaforge.com` | GM — all modules |
| `production@nexaforge.com` | Production |
| `qc@nexaforge.com` | Quality Control |
| `marketing@nexaforge.com` | Marketing |
| `finance@nexaforge.com` | Finance |
| `hr@nexaforge.com` | HR |
| `procurement@nexaforge.com` | Procurement |
| `store@nexaforge.com` | Store |
| `welding@nexaforge.com` | Welding |

---

## Running the app

```bash
# Frontend only (static)
cd "D:/Claude Projects/ERP/Sprint 1"
npx serve . -l 5500

# With live backend
cd "D:/Claude Projects/ERP/backend"
npm start

# With Mock Server (no DB required)
node mock-server.js
```

---

---

## Production module CSS components (`production.css` v=3.9)

### Shared components
| Class | Purpose |
|---|---|
| `.prod-kpi-card` | Standard KPI tile — replaces legacy `.metric-card--glass` in production |
| `.prod-status-card` `.ok` / `.warn` / `.error` | Banner status strip with icon slot |
| `.prod-asset-card` | Equipment card with header + health bar |
| `.prod-asset-header` | Flex row: name left, badge right |
| `.prod-asset-health` | Health bar wrapper (margin-bottom: 14px) |
| `.prod-maint-log` | Maintenance event log container |

### BOM Visual Engine
| Class | Purpose |
|---|---|
| `.bom-view-tabs` | Pill toggle strip (Hierarchy Tree / Cost Treemap) |
| `.bom-view-tab` / `.bom-view-tab.active` | Individual tab button |

SVG trees drawn via `_drawBOMTree()` and `_drawBOMTreemap()` using `document.createElementNS`. Use `element.style.fill` for CSS custom property fills (not `setAttribute`).

### Routing Steps — Project Switcher
| Class | Purpose |
|---|---|
| `.route-proj-strip` | Full-width horizontal project selector above routing grid |
| `.route-proj-chip` / `.active` | Individual project button |
| `.route-proj-dot` | Status colour dot |
| `.route-proj-id` | Project ID monospace |
| `.route-proj-name` | Project short name |
| `.route-proj-progress` | Step count `done/total` badge |
| `.route-proj-none` | "No routing" label |

### Routing Steps — Access Control
| Class | Purpose |
|---|---|
| `.route-lock-btn` / `.is-locked` | Lock/Unlock toggle button |
| `.route-access-list` | Role RBAC list container |
| `.route-access-row` | Single role row |
| `.route-access-btns` | 4-level button strip (None/View/Execute/Manage) |
| `.route-acc-lvl-btn` / `.active.none/.view/.execute/.manage` | Level button states |
| `.route-acc-chip` | Summary chip (None/View/Execute/Manage) |
| `.route-acc-none/.view/.execute/.manage` | Chip colour variants |
| `.route-access-legend` | Legend row at bottom of card |

Global handlers: `window._routeSetAccess(pid, roleId, newAccess)`, `window._routeToggleLock(pid)`.
Data store: module-level `_routeAccess` object keyed by project ID.

### Quality Gate Pipeline
| Class | Purpose |
|---|---|
| `.qg-pipeline` | Horizontal step flow container |
| `.qg-step-wrap` | Column: node + connector |
| `.qg-node` / `.qg-node-done/.active/.locked/.pending` | Gate circle node |
| `.qg-gate-marker` | Small marker dot on gate node |
| `.qg-step-label` | Step name below node |
| `.qg-connector` | Flex row: line + arrow |
| `.qg-line-done/.pending` | Connector line fill states |
| `.qg-legend` | Legend row |
| `.qg-compliance-icon.compliant/.pending` | Compliance checkpoint icon |

Quality Gates is **read-only** in the Production module. Disposition actions belong in the QC module. Banner calls `navigateTo('quality')`.

### Skill Matrix
| Class | Purpose |
|---|---|
| `.sm-heatmap` | Cert × operator heat map table |
| `.sm-op-col` / `.sm-cert-col` / `.sm-col-highlight` | Column highlight on cert click |
| `.sm-op-cell` / `.sm-cell` | Heat map cell |
| `.sm-cell.sm-valid/.expiring/.expired/.none` | Cell colour state |
| `.sm-dot.sm-dot-valid/.expiring/.expired/.none` | Dot inside cell |
| `.sm-legend-item.sm-valid/.expiring/.expired/.none` | Legend pill |
| `.sm-op-row` | Cert register operator row (grid: 200px 1fr auto) |
| `.sm-op-profile` / `.sm-op-avatar` | Operator profile within row |
| `.sm-cert-chips` | Flex wrap of cert cards |
| `.sm-cert-chip` / `.sm-cert-valid/.expiring/.expired` | Cert card variants |
| `.sm-cert-chip-header` / `.sm-cert-chip-name` | Chip internals |
| `.sm-op-actions` | Action column (Renew buttons) |

Global handler: `window._smHighlight(cert)` — toggles `_smHighlightCert` state and re-renders.

### Control Centre Grid
| Class | Purpose |
|---|---|
| `.cc-grid` | 3-column grid: `1fr 1fr 290px` |
| `.cc-col-main` | Col 1: Active Work Orders + Shop Floor Feed |
| `.cc-col-mid` | Col 2: Project Pipeline + Shift Handover |
| `.cc-col-side` | Col 3: Work Centres + IIoT Telemetry + Materials |
| `.cc-ticker` / `.cc-ticker-item.warn/.error` | Exception alert strip |
| `.cc-wo-row` / `.cc-wo-id` / `.cc-wo-name` / `.cc-wo-timer` | Work order list row |
| `.cc-feed-entry` / `.cc-feed-time` / `.cc-feed-text` | Shop floor event feed |
| `.cc-proj-row` / `.cc-proj-active` / `.cc-proj-border` / `.cc-proj-dot` | Pipeline project rows |
| `.cc-shift-row` / `.cc-shift-label` / `.cc-shift-val` | Shift handover rows |
| `.cc-wc-row` / `.cc-wc-dot` / `.cc-wc-name` / `.cc-wc-op` | Work centre compact rows |
| `.cc-iot-row` / `.cc-iot-sensor` / `.cc-iot-val.warn/.error` | IIoT telemetry rows |
| `.cc-mat-row` / `.cc-mat-code` / `.cc-mat-name` / `.cc-mat-qty` | Material shortage rows |

Live work order timers: `<span id="timer-${wo.id}">` updated by `updateLiveTimers()`.

---

## Known issues

- `me.js` `DEPT_COLOURS` hex values differ from `s16-design.css` (legacy mismatch — low priority)
- `deptKpiStrip` nests `.kpi-strip` inside `.kpi-strip` (pre-existing, refactor to `deptKpiCards()` when convenient)
- `chart-line-draw` CSS class exists but Chart.js post-render hook not yet wired
- `__Host-` cookie prefix deferred until HTTPS in production
- `navigateTo('quality')` in Quality Gates banner — confirm function signature matches `app.js`
