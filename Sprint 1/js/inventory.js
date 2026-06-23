/* ============================================================
   NexaForge ERP — Store & Inventory Module
   Covers: Stock ledger · Material movements · Quarantine
           Remnant tracking · Heat-number traceability
   ============================================================ */

'use strict';

/* ── Data store ─────────────────────────────────────────────── */
const InvData = {

  /* Stock items — each physical stock line with a heat number */
  items: [
    {
      id: 'STK-001', pn: 'PLT-316L-10', description: 'Shell plate 316L 10mm',
      category: 'Plate & Sheet', uom: 'SHT',
      qtyOnHand: 4, qtyReserved: 4, minStock: 2, reorderQty: 8,
      location: 'Bay A-3', heatNo: 'HN-44810',
      project: 'P-2401', supplier: 'Outokumpu',
      received: '2025-03-10', status: 'available',
      unitValue: 3575, totalValue: 14300,
      mtcRef: 'MTC-HN44810', grnRef: 'GRN-088', irRef: 'IR-001',
      notes: 'QC cleared. All sheets released to fab bay.'
    },
    {
      id: 'STK-002', pn: 'WELD-ER316L', description: 'Filler wire ER316L 45kg reel',
      category: 'Welding Consumables', uom: 'KG',
      qtyOnHand: 38, qtyReserved: 30, minStock: 20, reorderQty: 45,
      location: 'Weld Bay Store – W1', heatNo: 'FW-2231',
      project: 'P-2401', supplier: 'Lincoln Electric',
      received: '2025-03-28', status: 'available',
      unitValue: 30, totalValue: 1140,
      mtcRef: 'MTC-FW2231', grnRef: 'GRN-086', irRef: 'IR-002',
      notes: 'Lot traceability confirmed. Released to weld bay.'
    },
    {
      id: 'STK-003', pn: 'HEAD-EL-304', description: '2:1 Ellipsoidal head SA-240 304',
      category: 'Formed Heads', uom: 'EA',
      qtyOnHand: 6, qtyReserved: 6, minStock: 0, reorderQty: 4,
      location: 'Bay B-1 – Quarantine pending', heatNo: 'DH-2204',
      project: 'P-2402', supplier: 'Endress+Hauser',
      received: '2025-04-28', status: 'pending-qc',
      unitValue: 0, totalValue: 0,
      mtcRef: null, grnRef: 'GRN-089', irRef: null,
      notes: 'Emergency receipt without prior PO. Pending QC clearance and MTC verification.'
    },
    {
      id: 'STK-004', pn: 'TS-316L-01', description: 'Tube sheet 316L TS-01',
      category: 'Plate & Sheet', uom: 'EA',
      qtyOnHand: 2, qtyReserved: 0, minStock: 0, reorderQty: 2,
      location: 'Bay C-2 – QUARANTINE', heatNo: 'HN-44821',
      project: 'P-2403', supplier: 'Rolled Alloys',
      received: '2025-04-01', status: 'quarantine',
      unitValue: 6200, totalValue: 12400,
      mtcRef: 'MTC-HN44821-FAIL', grnRef: 'GRN-087', irRef: null,
      notes: 'Mo content 2.08% vs min 2.10%. NCR-031 raised. Awaiting supplier disposition.'
    },
    {
      id: 'STK-005', pn: 'GRND-125', description: 'Grinding disc 125mm',
      category: 'Consumables', uom: 'EA',
      qtyOnHand: 42, qtyReserved: 0, minStock: 30, reorderQty: 60,
      location: 'Tool Store – TS-04', heatNo: null,
      project: null, supplier: 'Norton Abrasives',
      received: '2025-03-28', status: 'available',
      unitValue: 4.5, totalValue: 189,
      mtcRef: null, grnRef: null, irRef: null,
      notes: 'General consumable stock.'
    },
    {
      id: 'STK-006', pn: 'PLT-304-12', description: 'Shell plate 304 SS 12mm',
      category: 'Plate & Sheet', uom: 'SHT',
      qtyOnHand: 0, qtyReserved: 0, minStock: 2, reorderQty: 6,
      location: '—', heatNo: null,
      project: 'P-2402', supplier: null,
      received: null, status: 'on-order',
      unitValue: 2850, totalValue: 0,
      mtcRef: null, grnRef: null, irRef: null,
      notes: 'On order — PR-2024-089 / PO pending.'
    },
    {
      id: 'STK-007', pn: 'FLNG-150RF-304', description: 'Flange 150RF 4" 304SS',
      category: 'Flanges & Fittings', uom: 'EA',
      qtyOnHand: 8, qtyReserved: 4, minStock: 4, reorderQty: 12,
      location: 'Bay D-1 – Shelf 3', heatNo: 'FL-0921',
      project: null, supplier: 'Boltun / ITW',
      received: '2025-02-14', status: 'available',
      unitValue: 85, totalValue: 680,
      mtcRef: 'MTC-FL0921', grnRef: null, irRef: null,
      notes: 'General stock. MTC available.'
    },
    {
      id: 'STK-008', pn: 'PIPE-316L-2IN', description: 'Pipe 316L Sch10 2" seamless',
      category: 'Pipe & Tube', uom: 'M',
      qtyOnHand: 24, qtyReserved: 12, minStock: 10, reorderQty: 30,
      location: 'Pipe Rack – PR-02', heatNo: 'PH-338A',
      project: null, supplier: 'Sandvik',
      received: '2025-01-20', status: 'available',
      unitValue: 48, totalValue: 1152,
      mtcRef: 'MTC-PH338A', grnRef: null, irRef: null,
      notes: 'General stock. Traceability confirmed.'
    },
    {
      id: 'STK-009', pn: 'BOLTS-A193-B8M', description: 'Stud bolt A193-B8M 3/4" × 100mm',
      category: 'Fasteners', uom: 'EA',
      qtyOnHand: 120, qtyReserved: 80, minStock: 50, reorderQty: 200,
      location: 'Bay D-2 – Bin 12', heatNo: null,
      project: 'P-2401', supplier: 'Boltun / ITW',
      received: '2025-03-05', status: 'available',
      unitValue: 3.2, totalValue: 384,
      mtcRef: null, grnRef: null, irRef: null,
      notes: 'Nozzle flange fasteners — ASME B18.2.1.'
    },
    {
      id: 'STK-010', pn: 'INSUL-ROCK-50', description: 'Rock wool insulation 50mm slab',
      category: 'Insulation', uom: 'M2',
      qtyOnHand: 15, qtyReserved: 15, minStock: 10, reorderQty: 40,
      location: 'Bay E-1', heatNo: null,
      project: 'P-2401', supplier: 'Rockwool',
      received: '2025-04-10', status: 'available',
      unitValue: 18, totalValue: 270,
      mtcRef: null, grnRef: null, irRef: null,
      notes: 'Tank insulation — issued to P-2401 Phase 4.'
    },
  ],

  /* Movement log — GRN receipts, shop-floor issues, returns */
  movements: [
    {
      id: 'MV-2025-048', type: 'receipt', date: '2025-04-28',
      pn: 'HEAD-EL-304', description: '2:1 Ellipsoidal head SA-240 304',
      qty: 6, uom: 'EA', project: 'P-2402',
      from: 'Incoming dock', to: 'Bay B-1',
      reference: 'GRN-089', executedBy: 'Store Manager',
      heatNo: 'DH-2204', notes: 'Emergency receipt — pending QC'
    },
    {
      id: 'MV-2025-047', type: 'issue', date: '2025-04-20',
      pn: 'BOLTS-A193-B8M', description: 'Stud bolt A193-B8M 3/4"',
      qty: 48, uom: 'EA', project: 'P-2401',
      from: 'Bay D-2 – Bin 12', to: 'Shop Floor – Station 3',
      reference: 'MR-2025-041', executedBy: 'Store Manager',
      heatNo: null, notes: 'Nozzle assembly — nozzles N1–N6'
    },
    {
      id: 'MV-2025-046', type: 'receipt', date: '2025-04-01',
      pn: 'TS-316L-01', description: 'Tube sheet 316L TS-01',
      qty: 2, uom: 'EA', project: 'P-2403',
      from: 'Incoming dock', to: 'Bay C-2',
      reference: 'GRN-087', executedBy: 'Store Manager',
      heatNo: 'HN-44821', notes: 'Received — subsequently quarantined QC fail'
    },
    {
      id: 'MV-2025-045', type: 'issue', date: '2025-03-30',
      pn: 'WELD-ER316L', description: 'Filler wire ER316L 45kg',
      qty: 7, uom: 'KG', project: 'P-2401',
      from: 'Weld Bay Store – W1', to: 'Welding Station 2',
      reference: 'MR-2025-038', executedBy: 'Weld Supervisor',
      heatNo: 'FW-2231', notes: 'GTAW root pass — joints W-03 to W-07'
    },
    {
      id: 'MV-2025-044', type: 'receipt', date: '2025-03-28',
      pn: 'WELD-ER316L', description: 'Filler wire ER316L 45kg reel',
      qty: 45, uom: 'KG', project: 'P-2401',
      from: 'Incoming dock', to: 'Weld Bay Store – W1',
      reference: 'GRN-086', executedBy: 'Store Manager',
      heatNo: 'FW-2231', notes: 'QC pass lot FW-2231. Released.'
    },
    {
      id: 'MV-2025-043', type: 'issue', date: '2025-03-20',
      pn: 'PLT-316L-10', description: 'Shell plate 316L 10mm',
      qty: 4, uom: 'SHT', project: 'P-2401',
      from: 'Bay A-3', to: 'Cutting Station 1',
      reference: 'MR-2025-035', executedBy: 'Store Manager',
      heatNo: 'HN-44810', notes: 'Marked-up for shell course cutting'
    },
    {
      id: 'MV-2025-042', type: 'receipt', date: '2025-03-10',
      pn: 'PLT-316L-10', description: 'Shell plate 316L 10mm',
      qty: 8, uom: 'SHT', project: 'P-2401',
      from: 'Incoming dock', to: 'Bay A-3',
      reference: 'GRN-088', executedBy: 'Store Manager',
      heatNo: 'HN-44810', notes: 'Full quantity received. QC pass. MTC verified.'
    },
    {
      id: 'MV-2025-041', type: 'return', date: '2025-03-18',
      pn: 'GRND-125', description: 'Grinding disc 125mm',
      qty: 8, uom: 'EA', project: 'P-2401',
      from: 'Shop Floor – General', to: 'Tool Store – TS-04',
      reference: 'RET-2025-012', executedBy: 'Store Manager',
      heatNo: null, notes: 'Unused discs returned — end of grinding phase'
    },
    {
      id: 'MV-2025-040', type: 'adjustment', date: '2025-02-28',
      pn: 'GRND-125', description: 'Grinding disc 125mm',
      qty: -6, uom: 'EA', project: null,
      from: 'Tool Store – TS-04', to: '—',
      reference: 'ADJ-2025-007', executedBy: 'Store Manager',
      heatNo: null, notes: 'Stock count adjustment — cycle count discrepancy'
    },
    {
      id: 'MV-2025-039', type: 'issue', date: '2025-04-12',
      pn: 'PIPE-316L-2IN', description: 'Pipe 316L Sch10 2"',
      qty: 6, uom: 'M', project: 'P-2401',
      from: 'Pipe Rack – PR-02', to: 'Fitting Station 1',
      reference: 'MR-2025-029', executedBy: 'Store Manager',
      heatNo: 'PH-338A', notes: 'Nozzle connections N7–N10'
    },
  ],

  /* Quarantine register */
  quarantine: [
    {
      id: 'QRN-001', pn: 'TS-316L-01', description: 'Tube sheet 316L TS-01',
      qty: '2 EA', heatNo: 'HN-44821',
      project: 'P-2403', supplier: 'Rolled Alloys',
      location: 'Bay C-2 – QUARANTINE', grnRef: 'GRN-087',
      ncrRef: 'NCR-031', quarantineDate: '2025-04-02',
      raisedBy: 'QC Inspector', status: 'open',
      reason: 'Mo content 2.08% vs ASTM A240 min 2.10%',
      disposition: 'pending',
      notes: 'Supplier notified. Awaiting replacement material or concession request.'
    },
  ],

  /* Remnant stock — off-cuts with heat number linkage */
  remnants: [
    {
      id: 'REM-001', pn: 'PLT-316L-10', description: 'Shell plate 316L 10mm off-cut',
      heatNo: 'HN-44810', project: 'P-2401',
      dimensions: '2400 × 800 × 10mm', estimatedWeight: 152,
      location: 'Remnant Rack – RR-01', status: 'available',
      created: '2025-03-22', createdBy: 'Cutting Operator',
      notes: 'Off-cut from shell course C2 nesting. Tagged HN-44810.'
    },
    {
      id: 'REM-002', pn: 'PLT-316L-10', description: 'Shell plate 316L 10mm off-cut',
      heatNo: 'HN-44810', project: 'P-2401',
      dimensions: '1200 × 600 × 10mm', estimatedWeight: 57,
      location: 'Remnant Rack – RR-01', status: 'reserved',
      created: '2025-03-22', createdBy: 'Cutting Operator',
      notes: 'Reserved for nozzle reinforcement pads — P-2401.'
    },
    {
      id: 'REM-003', pn: 'PIPE-316L-2IN', description: '316L 2" pipe spool off-cut',
      heatNo: 'PH-338A', project: 'P-2401',
      dimensions: '480mm length, 2" OD', estimatedWeight: 3.2,
      location: 'Pipe Rack – Remnants', status: 'available',
      created: '2025-04-15', createdBy: 'Pipe Fitter',
      notes: 'Short spool remnant. Usable for small connections.'
    },
    {
      id: 'REM-004', pn: 'FLNG-150RF-304', description: 'Flange gasket sheet 304 2mm',
      heatNo: null, project: null,
      dimensions: '600 × 600 × 2mm', estimatedWeight: 5.8,
      location: 'Remnant Rack – RR-02', status: 'available',
      created: '2025-02-10', createdBy: 'Store Manager',
      notes: 'No heat number — general stock scrap.'
    },
  ],

  /* Material Requisitions (MRF) — Shop floor requests */
  requisitions: [
    {
      id: 'MRF-2025-051', project: 'P-2401', requester: 'S. Kumar (Fabrication)',
      date: '2025-05-14', status: 'pending', priority: 'high',
      items: [
        { pn: 'PLT-316L-10', description: 'Shell plate 316L 10mm', qty: 2, uom: 'SHT', status: 'pending' },
        { pn: 'WELD-ER316L', description: 'Filler wire ER316L', qty: 10, uom: 'KG', status: 'pending' }
      ]
    },
    {
      id: 'MRF-2025-048', project: 'P-2402', requester: 'M. Chen (Fitting)',
      date: '2025-05-12', status: 'partial', priority: 'medium',
      items: [
        { pn: 'PIPE-316L-2IN', description: 'Pipe 316L Sch10 2"', qty: 6, uom: 'M', status: 'issued' },
        { pn: 'FLNG-150RF-304', description: 'Flange 150RF 4"', qty: 4, uom: 'EA', status: 'pending' }
      ]
    },
    {
      id: 'MRF-2025-045', project: 'P-2401', requester: 'A. Singh (Weld)',
      date: '2025-05-10', status: 'fulfilled', priority: 'low',
      items: [
        { pn: 'BOLTS-A193-B8M', description: 'Stud bolt A193-B8M', qty: 24, uom: 'EA', status: 'issued' }
      ]
    }
  ],

  /* Kitting & Staging — Pre-pick containers for production */
  kitting: [
    {
      id: 'KIT-P2401-SHELL', project: 'P-2401', description: 'Shell Course A1 Components',
      stagingLoc: 'Rack S-1', progress: 65, status: 'in-progress',
      items: [
        { desc: 'Shell Plate A1', kitted: true },
        { desc: 'Nozzle N1 Gasket', kitted: true },
        { desc: 'Nozzle N1 Flange', kitted: false }
      ]
    },
    {
      id: 'KIT-P2401-INT', project: 'P-2401', description: 'Internal Baffles Set',
      stagingLoc: 'Rack S-2', progress: 100, status: 'complete',
      items: [
        { desc: 'Baffle Plate Set', kitted: true },
        { desc: 'Support Brackets', kitted: true }
      ]
    },
    {
      id: 'KIT-P2402-MAIN', project: 'P-2402', description: 'Main Vessel Sub-assy',
      stagingLoc: 'Floor Zone A', progress: 20, status: 'staged',
      items: [
        { desc: 'Dished Head DH-1', kitted: true },
        { desc: 'Shell Course S1', kitted: false },
        { desc: 'Shell Course S2', kitted: false }
      ]
    }
  ],

  /* Incoming QC — Items received but not yet released to stock */
  incomingQC: [
    { id: 'GRN-091', date: '2025-05-14', supplier: 'Sandvik', item: '316L 1" Pipe', qty: 200, uom: 'M', priority: 'high', ageing: 1, status: 'pending' },
    { id: 'GRN-090', date: '2025-05-10', supplier: 'Outokumpu', item: '316L 12mm Plate', qty: 4, uom: 'SHT', priority: 'medium', ageing: 5, status: 'in-inspection' },
    { id: 'GRN-088', date: '2025-05-01', supplier: 'Lincoln Electric', item: 'ER316L Wire', qty: 100, uom: 'KG', priority: 'low', ageing: 14, status: 'hold' }
  ],

  /* Cycle Counts — Inventory audit sessions */
  cycleCounts: [
    { id: 'CC-2025-004', date: '2025-05-15', zone: 'Bay A', status: 'active', itemsCounted: 12, variances: 0 },
    { id: 'CC-2025-003', date: '2025-04-15', zone: 'Consumables', status: 'complete', itemsCounted: 45, variances: 2 },
    { id: 'CC-2025-002', date: '2025-03-15', zone: 'Bay B', status: 'complete', itemsCounted: 22, variances: 1 }
  ],

  /* Bin Locations — Warehouse mapping */
  binLocations: [
    { id: 'A1-01', zone: 'Bay A', rack: 'R1', level: 'L1', capacity: 100, occupancy: 85, status: 'full' },
    { id: 'A1-02', zone: 'Bay A', rack: 'R1', level: 'L2', capacity: 100, occupancy: 20, status: 'available' },
    { id: 'B2-01', zone: 'Bay B', rack: 'R2', level: 'L1', capacity: 200, occupancy: 0, status: 'empty' }
  ],

  /* Analytics — Historical trends */
  analytics: {
    turnover: [4.2, 4.5, 4.3, 4.8, 5.1, 4.9],
    valuation: [120000, 125000, 131000, 128000, 135000, 142000],
    velocity: [
      { pn: 'PLT-316L-10', count: 45 },
      { pn: 'WELD-ER316L', count: 38 },
      { pn: 'GRND-125', count: 32 }
    ]
  }
};

/* ── Active tab state ───────────────────────────────────────── */
let invLedgerFilter = 'all';
let invLedgerSearch = '';
let invLedgerCategory = 'all';
let invMovFilter = 'all';
let invMovSearch = '';
let invMovProject = 'all';
let invMovDateStart = '';
let invMovDateEnd = '';
let invSelectedItems = new Set();

/* ── Sub-page Wrappers (Sidebar Dispatchers) ────────────────── */
function renderStore_control_centre() { renderInvOverview(); }
function renderStore_stock_ledger()    { renderInvLedger(); }
function renderStore_movements()       { renderInvMovements(); }
function renderStore_quarantine()      { renderInvQuarantine(); }
function renderStore_remnants()        { renderInvRemnants(); }

// New stubs
// Sprint 4 & 5 Renderers
function renderStore_bin_locator() {
  const el = document.getElementById('pageContent');
  if (!el) return;

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Bin & Bay Locator</div>
        <div class="page-subtitle">Interactive warehouse floor map · Real-time occupancy tracking</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="showToast('Map refreshed','info')">Refresh Map</button>
      </div>
    </div>

    <div class="card stagger-in" style="margin-bottom:24px">
      <div style="display:flex;gap:20px;padding:20px;align-items:center;background:var(--bg-elevated);border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:8px"><div style="width:12px;height:12px;background:var(--green);border-radius:2px"></div><span style="font-size:12px;color:var(--text-secondary)">Available</span></div>
        <div style="display:flex;align-items:center;gap:8px"><div style="width:12px;height:12px;background:var(--amber);border-radius:2px"></div><span style="font-size:12px;color:var(--text-secondary)">Partially Full</span></div>
        <div style="display:flex;align-items:center;gap:8px"><div style="width:12px;height:12px;background:var(--red);border-radius:2px"></div><span style="font-size:12px;color:var(--text-secondary)">At Capacity</span></div>
      </div>
      
      <div style="padding:40px;display:flex;justify-content:center;background:var(--bg-surface)">
        <!-- Warehouse SVG Map -->
        <svg width="800" height="400" viewBox="0 0 800 400" style="filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2))">
          <!-- Bay A -->
          <text x="50" y="30" fill="var(--text-muted)" font-size="12" font-weight="600">BAY A (Heavy Plates)</text>
          <rect x="50" y="50" width="100" height="150" rx="4" fill="var(--red)" opacity="0.8" style="cursor:pointer" onclick="showBinDetails('A1-01')">
            <title>Bin A1-01: 85% Full</title>
          </rect>
          <rect x="160" y="50" width="100" height="150" rx="4" fill="var(--amber)" opacity="0.8" style="cursor:pointer" onclick="showBinDetails('A1-02')">
            <title>Bin A1-02: 20% Full</title>
          </rect>
          
          <!-- Bay B -->
          <text x="350" y="30" fill="var(--text-muted)" font-size="12" font-weight="600">BAY B (Pipes & Tubes)</text>
          <rect x="350" y="50" width="100" height="150" rx="4" fill="var(--green)" opacity="0.8" style="cursor:pointer" onclick="showBinDetails('B1-01')">
            <title>Bin B1-01: Empty</title>
          </rect>
          <rect x="460" y="50" width="100" height="150" rx="4" fill="var(--green)" opacity="0.8" style="cursor:pointer" onclick="showBinDetails('B1-02')">
            <title>Bin B1-02: Empty</title>
          </rect>
          
          <!-- Bay C (Quarantine) -->
          <text x="650" y="30" fill="var(--red)" font-size="12" font-weight="700">BAY C (QUARANTINE)</text>
          <rect x="650" y="50" width="100" height="150" rx="4" fill="var(--red)" opacity="0.2" stroke="var(--red)" stroke-dasharray="4" stroke-width="2">
            <title>Restricted Area</title>
          </rect>
          
          <!-- Aisle -->
          <rect x="50" y="250" width="700" height="40" rx="20" fill="var(--bg-elevated)" opacity="0.5"/>
          <text x="360" y="275" fill="var(--text-hint)" font-size="10">FORKLIFT AISLE 1</text>
        </svg>
      </div>
    </div>

    <div id="binDetailPanel"></div>
  `;
}

function showBinDetails(binId) {
  const panel = document.getElementById('binDetailPanel');
  panel.innerHTML = `
    <div class="card stagger-in" style="border-left:4px solid var(--brand)">
      <div class="card-header">
        <span class="card-title">Bin Details: ${binId}</span>
        <button class="btn btn-ghost btn-sm" onclick="this.parentElement.parentElement.remove()">Close</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:16px">
        <div>
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">Occupancy</div>
          <div style="font-size:24px;font-weight:700;color:var(--text-primary)">85%</div>
          <div class="progress-bar" style="height:6px;margin-top:8px"><div class="progress-fill" style="width:85%;background:var(--red)"></div></div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">Stored Item</div>
          <div style="font-size:14px;font-weight:600;color:var(--brand)">PLT-316L-10</div>
          <div style="font-size:12px;color:var(--text-secondary)">Shell plate 316L 10mm</div>
        </div>
      </div>
    </div>
  `;
}

function renderStore_incoming_qc() {
  const el = document.getElementById('pageContent');
  if (!el) return;

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Incoming QC Hold</div>
        <div class="page-subtitle">Materials pending inspection · ${InvData.incomingQC.length} active receipts</div>
      </div>
    </div>

    <div class="card stagger-in">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>GRN ID</th>
              <th>Supplier</th>
              <th>Item Description</th>
              <th>Qty</th>
              <th>Ageing</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${InvData.incomingQC.map(q => `
              <tr>
                <td style="font-family:var(--font-mono);color:var(--brand);font-weight:600">${q.id}</td>
                <td style="font-size:13px">${q.supplier}</td>
                <td>
                  <div style="font-size:13px;font-weight:500">${q.item}</div>
                  <div style="font-size:11px;color:var(--text-muted)">Received: ${q.date}</div>
                </td>
                <td style="font-family:var(--font-mono)">${q.qty} ${q.uom}</td>
                <td style="color:${q.ageing > 10 ? 'var(--red)' : 'var(--text-primary)'}">${q.ageing} days</td>
                <td><span class="badge ${q.priority === 'high' ? 'badge-red' : q.priority === 'medium' ? 'badge-amber' : 'badge-blue'}">${q.priority.toUpperCase()}</span></td>
                <td><span class="badge badge-muted">${q.status.replace('-', ' ')}</span></td>
                <td>
                  <button class="btn btn-primary btn-sm" onclick="navigate('quality');showToast('Opening Inspection for ${q.id}','info')">Start Inspection</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderStore_heat_trace() {
  const el = document.getElementById('pageContent');
  if (!el) return;

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Heat Number Traceability</div>
        <div class="page-subtitle">Digital material genealogy · Search by Heat/Batch number</div>
      </div>
    </div>

    <div class="card stagger-in" style="margin-bottom:24px">
      <div style="padding:20px;display:flex;gap:12px;background:var(--bg-elevated)">
        <div class="search-input-wrap" style="flex:1">
          <svg class="search-icon" viewBox="0 0 15 15" fill="none"><path d="M14.5 14.5l-4-4m-4 2a6 6 0 110-12 6 6 0 010 12z" stroke="currentColor" stroke-width="1.5"/></svg>
          <input type="text" id="heatSearchInput" class="search-input" placeholder="Enter Heat Number (e.g. HN-44810)..." onkeyup="if(event.key==='Enter')traceHeat(this.value)"/>
        </div>
        <button class="btn btn-primary" onclick="traceHeat(document.getElementById('heatSearchInput').value)">Generate Trace</button>
      </div>
    </div>

    <div id="traceResult">
      <div style="text-align:center;padding:60px;color:var(--text-muted)">
        <div style="font-size:48px;opacity:0.2;margin-bottom:16px">🧬</div>
        <div style="font-size:14px">Enter a heat number to view its full genealogy timeline.</div>
      </div>
    </div>
  `;
}

function traceHeat(heatNo) {
  const res = document.getElementById('traceResult');
  if (!heatNo || heatNo.trim() === '') {
    showToast('Please enter a heat number', 'warn');
    return;
  }

  // Mock trace data for demo
  res.innerHTML = `
    <div class="stagger-in">
      <div class="card" style="border-left:4px solid var(--green);margin-bottom:24px">
        <div style="padding:16px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Tracing Heat Number</div>
            <div style="font-size:20px;font-weight:700;color:var(--text-primary)">${heatNo}</div>
          </div>
          <span class="badge badge-green">VERIFIED TRACE</span>
        </div>
      </div>

      <div class="trace-timeline" style="position:relative;padding-left:40px;margin-left:20px;border-left:2px dashed var(--border)">
        ${[
          { date: '2025-02-15', title: 'Mill Production', desc: 'Material manufactured by Outokumpu, Sweden. Batch verified.', icon: '🏭' },
          { date: '2025-03-01', title: 'MTC Issued', desc: 'Material Test Certificate #MTC-HN44810 released. Chemical/Mechanical pass.', icon: '📜' },
          { date: '2025-03-10', title: 'Goods Receipt', desc: 'Received at Port Jebel Ali. Logged as GRN-088.', icon: '🚢' },
          { date: '2025-03-12', title: 'Incoming QC', desc: 'Visual & Dimensional inspection complete. Release to stock.', icon: '✅' },
          { date: '2025-03-20', title: 'Production Issue', desc: 'Issued to Project P-2401 (316L Storage Tank) for Shell Course C1.', icon: '⚙️' }
        ].map((t, i) => `
          <div class="trace-node" style="margin-bottom:30px;position:relative">
            <div style="position:absolute;left:-51px;top:0;width:20px;height:20px;background:var(--bg-surface);border:2px solid var(--brand);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px">${t.icon}</div>
            <div style="font-size:11px;color:var(--brand);font-weight:600;margin-bottom:4px">${t.date}</div>
            <div style="font-size:15px;font-weight:700;color:var(--text-primary)">${t.title}</div>
            <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">${t.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderStore_cycle_count() {
  const el = document.getElementById('pageContent');
  if (!el) return;

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Cycle Count Manager</div>
        <div class="page-subtitle">Physical inventory audits · Scheduled sessions · Variance reporting</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" onclick="showToast('New session started','success')">+ Start New Session</button>
      </div>
    </div>

    <div class="metric-grid stagger-in" style="margin-bottom:24px">
      ${[
        { label: 'Total Audited SKUs', value: '1,240', color: 'var(--brand)' },
        { label: 'Active Sessions', value: '1', color: 'var(--amber)' },
        { label: 'Avg Variance %', value: '0.42%', color: 'var(--green)' },
        { label: 'Last Count Date', value: '2025-05-15', color: 'var(--text-muted)' }
      ].map(k => `
        <div class="kpi-card metric-card--glass">
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-value" style="color:${k.color}">${k.value}</div>
        </div>`).join('')}
    </div>

    <div class="card stagger-in">
      <div class="card-header"><span class="card-title">Recent Audit Sessions</span></div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Session ID</th>
              <th>Date</th>
              <th>Warehouse Zone</th>
              <th>Items Counted</th>
              <th>Variances</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${InvData.cycleCounts.map(c => `
              <tr>
                <td style="font-family:var(--font-mono);font-weight:600">${c.id}</td>
                <td>${c.date}</td>
                <td>${c.zone}</td>
                <td>${c.itemsCounted} items</td>
                <td style="color:${c.variances > 0 ? 'var(--red)' : 'var(--green)'}">${c.variances} found</td>
                <td><span class="badge ${c.status === 'active' ? 'badge-amber' : 'badge-green'}">${c.status.toUpperCase()}</span></td>
                <td>
                  <button class="btn btn-ghost btn-sm">View Report</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderStore_requisitions()    { renderInvRequisitions(); }
function renderStore_kitting()         { renderInvKitting(); }
function renderStore_cycle_count()     { renderInvCycleCount(); } // Renamed to match task list

function renderInvCycleCount() {
  // Alias to the function above
  renderStore_cycle_count();
}

function renderStore_reports() {
  const el = document.getElementById('pageContent');
  if (!el) return;

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Store Reports</div>
        <div class="page-subtitle">Inventory valuation · Dead stock analysis · Audit trails</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:20px" class="stagger-in">
      <div class="card" style="cursor:pointer" onclick="showToast('Generating Stock Ageing Report...','info')">
        <div style="font-size:32px;margin-bottom:12px">⏳</div>
        <div style="font-size:16px;font-weight:700">Stock Ageing (Dead Stock)</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px">Identify items with no movement for > 180 days to optimize warehouse space.</div>
      </div>
      <div class="card" style="cursor:pointer" onclick="showToast('Generating Valuation Report...','info')">
        <div style="font-size:32px;margin-bottom:12px">💰</div>
        <div style="font-size:16px;font-weight:700">Inventory Valuation</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px">Real-time financial breakdown of stock on hand by category and project.</div>
      </div>
      <div class="card" style="cursor:pointer" onclick="showToast('Generating Project Audit Log...','info')">
        <div style="font-size:32px;margin-bottom:12px">📋</div>
        <div style="font-size:16px;font-weight:700">Project Material Audit</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px">Full traceability log of every material issued to a specific project.</div>
      </div>
    </div>
  `;
}

function renderStore_analytics() {
  const el = document.getElementById('pageContent');
  if (!el) return;

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Store Analytics</div>
        <div class="page-subtitle">Operational KPIs · Movement velocity · Supplier performance</div>
      </div>
    </div>

    <div class="metric-grid stagger-in" style="margin-bottom:24px">
      ${[
        { label: 'Stock Turnover Ratio', value: '5.1x', color: 'var(--green)' },
        { label: 'Pick Accuracy', value: '99.8%', color: 'var(--brand)' },
        { label: 'Out of Stock SKUs', value: '4', color: 'var(--red)' },
        { label: 'Avg Receipt Time', value: '1.2 days', color: 'var(--blue)' }
      ].map(k => `
        <div class="kpi-card metric-card--glass">
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-value" style="color:${k.color}">${k.value}</div>
        </div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px" class="stagger-in">
      <div class="card">
        <div class="card-header"><span class="card-title">Movement Velocity (Top SKUs)</span></div>
        <div style="padding:10px">
          ${InvData.analytics.velocity.map(v => `
            <div style="margin-bottom:15px">
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
                <span style="color:var(--text-primary);font-weight:600">${v.pn}</span>
                <span style="color:var(--brand)">${v.count} issues/mo</span>
              </div>
              <div class="progress-bar" style="height:6px"><div class="progress-fill" style="width:${(v.count/50)*100}%;background:var(--brand)"></div></div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Inventory Valuation Trend</span></div>
        <div style="height:200px;display:flex;align-items:flex-end;gap:10px;padding:20px">
          ${InvData.analytics.valuation.map(v => {
            const h = (v / 150000) * 100;
            return `<div style="flex:1;height:${h}%;background:var(--blue);border-radius:4px 4px 0 0;opacity:0.8;position:relative" title="${fmt(v)}"></div>`;
          }).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;padding:0 20px 10px;font-size:10px;color:var(--text-hint)">
          <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span>
        </div>
      </div>
    </div>
  `;
  mountAnaCockpit('store', { append: true, heading: 'Cross-functional analytics' });
}

/* ── Inventory API loader — populates InvData from backend (no-op in demo mode) ── */
async function _loadInvFromAPI() {
  if (typeof AppState !== 'undefined' && AppState.isDemoMode) return;
  try {
    const [remnantsRes, mrRes, grnRes] = await Promise.allSettled([
      WarehouseAPI.remnants({ limit: 200 }),
      WarehouseAPI.mrList({ limit: 200 }),
      WarehouseAPI.grnList({ limit: 200 }),
    ]);

    if (remnantsRes.status === 'fulfilled') {
      const raw = remnantsRes.value || [];
      if (raw.length) {
        InvData.remnants = raw.map(r => ({
          id: r.id,
          matCode: r.parent_item_code || r.id.slice(0, 8).toUpperCase(),
          grade: r.material || '',
          spec: r.material || '',
          thick: r.thickness_mm || 0,
          width: r.width_mm || 0,
          length: r.length_mm || 0,
          weight: r.weight_kg || 0,
          project: r.source_project_no || '',
          status: r.status || 'available',
          location: r.location || '',
          heatNo: r.heat_no || '',
          notes: r.notes || '',
        }));
      }
    }

    if (mrRes.status === 'fulfilled') {
      const raw = mrRes.value || [];
      if (raw.length) {
        InvData.requisitions = raw.map(r => ({
          id: r.mr_no || r.id,
          project: r.project_no || '',
          requestedBy: r.requested_by_name || '',
          requestedDate: (r.created_at || '').slice(0, 10),
          priority: r.priority || 'normal',
          status: r.status || 'pending',
          items: (r.lines || []).map(l => ({
            matCode: l.material_code || '',
            description: l.description || '',
            qty: l.quantity_required || 0,
            unit: l.unit || 'EA',
            status: l.status || 'pending',
          })),
        }));
      }
    }

    if (grnRes.status === 'fulfilled') {
      const raw = grnRes.value.grns || grnRes.value || [];
      if (raw.length) {
        // Map GRN lines into inventory items (received stock)
        const itemMap = {};
        raw.forEach(grn => {
          (grn.lines || []).forEach(l => {
            const key = l.material_code || l.id;
            if (!itemMap[key]) {
              itemMap[key] = {
                id: key, matCode: l.material_code || key,
                description: l.description || '', category: l.category || 'General',
                unit: l.unit || 'EA', qtyOnHand: 0, totalValue: 0,
                status: 'available', location: l.location || '', heatNo: l.heat_no || '',
                minStock: 0, maxStock: 0, unitCost: l.unit_price || 0,
              };
            }
            itemMap[key].qtyOnHand += Number(l.quantity_received || 0);
            itemMap[key].totalValue += Number(l.quantity_received || 0) * Number(l.unit_price || 0);
          });
        });
        const items = Object.values(itemMap);
        if (items.length) InvData.items = items;
      }
    }
  } catch (e) {
    // Silent — seed data remains
  }
}

/* ── Legacy Entry Point (Redirects to Control Centre) ───────── */
async function renderInventory() {
  await _loadInvFromAPI();
  enterStoreModule();
}

/* ═══════════════════════════════════════════════════════════
   TAB 1 — OVERVIEW (Now Control Centre Dashboard)
   ═══════════════════════════════════════════════════════════ */
function renderInvOverview() {
  const el = document.getElementById('pageContent');
  if (!el) return;

  const totalItems    = InvData.items.length;
  const available     = InvData.items.filter(i => i.status === 'available').length;
  const lowStock      = InvData.items.filter(i => i.status === 'available' && i.qtyOnHand <= i.minStock && i.minStock > 0).length;
  const quarantined   = InvData.items.filter(i => i.status === 'quarantine').length;
  const pendingQC     = InvData.items.filter(i => i.status === 'pending-qc').length;
  const totalValue    = InvData.items.reduce((s, i) => s + (i.totalValue || 0), 0);

  // Category breakdown
  const catTotals = {};
  InvData.items.forEach(i => {
    if (!catTotals[i.category]) catTotals[i.category] = 0;
    catTotals[i.category] += i.totalValue || 0;
  });
  const catEntries = Object.entries(catTotals).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]);

  // Recent movements (last 8)
  const recentMoves = InvData.movements.slice(0, 8);

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Store Control Centre</div>
        <div class="page-subtitle">Real-time warehouse health · Traceability monitoring · Stock valuation</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="renderStore_control_centre()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Refresh
        </button>
        <button class="btn btn-primary btn-sm" onclick="openReceiveStockModal()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Receive Stock
        </button>
      </div>
    </div>

    <!-- KPI Strip — S-16 Glassmorphism -->
    <div class="metric-grid stagger-in" style="margin-bottom:24px">
      ${[
        { label: 'Total stock lines',   value: totalItems,   sub: 'Unique SKUs', color: 'var(--text-primary)' },
        { label: 'Low stock alerts',    value: lowStock,     sub: 'Requires PR', color: lowStock > 0 ? 'var(--amber)' : 'var(--text-muted)' },
        { label: 'Quarantined items',   value: quarantined,  sub: 'NCR locked',  color: quarantined > 0 ? 'var(--red)' : 'var(--text-muted)' },
        { label: 'Pending QC release',  value: pendingQC,    sub: 'Incoming dock',color: pendingQC > 0 ? 'var(--amber)' : 'var(--text-muted)' },
        { label: 'Total stock value',   value: fmt(totalValue), sub: 'USD Total', color: 'var(--blue)' },
        { label: 'Mvt velocity',        value: '14.2',       sub: 'Items/day',   color: 'var(--green)' },
      ].map(k => `
        <div class="kpi-card metric-card--glass">
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-value" style="color:${k.color}">${k.value}</div>
          <div class="kpi-sub">${k.sub}</div>
        </div>`).join('')}
    </div>

    <!-- Alert feed -->
    ${lowStock > 0 || quarantined > 0 || pendingQC > 0 ? `
    <div class="stagger-in" style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px">
      ${InvData.items.filter(i => i.status === 'quarantine').map(i => `
        <div class="alert-banner alert-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <div style="flex:1"><strong>QUARANTINE:</strong> ${i.description} — Heat: ${i.heatNo}</div>
          <button class="btn btn-ghost btn-sm" onclick="renderStoreSubPage('quarantine')">Inspect →</button>
        </div>`).join('')}
      ${InvData.items.filter(i => i.status === 'pending-qc').map(i => `
        <div class="alert-banner alert-warn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          <div style="flex:1"><strong>PENDING QC:</strong> ${i.description} — ${i.grnRef || ''}</div>
          <button class="btn btn-ghost btn-sm" onclick="navigate('quality')">Go to QC →</button>
        </div>`).join('')}
    </div>` : ''}

    <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:20px;margin-bottom:20px">
      
      <div style="display:flex;flex-direction:column;gap:20px">
        <!-- Stock value by category -->
        <div class="card stagger-in">
          <div class="card-header">
            <span class="card-title">Stock value by category</span>
            <button class="btn btn-ghost btn-sm" onclick="renderStoreSubPage('stock-ledger')">Full ledger →</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:14px;padding-top:10px">
            ${catEntries.map(([cat, val], i) => {
              const pct = Math.round((val / totalValue) * 100);
              const cols = ['var(--brand)','var(--blue)','var(--green)','var(--amber)','var(--text-secondary)'];
              const col = cols[i % cols.length];
              return `
              <div>
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px">
                  <span style="color:var(--text-secondary)">${cat}</span>
                  <span style="font-family:var(--font-mono);font-weight:600;color:${col}">${fmt(val)} (${pct}%)</span>
                </div>
                <div class="progress-bar" style="height:6px;background:var(--bg-elevated)">
                  <div class="progress-fill" style="width:${pct}%;background:${col};box-shadow:0 0 8px ${col}40"></div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Sprint 3: MRF & Kitting Summary -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px">
          <div class="card stagger-in" style="background:var(--blue-10);border:1px solid var(--blue-20)">
            <div style="font-size:11px;color:var(--blue);font-weight:700;text-transform:uppercase;margin-bottom:8px">Open Requisitions</div>
            <div style="display:flex;align-items:baseline;gap:8px">
              <div style="font-size:24px;font-weight:800;color:var(--text-primary)">${InvData.requisitions.filter(r => r.status !== 'fulfilled').length}</div>
              <div style="font-size:12px;color:var(--text-secondary)">Pending fulfillment</div>
            </div>
            <button class="btn btn-primary btn-sm" style="width:100%;margin-top:12px" onclick="renderStoreSubPage('requisitions')">Open Queue</button>
          </div>
          <div class="card stagger-in" style="background:var(--green-10);border:1px solid var(--green-20)">
            <div style="font-size:11px;color:var(--green);font-weight:700;text-transform:uppercase;margin-bottom:8px">Active Kits</div>
            <div style="display:flex;align-items:baseline;gap:8px">
              <div style="font-size:24px;font-weight:800;color:var(--text-primary)">${InvData.kitting.filter(k => k.status !== 'complete').length}</div>
              <div style="font-size:12px;color:var(--text-secondary)">In staging zones</div>
            </div>
            <button class="btn btn-secondary btn-sm" style="width:100%;margin-top:12px" onclick="renderStoreSubPage('kitting')">Kitting Hub</button>
          </div>
        </div>


        <!-- Quick actions -->
        <div class="card stagger-in">
          <div class="card-header"><span class="card-title">Operations toolbox</span></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <button class="btn btn-secondary btn-sm" onclick="openReceiveStockModal()">Receive Stock</button>
            <button class="btn btn-secondary btn-sm" onclick="openIssueStockModal()">Issue Material</button>
            <button class="btn btn-secondary btn-sm" onclick="openLogRemnantModal()">Log Remnant</button>
            <button class="btn btn-secondary btn-sm" onclick="showToast('Cycle count started','info')">Start Cycle Count</button>
          </div>
        </div>
      </div>

      <!-- Recent movements -->
      <div class="card stagger-in">
        <div class="card-header">
          <span class="card-title">Recent material movements</span>
          <button class="btn btn-ghost btn-sm" onclick="renderStoreSubPage('movements')">View all →</button>
        </div>
        <div class="table-wrap" style="margin-top:10px">
          <table class="data-table">
            <thead>
              <tr><th>Type</th><th>Item</th><th>Qty</th><th>Date</th></tr>
            </thead>
            <tbody>
              ${recentMoves.map(m => {
                const typeMap = { receipt: 'badge-green', issue: 'badge-accent', return: 'badge-blue', adjustment: 'badge-muted' };
                return `
                <tr onclick="openMovementDetail('${m.id}')" style="cursor:pointer">
                  <td><span class="badge ${typeMap[m.type] || 'badge-muted'}" style="font-size:9px">${m.type.toUpperCase()}</span></td>
                  <td>
                    <div style="font-size:12px;font-weight:500;color:var(--text-primary)">${m.description}</div>
                    <div style="font-size:10px;color:var(--text-hint)">${m.pn}</div>
                  </td>
                  <td style="font-family:var(--font-mono);font-size:12px;color:${m.qty < 0 ? 'var(--red)' : 'var(--text-primary)'}">${m.qty > 0 ? '+' : ''}${m.qty}</td>
                  <td style="font-size:11px;color:var(--text-muted)">${m.date}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}


function renderInvLedger() {
  const el = document.getElementById('pageContent');
  if (!el) return;

  const categories = [...new Set(InvData.items.map(i => i.category))].sort();
  const statusFilters = ['all', 'available', 'pending-qc', 'quarantine', 'on-order'];
  
  // Filter logic
  let filtered = InvData.items.filter(item => {
    const matchesStatus   = invLedgerFilter === 'all' || item.status === invLedgerFilter;
    const matchesCategory = invLedgerCategory === 'all' || item.category === invLedgerCategory;
    const s = invLedgerSearch.toLowerCase();
    const matchesSearch   = !s || 
      item.pn.toLowerCase().includes(s) || 
      item.description.toLowerCase().includes(s) || 
      (item.heatNo && item.heatNo.toLowerCase().includes(s)) ||
      item.location.toLowerCase().includes(s);
    return matchesStatus && matchesCategory && matchesSearch;
  });

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Stock Ledger</div>
        <div class="page-subtitle">Master inventory registry · ${InvData.items.length} total lines · ${fmt(InvData.items.reduce((s,i)=>s+(i.totalValue||0),0))} valuation</div>
      </div>
      <div class="page-actions">
        <div id="ledgerBatchActions" class="batch-actions-bar" style="display:none;margin-right:12px;padding:4px 12px;background:var(--bg-elevated);border:1px solid var(--brand);border-radius:var(--radius-md);gap:8px;align-items:center">
          <span style="font-size:12px;font-weight:600;color:var(--brand);margin-right:8px"><span id="batchCount">0</span> selected</span>
          <button class="btn btn-ghost btn-sm" onclick="batchIssue()">Issue</button>
          <button class="btn btn-ghost btn-sm" onclick="batchQuarantine()">Quarantine</button>
          <button class="btn btn-ghost btn-sm" onclick="showToast('Exporting selection...','info')">Export</button>
          <button class="btn btn-ghost btn-sm" onclick="clearLedgerSelection()" style="color:var(--text-muted)">Cancel</button>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="renderStore_stock_ledger()">
          <svg viewBox="0 0 15 15" fill="none" style="width:12px;height:12px"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Refresh
        </button>
        <button class="btn btn-primary btn-sm" onclick="openReceiveStockModal()">+ Receive New Stock</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:20px">
      <div class="card-header" style="padding:12px 16px;background:var(--bg-elevated)">
        <div style="display:flex;gap:12px;flex:1;align-items:center">
          <div class="search-input-wrap" style="flex:1;max-width:400px">
            <svg class="search-icon" viewBox="0 0 15 15" fill="none"><path d="M14.5 14.5l-4-4m-4 2a6 6 0 110-12 6 6 0 010 12z" stroke="currentColor" stroke-width="1.5"/></svg>
            <input type="text" class="search-input" placeholder="Search PN, Heat No, Location..." value="${invLedgerSearch}" oninput="handleLedgerSearch(this.value)"/>
          </div>
          
          <select class="btn btn-ghost btn-sm" onchange="setLedgerCategory(this.value)" style="border:1px solid var(--border)">
            <option value="all">All Categories</option>
            ${categories.map(c => `<option value="${c}" ${invLedgerCategory===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>

        <div style="display:flex;gap:6px">
          ${statusFilters.map(f => `
            <button class="btn btn-ghost btn-sm" style="${invLedgerFilter===f?'background:var(--bg-surface);border:1px solid var(--border);color:var(--brand)':''}" onclick="setInvLedgerFilter('${f}')">
              ${f === 'all' ? 'All' : f === 'pending-qc' ? 'Pending QC' : f === 'on-order' ? 'On Order' : f.charAt(0).toUpperCase()+f.slice(1)}
            </button>`).join('')}
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table table--dense">
          <thead>
            <tr>
              <th style="width:30px"><input type="checkbox" onclick="toggleAllLedger(this.checked)"/></th>
              <th>Part Number</th>
              <th>Description</th>
              <th>Category</th>
              <th style="text-align:right">On Hand</th>
              <th style="text-align:right">Reserved</th>
              <th style="text-align:right">Free</th>
              <th>Heat / Batch</th>
              <th>Location</th>
              <th style="text-align:right">Value</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? `<tr><td colspan="11" style="text-align:center;padding:40px;color:var(--text-muted)">No matching stock lines found.</td></tr>` : ''}
            ${filtered.map(item => {
              const statusMap = {
                available:    ['badge-green',  'Available'],
                'pending-qc': ['badge-amber',  'Pending QC'],
                quarantine:   ['badge-red',    'Quarantine'],
                'on-order':   ['badge-blue',   'On Order'],
                issued:       ['badge-muted',  'Issued'],
              };
              const [badgeCls, badgeLbl] = statusMap[item.status] || ['badge-muted', item.status];
              const freeQty = item.qtyOnHand - item.qtyReserved;
              const isLow = item.status === 'available' && item.qtyOnHand <= item.minStock && item.minStock > 0;
              const rowStyle = isLow ? 'background:rgba(245,158,11,0.03);border-left:3px solid var(--amber)' : item.status === 'quarantine' ? 'background:rgba(245,101,101,0.03);border-left:3px solid var(--red)' : '';
              
              const isSelected = invSelectedItems.has(item.id);
              
              return `
              <tr onclick="openStockItemDetail('${item.id}')" style="cursor:pointer;${rowStyle}">
                <td onclick="event.stopPropagation()">
                  <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleItemSelection('${item.id}', this.checked)"/>
                </td>
                <td><span style="font-family:var(--font-mono);font-size:11px;color:var(--brand);font-weight:600">${item.pn}</span></td>
                <td>
                  <div style="font-size:12px;font-weight:500;color:var(--text-primary)">${item.description}</div>
                  ${isLow ? `<div style="font-size:10px;color:var(--amber);margin-top:2px">⚠ Low stock: min ${item.minStock}</div>` : ''}
                </td>
                <td style="font-size:11px;color:var(--text-secondary)">${item.category}</td>
                <td style="font-family:var(--font-mono);font-size:12px;text-align:right;font-weight:500">${item.qtyOnHand} <span style="color:var(--text-muted);font-size:10px">${item.uom}</span></td>
                <td style="font-family:var(--font-mono);font-size:12px;text-align:right;color:var(--text-secondary)">${item.qtyReserved}</td>
                <td style="font-family:var(--font-mono);font-size:12px;text-align:right;color:${freeQty <= 0 ? 'var(--red)' : 'var(--green)'};font-weight:600">${freeQty}</td>
                <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary)">${item.heatNo || '—'}</td>
                <td style="font-size:11px;color:var(--text-muted)">${item.location}</td>
                <td style="font-family:var(--font-mono);font-size:12px;text-align:right;color:var(--blue)">${item.totalValue ? fmt(item.totalValue) : '—'}</td>
                <td><span class="badge ${badgeCls}" style="font-size:10px">${badgeLbl}</span></td>
                <td onclick="event.stopPropagation()">
                  <div style="display:flex;gap:8px;justify-content:flex-end">
                    <button class="btn-icon" title="Transfer Bin" onclick="openTransferStockModal('${item.id}')">
                      <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M12.5 3.5L10 1m2.5 2.5L10 6m2.5-2.5H2M2.5 11.5L5 14m-2.5-2.5L5 9m-2.5 2.5H13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                    <button class="btn-icon" title="Adjust Stock" onclick="openAdjustStockModal('${item.id}')">
                      <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5v12M1.5 7.5h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
                    </button>
                    <button class="btn-icon" title="History" onclick="openMovementDetail('${item.id}')">
                      <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M13.5 7.5a6 6 0 11-12 0 6 6 0 0112 0z" stroke="currentColor" stroke-width="1.4"/><path d="M7.5 4v3.5h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
                    </button>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div style="padding:10px 16px;border-top:1px solid var(--border);display:flex;justify-content:space-between;font-size:12px;color:var(--text-secondary);background:var(--bg-elevated)">
        <div>Showing <strong>${filtered.length}</strong> of ${InvData.items.length} lines</div>
        <div>Total Value: <strong style="color:var(--blue);font-family:var(--font-mono)">${fmt(filtered.reduce((s,i)=>s+(i.totalValue||0),0))}</strong></div>
      </div>
    </div>
  `;
}

function handleLedgerSearch(v) {
  invLedgerSearch = v;
  renderInvLedger();
}

function setLedgerCategory(c) {
  invLedgerCategory = c;
  renderInvLedger();
}

function setInvLedgerFilter(f) {
  invLedgerFilter = f;
  renderInvLedger();
}

function handleLedgerSearch(val) {
  invLedgerSearch = val;
  renderInvLedger();
}

function setLedgerCategory(val) {
  invLedgerCategory = val;
  renderInvLedger();
}

function toggleItemSelection(id, checked) {
  if (checked) invSelectedItems.add(id);
  else invSelectedItems.delete(id);
  updateBatchBar();
}

function toggleAllLedger(checked) {
  const visibleIds = InvData.items.filter(item => {
    const matchesStatus = invLedgerFilter === 'all' || item.status === invLedgerFilter;
    const matchesCategory = invLedgerCategory === 'all' || item.category === invLedgerCategory;
    const s = invLedgerSearch.toLowerCase();
    return matchesStatus && matchesCategory && (!s || item.pn.toLowerCase().includes(s));
  }).map(i => i.id);

  if (checked) visibleIds.forEach(id => invSelectedItems.add(id));
  else visibleIds.forEach(id => invSelectedItems.delete(id));
  renderInvLedger();
  updateBatchBar();
}

function updateBatchBar() {
  const bar = document.getElementById('ledgerBatchActions');
  const count = document.getElementById('batchCount');
  if (!bar || !count) return;
  
  if (invSelectedItems.size > 0) {
    bar.style.display = 'flex';
    count.textContent = invSelectedItems.size;
  } else {
    bar.style.display = 'none';
  }
}

function clearLedgerSelection() {
  invSelectedItems.clear();
  renderInvLedger();
  updateBatchBar();
}

function batchIssue() {
  const ids = Array.from(invSelectedItems);
  showToast(`Initiating batch issue for ${ids.length} items...`, 'info');
  openIssueStockModal(ids[0]); // Demo: preselect first one
}

function batchQuarantine() {
  const ids = Array.from(invSelectedItems);
  showToast(`${ids.length} items moved to quarantine.`, 'error');
  ids.forEach(id => {
    const item = InvData.items.find(i => i.id === id);
    if (item) item.status = 'quarantine';
  });
  clearLedgerSelection();
}

/* ═══════════════════════════════════════════════════════════
   TAB 3 — MOVEMENTS (Wrapper)
   ═══════════════════════════════════════════════════════════ */
function renderInvMovements() {
  const el = document.getElementById('pageContent');
  if (!el) return;

  const mtdReceipts = InvData.movements.filter(m => m.type === 'receipt' && m.date.startsWith('2025-05')).length;
  const mtdIssues   = InvData.movements.filter(m => m.type === 'issue' && m.date.startsWith('2025-05')).length;
  const totalValue  = InvData.movements.filter(m => m.type === 'receipt').reduce((s, m) => s + (m.qty * 100), 0); // Mock value calculation

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Material Movements & Receipts</div>
        <div class="page-subtitle">Warehouse audit trail · Inbound GRN tracking · Material issuance log</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="exportMovements()">
          <svg viewBox="0 0 15 15" fill="none" style="width:12px;height:12px;margin-right:4px"><path d="M7.5 10.5V1.5M4.5 7.5L7.5 10.5L10.5 7.5M1.5 13.5H13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Export CSV
        </button>
        <button class="btn btn-primary btn-sm" onclick="openReceiveStockModal()">
          <svg viewBox="0 0 15 15" fill="none" style="width:12px;height:12px"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          New Receipt (GRN)
        </button>
      </div>
    </div>

    <!-- Movement KPI Ribbon -->
    <div class="metric-grid stagger-in" style="margin-bottom:20px">
      ${[
        { label: 'Receipts (MTD)', value: mtdReceipts, sub: 'Inbound GRNs', color: 'var(--green)' },
        { label: 'Issues (MTD)',   value: mtdIssues,   sub: 'Shop floor pull', color: 'var(--accent)' },
        { label: 'Inbound Value',  value: fmt(totalValue), sub: 'Value received MTD', color: 'var(--brand)' },
        { label: 'Audit Alerts',   value: InvData.movements.filter(m=>m.type==='adjustment').length, sub: 'Manual corrections', color: 'var(--amber)' },
      ].map(k => `
        <div class="metric-card metric-card--glass">
          <div class="metric-label">${k.label}</div>
          <div class="metric-value" style="font-size:22px;color:${k.color}">${k.value}</div>
          <div class="metric-sub">${k.sub}</div>
        </div>`).join('')}
    </div>

    <div class="card" style="margin-bottom:20px">
      <div class="card-header" style="background:var(--bg-elevated);padding:12px 16px">
        <div style="display:flex;flex-wrap:wrap;gap:12px;flex:1;align-items:center">
          <div class="search-input-wrap" style="flex:1;min-width:200px;max-width:300px">
            <svg class="search-icon" viewBox="0 0 15 15" fill="none"><path d="M14.5 14.5l-4-4m-4 2a6 6 0 110-12 6 6 0 010 12z" stroke="currentColor" stroke-width="1.5"/></svg>
            <input type="text" class="search-input" placeholder="Search PN, Heat, Ref..." value="${invMovSearch}" oninput="handleMovSearch(this.value)"/>
          </div>
          
          <div style="display:flex;gap:8px;align-items:center">
            <input type="date" class="btn btn-ghost btn-sm" style="border:1px solid var(--border)" value="${invMovDateStart}" onchange="setInvMovDateFilter('start', this.value)"/>
            <span style="color:var(--text-muted);font-size:11px">to</span>
            <input type="date" class="btn btn-ghost btn-sm" style="border:1px solid var(--border)" value="${invMovDateEnd}" onchange="setInvMovDateFilter('end', this.value)"/>
          </div>

          <select class="btn btn-ghost btn-sm" style="border:1px solid var(--border)" onchange="setInvMovProjectFilter(this.value)">
            <option value="all">All Projects</option>
            ${[...new Set(InvData.movements.map(m=>m.project).filter(p=>p))].sort().map(p => `<option value="${p}" ${invMovProject===p?'selected':''}>${p}</option>`).join('')}
          </select>
          
          <div style="display:flex;gap:4px;margin-left:auto">
            ${['all', 'receipt', 'issue', 'return', 'adjustment'].map(f => `
              <button class="btn btn-ghost btn-sm" style="${invMovFilter===f?'background:var(--bg-surface);border:1px solid var(--border);color:var(--brand)':''}" onclick="setInvMovFilter('${f}')">
                ${f.charAt(0).toUpperCase()+f.slice(1)}
              </button>`).join('')}
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table table--dense">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Date</th>
              <th>Item / PN</th>
              <th style="text-align:right">Quantity</th>
              <th>Source → Destination</th>
              <th>Project</th>
              <th>Ref / Heat</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="invMovTableBody"></tbody>
        </table>
      </div>
    </div>
  `;

  renderInvMovRows();
}

function renderInvMovRows() {
  let filtered = InvData.movements.filter(m => {
    const matchesType = invMovFilter === 'all' || m.type === invMovFilter;
    const matchesProj = invMovProject === 'all' || m.project === invMovProject;
    
    const s = invMovSearch.toLowerCase();
    const matchesSearch = !s || 
      m.id.toLowerCase().includes(s) || 
      m.pn.toLowerCase().includes(s) || 
      m.description.toLowerCase().includes(s) || 
      (m.reference && m.reference.toLowerCase().includes(s)) ||
      (m.heatNo && m.heatNo.toLowerCase().includes(s));

    const matchesDate = (!invMovDateStart || m.date >= invMovDateStart) && 
                        (!invMovDateEnd || m.date <= invMovDateEnd);

    return matchesType && matchesProj && matchesSearch && matchesDate;
  });

  const typeMap = {
    receipt:    ['badge-green',  'Receipt'],
    issue:      ['badge-accent', 'Issue'],
    return:     ['badge-blue',   'Return'],
    adjustment: ['badge-muted',  'Adjustment'],
    reversal:   ['badge-red',    'Reversal'],
  };

  const tbody = document.getElementById('invMovTableBody');
  if (!tbody) return;

  tbody.innerHTML = filtered.map(m => {
    const [badgeCls, lbl] = typeMap[m.type] || ['badge-muted', m.type];
    const qtyCol = m.type === 'issue' || m.qty < 0 ? 'var(--red)' : m.type === 'receipt' ? 'var(--green)' : 'var(--text-primary)';
    const isVoid = m.notes && m.notes.includes('VOID');
    
    return `
      <tr onclick="openMovementDetail('${m.id}')" style="cursor:pointer; ${isVoid ? 'opacity:0.4;text-decoration:line-through' : ''}">
        <td><span style="font-family:var(--font-mono);font-size:11px;color:var(--brand)">${m.id}</span></td>
        <td><span class="badge ${badgeCls}" style="font-size:9px">${lbl.toUpperCase()}</span></td>
        <td style="font-size:11px;color:var(--text-muted)">${m.date}</td>
        <td>
          <div style="font-size:12px;font-weight:500;color:var(--text-primary)">${m.description}</div>
          <div style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono)">${m.pn}</div>
        </td>
        <td style="font-family:var(--font-mono);font-size:12px;font-weight:600;text-align:right;color:${qtyCol}">
          ${m.qty > 0 ? '+' : ''}${m.qty} <span style="font-size:10px;color:var(--text-muted)">${m.uom}</span>
        </td>
        <td style="font-size:11px;color:var(--text-muted);max-width:160px">
          <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.from}</div>
          <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-secondary)">→ ${m.to}</div>
        </td>
        <td><span style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary)">${m.project || '—'}</span></td>
        <td>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--blue);font-weight:500">${m.reference}</div>
          <div style="font-size:10px;color:var(--text-hint)">${m.heatNo || '—'}</div>
        </td>
        <td onclick="event.stopPropagation()">
          <div style="display:flex;gap:6px;justify-content:flex-end">
            ${!isVoid ? `<button class="btn-icon" title="Reverse Transaction" onclick="reverseMovement('${m.id}')">
              <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M1.5 7.5l4-4m-4 4l4 4m-4-4H13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>` : ''}
            <button class="btn-icon" title="View Detail" onclick="openMovementDetail('${m.id}')">
              <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M7.5 13.5a6 6 0 100-12 6 6 0 000 12zM7.5 4v4m0 2v.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function setInvMovFilter(f) {
  invMovFilter = f;
  renderInvMovements();
}

function setInvMovDateFilter(type, val) {
  if (type === 'start') invMovDateStart = val;
  else invMovDateEnd = val;
  renderInvMovements();
}

function setInvMovProjectFilter(val) {
  invMovProject = val;
  renderInvMovements();
}

function handleMovSearch(val) {
  invMovSearch = val;
  renderInvMovRows();
}

function reverseMovement(id) {
  const m = InvData.movements.find(x => x.id === id);
  if (!m) return;
  
  if (confirm(`Are you sure you want to reverse transaction ${id}? This will create a compensating entry.`)) {
    const reversal = {
      ...m,
      id: 'REV-' + Date.now().toString().slice(-6),
      type: 'reversal',
      date: new Date().toISOString().split('T')[0],
      qty: -m.qty,
      notes: `REVERSAL of ${id}: ${m.notes || ''}`,
      executedBy: 'Current User'
    };
    
    m.notes = (m.notes || '') + ' [VOIDED BY REVERSAL]';
    InvData.movements.unshift(reversal);
    
    // Also update main ledger if applicable
    const item = InvData.items.find(i => i.pn === m.pn && i.heatNo === m.heatNo);
    if (item) {
      item.qtyOnHand += reversal.qty;
      item.totalValue = item.qtyOnHand * (item.unitValue || 0);
    }
    
    showToast(`Transaction ${id} reversed successfully`, 'success');
    renderInvMovements();
  }
}

function exportMovements() {
  showToast('Generating CSV audit export...', 'info');
  setTimeout(() => {
    showToast('Export ready for download', 'success');
  }, 1500);
}

/* ═══════════════════════════════════════════════════════════
   TAB 4 — QUARANTINE (Wrapper)
   ═══════════════════════════════════════════════════════════ */
function renderInvQuarantine() {
  const el = document.getElementById('pageContent');
  if (!el) return;

  const quarantineItems  = InvData.items.filter(i => i.status === 'quarantine');
  const pendingQCItems   = InvData.items.filter(i => i.status === 'pending-qc');

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Quarantine & Non-Conformance</div>
        <div class="page-subtitle">Digital ring-fencing · Disposition tracking · QC integration</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="renderStore_quarantine()">
          <svg viewBox="0 0 15 15" fill="none" style="width:12px;height:12px"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Refresh
        </button>
        <button class="btn btn-primary btn-sm" onclick="navigate('quality')">Go to QC Command Centre</button>
      </div>
    </div>

    <!-- Summary KPIs -->
    <div class="metric-grid stagger-in" style="margin-bottom:20px">
      ${[
        { label:'Active quarantine',      value: InvData.quarantine.filter(q=>q.status==='open').length,    color:'var(--red)',    sub:'Requires action' },
        { label:'Pending QC clearance',   value: pendingQCItems.length,                                      color:'var(--amber)',  sub:'At dock' },
        { label:'Average ageing',         value: '4.2 days',                                                 color:'var(--text-primary)', sub:'Target < 3' },
        { label:'Value at risk',          value: fmt(quarantineItems.reduce((s,i)=>s+(i.totalValue||0),0)),   color:'var(--red)',    sub:'Stock value' },
      ].map(k => `
        <div class="metric-card metric-card--glass">
          <div class="metric-label">${k.label}</div>
          <div class="metric-value" style="font-size:24px;color:${k.color}">${k.value}</div>
          <div class="metric-sub">${k.sub}</div>
        </div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:20px">
      
      <div style="display:flex;flex-direction:column;gap:20px">
        <!-- Quarantine register -->
        <div class="card stagger-in">
          <div class="card-header">
            <span class="card-title">Quarantine register</span>
            <span class="badge badge-red">${InvData.quarantine.filter(q=>q.status==='open').length} items locked</span>
          </div>
          ${InvData.quarantine.map(q => {
            const daysOpen = Math.floor(Math.random() * 10) + 1; // Simulated
            const ageingColor = daysOpen > 5 ? 'var(--red)' : daysOpen > 2 ? 'var(--amber)' : 'var(--green)';
            return `
            <div class="inv-qrn-card" onclick="openQuarantineDetail('${q.id}')">
              <div class="inv-qrn-header">
                <div>
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                    <span style="font-family:var(--font-mono);font-size:12px;color:var(--red);font-weight:600">${q.id}</span>
                    <span style="font-size:11px;color:var(--text-muted)">·</span>
                    <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">Project: ${q.project}</span>
                  </div>
                  <div style="font-size:14px;font-weight:600;color:var(--text-primary)">${q.description}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">Ageing</div>
                  <span class="badge" style="background:${ageingColor}15;color:${ageingColor};border:1px solid ${ageingColor}30">${daysOpen} Days</span>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:12px;padding:10px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm)">
                <div><div style="font-size:9px;color:var(--text-muted);text-transform:uppercase">Qty</div><div style="font-size:12px;font-weight:500">${q.qty}</div></div>
                <div><div style="font-size:9px;color:var(--text-muted);text-transform:uppercase">Heat No</div><div style="font-size:12px;font-family:var(--font-mono)">${q.heatNo}</div></div>
                <div><div style="font-size:9px;color:var(--text-muted);text-transform:uppercase">NCR Ref</div><div style="font-size:12px;color:var(--brand);font-weight:600">${q.ncrRef}</div></div>
                <div><div style="font-size:9px;color:var(--text-muted);text-transform:uppercase">Location</div><div style="font-size:12px;color:var(--text-secondary)">${q.location}</div></div>
              </div>
              <div style="margin-top:12px;padding:10px;background:var(--red-bg);border:1px solid rgba(245,101,101,.1);border-radius:var(--radius-sm)">
                <div style="font-size:11px;color:var(--red);font-weight:600;margin-bottom:2px">DEFECT/REASON</div>
                <div style="font-size:12px;color:var(--text-primary);line-height:1.5">${q.reason}</div>
              </div>
              <div style="margin-top:12px;display:flex;gap:8px" onclick="event.stopPropagation()">
                <button class="btn btn-secondary btn-sm" onclick="showToast('Disposition flow: Release to Stock initiated','success')">Release</button>
                <button class="btn btn-secondary btn-sm" onclick="showToast('Disposition flow: Return to Vendor initiated','warn')">Return to Vendor</button>
                <button class="btn btn-secondary btn-sm" onclick="showToast('Scrap disposition logged','error')">Scrap</button>
                <button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="navigate('quality')">View NCR →</button>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:20px">
        <!-- Pending QC items -->
        <div class="card stagger-in">
          <div class="card-header">
            <span class="card-title">Awaiting QC clearance</span>
            <span class="badge badge-amber">${pendingQCItems.length} lines</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px;padding-top:10px">
            ${pendingQCItems.map(item => `
              <div class="list-item" style="padding:12px;border:1px solid var(--border);border-radius:var(--radius-md);cursor:pointer" onclick="openStockItemDetail('${item.id}')">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                  <span style="font-family:var(--font-mono);font-size:11px;color:var(--brand)">${item.grnRef || item.id}</span>
                  <span style="font-size:11px;color:var(--text-muted)">Received ${item.received}</span>
                </div>
                <div style="font-size:13px;font-weight:500;color:var(--text-primary);margin-bottom:8px">${item.description}</div>
                <div style="display:flex;gap:12px;font-size:11px;color:var(--text-secondary)">
                  <span>Qty: <strong>${item.qtyOnHand} ${item.uom}</strong></span>
                  <span>Heat: <strong style="font-family:var(--font-mono)">${item.heatNo}</strong></span>
                </div>
                <div style="margin-top:12px;display:flex;gap:8px">
                  <button class="btn btn-primary btn-sm" style="flex:1" onclick="event.stopPropagation();navigate('quality')">Execute QC</button>
                  <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();showToast('MTC documentation verified','success')">Check MTC</button>
                </div>
              </div>`).join('')}
          </div>
        </div>

        <div class="card stagger-in">
          <div class="card-header"><span class="card-title">Quarantine notes</span></div>
          <div style="font-size:12px;color:var(--text-secondary);line-height:1.7">
            Items in quarantine are digitally locked and cannot be issued to any project until a disposition is signed off by both QC and Production Managers.
          </div>
        </div>
      </div>

    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   TAB 5 — REMNANTS (Wrapper)
   ═══════════════════════════════════════════════════════════ */
function renderInvRemnants() {
  const el = document.getElementById('pageContent');
  if (!el) return;

  const available = InvData.remnants.filter(r => r.status === 'available');
  const reserved  = InvData.remnants.filter(r => r.status === 'reserved');

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Remnant Yard Management</div>
        <div class="page-subtitle">Off-cut traceability · Dimensional search · Material reuse optimization</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="renderStore_remnants()">
          <svg viewBox="0 0 15 15" fill="none" style="width:12px;height:12px"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Refresh
        </button>
        <button class="btn btn-primary btn-sm" onclick="openLogRemnantModal()">+ Log New Remnant</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:20px">
      <div class="card-header" style="background:var(--bg-elevated)">
        <div style="display:flex;gap:12px;flex:1;align-items:center">
          <div class="search-input-wrap" style="flex:1;max-width:400px">
            <svg class="search-icon" viewBox="0 0 15 15" fill="none"><path d="M14.5 14.5l-4-4m-4 2a6 6 0 110-12 6 6 0 010 12z" stroke="currentColor" stroke-width="1.5"/></svg>
            <input type="text" class="search-input" placeholder="Search by PN, Heat No, or Dimensions..." oninput="showToast('Dimensional search active','info')"/>
          </div>
          <div style="display:flex;gap:8px">
            <span class="badge badge-green">${available.length} Available</span>
            <span class="badge badge-blue">${reserved.length} Reserved</span>
          </div>
        </div>
      </div>

      <div style="padding:20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
        ${InvData.remnants.map(r => {
          const stMap = {
            available: ['badge-green', 'Available', 'var(--green)'],
            reserved:  ['badge-blue',  'Reserved',  'var(--blue)'],
            scrapped:  ['badge-muted', 'Scrapped',  'var(--text-muted)'],
          };
          const [badgeCls, stLbl, stCol] = stMap[r.status] || ['badge-muted', r.status, 'var(--text-muted)'];
          return `
          <div class="inv-remnant-card stagger-in" onclick="openRemnantDetail('${r.id}')" style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;transition:transform 0.2s, box-shadow 0.2s;cursor:pointer">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
              <div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--brand);font-weight:600;margin-bottom:2px">${r.id}</div>
                <div style="font-size:14px;font-weight:700;color:var(--text-primary)">${r.description}</div>
              </div>
              <span class="badge ${badgeCls}" style="font-size:10px">${stLbl}</span>
            </div>

            <div style="background:var(--bg-surface);border-radius:var(--radius-md);padding:12px;margin-bottom:16px;border:1px solid var(--border)">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">Dimensions (mm)</div>
              <div style="font-family:var(--font-mono);font-size:15px;color:var(--text-primary);font-weight:700">${r.dimensions}</div>
              ${r.estimatedWeight ? `<div style="font-size:11px;color:var(--text-muted);margin-top:4px">Est. Weight: <strong>${r.estimatedWeight} kg</strong></div>` : ''}
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:11px;color:var(--text-muted);margin-bottom:16px">
              <div>Original Heat<br><span style="font-family:var(--font-mono);color:var(--text-secondary);font-weight:500">${r.heatNo || 'N/A'}</span></div>
              <div>Project Link<br><span style="color:${stCol};font-weight:600">${r.project || 'Free Stock'}</span></div>
              <div>Location<br><span style="color:var(--text-secondary)">${r.location}</span></div>
              <div>Logged<br><span style="color:var(--text-secondary)">${r.created}</span></div>
            </div>

            <div style="display:flex;gap:8px" onclick="event.stopPropagation()">
              ${r.status === 'available' ? `
                <button class="btn btn-primary btn-sm" style="flex:1" onclick="showToast('Remnant reserved for project','success')">Reserve</button>
                <button class="btn btn-secondary btn-sm" onclick="showToast('Printing QR tag...','info')">Print Tag</button>
              ` : `
                <button class="btn btn-ghost btn-sm" style="flex:1" onclick="showToast('Reservation details','info')">View Reservation</button>
              `}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   TAB 6 — MATERIAL REQUISITIONS (MRF)
   ═══════════════════════════════════════════════════════════ */
function renderInvRequisitions() {
  const el = document.getElementById('pageContent');
  if (!el) return;

  const mrfPending = InvData.requisitions.filter(r => r.status === 'pending');
  const mrfPartial = InvData.requisitions.filter(r => r.status === 'partial');
  const mrfHigh    = InvData.requisitions.filter(r => r.priority === 'high' && r.status !== 'fulfilled');

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Material Requisitions (MRF)</div>
        <div class="page-subtitle">Production fulfillment queue · Shop-floor issuance tracking · Priority handling</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="renderStore_requisitions()">Refresh Queue</button>
        <button class="btn btn-primary btn-sm" onclick="openIssueStockModal()">Direct Issuance</button>
      </div>
    </div>

    <!-- KPI Strip -->
    <div class="metric-grid stagger-in" style="margin-bottom:24px">
      ${[
        { label: 'Open requisitions', value: mrfPending.length + mrfPartial.length, sub: 'Awaiting fulfillment', color: 'var(--text-primary)' },
        { label: 'High priority MRFs', value: mrfHigh.length, sub: 'Urgent production', color: 'var(--red)' },
        { label: 'Partially fulfilled', value: mrfPartial.length, sub: 'In-progress picking', color: 'var(--blue)' },
        { label: 'Avg pick time', value: '18m', sub: 'Last 24 hours', color: 'var(--green)' },
      ].map(k => `
        <div class="kpi-card metric-card--glass">
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-value" style="color:${k.color}">${k.value}</div>
          <div class="kpi-sub">${k.sub}</div>
        </div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:20px">
      
      <!-- MRF Queue -->
      <div class="card stagger-in">
        <div class="card-header">
          <span class="card-title">Pending Fulfillment Queue</span>
          <div style="display:flex;gap:6px">
            <span class="badge badge-muted">All Projects</span>
            <span class="badge badge-accent">${mrfPending.length + mrfPartial.length} Active</span>
          </div>
        </div>
        <div class="table-wrap" style="margin-top:10px">
          <table class="data-table table--dense">
            <thead>
              <tr><th>MRF Ref</th><th>Project</th><th>Requester</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${InvData.requisitions.sort((a,b) => a.status==='fulfilled'?1:-1).map(r => {
                const stCls = r.status==='pending'?'badge-red':(r.status==='partial'?'badge-blue':'badge-green');
                const prioCls = r.priority==='high'?'color:var(--red);font-weight:700':'';
                return `
                <tr style="opacity:${r.status==='fulfilled'?0.6:1}">
                  <td style="font-family:var(--font-mono);font-size:12px;${prioCls}">${r.id}</td>
                  <td style="font-weight:600">${r.project}</td>
                  <td style="font-size:11px;color:var(--text-secondary)">${r.requester}</td>
                  <td><span class="badge ${stCls}" style="font-size:9px">${r.status.toUpperCase()}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="openMrfDetailModal('${r.id}')">Review & Issue</button>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Compliance & Process notes -->
      <div style="display:flex;flex-direction:column;gap:20px">
        <div class="card stagger-in">
          <div class="card-header"><span class="card-title">Fulfillment Intelligence</span></div>
          <div style="display:flex;flex-direction:column;gap:15px;padding-top:10px">
            <div style="padding:12px;background:var(--blue-10);border-left:3px solid var(--blue);border-radius:var(--radius-sm)">
              <div style="font-weight:600;font-size:13px;color:var(--blue);margin-bottom:4px">Smart Allocation Enabled</div>
              <div style="font-size:11px;color:var(--text-secondary);line-height:1.5">
                The system automatically suggests stock lines from general stock or remnants first, preserving project-specific allocations where possible.
              </div>
            </div>
            <div style="padding:12px;background:var(--green-10);border-left:3px solid var(--green);border-radius:var(--radius-sm)">
              <div style="font-weight:600;font-size:13px;color:var(--green);margin-bottom:4px">Traceability Check: OK</div>
              <div style="font-size:11px;color:var(--text-secondary);line-height:1.5">
                All pending MRFs have heat-number linked stock available in store.
              </div>
            </div>
          </div>
        </div>

        <div class="card stagger-in">
          <div class="card-header"><span class="card-title">Pending Pick Tickets</span></div>
          <div style="text-align:center;padding:30px 10px;border:1px dashed var(--border);border-radius:var(--radius-lg);background:var(--bg-surface)">
             <div style="font-size:24px;margin-bottom:10px">🖨️</div>
             <div style="font-size:13px;font-weight:600;color:var(--text-primary)">No Active Pick Tickets</div>
             <div style="font-size:11px;color:var(--text-secondary);margin-top:4px">Generated tickets for the mobile picking app will appear here.</div>
          </div>
        </div>
      </div>

    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   TAB 7 — KITTING & STAGING
   ═══════════════════════════════════════════════════════════ */
function renderInvKitting() {
  const el = document.getElementById('pageContent');
  if (!el) return;

  const kits = InvData.kitting;
  const complete = kits.filter(k => k.status === 'complete').length;

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Kitting & Staging Hub</div>
        <div class="page-subtitle">Project material consolidation · Pre-pick staging · Sub-assembly kitting</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="renderStore_kitting()">Refresh Hub</button>
        <button class="btn btn-primary btn-sm" onclick="showToast('New kit initialization','info')">+ Initialize New Kit</button>
      </div>
    </div>

    <!-- KPI Strip -->
    <div class="metric-grid stagger-in" style="margin-bottom:24px">
      ${[
        { label: 'Active kits',     value: kits.length,   sub: 'In-progress consolidation', color: 'var(--text-primary)' },
        { label: 'Kits complete',   value: complete,      sub: 'Ready for production',       color: 'var(--green)' },
        { label: 'Items staged',    value: '42',          sub: 'Across 3 staging zones',     color: 'var(--blue)' },
        { label: 'Staging capacity',value: '72%',         sub: 'Floor space utilized',       color: 'var(--amber)' },
      ].map(k => `
        <div class="kpi-card metric-card--glass">
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-value" style="color:${k.color}">${k.value}</div>
          <div class="kpi-sub">${k.sub}</div>
        </div>`).join('')}
    </div>

    <div class="stagger-in" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(340px, 1fr));gap:20px">
      ${kits.map(k => {
        const stCls = k.status==='complete'?'badge-green':(k.status==='in-progress'?'badge-blue':'badge-muted');
        const progCol = k.progress === 100 ? 'var(--green)' : 'var(--brand)';
        return `
        <div class="card kit-card" style="padding:0;overflow:hidden">
          <div style="padding:16px;background:linear-gradient(to bottom right, var(--bg-surface), var(--bg-elevated));border-bottom:1px solid var(--border)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
              <div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--brand);font-weight:600;margin-bottom:2px">${k.id}</div>
                <div style="font-size:14px;font-weight:700;color:var(--text-primary)">${k.description}</div>
              </div>
              <span class="badge ${stCls}" style="font-size:10px">${k.status.toUpperCase()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:6px">
              <span style="color:var(--text-secondary)">Kitting Progress</span>
              <span style="font-weight:700;color:${progCol}">${k.progress}%</span>
            </div>
            <div class="progress-bar" style="height:6px;background:rgba(0,0,0,0.1);border-radius:10px">
              <div class="progress-fill" style="width:${k.progress}%;background:${progCol};box-shadow:0 0 8px ${progCol}40"></div>
            </div>
          </div>
          <div style="padding:16px;display:flex;flex-direction:column;gap:12px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:11px">
              <div>
                <div style="color:var(--text-muted);text-transform:uppercase;font-size:9px;letter-spacing:.05em">Project</div>
                <div style="font-weight:600;color:var(--text-primary)">${k.project}</div>
              </div>
              <div>
                <div style="color:var(--text-muted);text-transform:uppercase;font-size:9px;letter-spacing:.05em">Staging Location</div>
                <div style="font-weight:600;color:var(--blue)">${k.stagingLoc}</div>
              </div>
            </div>
            
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px">
              <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase">Pick List Preview</div>
              ${k.items.slice(0, 3).map(i => `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:11px">
                  <span style="color:var(--text-secondary)">${i.desc}</span>
                  ${i.kitted ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>` : `<span style="font-size:10px;color:var(--red)">Pending</span>`}
                </div>
              `).join('')}
            </div>

            <div style="display:flex;gap:8px;margin-top:4px">
              <button class="btn btn-secondary btn-sm" style="flex:1" onclick="showToast('Opening kit manager...','info')">Manage Kit</button>
              <button class="btn btn-ghost btn-sm" onclick="showToast('Pick ticket generated','success')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg></button>
            </div>
          </div>
        </div>
        `;
      }).join('')}
    </div>
  `;
}

function openMrfDetailModal(mrfId) {
  const mrf = InvData.requisitions.find(r => r.id === mrfId);
  if (!mrf) return;

  openInvModal(`
    <div class="inv-modal-inner" style="max-width:700px">
      <div class="inv-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:12px;color:var(--brand);margin-bottom:3px">${mrf.id} · ${mrf.project}</div>
          <div style="font-family:var(--font-display);font-size:16px;font-weight:700">Material Fulfillment: ${mrf.requester}</div>
        </div>
        <button class="btn-icon" onclick="closeInvModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="inv-modal-body">
        <div style="margin-bottom:15px;display:flex;justify-content:space-between;align-items:center;background:var(--bg-surface);padding:10px 15px;border-radius:var(--radius-md);border:1px solid var(--border)">
           <div style="font-size:12px;color:var(--text-secondary)">Status: <span class="badge ${mrf.status==='pending'?'badge-red':'badge-blue'}">${mrf.status.toUpperCase()}</span></div>
           <div style="font-size:12px;color:var(--text-secondary)">Date Requested: <strong>${mrf.date}</strong></div>
        </div>

        <div style="font-weight:600;font-size:13px;margin-bottom:10px;color:var(--text-primary)">Requested Items & Fulfillment</div>
        <div class="table-wrap" style="margin-bottom:20px">
          <table class="data-table table--dense">
            <thead>
              <tr><th>Item Description</th><th>PN</th><th>Required</th><th>Fulfilled</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${mrf.items.map(item => {
                const isIssued = item.status === 'issued';
                return `
                <tr>
                  <td><div style="font-size:12px;font-weight:500">${item.description}</div></td>
                  <td><span style="font-family:var(--font-mono);font-size:11px">${item.pn}</span></td>
                  <td style="font-weight:600">${item.qty} ${item.uom}</td>
                  <td>
                    ${isIssued ? `<span class="badge badge-green" style="font-size:9px">FULFILLED</span>` : `<span style="color:var(--red);font-size:11px">Awaiting Pick</span>`}
                  </td>
                  <td>
                    ${isIssued ? `<button class="btn btn-ghost btn-sm" disabled>Issued</button>` : `<button class="btn btn-primary btn-sm" onclick="showToast('Allocating stock for ${item.pn}...','info');closeInvModal();">Pick Item</button>`}
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div style="display:flex;gap:10px">
          <button class="btn btn-secondary" style="flex:1" onclick="closeInvModal();showToast('Digital pick ticket generated','success')">Generate Pick Ticket</button>
          <button class="btn btn-ghost" onclick="closeInvModal()">Close</button>
        </div>
      </div>
    </div>
  `, true);
}

/* ═══════════════════════════════════════════════════════════
   DETAIL MODALS
═══════════════════════════════════════════════════════════ */
function openStockItemDetail(id) {
  const item = InvData.items.find(i => i.id === id);
  if (!item) return;

  const statusMap = {
    available:    ['badge-green',  'Available'],
    'pending-qc': ['badge-amber',  'Pending QC'],
    quarantine:   ['badge-red',    'Quarantine'],
    'on-order':   ['badge-blue',   'On Order'],
  };
  const [badgeCls, badgeLbl] = statusMap[item.status] || ['badge-muted', item.status];
  const freeQty = item.qtyOnHand - item.qtyReserved;

  /* Recent movements for this PN */
  const itemMoves = InvData.movements.filter(m => m.pn === item.pn).slice(0, 4);

  openInvModal(`
    <div class="inv-modal-inner">
      <div class="inv-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:12px;color:var(--brand);margin-bottom:3px">${item.id} · ${item.pn}</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${item.description}</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${item.category}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="badge ${badgeCls}" style="font-size:10px">${badgeLbl}</span>
          <button class="btn-icon" onclick="closeInvModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
      </div>
      <div class="inv-modal-body">
        <!-- Qty summary -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
          ${[
            ['On hand',   item.qtyOnHand,    'var(--text-primary)'],
            ['Reserved',  item.qtyReserved,  'var(--amber)'],
            ['Free',      freeQty,           freeQty <= 0 ? 'var(--red)' : 'var(--green)'],
            ['Min stock', item.minStock,     'var(--text-muted)'],
          ].map(([l,v,col]) => `
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px;text-align:center">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px">${l}</div>
              <div style="font-family:var(--font-display);font-size:20px;font-weight:700;color:${col}">${v} <span style="font-size:10px;color:var(--text-muted)">${item.uom}</span></div>
            </div>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${[
            ['Heat number', item.heatNo || '—'],
            ['Location', item.location],
            ['Supplier', item.supplier || '—'],
            ['Project', item.project || 'General stock'],
            ['MTC reference', item.mtcRef || '—'],
            ['GRN reference', item.grnRef || '—'],
            ['IR reference', item.irRef || '—'],
            ['Unit value', item.unitValue ? fmt(item.unitValue) : '—'],
          ].map(([l,v]) => `
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px">${l}</div>
              <div style="font-size:12px;color:var(--text-primary)">${v}</div>
            </div>`).join('')}
        </div>
        ${item.notes ? `
          <div style="padding:10px 12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm)">
            <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:4px">Notes</div>
            <div style="font-size:12px;color:var(--text-secondary);line-height:1.6">${item.notes}</div>
          </div>` : ''}
        ${itemMoves.length ? `
          <div>
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:8px">Recent movements for this PN</div>
            ${itemMoves.map(m => `
              <div style="display:flex;align-items:center;gap:10px;padding:7px 10px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:5px;font-size:11px">
                <span style="font-family:var(--font-mono);color:var(--brand);width:88px;flex-shrink:0">${m.id}</span>
                <span class="badge ${m.type==='receipt'?'badge-green':m.type==='issue'?'badge-accent':'badge-muted'}" style="font-size:10px">${m.type}</span>
                <span style="color:var(--text-muted)">${m.date}</span>
                <span style="font-family:var(--font-mono);color:${m.type==='issue'?'var(--amber)':'var(--green)'};margin-left:auto">${m.type==='issue'?'-':'+'}${Math.abs(m.qty)} ${m.uom}</span>
              </div>`).join('')}
          </div>` : ''}
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${item.status === 'available' ? `<button class="btn btn-primary" onclick="closeInvModal();openIssueStockModal('${item.id}')">Issue Stock</button>` : ''}
          <button class="btn btn-secondary" onclick="closeInvModal();openTransferStockModal('${item.id}')">Transfer Bin</button>
          <button class="btn btn-secondary" onclick="closeInvModal();openAdjustStockModal('${item.id}')">Adjust Qty</button>
          <button class="btn btn-ghost" onclick="closeInvModal();showToast('Stock card printed','info')">Print Card</button>
          <button class="btn btn-ghost" onclick="closeInvModal()">Close</button>
        </div>
      </div>
    </div>`, true);
}

function openMovementDetail(id) {
  const m = InvData.movements.find(x => x.id === id);
  if (!m) return;
  const typeMap = {
    receipt:    ['badge-green',  'Receipt'],
    issue:      ['badge-accent', 'Issue'],
    return:     ['badge-blue',   'Return'],
    adjustment: ['badge-muted',  'Adjustment'],
  };
  const [badgeCls, lbl] = typeMap[m.type] || ['badge-muted', m.type];

  openInvModal(`
    <div class="inv-modal-inner">
      <div class="inv-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:12px;color:var(--brand);margin-bottom:3px">${m.id}</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${m.description}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="badge ${badgeCls}" style="font-size:10px">${lbl}</span>
          <button class="btn-icon" onclick="closeInvModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
      </div>
      <div class="inv-modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          ${[
            ['Part number', m.pn],
            ['Quantity', `${m.qty > 0 ? '+' : ''}${m.qty} ${m.uom}`],
            ['Date', m.date],
          ].map(([l,v]) => `
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px">${l}</div>
              <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${v}</div>
            </div>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${[
            ['From', m.from],
            ['To', m.to],
            ['Project', m.project || '—'],
            ['Reference', m.reference],
            ['Heat number', m.heatNo || '—'],
            ['Executed by', m.executedBy],
          ].map(([l,v]) => `
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px">${l}</div>
              <div style="font-size:12px;color:var(--text-primary)">${v}</div>
            </div>`).join('')}
        </div>
        ${m.notes ? `
          <div style="padding:10px 12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm)">
            <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:4px">Notes</div>
            <div style="font-size:12px;color:var(--text-secondary);line-height:1.6">${m.notes}</div>
          </div>` : ''}
        <div style="display:flex;gap:10px">
          <button class="btn btn-secondary" onclick="closeInvModal();showToast('Movement slip printed','info')">Print slip</button>
          <button class="btn btn-ghost" onclick="closeInvModal()">Close</button>
        </div>
      </div>
    </div>`);
}

function openQuarantineDetail(id) {
  const q = InvData.quarantine.find(x => x.id === id);
  if (!q) return;

  openInvModal(`
    <div class="inv-modal-inner">
      <div class="inv-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:12px;color:var(--red);margin-bottom:3px">${q.id} — QUARANTINE</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${q.description}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="badge badge-red" style="font-size:10px">Open</span>
          <button class="btn-icon" onclick="closeInvModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
      </div>
      <div class="inv-modal-body">
        <div style="padding:12px;background:var(--red-bg);border:1px solid rgba(245,101,101,.2);border-radius:var(--radius-sm)">
          <div style="font-size:11px;color:var(--red);font-weight:600;margin-bottom:4px">QUARANTINE REASON</div>
          <div style="font-size:13px;color:var(--text-primary)">${q.reason}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${[
            ['Part number', q.pn],
            ['Quantity', q.qty],
            ['Heat number', q.heatNo],
            ['Project', q.project],
            ['Supplier', q.supplier],
            ['Location', q.location],
            ['GRN ref', q.grnRef],
            ['NCR ref', q.ncrRef],
            ['Quarantine date', fmtDate(q.quarantineDate)],
            ['Raised by', q.raisedBy],
          ].map(([l,v]) => `
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px">${l}</div>
              <div style="font-size:12px;color:var(--text-primary)">${v}</div>
            </div>`).join('')}
        </div>
        <div style="padding:10px 12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm)">
          <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:4px">Notes</div>
          <div style="font-size:12px;color:var(--text-secondary);line-height:1.6">${q.notes}</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-secondary" style="color:var(--red)" onclick="closeInvModal();navigate('quality');showToast('NCR ${q.ncrRef} opened','info')">View NCR in QC</button>
          <button class="btn btn-secondary" onclick="closeInvModal();showToast('Disposition request sent to supplier','warn')">Request disposition</button>
          <button class="btn btn-ghost" onclick="closeInvModal()">Close</button>
        </div>
      </div>
    </div>`);
}

function openRemnantDetail(id) {
  const r = InvData.remnants.find(x => x.id === id);
  if (!r) return;

  openInvModal(`
    <div class="inv-modal-inner">
      <div class="inv-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:12px;color:var(--brand);margin-bottom:3px">${r.id}</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${r.description}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="badge ${r.status==='available'?'badge-green':'badge-blue'}" style="font-size:10px">${r.status.charAt(0).toUpperCase()+r.status.slice(1)}</span>
          <button class="btn-icon" onclick="closeInvModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
      </div>
      <div class="inv-modal-body">
        <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px">
          <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:6px">Dimensions</div>
          <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--text-primary)">${r.dimensions}</div>
          ${r.estimatedWeight ? `<div style="font-size:12px;color:var(--text-muted);margin-top:4px">Estimated weight: ~${r.estimatedWeight} kg</div>` : ''}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${[
            ['Part number', r.pn],
            ['Heat number', r.heatNo || 'Not recorded'],
            ['Project', r.project || 'General stock'],
            ['Location', r.location],
            ['Logged by', r.createdBy],
            ['Date logged', r.created],
          ].map(([l,v]) => `
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px">${l}</div>
              <div style="font-size:12px;color:var(--text-primary)">${v}</div>
            </div>`).join('')}
        </div>
        ${r.notes ? `
          <div style="padding:10px 12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm)">
            <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:4px">Notes</div>
            <div style="font-size:12px;color:var(--text-secondary);line-height:1.6">${r.notes}</div>
          </div>` : ''}
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${r.status === 'available' ? `<button class="btn btn-primary" onclick="closeInvModal();showToast('Remnant ${r.id} reserved','success')">Reserve</button>` : ''}
          <button class="btn btn-secondary" onclick="closeInvModal();showToast('Remnant tag printed','info')">Print tag</button>
          <button class="btn btn-ghost" onclick="closeInvModal()">Close</button>
        </div>
      </div>
    </div>`);
}

/* ═══════════════════════════════════════════════════════════
   ACTION MODALS — Issue / Receive / Adjust / Remnant
═══════════════════════════════════════════════════════════ */
function openIssueStockModal(preselect) {
  openInvModal(`
    <div class="inv-modal-inner">
      <div class="inv-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Issue Material to Shop Floor</div>
        <button class="btn-icon" onclick="closeInvModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="inv-modal-body">
        <div class="inv-field-row">
          <div class="inv-field">
            <label>Project</label>
            <select>${AppState.projects.map(p => `<option>${p.id} — ${p.name.split('—')[0].trim()}</option>`).join('')}</select>
          </div>
          <div class="inv-field">
            <label>Work centre / station</label>
            <input type="text" placeholder="e.g. Cutting Station 1"/>
          </div>
        </div>
        <div class="inv-field">
          <label>Item (part number)</label>
          <select>
            ${InvData.items.filter(i => i.status === 'available' && i.qtyOnHand > 0).map(i => `
              <option ${preselect===i.id?'selected':''} value="${i.id}">${i.pn} — ${i.description} (${i.qtyOnHand} ${i.uom} on hand)</option>`).join('')}
          </select>
        </div>
        <div class="inv-field-row">
          <div class="inv-field"><label>Quantity to issue</label><input type="number" placeholder="Qty"/></div>
          <div class="inv-field"><label>Material requisition ref.</label><input type="text" placeholder="e.g. MR-2025-050"/></div>
        </div>
        <div class="inv-field"><label>Issued by</label><input type="text" placeholder="Your name"/></div>
        <div class="inv-field"><label>Notes</label><textarea rows="2" placeholder="Activity / purpose…"></textarea></div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="closeInvModal();showToast('Material issued — movement logged','success')">Issue material</button>
          <button class="btn btn-secondary" onclick="closeInvModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function openReceiveStockModal() {
  openInvModal(`
    <div class="inv-modal-inner">
      <div class="inv-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Receive Stock into Store</div>
        <button class="btn-icon" onclick="closeInvModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="inv-modal-body">
        <div class="inv-field-row">
          <div class="inv-field">
            <label>GRN reference</label>
            <select>
              <option value="">— Select GRN —</option>
              ${InvData.movements.filter(m=>m.type==='receipt').map(m => `<option>${m.reference}</option>`).join('')}
              <option>Manual / no GRN</option>
            </select>
          </div>
          <div class="inv-field">
            <label>Project</label>
            <select><option value="">— General stock —</option>${AppState.projects.map(p=>`<option>${p.id}</option>`).join('')}</select>
          </div>
        </div>
        <div class="inv-field"><label>Item description</label><input type="text" placeholder="Description"/></div>
        <div class="inv-field-row">
          <div class="inv-field"><label>Part number</label><input type="text" placeholder="PN"/></div>
          <div class="inv-field"><label>Heat / batch number</label><input type="text" placeholder="e.g. HN-XXXXX"/></div>
        </div>
        <div class="inv-field-row">
          <div class="inv-field"><label>Quantity received</label><input type="number" placeholder="Qty"/></div>
          <div class="inv-field">
            <label>Unit of measure</label>
            <select><option>EA</option><option>SHT</option><option>KG</option><option>M</option><option>M2</option><option>SET</option></select>
          </div>
        </div>
        <div class="inv-field-row">
          <div class="inv-field"><label>Storage location</label><input type="text" placeholder="e.g. Bay A-3"/></div>
          <div class="inv-field"><label>Unit value (USD)</label><input type="number" placeholder="0.00"/></div>
        </div>
        <div class="inv-field"><label>Notes</label><textarea rows="2" placeholder="MTC reference, supplier lot, condition…"></textarea></div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="closeInvModal();showToast('Stock received — ledger updated','success')">Receive stock</button>
          <button class="btn btn-secondary" onclick="closeInvModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function openLogRemnantModal() {
  openInvModal(`
    <div class="inv-modal-inner">
      <div class="inv-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Log Remnant</div>
        <button class="btn-icon" onclick="closeInvModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="inv-modal-body">
        <div class="inv-field-row">
          <div class="inv-field">
            <label>Part number</label>
            <select>
              ${InvData.items.map(i => `<option>${i.pn} — ${i.description}</option>`).join('')}
            </select>
          </div>
          <div class="inv-field"><label>Heat number</label><input type="text" placeholder="From original stock"/></div>
        </div>
        <div class="inv-field"><label>Dimensions (L × W × T or length)</label><input type="text" placeholder="e.g. 2400 × 800 × 10mm"/></div>
        <div class="inv-field-row">
          <div class="inv-field"><label>Estimated weight (kg)</label><input type="number" placeholder="kg"/></div>
          <div class="inv-field">
            <label>Project origin</label>
            <select><option value="">— General —</option>${AppState.projects.map(p=>`<option>${p.id}</option>`).join('')}</select>
          </div>
        </div>
        <div class="inv-field"><label>Storage location</label><input type="text" placeholder="e.g. Remnant Rack – RR-01"/></div>
        <div class="inv-field"><label>Notes</label><textarea rows="2" placeholder="Off-cut from which operation, condition…"></textarea></div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="closeInvModal();showToast('Remnant logged and tagged','success')">Log remnant</button>
          <button class="btn btn-secondary" onclick="closeInvModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function openTransferStockModal(id) {
  const item = InvData.items.find(i => i.id === id);
  if (!item) return;

  openInvModal(`
    <div class="inv-modal-inner">
      <div class="inv-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Stock Transfer (Bin Move)</div>
        <button class="btn-icon" onclick="closeInvModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="inv-modal-body">
        <div style="padding:12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:16px">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Moving Item</div>
          <div style="font-size:14px;font-weight:700">${item.pn} — ${item.description}</div>
          <div style="font-size:12px;color:var(--brand);margin-top:4px">Current Location: ${item.location}</div>
        </div>
        
        <div class="inv-field">
          <label>Target Storage Location (Bin/Bay)</label>
          <input type="text" id="targetBin" placeholder="e.g. Bay B-12 / R2-L3" list="binSuggestions"/>
          <datalist id="binSuggestions">
            <option value="Bay A-1">
            <option value="Bay A-2">
            <option value="Bay B-1">
            <option value="Bay B-2">
            <option value="Weld Bay Store">
            <option value="Quarantine Zone">
          </datalist>
        </div>
        
        <div class="inv-field">
          <label>Reason for Transfer</label>
          <select id="transferReason">
            <option>Consolidation</option>
            <option>Staging for Production</option>
            <option>Quarantine Move</option>
            <option>Space Optimization</option>
            <option>Incoming to Rack</option>
          </select>
        </div>

        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="executeStockTransfer('${item.id}')">Execute Transfer</button>
          <button class="btn btn-secondary" onclick="closeInvModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function executeStockTransfer(id) {
  const target = document.getElementById('targetBin').value;
  if (!target) { showToast('Please enter a target location', 'warn'); return; }
  
  const item = InvData.items.find(i => i.id === id);
  if (item) {
    const oldLoc = item.location;
    item.location = target;
    // Log movement
    InvData.movements.unshift({
      id: 'MV-' + Date.now().toString().slice(-6),
      type: 'adjustment',
      date: new Date().toISOString().split('T')[0],
      pn: item.pn,
      description: item.description,
      qty: 0,
      uom: item.uom,
      from: oldLoc,
      to: target,
      reference: 'BIN-MOVE',
      executedBy: 'Current User',
      notes: 'Internal stock transfer'
    });
    showToast(`Transferred ${item.pn} to ${target}`, 'success');
  }
  closeInvModal();
  renderInvLedger();
}

function openAdjustStockModal(id) {
  const item = InvData.items.find(i => i.id === id);
  if (!item) return;

  openInvModal(`
    <div class="inv-modal-inner">
      <div class="inv-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Inventory Adjustment</div>
        <button class="btn-icon" onclick="closeInvModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="inv-modal-body">
        <div style="padding:12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:16px">
          <div style="font-size:14px;font-weight:700">${item.pn}</div>
          <div style="font-size:12px;color:var(--text-secondary)">Current Stock: <strong>${item.qtyOnHand} ${item.uom}</strong></div>
        </div>
        
        <div class="inv-field-row">
          <div class="inv-field">
            <label>Adjustment Type</label>
            <select id="adjType">
              <option value="add">Addition (+)</option>
              <option value="subtract">Subtraction (-)</option>
              <option value="set">Set Absolute Value (=)</option>
            </select>
          </div>
          <div class="inv-field">
            <label>Quantity</label>
            <input type="number" id="adjQty" placeholder="0"/>
          </div>
        </div>
        
        <div class="inv-field">
          <label>Reason Code</label>
          <select id="adjReason">
            <option>Cycle Count Discrepancy</option>
            <option>Damage / Spillage</option>
            <option>Theft / Loss</option>
            <option>Data Entry Correction</option>
            <option>Project Return</option>
            <option>Found Stock</option>
          </select>
        </div>

        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="executeStockAdjustment('${item.id}')">Save Adjustment</button>
          <button class="btn btn-secondary" onclick="closeInvModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function executeStockAdjustment(id) {
  const type = document.getElementById('adjType').value;
  const qty = parseFloat(document.getElementById('adjQty').value);
  const reason = document.getElementById('adjReason').value;
  
  if (isNaN(qty)) { showToast('Please enter a valid quantity', 'warn'); return; }
  
  const item = InvData.items.find(i => i.id === id);
  if (item) {
    const oldQty = item.qtyOnHand;
    let delta = 0;
    
    if (type === 'add') { item.qtyOnHand += qty; delta = qty; }
    else if (type === 'subtract') { item.qtyOnHand -= qty; delta = -qty; }
    else if (type === 'set') { item.qtyOnHand = qty; delta = qty - oldQty; }
    
    item.totalValue = item.qtyOnHand * (item.unitValue || 0);
    
    // Log movement
    InvData.movements.unshift({
      id: 'ADJ-' + Date.now().toString().slice(-6),
      type: 'adjustment',
      date: new Date().toISOString().split('T')[0],
      pn: item.pn,
      description: item.description,
      qty: delta,
      uom: item.uom,
      from: 'System Adjustment',
      to: item.location,
      reference: 'STOCK-ADJ',
      executedBy: 'Current User',
      notes: reason
    });
    
    showToast(`Stock adjusted: ${oldQty} → ${item.qtyOnHand}`, 'success');
  }
  closeInvModal();
  renderInvLedger();
}
