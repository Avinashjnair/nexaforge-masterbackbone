/* ============================================================
   NexaForge ERP — Production Module
   Covers: BOM management · MRP engine · Master schedule (Gantt)
           Work-centre management · Routing steps · Shop-floor log
           Material requests · Nesting integration hook
   ============================================================ */

'use strict';

/* ── Production data ────────────────────────────────────────── */
const ProdData = {
  selectedProject: 'P-2401',

  /* Projects newly assigned to Production — show badge + highlight */
  _newlyAssigned: ['P-2402'],  /* P-2402 is flagged as newly assigned in this session */

  /* Bill of Materials per project */
  bom: {
    'P-2401': [
      {
        id: 'ASM-001', pn: 'TANK-50K-316L', name: '50,000L Storage Tank — Assembly', type: 'assembly',
        qty: 1, unit: 'EA', material: '316L SS', stock: 'ok', expanded: true,
        children: [
          {
            id: 'ASM-002', pn: 'SH-001', name: 'Shell assembly', type: 'assembly',
            qty: 1, unit: 'EA', material: '316L SS', stock: 'ok', expanded: false,
            children: [
            { id: 'PRT-001', pn: 'PLT-316L-10', name: 'Shell plate — 10mm', type: 'material', qty: 18, unit: 'SHT', material: '316L SS', stock: 'partial', unitCost: 1250, targetQty: 18 },
            { id: 'PRT-002', pn: 'PLT-316L-12', name: 'Shell plate — 12mm (btm)', type: 'material', qty: 4, unit: 'SHT', material: '316L SS', stock: 'ok', unitCost: 1480, targetQty: 4 },
            { id: 'PRT-003', pn: 'WELD-ER316L', name: 'Filler wire ER316L', type: 'material', qty: 45, unit: 'KG', material: 'Consumable', stock: 'ok', unitCost: 45, targetQty: 45 },
          ]
        },
        {
          id: 'ASM-003', pn: 'RF-001', name: 'Roof assembly (cone)', type: 'assembly',
          qty: 1, unit: 'EA', material: '316L SS', stock: 'ok', expanded: false,
          children: [
            { id: 'PRT-004', pn: 'PLT-316L-8', name: 'Roof plate — 8mm', type: 'material', qty: 8, unit: 'SHT', material: '316L SS', stock: 'ok', unitCost: 1100, targetQty: 8 },
            { id: 'PRT-005', pn: 'ANG-316L-75', name: 'Top angle 75×75×8', type: 'material', qty: 32, unit: 'M', material: '316L SS', stock: 'low', unitCost: 85, targetQty: 32 },
          ]
        },
        {
          id: 'ASM-004', pn: 'NZ-PKG', name: 'Nozzle package', type: 'assembly',
          qty: 1, unit: 'EA', material: 'Mixed', stock: 'low', expanded: false,
          children: [
            { id: 'PRT-006', pn: 'NZ-150-150LB', name: 'Nozzle DN150 150LB WNRF', type: 'part', qty: 2, unit: 'EA', material: '316L SS', stock: 'ok', unitCost: 420, targetQty: 2 },
            { id: 'PRT-007', pn: 'NZ-100-150LB', name: 'Nozzle DN100 150LB WNRF', type: 'part', qty: 4, unit: 'EA', material: '316L SS', stock: 'ok', unitCost: 280, targetQty: 4 },
            { id: 'PRT-008', pn: 'NZ-50-150LB',  name: 'Nozzle DN50 150LB WNRF',  type: 'part', qty: 6, unit: 'EA', material: '316L SS', stock: 'low', unitCost: 155, targetQty: 6 },
            { id: 'PRT-009', pn: 'MH-24IN',       name: 'Manhole 24" with cover',   type: 'part', qty: 1, unit: 'EA', material: '316L SS', stock: 'ok', unitCost: 1850, targetQty: 1 },
          ]
        },
        { id: 'PRT-010', pn: 'BTM-DISH-316L', name: 'Bottom dish end (dished head)', type: 'part', qty: 1, unit: 'EA', material: '316L SS', stock: 'ok', unitCost: 4200, targetQty: 1 },
        { id: 'PRT-011', pn: 'PAD-FEET',       name: 'Leg pad plates 300×300×10', type: 'material', qty: 8, unit: 'EA', material: 'CS A36', stock: 'ok', unitCost: 120, targetQty: 8 },
        ]
      }
    ],
    'P-2402': [
      {
        id: 'ASM-010', pn: 'PV-ASME-3U', name: 'Pressure Vessel ASME VIII — 3-unit set', type: 'assembly',
        qty: 3, unit: 'EA', material: 'SA-240 304', stock: 'partial', expanded: true,
        children: [
          { id: 'PRT-020', pn: 'SHELL-PV-304', name: 'Pressure vessel shell', type: 'material', qty: 1, unit: 'EA', material: 'SA-240 304', stock: 'partial' },
          { id: 'PRT-021', pn: 'HEAD-EL-304',  name: '2:1 Ellipsoidal head',  type: 'part',     qty: 2, unit: 'EA', material: 'SA-240 304', stock: 'low' },
          { id: 'PRT-022', pn: 'FLANGE-ASME',  name: 'ANSI flanges set',       type: 'part',     qty: 1, unit: 'SET', material: 'SA-105',    stock: 'ok' },
        ]
      }
    ],
    'P-2403': [
      {
        id: 'ASM-020', pn: 'HX-304-001', name: '304 SS Shell & Tube Heat Exchanger', type: 'assembly',
        qty: 1, unit: 'EA', material: '304 SS', stock: 'ok', expanded: true,
        children: [
          { id: 'PRT-030', pn: 'SHELL-HX', name: 'Shell body', type: 'material', qty: 1, unit: 'EA', material: '304 SS', stock: 'ok' },
          { id: 'PRT-031', pn: 'TUBE-304', name: 'Tube bundle 19.05mm OD', type: 'material', qty: 420, unit: 'M', material: '304 SS', stock: 'ok' },
          { id: 'PRT-032', pn: 'HEAD-CH',  name: 'Channel heads (2-off)', type: 'part', qty: 2, unit: 'EA', material: '304 SS', stock: 'ok' },
        ]
      }
    ]
  },

  /* Master schedule — Gantt tasks per project (weeks from Jan 1 2025) */
  schedule: {
    'P-2401': [
      { id: 'T01', name: 'Material procurement', wc: 'Planning', start: 0, dur: 3, status: 'done',    holdType: null, deps: [] },
      { id: 'T02', name: 'Shell plate rolling',  wc: 'Rolling bay', start: 3, dur: 4, status: 'done', holdType: null, deps: [{ id: 'T01', type: 'FS' }] },
      { id: 'T03', name: 'Shell seam welding',   wc: 'Weld bay 1', start: 7, dur: 4, status: 'active', holdType: 'W', deps: [{ id: 'T02', type: 'FS' }] },
      { id: 'T04', name: 'Nozzle fabrication',   wc: 'Fitting bay', start: 8, dur: 3, status: 'active', holdType: null, deps: [{ id: 'T01', type: 'FS' }] },
      { id: 'T05', name: 'Roof assembly',         wc: 'Weld bay 2', start: 11, dur: 3, status: 'pending', holdType: null, deps: [{ id: 'T04', type: 'FS' }, { id: 'T02', type: 'SS', lag: 2 }] },
      { id: 'T06', name: 'Final assembly & fit-up', wc: 'Assembly', start: 14, dur: 2, status: 'pending', holdType: null, deps: [{ id: 'T03', type: 'FS' }, { id: 'T05', type: 'FS' }] },
      { id: 'T07', name: 'NDT & hydro test',     wc: 'QC bay',     start: 16, dur: 2, status: 'pending', holdType: 'H', deps: [{ id: 'T06', type: 'FS' }] },
      { id: 'T08', name: 'Surface treatment',    wc: 'Paint bay',  start: 18, dur: 1, status: 'pending', holdType: null, deps: [{ id: 'T07', type: 'FS' }] },
      { id: 'T09', name: 'Final inspection & dispatch', wc: 'Dispatch', start: 19, dur: 1, status: 'pending', holdType: 'H', deps: [{ id: 'T08', type: 'FS' }] },
    ],
    'P-2402': [],
    'P-2403': [
      { id: 'T20', name: 'Shell fabrication',    wc: 'Rolling bay', start: 0, dur: 2, status: 'done',   holdType: null },
      { id: 'T21', name: 'Tube bundle assembly', wc: 'Assembly',    start: 2, dur: 3, status: 'done',   holdType: null },
      { id: 'T22', name: 'Tube sheet welding',   wc: 'Weld bay 1',  start: 5, dur: 4, status: 'blocked', holdType: 'H' },
      { id: 'T23', name: 'Hydro pressure test',  wc: 'QC bay',      start: 9, dur: 1, status: 'pending', holdType: 'H' },
      { id: 'T24', name: 'Final inspection',     wc: 'Dispatch',    start: 10, dur: 1, status: 'pending', holdType: null },
    ]
  },

  /* Work centres */
  workCentres: [
    { id: 'WC-01', name: 'Rolling bay',   status: 'busy', util: 88, job: 'P-2401 Shell plates', operator: 'M. Al-Rashid', color: '#e8622a', health: 87, nextMaint: 12 },
    { id: 'WC-02', name: 'Weld bay 1',    status: 'busy', util: 95, job: 'P-2401 Seam weld', operator: 'K. Suresh', color: '#4a9eff', health: 91, nextMaint: 8 },
    { id: 'WC-03', name: 'Weld bay 2',    status: 'idle', util: 20, job: 'Available', operator: '—', color: '#2dd4a0', health: 94, nextMaint: 21 },
    { id: 'WC-04', name: 'Fitting bay',   status: 'busy', util: 72, job: 'P-2401 Nozzle fit', operator: 'T. Kumar', color: '#e8622a', health: 83, nextMaint: 6 },
    { id: 'WC-05', name: 'Assembly',      status: 'idle', util: 35, job: 'Cleaning / prep', operator: 'S. Ahmed', color: '#4a9eff', health: 96, nextMaint: 18 },
    { id: 'WC-06', name: 'QC bay',        status: 'busy', util: 60, job: 'P-2403 NCR review', operator: 'F. Nair', color: '#f59e0b', health: 89, nextMaint: 14 },
    { id: 'WC-07', name: 'Paint bay',     status: 'idle', util: 10, job: 'Available', operator: '—', color: '#2dd4a0', health: 92, nextMaint: 25 },
    { id: 'WC-08', name: 'CNC/Plasma',    status: 'down', util: 0,  job: 'Maintenance — compressor', operator: 'Maintenance', color: '#f56565', health: 62, nextMaint: 5 },
  ],

  /* Routing steps per project */
  routing: {
    'P-2401': [
      { step: 1, name: 'Material receiving & QC inspection',  wc: 'QC bay',     dur: '3 days',  status: 'done',    hold: null,  welder: null, note: 'All MTCs verified — batch HN-44810' },
      { step: 2, name: 'Plate marking & plasma cutting',       wc: 'CNC/Plasma', dur: '2 days',  status: 'done',    hold: null,  welder: null, note: 'Nesting optimised — 94% yield' },
      { step: 3, name: 'Shell plate rolling',                  wc: 'Rolling bay',dur: '4 days',  status: 'done',    hold: null,  welder: null, note: 'Roundness tolerance ±2mm ✓' },
      { step: 4, name: 'Shell longitudinal seam welding',      wc: 'Weld bay 1', dur: '6 days',  status: 'active',  hold: 'W',   welder: 'K. Suresh (WPQ-316L-GTAW)', note: 'WPS #WPS-316L-04 in use' },
      { step: 5, name: 'Shell circumferential seam welding',   wc: 'Weld bay 1', dur: '4 days',  status: 'pending', hold: 'H',   welder: 'K. Suresh', note: 'QC hold — RT film required before proceed' },
      { step: 6, name: 'Nozzle stub fabrication & fit-up',     wc: 'Fitting bay',dur: '3 days',  status: 'active',  hold: null,  welder: null, note: 'Running parallel to step 4' },
      { step: 7, name: 'Nozzle welding to shell',              wc: 'Weld bay 2', dur: '3 days',  status: 'pending', hold: 'W',   welder: 'TBD', note: 'Pending shell completion' },
      { step: 8, name: 'Roof cone fabrication & fit-up',       wc: 'Assembly',   dur: '3 days',  status: 'pending', hold: null,  welder: null, note: '' },
      { step: 9, name: 'Final assembly welding',               wc: 'Weld bay 1', dur: '4 days',  status: 'pending', hold: 'H',   welder: 'TBD', note: 'Full RT + UT required before hydro' },
      { step:10, name: 'Hydrostatic pressure test',            wc: 'QC bay',     dur: '1 day',   status: 'pending', hold: 'H',   welder: null,  note: '1.5× MAWP = 1.35 bar' },
      { step:11, name: 'Surface treatment & painting',         wc: 'Paint bay',  dur: '2 days',  status: 'pending', hold: null,  welder: null, note: 'SA 2.5 blast + epoxy coat' },
      { step:12, name: 'Final dimensional inspection & dispatch', wc: 'Dispatch', dur: '1 day',  status: 'pending', hold: 'H',   welder: null,  note: 'Client witness required' },
    ]
  },

  /* MRP — material requirements */
  mrp: {
    'P-2401': [
      { item: 'Shell plate 316L 10mm', pn: 'PLT-316L-10', required: '18 SHT', onHand: '10 SHT', status: 'partial', needDate: '2025-06-10' },
      { item: 'Shell plate 316L 12mm', pn: 'PLT-316L-12', required: '4 SHT',  onHand: '4 SHT',  status: 'ok',     needDate: '2025-06-10' },
      { item: 'Filler wire ER316L',    pn: 'WELD-ER316L', required: '45 KG',  onHand: '52 KG',  status: 'ok',     needDate: '2025-06-01' },
      { item: 'Top angle 75×75×8',     pn: 'ANG-316L-75', required: '32 M',   onHand: '18 M',   status: 'low',    needDate: '2025-07-01' },
      { item: 'Nozzle DN50 150LB WNRF',pn: 'NZ-50-150LB', required: '6 EA',   onHand: '2 EA',   status: 'low',    needDate: '2025-07-15' },
      { item: 'Bottom dish end',        pn: 'BTM-DISH-316L',required: '1 EA',  onHand: '1 EA',   status: 'ok',     needDate: '2025-06-05' },
      { item: 'Grinding discs 125mm',  pn: 'GRND-125',    required: '60 EA',  onHand: '60 EA',  status: 'ok',     needDate: '2025-06-01' },
    ],
    'P-2402': [
      { item: 'SA-240 304 plate 12mm', pn: 'SHELL-PV-304', required: '1 SET', onHand: '0 SET', status: 'missing', needDate: '2025-07-01' },
      { item: '2:1 Ellipsoidal head',  pn: 'HEAD-EL-304',  required: '6 EA',  onHand: '2 EA',  status: 'low',     needDate: '2025-07-15' },
      { item: 'ANSI flanges SA-105',   pn: 'FLANGE-ASME',  required: '3 SET', onHand: '3 SET', status: 'ok',      needDate: '2025-07-20' },
    ],
    'P-2403': [
      { item: '304 SS tube bundle',    pn: 'TUBE-304',     required: '420 M', onHand: '420 M', status: 'ok',     needDate: '2025-05-01' },
      { item: 'Shell body 304',        pn: 'SHELL-HX',     required: '1 EA',  onHand: '1 EA',  status: 'ok',     needDate: '2025-05-01' },
      { item: 'Channel heads 304',     pn: 'HEAD-CH',      required: '2 EA',  onHand: '2 EA',  status: 'ok',     needDate: '2025-05-10' },
    ]
  },

  /* Shop-floor execution log */
  sfLog: [
    { time: '09:14', project: 'P-2401', dot: '#2dd4a0', tag: 'Complete', tagBg: 'var(--green-bg)', tagColor: 'var(--green)', text: '<strong>Step 3 — Shell plate rolling</strong> marked complete. Roundness check passed (±1.8mm).' },
    { time: '08:52', project: 'P-2401', dot: '#e8622a', tag: 'Started',  tagBg: 'var(--brand-light)', tagColor: 'var(--brand)', text: '<strong>Step 4 — Shell seam welding</strong> started. Welder: K. Suresh. WPS-316L-04 active.' },
    { time: '08:30', project: 'P-2401', dot: '#4a9eff', tag: 'Note',     tagBg: 'var(--blue-bg)', tagColor: 'var(--blue)', text: 'Nesting run completed by operator. Plate yield 94.2%. Cut program uploaded to CNC.' },
    { time: '07:55', project: 'P-2403', dot: '#f56565', tag: 'Blocked',  tagBg: 'var(--red-bg)', tagColor: 'var(--red)', text: '<strong>Step 3 — Tube sheet welding</strong> BLOCKED. QC Hold (H) pending MTC re-inspection on batch HN-44821.' },
  ],

  /* ── Equipment Resource Model ── */
  equipment: [
    { id: 'MACH-001', name: 'CNC Plasma Cutter',       model: 'Hypertherm XPR300',  assetId: 'NF-PRD-01', location: 'Cutting Bay A',  status: 'running', health: 94, lastServiced: '2025-04-10' },
    { id: 'MACH-002', name: 'Plate Rolling Machine',    model: 'Davi MCA 3053',      assetId: 'NF-PRD-02', location: 'Rolling Bay',    status: 'running', health: 87, lastServiced: '2025-03-28' },
    { id: 'MACH-003', name: 'Submerged Arc Welder',     model: 'Lincoln Power Wave', assetId: 'NF-PRD-03', location: 'Weld Bay 1',     status: 'stopped', health: 72, lastServiced: '2025-05-01' },
    { id: 'MACH-004', name: 'Overhead Crane (10T)',     model: 'Konecranes CXT',     assetId: 'NF-PRD-04', location: 'Main shop floor',status: 'running', health: 98, lastServiced: '2025-04-20' },
  ],

  /* ── Tooling Lifecycle ── */
  tooling: [
    { id: 'TOOL-101', name: 'Shell Alignment Jig',       type: 'Jig',       lifecycle: 'Active',  usage: 142, modification: 'Rev B — stiffener added', lastSwap: '2025-05-01' },
    { id: 'TOOL-102', name: 'Plasma Torch Insert Set',   type: 'Insert',    lifecycle: 'Active',  usage: 310, modification: 'Original',                lastSwap: '2025-04-15' },
    { id: 'TOOL-103', name: 'HD Clamping Fixture 50T',   type: 'Fixture',   lifecycle: 'Servicing', usage: 89, modification: 'Rev A',                  lastSwap: '2025-03-20' },
  ],

  /* ── Maintenance Operations ── */
  maintenance: {
    schedule: [
      { id: 'PM-001', machineId: 'MACH-001', task: 'Torch height calibration',  type: 'Weekly',  frequency: 7,  lastDate: '2025-05-01', status: 'due' },
      { id: 'PM-002', machineId: 'MACH-002', task: 'Hydraulic oil check',       type: 'Weekly',  frequency: 7,  lastDate: '2025-05-05', status: 'ok' },
      { id: 'PM-003', machineId: 'MACH-003', task: 'Flux hopper cleaning',      type: 'Daily',   frequency: 1,  lastDate: '2025-05-07', status: 'ok' },
      { id: 'PM-004', machineId: 'MACH-004', task: 'Wire rope inspection',      type: 'Monthly', frequency: 30, lastDate: '2025-04-10', status: 'overdue' },
      { id: 'PM-005', machineId: 'MACH-001', task: 'Compressor filter change',  type: 'Monthly', frequency: 30, lastDate: '2025-04-15', status: 'due' },
    ],
    logs: [
      { id: 'LOG-501', date: '2025-05-01', machineId: 'MACH-003', technician: 'R. Khan',  action: 'Oil filter replacement', type: 'Preventive', measurements: 'Temp: 42°C · Vib: 0.2mm/s · Pressure: 4.2 bar' },
      { id: 'LOG-502', date: '2025-04-28', machineId: 'MACH-001', technician: 'R. Khan',  action: 'Torch nozzle swap',      type: 'Corrective', measurements: 'Arc gap: 3.2mm → 3.0mm · Gas flow: 18 L/min' },
      { id: 'LOG-503', date: '2025-04-20', machineId: 'MACH-004', technician: 'S. Patel', action: 'Annual load test',       type: 'Statutory',  measurements: 'Test load: 12.5T · SWL: 10T · Cert renewed' },
    ],
    failureCodes: {
      problem: ['Abnormal Vibration', 'Overheating', 'Software / PLC Error', 'Hydraulic Leak', 'Electrical Fault', 'Structural Crack'],
      cause:   ['Bearing Wear', 'Lack of Lubrication', 'Sensor Failure', 'Power Surge', 'Material Fatigue', 'Operator Error'],
      remedy:  ['Component Replacement', 'General Servicing', 'Software Patch', 'Calibration', 'Welding Repair', 'Full Overhaul']
    }
  },

  /* ── Material Requisition Forms ── */
  mrf: [
    { id: 'MRF-8001', date: '2025-05-07', project: 'P-2401', item: 'Hydraulic Seal Kit', qty: 2, unit: 'SET', activity: 'Rolling machine maintenance', status: 'pending_approval', requester: 'S. Ahmed' },
    { id: 'MRF-8002', date: '2025-05-06', project: 'P-2401', item: 'Grinding Discs 180mm', qty: 24, unit: 'EA', activity: 'Shell weld prep', status: 'approved', requester: 'K. Suresh' },
  ],

  /* ── Inspection Calls / Quality Gates ── */
  inspectionCalls: [
    { id: 'IC-2025-01', taskId: 'T03', stepNum: 4, type: 'Dimensional + Visual', status: 'locked', raisedAt: '2025-05-08 09:15', raisedBy: 'M. Al-Rashid', project: 'P-2401', note: 'Shell seam weld complete — requesting QC fit-up check' },
  ],
  /* ── Skill Matrix & Certifications ── */
  skillMatrix: [
    { id: 'OP-001', name: 'K. Suresh',     role: 'Senior Welder',       assignedWC: 'WC-02', shift: 'Day',
      certifications: [
        { cert: 'GTAW 316L',        code: 'WPQ-316L-GTAW', expiry: '2025-12-15', status: 'valid' },
        { cert: 'SMAW CS',          code: 'WPQ-CS-SMAW',   expiry: '2025-06-01', status: 'expiring' },
      ] },
    { id: 'OP-002', name: 'T. Kumar',      role: 'Fitter / Welder',     assignedWC: 'WC-04', shift: 'Day',
      certifications: [
        { cert: 'SMAW 316L',        code: 'WPQ-316L-SMAW', expiry: '2026-03-10', status: 'valid' },
      ] },
    { id: 'OP-003', name: 'M. Al-Rashid',  role: 'Plate Operator',      assignedWC: 'WC-01', shift: 'Day',
      certifications: [
        { cert: 'CNC Plasma Op.',   code: 'CERT-CNC-01',   expiry: '2025-11-20', status: 'valid' },
        { cert: 'Overhead Crane',   code: 'CERT-CRANE-01', expiry: '2025-08-15', status: 'valid' },
      ] },
    { id: 'OP-004', name: 'S. Ahmed',      role: 'Assembly Technician', assignedWC: 'WC-05', shift: 'Day',
      certifications: [
        { cert: 'Fit-up & Alignment', code: 'CERT-FIT-01', expiry: '2026-01-30', status: 'valid' },
      ] },
    { id: 'OP-005', name: 'R. Khan',       role: 'Maintenance Tech.',   assignedWC: null,    shift: 'Day',
      certifications: [
        { cert: 'Electrical Safety', code: 'CERT-ELEC-01', expiry: '2025-09-10', status: 'valid' },
        { cert: 'Hydraulics L2',     code: 'CERT-HYD-02',  expiry: '2025-05-15', status: 'expired' },
      ] },
  ],

  /* ── Live Work Orders (Phase 2) ── */
  workOrders: [
    { id: 'WO-1001', project: 'P-2401', step: 4, name: 'Shell Seam Welding', wc: 'WC-02', operator: 'K. Suresh', status: 'running', progress: 42, timeInStation: 14520, serials: ['SN-001', 'SN-002'] },
    { id: 'WO-1002', project: 'P-2401', step: 6, name: 'Nozzle Fabrication', wc: 'WC-04', operator: 'T. Kumar', status: 'running', progress: 15, timeInStation: 3600, serials: ['SN-NZ-01', 'SN-NZ-02', 'SN-NZ-03'] },
    { id: 'WO-1003', project: 'P-2403', step: 22, name: 'Tube Sheet Welding', wc: 'WC-06', operator: 'F. Nair', status: 'blocked', progress: 5, timeInStation: 0, serials: [] },
  ],

  /* ── Shop Floor Events (Phase 2) ── */
  shopFloorEvents: [
    { id: 'EV-901', time: '2025-05-09 10:15', wo: 'WO-1001', type: 'Weld Pass Start', msg: 'Root pass started on Seam A-1', user: 'K. Suresh' },
    { id: 'EV-902', time: '2025-05-09 09:45', wo: 'WO-1002', type: 'Material Check', msg: '316L 4" pipe segments received', user: 'T. Kumar' },
  ],

  /* ── IIoT Telemetry Snapshots ── */
  telemetry: {
    'MACH-001': { power: 42.5, temp: 185, status: 'running', load: 92, lastEvent: 'Cut cycle 14 started' },
    'MACH-002': { power: 12.2, temp: 45,  status: 'running', load: 78, lastEvent: 'Roll pressure stable' },
    'MACH-003': { power: 0.5,  temp: 22,  status: 'stopped', load: 0,  lastEvent: 'Shift end idle' },
  },

  /* ── Shift Transition Monitor ── */
  shiftTransition: {
    outgoing: 'Day Shift (A)',
    incoming: 'Night Shift (B)',
    completion: 68,
    tasks: [
      { id: 'ST-01', name: 'Rolling bay cleanup', status: 'done' },
      { id: 'ST-02', name: 'Tooling handover log', status: 'done' },
      { id: 'ST-03', name: 'Weld bay gas levels check', status: 'pending' },
    ]
  },

  /* ── Heat Number Genealogy ── */
  genealogy: {
    'P-2401': [
      { sn: 'TANK-01-A', heat: 'HN-44810', material: '316L', supplier: 'Outokumpu', cert: 'MTC-9921' },
      { sn: 'TANK-01-B', heat: 'HN-44811', material: '316L', supplier: 'Outokumpu', cert: 'MTC-9922' },
    ]
  },

  /* ── In-Process Scrap Log ── */
  scrapLog: [],

  /* ── COPQ Waterfall Data ── */
  copq: [
    { label: 'Scrap Metal', value: 12500, color: 'var(--red)' },
    { label: 'Rework Labour', value: 8400, color: 'var(--amber)' },
    { label: 'NDT Re-tests', value: 3200, color: 'var(--indigo)' },
    { label: 'Warranty Claims', value: 1500, color: 'var(--blue)' },
  ]
};

/* ── Active sub-page state ─────────────────────────────────── */
let bomExpanded = {};

/* ── Timer Logic (Phase 2) ── */
let _stationTimerInterval = null;
function startStationTimers() {
  if (_stationTimerInterval) return;
  _stationTimerInterval = setInterval(() => {
    ProdData.workOrders.forEach(wo => {
      if (wo.status === 'running') wo.timeInStation++;
    });
    // If we are on the manufacturing page, we need to refresh the timer displays
    if (AppState.currentPage === 'production' && _prodActiveSubPage === 'manufacturing') {
      updateLiveTimers();
    }
  }, 1000);
}

function updateLiveTimers() {
  ProdData.workOrders.forEach(wo => {
    const el = document.getElementById(`timer-${wo.id}`);
    if (el) el.textContent = formatDuration(wo.timeInStation);
  });
}

function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

startStationTimers();

/* ── Main renderer — delegates to sidebar context switcher ── */
async function renderProduction() {
  // This is now called by enterProductionModule() in app.js
  // which rebuilds the sidebar with Production-exclusive nav
  // The actual sub-page rendering is done by renderProdSubPage()
}

/* ═══════════════════════════════════════════════════════════
   MANUFACTURING EXECUTION (Phase 2)
   ═══════════════════════════════════════════════════════════ */
/* ── Manufacturing activity log (in-memory, per session) ── */
if (!window._mfgLog) window._mfgLog = [];

function _mfgLogEntry(taskId, taskName, action, note) {
  window._mfgLog.unshift({
    taskId, taskName, action,
    note: note || '',
    ts: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    user: AppState.currentUser?.name || 'Production Mgr',
  });
}

function mfgSetStatus(taskIdx, newStatus) {
  const pid = ProdData.selectedProject;
  const tasks = ProdData.schedule[pid];
  if (!tasks || !tasks[taskIdx]) return;
  const t = tasks[taskIdx];

  // Guard: can only start a task if all deps are done
  if (newStatus === 'active') {
    const blocked = (t.deps || []).some(d => {
      const dep = tasks.find(x => x.id === d.id);
      return dep && dep.status !== 'done';
    });
    if (blocked) { showToast(`Cannot start — predecessor tasks not yet complete`, 'warn'); return; }
    t.progress = t.progress || 0;
    t.startedAt = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  if (newStatus === 'done') t.progress = 100;

  const prev = t.status;
  t.status = newStatus;
  _mfgLogEntry(t.id, t.name, `${prev} → ${newStatus}`);
  renderProdManufacturing();
}

function mfgUpdateProgress(taskIdx, val) {
  const pid = ProdData.selectedProject;
  const tasks = ProdData.schedule[pid];
  if (!tasks || !tasks[taskIdx]) return;
  tasks[taskIdx].progress = parseInt(val, 10);
  // update only the progress label live without full re-render
  const label = document.getElementById(`prog-label-${taskIdx}`);
  if (label) label.textContent = val + '%';
}

function mfgLogNote(taskIdx) {
  const pid = ProdData.selectedProject;
  const tasks = ProdData.schedule[pid];
  if (!tasks || !tasks[taskIdx]) return;
  const t = tasks[taskIdx];
  _ensureProdModal();
  const mo = document.getElementById('prodModalContent');
  mo.style.width = 'min(440px,94vw)';
  mo.innerHTML = `
    <div style="background:var(--bg-surface);border-radius:14px;overflow:hidden">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border);font-weight:700;font-size:14px">${t.id} — Log Note</div>
      <div style="padding:20px;display:flex;flex-direction:column;gap:12px">
        <textarea id="mfgNoteText" rows="4" placeholder="Enter note, observation, or issue..." style="width:100%;padding:10px;border:1px solid var(--border-md);border-radius:8px;font-size:13px;resize:vertical;background:var(--bg-elevated);color:var(--text-primary)"></textarea>
        <div style="display:flex;justify-content:flex-end;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="closeProdModal()">Cancel</button>
          <button class="btn btn-primary btn-sm" onclick="
            const note = document.getElementById('mfgNoteText').value.trim();
            if (!note) return;
            _mfgLogEntry('${t.id}', '${t.name.replace(/'/g,'&apos;')}', 'Note', note);
            closeProdModal();
            renderProdManufacturing();
          ">Save Note</button>
        </div>
      </div>
    </div>`;
  document.getElementById('prodModal').style.display = 'block';
}

function renderProdManufacturing() {
  const pid    = ProdData.selectedProject;
  const el     = document.getElementById('pageContent');
  const rawTasks = (ProdData.schedule[pid] || []);

  // ── Empty state ───────────────────────────────────────────
  if (rawTasks.length === 0) {
    el.innerHTML = prodPageHeader('Manufacturing', 'Task execution linked to Master Schedule · CPM-driven work orders') + `
      <div class="card stagger-in" style="padding:56px 32px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:16px">
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none" style="opacity:0.25">
          <rect x="6" y="10" width="36" height="30" rx="4" stroke="currentColor" stroke-width="2"/>
          <path d="M6 18h36M16 10v8M32 10v8M14 26h8M14 32h20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <div style="font-size:16px;font-weight:700;color:var(--text-primary)">No schedule for ${pid}</div>
        <div style="font-size:13px;color:var(--text-muted);max-width:380px">Create a Master Schedule first — Manufacturing tasks are driven directly from it.</div>
        <button class="btn btn-primary" onclick="renderProdSubPage('schedule')">Go to Master Schedule</button>
      </div>`;
    renderProjStrip();
    return;
  }

  // Run CPM so we have isCritical + slack
  const tasks = calculateCPM(JSON.parse(JSON.stringify(rawTasks)));
  // Mirror CPM results (isCritical, slack, es, ef) back to ProdData so progress edits persist
  tasks.forEach((t, i) => {
    rawTasks[i].isCritical = t.isCritical;
    rawTasks[i].slack      = t.slack;
    rawTasks[i].es         = t.es;
    rawTasks[i].ef         = t.ef;
    if (rawTasks[i].progress === undefined) rawTasks[i].progress = 0;
  });

  // ── KPIs ─────────────────────────────────────────────────
  const total    = rawTasks.length;
  const done     = rawTasks.filter(t => t.status === 'done').length;
  const active   = rawTasks.filter(t => t.status === 'active').length;
  const blocked  = rawTasks.filter(t => t.status === 'blocked').length;
  const pending  = total - done - active - blocked;
  const critDone = rawTasks.filter(t => t.isCritical && t.status === 'done').length;
  const critTotal= rawTasks.filter(t => t.isCritical).length;
  const pct      = Math.round((done / total) * 100);

  const kpiHTML = [
    { label: 'Total Tasks',   value: total,                      color: 'var(--text-primary)', sub: `${pct}% complete` },
    { label: 'In Progress',   value: active,                     color: 'var(--brand)',        sub: `${pending} pending` },
    { label: 'Completed',     value: done,                       color: 'var(--green)',         sub: `of ${total} tasks` },
    { label: 'Critical Path', value: `${critDone}/${critTotal}`, color: 'var(--red)',           sub: 'tasks done' },
  ].map(k => `
    <div class="prod-kpi-card">
      <div class="prod-kpi-label">${k.label}</div>
      <div class="prod-kpi-value" style="color:${k.color}">${k.value}</div>
      <div class="prod-kpi-sub">${k.sub}</div>
    </div>`).join('');

  // ── Kanban columns ────────────────────────────────────────
  const cols = [
    { key: 'pending',  label: 'To Do',      color: 'var(--text-muted)',    dot: '#B0BCCE' },
    { key: 'active',   label: 'In Progress', color: 'var(--brand)',        dot: 'var(--brand)' },
    { key: 'done',     label: 'Done',        color: 'var(--green)',         dot: 'var(--green)' },
    { key: 'blocked',  label: 'Blocked',     color: 'var(--red)',           dot: 'var(--red)' },
  ];

  const role = AppState.currentUser?.role || 'manager';
  const isOperator = role === 'user';

  function taskCard(t, idx) {
    const depNames = (t.deps || []).map(d => d.id).join(', ');
    const isBlocked = t.status !== 'done' && (t.deps || []).some(d => {
      const dep = rawTasks.find(x => x.id === d.id);
      return dep && dep.status !== 'done';
    });

    let statusActions = {
      pending: `<button class="btn btn-primary btn-sm" onclick="mfgSetStatus(${idx},'active')" ${isBlocked ? 'disabled title="Predecessors not done"' : ''} style="${isBlocked ? 'opacity:0.45;cursor:not-allowed' : ''}">▶ Start</button>`,
      active:  `<button class="btn btn-secondary btn-sm" onclick="mfgSetStatus(${idx},'done')">✓ Complete</button>
                <button class="btn btn-ghost btn-sm" onclick="mfgSetStatus(${idx},'blocked')">Block</button>`,
      done:    `<button class="btn btn-ghost btn-sm" onclick="mfgSetStatus(${idx},'active')">Reopen</button>`,
      blocked: `<button class="btn btn-primary btn-sm" onclick="mfgSetStatus(${idx},'active')">▶ Resume</button>`,
    }[t.status] || '';

    if (isOperator) {
      statusActions = '<span style="font-size:11px;color:var(--text-muted)">View only</span>';
    }

    const progressBar = (t.status === 'active' || t.status === 'done') ? `
      <div style="margin:10px 0 6px">
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-bottom:4px">
          <span>PROGRESS</span><span id="prog-label-${idx}">${t.progress || 0}%</span>
        </div>
        <input type="range" min="0" max="100" value="${t.progress || 0}"
               oninput="mfgUpdateProgress(${idx}, this.value)"
               onchange="mfgUpdateProgress(${idx}, this.value)"
               ${isOperator ? 'disabled style="pointer-events:none;opacity:0.7"' : ''}
               style="width:100%;height:4px;appearance:none;-webkit-appearance:none;background:linear-gradient(to right,var(--brand) 0%,var(--brand) ${t.progress || 0}%,var(--border-md) ${t.progress || 0}%,var(--border-md) 100%);border-radius:2px;outline:none;cursor:pointer" />
      </div>` : '';

    return `
      <div class="prod-task-card ${t.isCritical ? 'is-critical' : ''}">
        <div class="prod-task-top">
          <span class="prod-task-id">${t.id}</span>
          <div class="prod-task-badges">
            ${t.isCritical ? '<span class="badge badge-red" style="font-size:10px">CPM</span>' : ''}
            ${t.slack > 0 ? `<span class="badge badge-muted" style="font-size:10px">Float ${t.slack}w</span>` : ''}
            ${isBlocked && t.status === 'pending' ? '<span class="badge badge-amber" style="font-size:10px">WAITING</span>' : ''}
          </div>
        </div>

        <div>
          <div class="prod-task-name">${t.name}</div>
          <div class="prod-task-meta">${t.wc} · ${t.dur}w duration</div>
        </div>

        ${depNames ? `<div class="prod-task-deps">After: <span style="color:var(--text-secondary)">${depNames}</span></div>` : ''}

        ${progressBar}

        <div class="prod-task-footer">
          ${statusActions}
          <button class="btn btn-ghost btn-sm" onclick="mfgLogNote(${idx})" style="margin-left:auto" title="Add note">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 2h10v8l-3 3H2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M5 5h4M5 7.5h2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="renderProdSubPage('schedule')" title="View in Gantt">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M1 6h12M4 3V1M10 3V1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>`;
  }

  const kanbanHTML = `
    <div class="prod-kanban">
      ${cols.map(col => {
        const colTasks = rawTasks.map((t, i) => ({ t, i })).filter(({ t }) => t.status === col.key);
        return `
          <div class="prod-kanban-col">
            <div class="prod-kanban-header" style="border-color:${col.color}">
              <span class="prod-kanban-dot" style="background:${col.dot}"></span>
              <span class="prod-kanban-label" style="color:${col.color}">${col.label}</span>
              <span class="prod-kanban-count">${colTasks.length}</span>
            </div>
            ${colTasks.length === 0
              ? `<div class="prod-kanban-empty">No tasks</div>`
              : colTasks.map(({ t, i }) => taskCard(t, i)).join('')}
          </div>`;
      }).join('')}
    </div>`;

  // ── Activity log ──────────────────────────────────────────
  const logHTML = window._mfgLog.length === 0
    ? `<div style="font-size:12px;color:var(--text-muted);padding:16px 0;text-align:center">No activity yet this session.</div>`
    : window._mfgLog.slice(0, 12).map(e => `
        <div class="prod-log-entry">
          <div class="prod-log-time">${e.ts}</div>
          <div class="prod-log-body">
            <div class="prod-log-action">${e.taskId} — ${e.action}</div>
            ${e.note ? `<div class="prod-log-note">${e.note}</div>` : ''}
            <div class="prod-log-user">${e.user}</div>
          </div>
        </div>`).join('');

  // ── Overall progress banner ───────────────────────────────
  const overallBar = `
    <div class="prod-progress-banner">
      <div class="prod-progress-label">Project Progress</div>
      <div class="prod-progress-track"><div class="prod-progress-fill" style="width:${pct}%"></div></div>
      <div class="prod-progress-pct">${pct}%</div>
      <button class="btn btn-ghost btn-sm" onclick="renderProdSubPage('schedule')">
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M1 6h12" stroke="currentColor" stroke-width="1.3"/></svg>
        View Gantt
      </button>
    </div>`;

  // ── Render ────────────────────────────────────────────────
  el.innerHTML = prodPageHeader('Manufacturing', `Task execution · ${pid} · Linked to Master Schedule`) + `
    <div class="prod-kpi-grid stagger-in">${kpiHTML}</div>
    ${overallBar}
    <div style="display:grid;grid-template-columns:1fr 260px;gap:20px;align-items:start">
      <div class="stagger-in">${kanbanHTML}</div>
      <div class="card stagger-in" style="position:sticky;top:72px">
        <div class="card-header">
          <span class="card-title">Activity Log</span>
          ${window._mfgLog.length > 0 ? `<button class="btn btn-ghost btn-sm" onclick="window._mfgLog=[];renderProdManufacturing()">Clear</button>` : ''}
        </div>
        <div style="max-height:480px;overflow-y:auto">${logHTML}</div>
      </div>
    </div>`;

  renderProjStrip();
}

/* ═══════════════════════════════════════════════════════════
   ROUTING & OPERATIONS
   ═══════════════════════════════════════════════════════════ */

/* ── Route Access Control Data ─────────────────────────────── */
const _deptColors = {
  production: '#f97316', qc: '#14b8a6', welding: '#3b82f6',
  finance: '#f59e0b', procurement: '#84cc16', hr: '#f43f5e', gm: '#2B8EF0',
};

const _routeAccess = {
  'P-2401': {
    projectLocked: false,
    roles: [
      { id: 'production',  label: 'Production',     access: 'manage'  },
      { id: 'qc',          label: 'Quality Control', access: 'execute' },
      { id: 'welding',     label: 'Welding',         access: 'execute' },
      { id: 'finance',     label: 'Finance',         access: 'view'    },
      { id: 'procurement', label: 'Procurement',     access: 'view'    },
      { id: 'hr',          label: 'Human Resources', access: 'none'    },
      { id: 'gm',          label: 'General Manager', access: 'manage'  },
    ]
  },
  'P-2402': {
    projectLocked: true,
    roles: [
      { id: 'production',  label: 'Production',     access: 'execute' },
      { id: 'qc',          label: 'Quality Control', access: 'execute' },
      { id: 'welding',     label: 'Welding',         access: 'view'    },
      { id: 'finance',     label: 'Finance',         access: 'view'    },
      { id: 'procurement', label: 'Procurement',     access: 'none'    },
      { id: 'hr',          label: 'Human Resources', access: 'none'    },
      { id: 'gm',          label: 'General Manager', access: 'manage'  },
    ]
  },
  'P-2403': {
    projectLocked: false,
    roles: [
      { id: 'production',  label: 'Production',     access: 'manage'  },
      { id: 'qc',          label: 'Quality Control', access: 'execute' },
      { id: 'welding',     label: 'Welding',         access: 'execute' },
      { id: 'finance',     label: 'Finance',         access: 'view'    },
      { id: 'procurement', label: 'Procurement',     access: 'none'    },
      { id: 'hr',          label: 'Human Resources', access: 'none'    },
      { id: 'gm',          label: 'General Manager', access: 'manage'  },
    ]
  }
};

window._routeSetAccess = function(pid, roleId, newAccess) {
  const userRole = AppState.currentUser?.role || 'manager';
  if (userRole !== 'manager' && userRole !== 'gm') {
    showToast('Permission denied: Production Manager role required', 'error');
    return;
  }
  if (!_routeAccess[pid]) _routeAccess[pid] = { projectLocked: false, roles: [] };
  const role = _routeAccess[pid].roles.find(r => r.id === roleId);
  if (role) {
    role.access = newAccess;
    showToast(`${role.label} → ${newAccess} access on ${pid}`, 'success');
    renderProdRouting();
  }
};

window._routeToggleLock = function(pid) {
  const userRole = AppState.currentUser?.role || 'manager';
  if (userRole !== 'manager' && userRole !== 'gm') {
    showToast('Permission denied: Production Manager role required', 'error');
    return;
  }
  if (!_routeAccess[pid]) _routeAccess[pid] = { projectLocked: false, roles: [] };
  _routeAccess[pid].projectLocked = !_routeAccess[pid].projectLocked;
  const locked = _routeAccess[pid].projectLocked;
  showToast(`Project ${pid} routing ${locked ? 'locked — no changes permitted' : 'unlocked'}`, locked ? 'warning' : 'success');
  renderProdRouting();
};

function renderProdRouting() {
  const el = document.getElementById('pageContent');
  const pid = ProdData.selectedProject;
  const steps = ProdData.routing[pid] || [];
  const access = _routeAccess[pid] || { projectLocked: false, roles: [] };
  const isProjectLocked = access.projectLocked;
  const colours = { active: 'var(--green)', planning: 'var(--blue)', 'qc-hold': 'var(--amber)' };

  const role = AppState.currentUser?.role || 'manager';
  const isManager = role === 'manager' || role === 'gm';

  const accessMeta = {
    none:    { label: 'No Access',    cls: 'route-acc-none'    },
    view:    { label: 'View',         cls: 'route-acc-view'    },
    execute: { label: 'Execute',      cls: 'route-acc-execute' },
    manage:  { label: 'Full Control', cls: 'route-acc-manage'  },
  };

  el.innerHTML = prodPageHeader('Routing & Operations', 'ISA-95 Process Segments · Operation sequence · Access control · Standard Operating Procedures') + `

    <!-- Project Switcher -->
    <div class="route-proj-strip stagger-in">
      <span class="route-proj-strip-label">Project</span>
      ${AppState.projects.map(p => {
        const hasRoute = (ProdData.routing[p.id] || []).length > 0;
        const stepsDone = (ProdData.routing[p.id] || []).filter(s => s.status === 'done').length;
        const stepsTotal = (ProdData.routing[p.id] || []).length;
        const pAccess = _routeAccess[p.id] || {};
        return `
        <button class="route-proj-chip ${p.id === pid ? 'active' : ''}" onclick="selectProdProject('${p.id}');renderProdSubPage('routing')">
          <span class="route-proj-dot" style="background:${colours[p.status]||'var(--text-muted)'}"></span>
          <span class="route-proj-id">${p.id}</span>
          <span class="route-proj-name">${p.name.split('—')[0].trim()}</span>
          ${hasRoute ? `<span class="route-proj-progress">${stepsDone}/${stepsTotal}</span>` : '<span class="route-proj-none">No routing</span>'}
          ${pAccess.projectLocked ? '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="margin-left:2px;color:var(--red)"><rect x="1.5" y="5" width="7" height="4.5" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M3 5V4a2 2 0 014 0v1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>' : ''}
        </button>`;
      }).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 320px;gap:20px">
      <div class="card stagger-in">
        <div class="card-header">
          <span class="card-title">Process Flow — ${pid}</span>
          <div style="display:flex;gap:8px;align-items:center">
            ${isProjectLocked ? '<span class="badge badge-red">ROUTING LOCKED</span>' : ''}
            <button class="btn btn-ghost btn-sm" onclick="showToast('Loading SOP documents...','info')">View SOPs</button>
            <button class="btn btn-secondary btn-sm" onclick="showToast('Router printed to floor station','success')">Print Router</button>
          </div>
        </div>
        ${isProjectLocked ? `
          <div class="prod-status-card warn" style="margin:0 16px 12px">
            <div class="prod-status-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </div>
            <div>
              <div class="prod-status-label">Project Routing Locked</div>
              <div class="prod-status-text">Changes to this routing are restricted. Unlock via the Access Control panel to modify steps.</div>
            </div>
          </div>` : ''}
        <div class="prod-routing-timeline" style="padding:4px 8px 8px">
          ${steps.map((s, idx) => {
            const isLocked = s.hold === 'H' && s.status !== 'done';
            const numCls   = isLocked ? 'status-locked' : s.status === 'done' ? 'status-done' : s.status === 'active' ? 'status-active' : 'status-pending';
            const badgeCls = s.status === 'done' ? 'badge-green' : s.status === 'active' ? 'badge-accent' : 'badge-muted';
            const isQGate  = s.hold === 'H';
            return `
            <div class="prod-routing-step ${isLocked ? 'is-locked' : ''}">
              <div class="prod-routing-num ${numCls}">${s.step}</div>
              ${idx < steps.length - 1 ? '<div class="prod-routing-connector"></div>' : ''}
              <div class="prod-routing-body">
                <div class="prod-routing-header">
                  <div>
                    <div class="prod-routing-name" style="display:flex;align-items:center;flex-wrap:wrap;gap:6px">
                      ${s.name}
                      ${isLocked ? '<span class="badge badge-red" style="font-size:10px">QC HOLD</span>' : ''}
                      ${isQGate && s.status !== 'done' ? '<span class="badge badge-amber" style="font-size:10px">Quality Gate</span>' : ''}
                    </div>
                    <div class="prod-routing-meta">${s.wc} · ${s.dur}${isProjectLocked ? ' · <span style="color:var(--red);font-weight:600">Restricted</span>' : ''}</div>
                  </div>
                  <span class="badge ${badgeCls}">${s.status.toUpperCase()}</span>
                </div>
                <div class="prod-routing-instruction">
                  <div class="prod-routing-instruction-label">Work Instruction</div>
                  ${s.note || 'Standard manufacturing process applies. Verify dimensions against DWG-PROD-2401-01.'}
                </div>
                <div class="prod-routing-footer">
                  <div class="prod-routing-assigned">
                    ${s.welder
                      ? `<span style="color:var(--brand);margin-right:4px">●</span>Assigned: <strong>${s.welder}</strong>`
                      : '<span style="color:var(--text-muted)">No resource assigned</span>'}
                  </div>
                  <div style="display:flex;gap:6px">
                    ${isLocked ? `<button class="btn btn-primary btn-sm" onclick="renderProdSubPage('quality')">QC Release</button>` : ''}
                    ${s.status === 'active' && !isProjectLocked ? `<button class="btn btn-secondary btn-sm" onclick="openScrapModal(${s.step}, '${s.name.replace(/'/g,'')}')">Log Scrap</button>` : ''}
                    <button class="btn btn-ghost btn-sm" onclick="showToast('Step ${s.step} detail view','info')">Details</button>
                  </div>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px" class="stagger-in">

        <!-- ── Access Control Panel ── -->
        <div class="card">
          <div class="card-header">
            <div style="display:flex;flex-direction:column;gap:2px">
              <span class="card-title">Project Access Control</span>
              <span style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em">${pid}</span>
            </div>
            ${isManager ? `
            <button class="route-lock-btn ${isProjectLocked ? 'is-locked' : ''}" onclick="_routeToggleLock('${pid}')">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                ${isProjectLocked
                  ? '<rect x="2" y="6" width="9" height="7" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M4 6V4.5a2.5 2.5 0 015 0V6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>'
                  : '<rect x="2" y="6" width="9" height="7" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M4 6V4.5a2.5 2.5 0 015 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>'
                }
              </svg>
              ${isProjectLocked ? 'Unlock Routing' : 'Lock Routing'}
            </button>
            ` : ''}
          </div>

          <div style="padding:4px 0">
            <div class="route-access-legend">
              ${Object.entries(accessMeta).map(([k,v]) => `<span class="route-acc-chip ${v.cls}">${v.label}</span>`).join('')}
            </div>
          </div>

          <div class="route-access-list">
            ${access.roles.map(r => {
              const color = _deptColors[r.id] || '#94a3b8';
              return `
              <div class="route-access-row">
                <div class="route-access-role">
                  <div class="route-access-dot" style="background:${color}"></div>
                  <span class="route-access-name">${r.label}</span>
                </div>
                <div class="route-access-btns">
                  ${['none','view','execute','manage'].map(lvl => `
                    <button class="route-acc-lvl-btn ${r.access === lvl ? 'active ' + accessMeta[lvl].cls : ''}"
                            ${isManager ? `onclick="_routeSetAccess('${pid}','${r.id}','${lvl}')"` : 'disabled style="cursor:not-allowed;opacity:0.6"'}
                            title="${accessMeta[lvl].label}">
                      ${lvl === 'none' ? '—' : lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                    </button>`).join('')}
                </div>
              </div>`;
            }).join('')}
          </div>

          <div style="padding:10px 14px 12px;border-top:1px solid var(--border)">
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.06em">Access Summary</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${access.roles.filter(r => r.access !== 'none').map(r => `
                <div class="route-acc-chip ${accessMeta[r.access].cls}" style="display:flex;align-items:center;gap:4px">
                  <div style="width:6px;height:6px;border-radius:50%;background:${_deptColors[r.id]||'#94a3b8'};flex-shrink:0"></div>
                  ${r.label.split(' ')[0]}
                </div>`).join('')}
            </div>
          </div>
        </div>

        <!-- ── Scrap / NCR Log ── -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Scrap / NCR Log</span>
            ${ProdData.scrapLog.length ? `<span class="badge badge-red">${ProdData.scrapLog.length}</span>` : ''}
          </div>
          <div style="padding:0 12px 12px">
            ${ProdData.scrapLog.length === 0
              ? `<div style="font-size:12px;color:var(--text-muted);padding:12px 0;text-align:center">No scrap logged this session.</div>`
              : ProdData.scrapLog.slice(0, 5).map(e => `
                <div class="scrap-log-entry">
                  <div style="flex:1">
                    <div style="font-weight:600;font-size:12px">Step ${e.step} — ${e.stepName}</div>
                    <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${e.reason}</div>
                  </div>
                  <div style="text-align:right;flex-shrink:0">
                    <div style="font-family:var(--font-mono);font-size:12px;font-weight:700">${e.qty} ${e.unit}</div>
                    <div style="font-size:10px;color:var(--text-muted)">${e.time}</div>
                  </div>
                </div>`).join('')}
          </div>
        </div>

      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   WORK CENTRES
   ═══════════════════════════════════════════════════════════ */
function renderProdWorkCentres() {
  const el = document.getElementById('pageContent');
  const totalUtil = Math.round(ProdData.workCentres.filter(w => w.status !== 'down').reduce((s, w) => s + w.util, 0) / ProdData.workCentres.filter(w => w.status !== 'down').length);

  el.innerHTML = prodPageHeader('Work Centres', 'Shop-floor capacity · Real-time station status · Resource allocation') + `
    <div class="prod-kpi-grid stagger-in" style="grid-template-columns:repeat(5,1fr);margin-bottom:20px">
      ${[
        { label: 'Total Stations', value: ProdData.workCentres.length,                                        color: 'var(--text-primary)', sub: 'registered work centres' },
        { label: 'Busy',           value: ProdData.workCentres.filter(w => w.status === 'busy').length,        color: 'var(--brand)',        sub: 'actively running' },
        { label: 'Idle',           value: ProdData.workCentres.filter(w => w.status === 'idle').length,        color: 'var(--green)',         sub: 'available capacity' },
        { label: 'Down',           value: ProdData.workCentres.filter(w => w.status === 'down').length,        color: 'var(--red)',           sub: 'maintenance required' },
        { label: 'Avg Utilisation',value: totalUtil + '%',                                                     color: totalUtil > 85 ? 'var(--amber)' : 'var(--green)', sub: 'across active stations' },
      ].map(k => `
        <div class="prod-kpi-card">
          <div class="prod-kpi-label">${k.label}</div>
          <div class="prod-kpi-value" style="color:${k.color}">${k.value}</div>
          <div class="prod-kpi-sub">${k.sub}</div>
        </div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 280px;gap:20px">
      <div class="card stagger-in">
        <div class="card-header">
          <span class="card-title">Live Station Status</span>
          <button class="btn btn-secondary btn-sm" onclick="showToast('Predictive health scan initiated...','info')">Run Health Audit</button>
        </div>
        <div class="wc-grid">
          ${ProdData.workCentres.map(wc => {
            const badgeCls = wc.status === 'busy' ? 'badge-accent' : wc.status === 'idle' ? 'badge-green' : 'badge-red';
            const healthCol = wc.health > 85 ? 'var(--green)' : wc.health > 70 ? 'var(--amber)' : 'var(--red)';
            return `
            <div class="wc-card" style="--wc-color:${wc.color}">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <div class="wc-name">${wc.name}</div>
                <span class="badge ${badgeCls}" style="font-size:10px">${wc.status.toUpperCase()}</span>
              </div>
              <div style="margin-bottom:12px">
                <div class="prod-section-label" style="margin-bottom:3px">Active Job</div>
                <div style="font-size:12px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${wc.job}</div>
              </div>
              <div style="margin-bottom:12px">
                <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:5px">
                  <span>Utilisation</span><span style="font-weight:600;color:var(--text-primary)">${wc.util}%</span>
                </div>
                <div class="progress-bar" style="height:5px"><div class="progress-fill" style="width:${wc.util}%;background:${wc.color}"></div></div>
              </div>
              <div style="background:var(--bg-base);border:1px solid var(--border);border-radius:6px;padding:8px 10px;margin-bottom:12px">
                <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px">
                  <span style="color:var(--text-muted)">Health Index</span>
                  <span style="font-weight:700;color:${healthCol}">${wc.health}%</span>
                </div>
                <div style="font-size:10px;color:var(--text-muted)">Next maintenance in <strong>${wc.nextMaint} days</strong></div>
              </div>
              <button class="btn btn-ghost btn-xs" style="width:100%" onclick="showAllocationModal('${wc.id}')">Manage Resource</button>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px" class="stagger-in">
        <div class="card">
          <div class="card-header"><span class="card-title">OEE Breakdown</span></div>
          <div style="display:flex;flex-direction:column;gap:12px;padding:0 2px 4px">
            ${[
              { label: 'Availability', val: 92, col: 'var(--brand)' },
              { label: 'Performance',  val: 88, col: 'var(--green)' },
              { label: 'Quality',      val: 98, col: 'var(--green)' },
            ].map(o => `
              <div>
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px">
                  <span style="color:var(--text-secondary)">${o.label}</span>
                  <span style="font-weight:600;color:var(--text-primary)">${o.val}%</span>
                </div>
                <div class="progress-bar" style="height:5px"><div class="progress-fill" style="width:${o.val}%;background:${o.col}"></div></div>
              </div>`).join('')}
            <div style="border-top:1px solid var(--border);padding-top:10px;display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:12px;font-weight:600;color:var(--text-secondary)">Overall OEE</span>
              <span style="font-size:18px;font-weight:700;color:var(--brand)">79.4%</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Bottleneck Alert</span></div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${ProdData.workCentres.filter(w => w.util > 85 || w.status === 'down').map(wc => `
              <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:${wc.status === 'down' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)'};border:1px solid ${wc.status === 'down' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'};border-radius:8px">
                <div style="width:8px;height:8px;border-radius:50%;background:${wc.status === 'down' ? 'var(--red)' : 'var(--amber)'};flex-shrink:0"></div>
                <div style="flex:1">
                  <div style="font-size:12px;font-weight:600">${wc.name}</div>
                  <div style="font-size:10px;color:var(--text-muted)">${wc.status === 'down' ? 'Machine down' : wc.util + '% utilisation'}</div>
                </div>
              </div>`).join('') || '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:12px 0">No bottlenecks detected</div>'}
          </div>
        </div>
      </div>
    </div>`;
}

/* ── Project selector ─────────────────────────────────────── */
function renderProjStrip() {
  const strip = document.getElementById('prodProjStrip');
  if (!strip) return;
  const colours = { active:'var(--green)', planning:'var(--blue)', 'qc-hold':'var(--amber)' };
  strip.innerHTML = AppState.projects.map(p => `
    <div class="proj-chip ${p.id === ProdData.selectedProject ? 'selected' : ''}" onclick="selectProdProject('${p.id}')">
      <span class="proj-chip-dot" style="background:${colours[p.status]||'var(--text-muted)'}"></span>
      <span style="font-family:var(--font-mono);font-size:11px">${p.id}</span>
      <span style="color:var(--text-muted)">·</span>
      <span style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name.split('—')[0].trim()}</span>
    </div>`).join('');
}

function selectProdProject(id) {
  ProdData.selectedProject = id;
  renderProjStrip();
  // Re-render current sub-page
  if (typeof renderProdSubPage === 'function') renderProdSubPage(_prodActiveSubPage);
}

/* ── Page header helper ───────────────────────────────────── */
function prodPageHeader(title, subtitle) {
  return `
    <div class="page-header">
      <div>
        <div class="page-title">${title}</div>
        <div class="page-subtitle">${subtitle}</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="renderProdSubPage(_prodActiveSubPage)">
          <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Refresh
        </button>
      </div>
    </div>
    <div class="proj-select-strip" id="prodProjStrip"></div>
  `;
}

/* ═══════════════════════════════════════════════════════════
   PROJECTS HUB
═══════════════════════════════════════════════════════════ */
function renderProdProjects() {
  const el       = document.getElementById('pageContent');
  const projects = AppState.projects || [];
  const newSet   = new Set(ProdData._newlyAssigned || []);

  // Dismiss "new" flag for a project and rebuild sidebar badge
  window.dismissNewProject = function(pid) {
    ProdData._newlyAssigned = (ProdData._newlyAssigned || []).filter(x => x !== pid);
    buildProductionSidebar();
    renderProdProjects();
  };

  // Assign the selected project and jump to a sub-page
  window.prodProjectAction = function(pid, page) {
    ProdData.selectedProject = pid;
    // Route "schedule" for projects with no existing schedule to the builder
    if (page === 'schedule' && !(ProdData.schedule[pid] && ProdData.schedule[pid].length)) {
      renderProdSubPage('schedule-builder');
    } else {
      renderProdSubPage(page);
    }
  };

  // Phase labels for the 7-phase strip
  const phaseLabels = ['Enquiry','Quote','PO','Production','QC','Dispatch','Closed'];

  const statusMeta = {
    'active':   { label: 'Active',    cls: 'badge-green',  dot: 'var(--green)' },
    'planning': { label: 'Planning',  cls: 'badge-blue',   dot: 'var(--blue)'  },
    'qc-hold':  { label: 'QC Hold',   cls: 'badge-amber',  dot: 'var(--amber)' },
    'complete': { label: 'Complete',  cls: 'badge-muted',  dot: 'var(--text-muted)' },
  };

  /* ── Readiness checks ── */
  function readiness(p) {
    const hasBOM      = !!(ProdData.bom[p.id]      && ProdData.bom[p.id].length);
    const hasSchedule = !!(ProdData.schedule[p.id] && ProdData.schedule[p.id].length);
    const hasMRP      = !!(ProdData.mrp[p.id]      && ProdData.mrp[p.id].length);
    const tasks       = ProdData.schedule[p.id] || [];
    const donePct     = tasks.length
      ? Math.round(tasks.filter(t => t.status === 'done').length / tasks.length * 100) : 0;
    return { hasBOM, hasSchedule, hasMRP, donePct, taskCount: tasks.length };
  }

  /* ── KPI bar ── */
  const total    = projects.length;
  const active   = projects.filter(p => p.status === 'active').length;
  const onHold   = projects.filter(p => p.status === 'qc-hold').length;
  const newCount = newSet.size;

  const kpiHTML = [
    { label: 'Total Projects', value: total,    color: 'var(--text-primary)', sub: 'assigned to production' },
    { label: 'Active',         value: active,   color: 'var(--green)',        sub: 'in production' },
    { label: 'QC Holds',       value: onHold,   color: 'var(--amber)',        sub: 'awaiting clearance' },
    { label: 'Newly Assigned', value: newCount, color: 'var(--brand)',       sub: 'action required' },
  ].map(k => `
    <div class="prod-kpi-card">
      <div class="prod-kpi-label">${k.label}</div>
      <div class="prod-kpi-value" style="color:${k.color}">${k.value}</div>
      <div class="prod-kpi-sub">${k.sub}</div>
    </div>`).join('');

  /* ── Project cards ── */
  const cardsHTML = projects.map(p => {
    const isNew  = newSet.has(p.id);
    const sm     = statusMeta[p.status] || statusMeta['active'];
    const r      = readiness(p);
    const tasks  = ProdData.schedule[p.id] || [];
    const cpmTasks = tasks.length ? calculateCPM(JSON.parse(JSON.stringify(tasks))) : [];
    const critCount = cpmTasks.filter(t => t.isCritical).length;

    // Phase progress strip
    const phaseStrip = (p.phases || []).map((ph, i) => {
      const bg = ph === 'done' ? 'var(--green)' : ph === 'active' ? 'var(--brand)' : 'var(--border-md)';
      const lbl = phaseLabels[i] || '';
      return `<div title="${lbl}" style="flex:1;height:6px;background:${bg};border-radius:2px;transition:background 0.2s"></div>`;
    }).join('');

    // Readiness pills
    const pills = [
      { label: 'BOM',      ok: r.hasBOM,      action: 'bom'      },
      { label: 'Schedule', ok: r.hasSchedule,  action: 'schedule' },
      { label: 'MRP',      ok: r.hasMRP,       action: 'mrp'      },
    ].map(pill => `
      <span class="badge ${pill.ok ? 'badge-green' : 'badge-red'}" style="font-size:10px;cursor:pointer" onclick="prodProjectAction('${p.id}','${pill.action}')">
        ${pill.ok ? '✓' : '!'} ${pill.label}
      </span>`).join('');

    // Action buttons
    const actionButtons = `
      <button class="btn btn-ghost btn-sm" onclick="prodProjectAction('${p.id}','bom')" title="Plan BOM">
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 2h10M2 5h7M2 8h9M2 11h5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        BOM
      </button>
      <button class="btn btn-ghost btn-sm" onclick="prodProjectAction('${p.id}','schedule')" title="Master Schedule / Gantt">
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M1 6h12M4 3V1M10 3V1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        ${r.hasSchedule ? 'Gantt' : 'Create Schedule'}
      </button>
      <button class="btn btn-ghost btn-sm" onclick="prodProjectAction('${p.id}','manufacturing')" title="Manufacturing Tasks">
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.3"/><path d="M7 4v3l2 1.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        Tasks
      </button>
      <button class="btn ${r.hasSchedule ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="prodProjectAction('${p.id}','mrp')">
        MRP
      </button>`;

    const isOverdue = new Date(p.dueDate) < new Date();
    return `
      <div class="prod-project-card ${isNew ? 'is-new' : ''}">

        ${isNew ? `
        <div class="prod-new-banner">
          <span class="prod-new-banner-text">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" fill="rgba(255,255,255,0.4)"/><circle cx="5" cy="5" r="2" fill="#fff"/></svg>
            NEWLY ASSIGNED TO PRODUCTION
          </span>
          <button class="prod-new-banner-dismiss" onclick="dismissNewProject('${p.id}')">Dismiss ×</button>
        </div>` : ''}

        <div class="prod-project-body">
          <div class="prod-project-header">
            <div style="flex:1;min-width:0">
              <div class="prod-project-id">${p.id} · ${p.client}</div>
              <div class="prod-project-name">${p.name}</div>
              <div class="prod-project-pills">
                <span class="badge ${sm.cls}">${sm.label}</span>
                ${pills}
              </div>
            </div>
            <div class="prod-project-value">
              <div class="prod-project-value-num">$${(p.value / 1000).toFixed(0)}K</div>
              <div class="prod-project-value-label">Contract value</div>
              <div class="prod-project-due ${isOverdue ? 'overdue' : ''}">${p.dueDate}</div>
            </div>
          </div>

          <div class="prod-phase-wrap">
            <div class="prod-section-label">Project Phase</div>
            <div class="prod-phase-bar">${phaseStrip}</div>
            <div class="prod-phase-labels">
              ${phaseLabels.map(l => `<div class="prod-phase-label">${l}</div>`).join('')}
            </div>
          </div>

          <div class="prod-mini-grid">
            <div class="prod-mini-cell">
              <div class="prod-mini-value" style="color:var(--brand)">${r.taskCount || '—'}</div>
              <div class="prod-mini-label">Tasks</div>
            </div>
            <div class="prod-mini-cell">
              <div class="prod-mini-value" style="color:${r.donePct === 100 ? 'var(--green)' : 'var(--text-primary)'}">${r.taskCount ? r.donePct + '%' : '—'}</div>
              <div class="prod-mini-label">Done</div>
            </div>
            <div class="prod-mini-cell">
              <div class="prod-mini-value" style="color:${critCount > 0 ? 'var(--red)' : 'var(--text-muted)'}">${r.taskCount ? critCount : '—'}</div>
              <div class="prod-mini-label">Critical</div>
            </div>
            <div class="prod-mini-cell">
              <div class="prod-mini-value" style="color:var(--text-primary)">${p.progress}%</div>
              <div class="prod-mini-label">Overall</div>
            </div>
          </div>

          <div class="progress-bar" style="height:6px;margin-bottom:14px">
            <div class="progress-fill" style="width:${p.progress}%;background:linear-gradient(90deg,var(--brand),var(--accent2,#38D2F2))"></div>
          </div>

          <div class="prod-actions-row">
            ${actionButtons}
          </div>
        </div>
      </div>`;
  }).join('');

  el.innerHTML = prodPageHeader('Projects', 'Assigned projects · Production readiness · Schedule & BOM planning') + `
    <div class="prod-kpi-grid stagger-in">${kpiHTML}</div>
    <div style="display:flex;flex-direction:column;gap:16px;max-width:940px" class="stagger-in">
      ${cardsHTML || '<div class="empty-state"><p>No projects assigned to Production yet.</p></div>'}
    </div>`;

  renderProjStrip();
}

/* ═══════════════════════════════════════════════════════════
   CONTROL CENTRE (formerly Overview)
═══════════════════════════════════════════════════════════ */
function renderProdOverview() {
  const el  = document.getElementById('pageContent');
  const pid = ProdData.selectedProject;

  /* ── Derived metrics ── */
  const avgHealth   = Math.round(ProdData.equipment.reduce((s,e)=>s+e.health,0)/ProdData.equipment.length);
  const qcLocks     = ProdData.inspectionCalls.filter(c=>c.status==='locked').length;
  const pendingMRFs = ProdData.mrf.filter(m=>m.status==='pending_approval').length;
  const pmOverdue   = ProdData.maintenance.schedule.filter(p=>p.status==='overdue').length;
  const wcDown      = ProdData.workCentres.filter(w=>w.status==='down').length;
  const pullIns     = (ProdData.mrp[pid]||[]).filter(m=>m.status!=='ok');
  const wcBusy      = ProdData.workCentres.filter(w=>w.status==='busy').length;
  const avgUtil     = Math.round(ProdData.workCentres.filter(w=>w.status!=='down').reduce((s,w)=>s+w.util,0)/Math.max(1,ProdData.workCentres.filter(w=>w.status!=='down').length));

  /* ── Exception ticker ── */
  const tickerItems = [];
  ProdData.workCentres.filter(w=>w.status==='down').forEach(w=>
    tickerItems.push({cls:'badge-red',  tag:'CRITICAL', msg:`${w.name} is DOWN — ${w.job}`}));
  ProdData.inspectionCalls.filter(c=>c.status==='locked').forEach(c=>
    tickerItems.push({cls:'badge-amber',tag:'QC HOLD',  msg:`${c.project} Step ${c.stepNum||c.taskId} — ${c.type}`}));
  ProdData.mrp[pid]?.filter(m=>m.status==='missing').forEach(m=>
    tickerItems.push({cls:'badge-blue', tag:'STOCK-OUT',msg:`${m.item} — out of stock, need by ${fmtDate(m.needDate)}`}));
  if (pmOverdue) tickerItems.push({cls:'badge-amber',tag:'PM DUE',msg:`${pmOverdue} preventive maintenance task${pmOverdue>1?'s':''} overdue`});

  /* ── Per-project summary ── */
  const projSummaries = AppState.projects.map(p => {
    const sched  = ProdData.schedule[p.id]||[];
    const done   = sched.filter(t=>t.status==='done').length;
    const active = sched.filter(t=>t.status==='active'||t.status==='in_progress').length;
    const blk    = sched.filter(t=>t.status==='blocked').length;
    const pct    = sched.length ? Math.round(done/sched.length*100) : 0;
    const holds  = ProdData.inspectionCalls.filter(c=>c.project===p.id&&c.status==='locked').length;
    const mrpWarn= (ProdData.mrp[p.id]||[]).filter(m=>m.status!=='ok').length;
    const statusColor = { active:'var(--green)', planning:'var(--blue)', 'qc-hold':'var(--amber)' }[p.status]||'var(--text-muted)';
    const health = pct >= 75 ? 'on-track' : pct >= 40 ? 'caution' : 'at-risk';
    return { ...p, done, active, blk, pct, holds, mrpWarn, statusColor, health, schedLen: sched.length };
  });

  el.innerHTML = prodPageHeader('Control Centre', 'ISA-95 Manufacturing Operations · Live shop-floor execution overview') + `

    <!-- Exception Ticker -->
    <div class="exception-ticker-wrap" style="margin-bottom:20px">
      <div class="exception-ticker">
        ${tickerItems.length
          ? tickerItems.map(t=>`<div class="exception-item"><span class="badge ${t.cls}">${t.tag}</span><span>${t.msg}</span></div>`).join('')
          : `<div class="exception-item"><span class="badge badge-green">ALL CLEAR</span><span>No active exceptions on the shop floor</span></div>`}
      </div>
    </div>

    <!-- KPI bar -->
    <div class="prod-kpi-grid stagger-in" style="grid-template-columns:repeat(6,1fr);margin-bottom:24px">
      ${[
        { label:'Active WOs',        value: ProdData.workOrders.filter(w=>w.status==='running').length, sub:'running now',     color:'var(--brand)' },
        { label:'Floor Utilisation', value: avgUtil+'%',   sub: wcBusy+' stations busy',   color: avgUtil>85?'var(--amber)':'var(--green)' },
        { label:'Asset Health',      value: avgHealth+'%', sub:'avg across machines',       color: avgHealth>85?'var(--green)':'var(--amber)' },
        { label:'QC Holds',          value: qcLocks,       sub: qcLocks?'blocking steps':'all clear',  color: qcLocks?'var(--red)':'var(--text-muted)' },
        { label:'PM Overdue',        value: pmOverdue,     sub: pmOverdue?'need attention':'schedule ok', color: pmOverdue?'var(--amber)':'var(--text-muted)' },
        { label:'Pending MRFs',      value: pendingMRFs,   sub:'awaiting approval',         color: pendingMRFs?'var(--amber)':'var(--text-muted)' },
      ].map(k=>`
        <div class="prod-kpi-card">
          <div class="prod-kpi-label">${k.label}</div>
          <div class="prod-kpi-value" style="color:${k.color}">${k.value}</div>
          <div class="prod-kpi-sub">${k.sub}</div>
        </div>`).join('')}
    </div>

    <!-- Main 3-col layout -->
    <div class="cc-grid stagger-in">

      <!-- ── Col 1: Work Orders + Execution Feed ── -->
      <div class="cc-col-main">

        <!-- Live Work Orders -->
        <div class="card" style="margin-bottom:20px">
          <div class="card-header">
            <div>
              <span class="card-title">Active Work Orders</span>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Live shop-floor execution — timers update every second</div>
            </div>
            <span class="badge badge-green">LIVE</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:0">
            ${ProdData.workOrders.map((wo,i,arr) => {
              const statusColor = wo.status==='running'?'var(--green)':wo.status==='blocked'?'var(--red)':'var(--text-muted)';
              const wcInfo = ProdData.workCentres.find(w=>w.id===wo.wc)||{name:wo.wc,color:'var(--brand)'};
              return `
              <div style="display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center;padding:14px 16px;${i<arr.length-1?'border-bottom:1px solid var(--border)':''}">
                <div style="display:flex;flex-direction:column;align-items:center;gap:4px;min-width:56px">
                  <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-primary)">${wo.id}</div>
                  <span class="badge ${wo.status==='running'?'badge-green':wo.status==='blocked'?'badge-red':'badge-muted'}">${wo.status.toUpperCase()}</span>
                </div>
                <div>
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                    <div style="font-weight:600;font-size:13px">${wo.name}</div>
                    <span style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono)">${wo.project}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
                    <span style="font-size:11px;color:var(--text-secondary)">
                      <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${wcInfo.color||'var(--brand)'};margin-right:4px;vertical-align:middle"></span>
                      ${wcInfo.name||wo.wc}
                    </span>
                    <span style="font-size:11px;color:var(--text-secondary)">${wo.operator}</span>
                    ${wo.status==='running'?`<span style="font-family:var(--font-mono);font-size:11px;color:var(--brand)" id="timer-${wo.id}">${formatDuration(wo.timeInStation)}</span>`:''}
                  </div>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="progress-bar" style="flex:1;height:5px">
                      <div class="progress-fill" style="width:${wo.progress}%;background:${statusColor}"></div>
                    </div>
                    <span style="font-size:11px;font-weight:600;color:${statusColor};min-width:32px;text-align:right">${wo.progress}%</span>
                  </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
                  <button class="btn btn-ghost btn-xs" onclick="renderProdSubPage('manufacturing')">View Floor</button>
                  ${wo.serials.length?`<div style="font-size:10px;color:var(--text-muted)">${wo.serials.length} serial${wo.serials.length>1?'s':''}</div>`:''}
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Execution Feed -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Shop Floor Feed</span>
            <span class="badge badge-green" style="font-size:10px">LIVE</span>
          </div>
          <div class="sflog" style="max-height:260px;overflow-y:auto">
            ${ProdData.sfLog.slice(0,8).map(e=>`
              <div class="sflog-entry">
                <span class="sflog-time">${e.time}</span>
                <span class="sflog-dot" style="background:${e.dot}"></span>
                <span class="sflog-text">${e.text}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- ── Col 2: Project Pipeline + Shift Handover ── -->
      <div class="cc-col-mid">

        <!-- Project Pipeline -->
        <div class="card" style="margin-bottom:20px">
          <div class="card-header">
            <span class="card-title">Project Pipeline</span>
            <button class="btn btn-ghost btn-sm" onclick="renderProdSubPage('projects')">All Projects</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:0">
            ${projSummaries.map((p,i,arr)=>`
              <div class="cc-proj-row ${p.id===pid?'cc-proj-active':''} ${i<arr.length-1?'cc-proj-border':''}"
                   onclick="selectProdProject('${p.id}');renderProdSubPage('overview')">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                  <div class="cc-proj-dot" style="background:${p.statusColor}"></div>
                  <div>
                    <div style="font-weight:700;font-size:13px">${p.name.split('—')[0].trim()}</div>
                    <div style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono)">${p.id} · ${p.status.toUpperCase()}</div>
                  </div>
                  <div style="margin-left:auto;display:flex;gap:6px;align-items:center">
                    ${p.holds?`<span class="badge badge-red" style="font-size:10px">${p.holds} QC hold${p.holds>1?'s':''}</span>`:''}
                    ${p.mrpWarn?`<span class="badge badge-amber" style="font-size:10px">${p.mrpWarn} material${p.mrpWarn>1?'s':''}</span>`:''}
                  </div>
                </div>
                ${p.schedLen ? `
                  <div style="display:flex;align-items:center;gap:10px">
                    <div class="progress-bar" style="flex:1;height:6px;border-radius:3px">
                      <div class="progress-fill" style="width:${p.pct}%;background:${p.health==='on-track'?'var(--green)':p.health==='caution'?'var(--amber)':'var(--red)'}"></div>
                    </div>
                    <span style="font-size:12px;font-weight:700;min-width:36px;text-align:right;color:${p.health==='on-track'?'var(--green)':p.health==='caution'?'var(--amber)':'var(--red)'}">${p.pct}%</span>
                    <span style="font-size:10px;color:var(--text-muted);min-width:50px">${p.done}/${p.schedLen} tasks</span>
                  </div>` :
                  `<div style="font-size:11px;color:var(--text-muted);font-style:italic">No schedule built yet</div>`}
              </div>`).join('')}
          </div>
        </div>

        <!-- Shift Transition -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Shift Handover</span>
            <span style="font-size:11px;color:var(--text-muted)">${ProdData.shiftTransition.outgoing} → ${ProdData.shiftTransition.incoming}</span>
          </div>
          <div style="padding:2px 4px 8px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <span style="font-size:12px;color:var(--text-secondary)">Handover completion</span>
              <span style="font-weight:700;font-size:13px">${ProdData.shiftTransition.completion}%</span>
            </div>
            <div class="progress-bar" style="height:7px;margin-bottom:16px">
              <div class="progress-fill" style="width:${ProdData.shiftTransition.completion}%"></div>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px">
              ${ProdData.shiftTransition.tasks.map(t=>`
                <div style="display:flex;align-items:center;gap:8px;font-size:12px">
                  <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${t.status==='done'?'var(--green)':'var(--border-md)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;background:${t.status==='done'?'rgba(34,197,94,0.1)':'var(--bg-elevated)'}">
                    ${t.status==='done'?'<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2.5" stroke="var(--green)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>':''}
                  </div>
                  <span style="color:${t.status==='done'?'var(--text-secondary)':'var(--text-primary)'}">${t.name}</span>
                  ${t.status==='done'?'':'<span class="badge badge-amber" style="margin-left:auto;font-size:9px">PENDING</span>'}
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- ── Col 3: Right sidebar ── -->
      <div class="cc-col-side">

        <!-- Work Centre Status -->
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <span class="card-title">Work Centres</span>
            <button class="btn btn-ghost btn-xs" onclick="renderProdSubPage('workcentres')">Detail</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:2px;padding-bottom:4px">
            ${ProdData.workCentres.map(wc=>{
              const isDown = wc.status==='down';
              const hot    = wc.util>90&&!isDown;
              const dotCol = isDown?'var(--red)':hot?'var(--red)':wc.util>70?'var(--amber)':'var(--green)';
              const label  = isDown?'DOWN':hot?`${wc.util}% CRIT`:`${wc.util}%`;
              return `
              <div class="prod-wc-row">
                <div class="prod-wc-info">
                  <div class="prod-wc-dot${hot||isDown?' pulse-dot':''}" style="background:${dotCol}${hot||isDown?';animation:pulse 1.4s infinite':''}"></div>
                  <div>
                    <div class="prod-wc-name">${wc.name}</div>
                    <div class="prod-wc-util" style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${wc.job}</div>
                  </div>
                </div>
                <span class="badge ${isDown?'badge-red':hot?'badge-red':wc.util>70?'badge-amber':'badge-muted'}" style="font-size:10px">${label}</span>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- IIoT Telemetry -->
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <span class="card-title">IIoT Telemetry</span>
            <span class="badge badge-green" style="font-size:10px">LIVE</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;padding:0 2px 4px">
            ${Object.entries(ProdData.telemetry).map(([id,t])=>`
              <div style="display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:8px 10px;background:var(--bg-elevated);border-radius:8px;border:1px solid var(--border)">
                <div style="width:8px;height:8px;border-radius:50%;background:${t.status==='running'?'var(--green)':'var(--text-muted)'};flex-shrink:0"></div>
                <div>
                  <div style="font-family:var(--font-mono);font-size:10px;font-weight:600;color:var(--text-primary)">${id}</div>
                  <div style="font-size:10px;color:var(--text-muted)">${t.power} kW · ${t.temp}°C</div>
                </div>
                <div style="text-align:right">
                  <div style="font-size:13px;font-weight:700;color:${t.load>85?'var(--amber)':'var(--text-primary)'}">${t.load}%</div>
                  <div style="font-size:9px;color:var(--text-muted)">LOAD</div>
                </div>
              </div>`).join('')}
          </div>
        </div>

        <!-- Material shortages -->
        ${pullIns.length?`
        <div class="card">
          <div class="card-header">
            <span class="card-title">Material Shortages</span>
            <span class="badge badge-amber">${pullIns.length}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:0;padding-bottom:4px">
            ${pullIns.map((m,i,arr)=>`
              <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;${i<arr.length-1?'border-bottom:1px solid var(--border)':''}">
                <div style="width:8px;height:8px;border-radius:50%;background:${m.status==='missing'?'var(--red)':'var(--amber)'};flex-shrink:0;margin-top:4px"></div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.item}</div>
                  <div style="font-size:10px;color:var(--text-muted)">${m.pn} · Have: ${m.onHand} / Need: ${m.required}</div>
                </div>
                <button class="btn btn-ghost btn-xs" onclick="renderProdSubPage('mrp')">MRP</button>
              </div>`).join('')}
          </div>
        </div>`:``}

      </div>
    </div>`;

  renderProjStrip();
}

/* ═══════════════════════════════════════════════════════════
   TAB 2 — BILL OF MATERIALS
═══════════════════════════════════════════════════════════ */
/* ── Advanced BOM Logic ── */
let bomCompareMode = false;

function calculateBOMCost(item) {
  if (item.type === 'material' || item.type === 'part') {
    item.totalCost = (item.unitCost || 0) * (item.qty || 0);
    item.targetCost = (item.unitCost || 0) * (item.targetQty || item.qty || 0);
    return item.totalCost;
  }
  if (item.children) {
    item.totalCost = item.children.reduce((sum, child) => sum + calculateBOMCost(child), 0);
    item.targetCost = item.children.reduce((sum, child) => sum + (child.targetCost || 0), 0);
    return item.totalCost;
  }
  return 0;
}

function toggleBOMCompare() {
  bomCompareMode = !bomCompareMode;
  renderProdBOM();
  showToast(bomCompareMode ? 'Comparison Mode: ON' : 'Comparison Mode: OFF', 'info');
}

function renderProdBOM() {
  const pid  = ProdData.selectedProject;
  const rawBom = ProdData.bom[pid] || [];
  const bom = JSON.parse(JSON.stringify(rawBom));

  bom.forEach(item => calculateBOMCost(item));
  const totalProjectCost   = bom.reduce((s, i) => s + i.totalCost,  0);
  const targetProjectCost  = bom.reduce((s, i) => s + i.targetCost, 0);
  const variance = totalProjectCost - targetProjectCost;

  document.getElementById('pageContent').innerHTML = prodPageHeader('BOM Management', 'ISA-95 Product Definition · Real-time Cost Roll-up · Variance Analysis') + `
    <div class="prod-kpi-grid stagger-in" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
      <div class="prod-kpi-card">
        <div class="prod-kpi-label">Total As-Built Cost</div>
        <div class="prod-kpi-value">${fmt(totalProjectCost)}</div>
        <div class="prod-kpi-sub">Rolled-up from all BOM lines</div>
      </div>
      <div class="prod-kpi-card">
        <div class="prod-kpi-label">Target / Budget Cost</div>
        <div class="prod-kpi-value" style="color:var(--text-secondary)">${fmt(targetProjectCost)}</div>
        <div class="prod-kpi-sub">Original estimate at award</div>
      </div>
      <div class="prod-kpi-card">
        <div class="prod-kpi-label">Cost Variance</div>
        <div class="prod-kpi-value" style="color:${variance > 0 ? 'var(--red)' : 'var(--green)'}">
          ${variance > 0 ? '+' : ''}${fmt(variance)}
        </div>
        <div class="prod-kpi-sub">${variance > 0 ? 'Over budget' : variance < 0 ? 'Under budget' : 'On budget'}</div>
      </div>
    </div>

    <div class="card stagger-in" style="margin-bottom:20px">
      <div class="card-header">
        <div style="display:flex;flex-direction:column;gap:2px">
          <span class="card-title">Visual BOM Engine</span>
          <span style="font-size:11px;color:var(--text-muted)">Interactive hierarchy · cost treemap · stock coverage</span>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <div class="bom-view-tabs" id="bomViewTabs">
            <button class="bom-view-tab active" id="bomTabTree" onclick="_bomSetView('tree')">Hierarchy Tree</button>
            <button class="bom-view-tab" id="bomTabMap" onclick="_bomSetView('treemap')">Cost Treemap</button>
          </div>
        </div>
      </div>
      <div id="bomVisualContainer" style="padding:16px 20px 12px;overflow:auto"></div>
    </div>

    <div class="card stagger-in">
      <div class="card-header">
        <span class="card-title">Bill of Materials — ${pid}</span>
        <div style="display:flex;gap:8px">
          <button class="btn ${bomCompareMode ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="toggleBOMCompare()">
            ${bomCompareMode ? 'Compare: On' : 'Compare As-Built'}
          </button>
          <button class="btn btn-ghost btn-sm" onclick="expandAllBOM()">Expand all</button>
          <button class="btn btn-secondary btn-sm" onclick="showToast('BOM exported to CSV','success')">Export</button>
        </div>
      </div>
      <div class="bom-row" style="background:var(--bg-elevated);cursor:default">
        <div style="width:18px;flex-shrink:0"></div>
        <div class="bom-cell bom-name"  style="color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em">Description</div>
        <div class="bom-cell bom-pn"    style="color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em">Part No.</div>
        <div class="bom-cell bom-qty"   style="color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em">Qty</div>
        <div class="bom-cell bom-unit"  style="color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em">Unit</div>
        <div class="bom-cell bom-cost"  style="color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em">Total Cost</div>
        ${bomCompareMode ? `<div class="bom-cell bom-var" style="color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em">Variance</div>` : ''}
        <div class="bom-cell bom-stock" style="color:var(--text-muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em">Stock</div>
        <div class="bom-cell bom-actions"></div>
      </div>
      <div class="bom-tree" id="bomTree"></div>
    </div>`;

  renderBOMTree(bom, document.getElementById('bomTree'), 0);
  _renderBOMVisual(pid, bom);
}

function renderBOMTree(items, container, level) {
  items.forEach(item => {
    const indent = level * 20;
    const hasChildren = item.children && item.children.length > 0;
    const expanded = bomExpanded[item.id] !== false && (item.expanded || bomExpanded[item.id]);
    const typeIcon = item.type === 'assembly' ? 'A' : item.type === 'part' ? 'P' : 'M';
    const typeCls  = item.type === 'assembly' ? 'bom-assembly' : item.type === 'part' ? 'bom-part' : 'bom-material';
    const stockBadge = {
      ok:      '<span class="badge badge-green" style="font-size:10px">In stock</span>',
      partial: '<span class="badge badge-amber" style="font-size:10px">Partial</span>',
      low:     '<span class="badge badge-amber" style="font-size:10px">Low</span>',
      missing: '<span class="badge badge-red"   style="font-size:10px">Missing</span>',
    }[item.stock] || '';

    const role = AppState.currentUser?.role || 'manager';
    const isManager = role === 'manager' || role === 'gm';

    const rowEl = document.createElement('div');
    rowEl.className = 'bom-row';
    rowEl.style.paddingLeft = indent + 'px';
    rowEl.innerHTML = `
      <div class="bom-toggle" onclick="event.stopPropagation();toggleBOMRow('${item.id}')">
        ${hasChildren ? (expanded ? '▾' : '▸') : ''}
      </div>
      <div class="bom-cell bom-name" style="display:flex;align-items:center">
        <span class="bom-level-icon ${typeCls}">${typeIcon}</span>
        <span style="font-size:13px;color:var(--text-primary)">${item.name}</span>
      </div>
      <div class="bom-cell bom-pn">${item.pn}</div>
      <div class="bom-cell bom-qty" style="font-weight:500">${item.qty}${bomCompareMode && item.targetQty && item.targetQty !== item.qty ? `<br/><small style="color:var(--text-muted)">Target: ${item.targetQty}</small>` : ''}</div>
      <div class="bom-cell bom-unit">${item.unit}</div>
      <div class="bom-cell bom-cost">${fmt(item.totalCost)}</div>
      ${bomCompareMode ? `
        <div class="bom-cell bom-var">
          <span style="color:${(item.totalCost > item.targetCost) ? 'var(--red)' : (item.totalCost < item.targetCost) ? 'var(--green)' : 'var(--text-muted)'}">
            ${item.totalCost === item.targetCost ? '—' : fmt(item.totalCost - item.targetCost)}
          </span>
        </div>` : ''}
      <div class="bom-cell bom-stock">${stockBadge}</div>
      <div class="bom-cell bom-actions">
        <button class="btn-icon" title="Raise RM" onclick="event.stopPropagation();showToast('RM raised for ${item.name}','success')">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        </button>
        ${isManager ? `
        <button class="btn-icon" title="Edit" onclick="event.stopPropagation();showToast('Editing ${item.pn}','info')">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2l2 2-6 6H2V8l6-6z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>` : ''}
      </div>`;

    container.appendChild(rowEl);

    if (hasChildren) {
      const childWrap = document.createElement('div');
      childWrap.className = 'bom-children' + (expanded ? ' open' : '');
      childWrap.id = 'bom-ch-' + item.id;
      renderBOMTree(item.children, childWrap, level + 1);
      container.appendChild(childWrap);
    }
  });
}

function toggleBOMRow(id) {
  const childWrap = document.getElementById('bom-ch-' + id);
  if (!childWrap) return;
  const isOpen = childWrap.classList.toggle('open');
  bomExpanded[id] = isOpen;
  // Refresh toggle icon
  renderProdBOM();
}

function expandAllBOM() {
  const pid = ProdData.selectedProject;
  const bom = ProdData.bom[pid] || [];
  const setAll = (items, val) => items.forEach(item => { bomExpanded[item.id] = val; if (item.children) setAll(item.children, val); });
  setAll(bom, true);
  renderProdBOM();
}

/* ── Visual BOM Engine ──────────────────────────────────────── */
let _bomView = 'tree'; // 'tree' | 'treemap'

function _bomSetView(view) {
  _bomView = view;
  const treeTab = document.getElementById('bomTabTree');
  const mapTab  = document.getElementById('bomTabMap');
  if (treeTab) treeTab.classList.toggle('active', view === 'tree');
  if (mapTab)  mapTab.classList.toggle('active',  view === 'treemap');
  const pid = ProdData.selectedProject;
  const bom = JSON.parse(JSON.stringify(ProdData.bom[pid] || []));
  bom.forEach(item => calculateBOMCost(item));
  _renderBOMVisual(pid, bom);
}

function _renderBOMVisual(pid, bom) {
  const container = document.getElementById('bomVisualContainer');
  if (!container) return;
  container.innerHTML = '';
  if (_bomView === 'treemap') {
    _drawBOMTreemap(bom, container);
  } else {
    _drawBOMTree(bom, container);
  }
  // sync tab highlights on re-render
  const treeTab = document.getElementById('bomTabTree');
  const mapTab  = document.getElementById('bomTabMap');
  if (treeTab) treeTab.classList.toggle('active', _bomView === 'tree');
  if (mapTab)  mapTab.classList.toggle('active',  _bomView === 'treemap');
}

function _drawBOMTree(bom, container) {
  const ns = 'http://www.w3.org/2000/svg';
  const NODE_W = 168, NODE_H = 40, LEVEL_GAP = 210, ROW_GAP = 52;
  const typeColor = { assembly: '#f97316', part: '#3b82f6', material: '#22c55e' };
  const stockColor = { ok: '#22c55e', partial: '#f59e0b', low: '#f59e0b', missing: '#ef4444' };

  function leafCount(n) {
    if (!n.children || !n.children.length) return 1;
    return n.children.reduce((s, c) => s + leafCount(c), 0);
  }

  const pos = {};
  function assignPos(nodes, level, startLeaf) {
    let idx = startLeaf;
    nodes.forEach(n => {
      const lc = leafCount(n);
      pos[n.id] = { x: level * LEVEL_GAP, y: (idx + lc / 2 - 0.5) * ROW_GAP };
      if (n.children && n.children.length) assignPos(n.children, level + 1, idx);
      idx += lc;
    });
  }
  assignPos(bom, 0, 0);

  const totalLeaves = bom.reduce((s, n) => s + leafCount(n), 0);
  const maxLevel = Math.max(0, ...Object.values(pos).map(p => Math.round(p.x / LEVEL_GAP)));
  const svgW = (maxLevel + 1) * LEVEL_GAP + NODE_W + 16;
  const svgH = Math.max(totalLeaves * ROW_GAP + 16, 80);

  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', svgW);
  svg.setAttribute('height', svgH);
  svg.style.fontFamily = 'var(--font-display)';
  svg.style.display = 'block';

  // Draw bezier edges before nodes so nodes render on top
  function drawEdges(nodes) {
    nodes.forEach(n => {
      if (!n.children || !n.children.length) return;
      const p = pos[n.id];
      n.children.forEach(c => {
        const cp = pos[c.id];
        const x1 = p.x + NODE_W, y1 = p.y + NODE_H / 2;
        const x2 = cp.x,         y2 = cp.y + NODE_H / 2;
        const mx = (x1 + x2) / 2;
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`);
        path.setAttribute('fill', 'none');
        path.style.stroke = 'var(--border-md)';
        path.setAttribute('stroke-width', '1.5');
        svg.appendChild(path);
      });
      drawEdges(n.children);
    });
  }
  drawEdges(bom);

  // Draw nodes
  function drawNodes(nodes) {
    nodes.forEach(n => {
      const p = pos[n.id];
      const color = typeColor[n.type] || '#94a3b8';
      const sc = stockColor[n.stock] || '#94a3b8';

      // Shadow rect
      const shadow = document.createElementNS(ns, 'rect');
      shadow.setAttribute('x', p.x + 2); shadow.setAttribute('y', p.y + 2);
      shadow.setAttribute('width', NODE_W); shadow.setAttribute('height', NODE_H);
      shadow.setAttribute('rx', '7');
      shadow.style.fill = 'rgba(0,0,0,0.06)';
      svg.appendChild(shadow);

      // Main rect
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', p.x); rect.setAttribute('y', p.y);
      rect.setAttribute('width', NODE_W); rect.setAttribute('height', NODE_H);
      rect.setAttribute('rx', '7');
      rect.style.fill = 'var(--bg-surface)';
      rect.style.stroke = color;
      rect.setAttribute('stroke-width', '1.5');
      rect.style.cursor = 'pointer';
      rect.style.transition = 'filter 0.15s';
      svg.appendChild(rect);

      // Left accent bar
      const bar = document.createElementNS(ns, 'rect');
      bar.setAttribute('x', p.x); bar.setAttribute('y', p.y + 6);
      bar.setAttribute('width', '4'); bar.setAttribute('height', NODE_H - 12);
      bar.setAttribute('rx', '2');
      bar.setAttribute('fill', color);
      svg.appendChild(bar);

      // Stock dot (top-right)
      const dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('cx', p.x + NODE_W - 12); dot.setAttribute('cy', p.y + 10);
      dot.setAttribute('r', '4'); dot.setAttribute('fill', sc);
      svg.appendChild(dot);

      // Part number
      const t1 = document.createElementNS(ns, 'text');
      t1.setAttribute('x', p.x + 13); t1.setAttribute('y', p.y + 16);
      t1.setAttribute('font-size', '10'); t1.setAttribute('font-weight', '600');
      t1.style.fill = color; t1.style.pointerEvents = 'none';
      t1.textContent = n.pn.length > 17 ? n.pn.slice(0, 17) + '…' : n.pn;
      svg.appendChild(t1);

      // Name
      const t2 = document.createElementNS(ns, 'text');
      t2.setAttribute('x', p.x + 13); t2.setAttribute('y', p.y + 30);
      t2.setAttribute('font-size', '10');
      t2.style.fill = 'var(--text-secondary)'; t2.style.pointerEvents = 'none';
      const short = n.name.length > 19 ? n.name.slice(0, 19) + '…' : n.name;
      t2.textContent = short;
      svg.appendChild(t2);

      // Hover / click
      rect.addEventListener('mouseenter', () => { rect.style.filter = 'brightness(0.94)'; });
      rect.addEventListener('mouseleave', () => { rect.style.filter = ''; });
      rect.addEventListener('click', () => {
        const info = `${n.name}  |  ${n.pn}  |  Qty: ${n.qty} ${n.unit}  |  Cost: ${fmt(n.totalCost || 0)}  |  Stock: ${n.stock}`;
        showToast(info, 'info');
      });

      if (n.children) drawNodes(n.children);
    });
  }
  drawNodes(bom);

  const wrap = document.createElement('div');
  wrap.style.cssText = 'overflow:auto;max-height:300px;border-radius:8px;background:var(--bg-elevated);padding:8px';
  wrap.appendChild(svg);
  container.appendChild(wrap);

  // Legend
  const legend = document.createElement('div');
  legend.style.cssText = 'display:flex;gap:20px;padding-top:12px;flex-wrap:wrap';
  [['Assembly','#f97316'],['Part','#3b82f6'],['Material','#22c55e']].forEach(([l,c]) => {
    const d = document.createElement('div');
    d.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-secondary)';
    d.innerHTML = `<div style="width:12px;height:12px;border-radius:3px;background:${c};opacity:0.85"></div>${l}`;
    legend.appendChild(d);
  });
  [['In Stock','#22c55e'],['Partial / Low','#f59e0b'],['Missing','#ef4444']].forEach(([l,c]) => {
    const d = document.createElement('div');
    d.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-secondary)';
    d.innerHTML = `<div style="width:8px;height:8px;border-radius:50%;background:${c}"></div>${l}`;
    legend.appendChild(d);
  });
  container.appendChild(legend);
}

function _drawBOMTreemap(bom, container) {
  const ns = 'http://www.w3.org/2000/svg';
  const W = (container.clientWidth || 760) - 32;
  const H = 260;
  const stockColor = { ok: '#22c55e', partial: '#f59e0b', low: '#f59e0b', missing: '#ef4444' };

  // Flatten to leaves only
  const leaves = [];
  function flatLeaves(nodes, parentName) {
    nodes.forEach(n => {
      if (!n.children || !n.children.length) {
        leaves.push({ ...n, parentName });
      } else {
        flatLeaves(n.children, n.name);
      }
    });
  }
  flatLeaves(bom, '');

  if (!leaves.length) {
    container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted);font-size:13px">No leaf items found</div>';
    return;
  }

  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  svg.style.display = 'block';

  // Tooltip div
  const tip = document.createElement('div');
  tip.style.cssText = 'position:absolute;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:8px;padding:10px 12px;font-size:11px;pointer-events:none;display:none;z-index:99;max-width:220px;line-height:1.6;box-shadow:0 4px 16px rgba(0,0,0,0.1)';
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative';
  wrap.appendChild(svg);
  wrap.appendChild(tip);

  function sliceMap(items, x, y, w, h, horiz) {
    if (!items.length) return;
    if (items.length === 1) { drawTile(items[0], x, y, w, h); return; }
    const sum = items.reduce((s, i) => s + (i.totalCost || 1), 0);
    const sorted = [...items].sort((a, b) => (b.totalCost || 1) - (a.totalCost || 1));
    let acc = 0, half = 1;
    for (let i = 0; i < sorted.length; i++) {
      acc += sorted[i].totalCost || 1;
      if (acc >= sum / 2) { half = i + 1; break; }
    }
    const a = sorted.slice(0, half), b = sorted.slice(half);
    const ratio = a.reduce((s, i) => s + (i.totalCost || 1), 0) / sum;
    if (horiz) {
      const split = Math.max(4, Math.round(w * ratio));
      sliceMap(a, x, y, split, h, !horiz);
      sliceMap(b, x + split, y, w - split, h, !horiz);
    } else {
      const split = Math.max(4, Math.round(h * ratio));
      sliceMap(a, x, y, w, split, !horiz);
      sliceMap(b, x, y + split, w, h - split, !horiz);
    }
  }

  function drawTile(item, x, y, w, h) {
    const PAD = 2;
    const color = stockColor[item.stock] || '#94a3b8';
    const rw = Math.max(0, w - PAD * 2), rh = Math.max(0, h - PAD * 2);

    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', x + PAD); rect.setAttribute('y', y + PAD);
    rect.setAttribute('width', rw); rect.setAttribute('height', rh);
    rect.setAttribute('rx', '5');
    rect.style.fill = color + '2a';
    rect.style.stroke = color;
    rect.setAttribute('stroke-width', '1.5');
    rect.style.cursor = 'pointer';
    rect.style.transition = 'fill 0.12s';
    svg.appendChild(rect);

    if (rw > 48 && rh > 22) {
      const maxChars = Math.max(4, Math.floor(rw / 7));
      const label = item.pn.length > maxChars ? item.pn.slice(0, maxChars) + '…' : item.pn;
      const txt = document.createElementNS(ns, 'text');
      txt.setAttribute('x', x + w / 2); txt.setAttribute('y', y + h / 2 + (rh > 40 ? -4 : 4));
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('font-size', Math.min(11, rw / 9));
      txt.setAttribute('font-weight', '600');
      txt.setAttribute('font-family', 'var(--font-display)');
      txt.style.fill = color; txt.style.pointerEvents = 'none';
      txt.textContent = label;
      svg.appendChild(txt);
      if (rh > 40) {
        const t2 = document.createElementNS(ns, 'text');
        t2.setAttribute('x', x + w / 2); t2.setAttribute('y', y + h / 2 + 10);
        t2.setAttribute('text-anchor', 'middle');
        t2.setAttribute('font-size', Math.min(10, rw / 10));
        t2.style.fill = color; t2.style.pointerEvents = 'none'; t2.style.opacity = '0.75';
        t2.textContent = fmt(item.totalCost || 0);
        svg.appendChild(t2);
      }
    }

    rect.addEventListener('mouseenter', e => {
      rect.style.fill = color + '55';
      tip.innerHTML = `<strong style="font-size:12px">${item.name}</strong><br>PN: <code>${item.pn}</code><br>Parent: ${item.parentName || '—'}<br>Cost: <strong>${fmt(item.totalCost || 0)}</strong><br>Stock: <span style="color:${color};font-weight:600">${item.stock}</span>`;
      tip.style.display = 'block';
    });
    rect.addEventListener('mouseleave', () => { rect.style.fill = color + '2a'; tip.style.display = 'none'; });
    rect.addEventListener('mousemove', e => {
      const cr = wrap.getBoundingClientRect();
      let lx = e.clientX - cr.left + 14, ly = e.clientY - cr.top - 10;
      if (lx + 230 > cr.width) lx = e.clientX - cr.left - 230;
      tip.style.left = lx + 'px'; tip.style.top = ly + 'px';
    });
    rect.addEventListener('click', () => showToast(`${item.name}  |  ${item.pn}  |  ${fmt(item.totalCost || 0)}`, 'info'));
  }

  sliceMap(leaves, 0, 0, W, H, true);
  container.appendChild(wrap);

  // Legend + summary
  const meta = document.createElement('div');
  meta.style.cssText = 'display:flex;gap:20px;padding-top:12px;align-items:center;flex-wrap:wrap';
  [['In Stock','#22c55e'],['Partial / Low','#f59e0b'],['Missing','#ef4444']].forEach(([l,c]) => {
    const d = document.createElement('div');
    d.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-secondary)';
    d.innerHTML = `<div style="width:12px;height:12px;border-radius:3px;background:${c};opacity:0.8"></div>${l}`;
    meta.appendChild(d);
  });
  const countEl = document.createElement('div');
  countEl.style.cssText = 'margin-left:auto;font-size:11px;color:var(--text-muted)';
  countEl.textContent = `${leaves.length} components · Area proportional to cost`;
  meta.appendChild(countEl);
  container.appendChild(meta);
}

/* ═══════════════════════════════════════════════════════════
   TAB 3 — MASTER SCHEDULE (GANTT)
═══════════════════════════════════════════════════════════ */
/* ── PMP Scheduling Logic (CPM) ── */
function calculateCPM(tasks) {
  if (!tasks || tasks.length === 0) return [];

  // Forward pass (Early Start, Early Finish)
  tasks.forEach(t => {
    t.es = t.start || 0;
    if (t.deps && t.deps.length > 0) {
      t.deps.forEach(d => {
        const pred = tasks.find(pt => pt.id === d.id);
        if (pred) {
          let reqStart = 0;
          if (d.type === 'FS') reqStart = pred.es + pred.dur;
          if (d.type === 'SS') reqStart = pred.es + (d.lag || 0);
          if (d.type === 'FF') reqStart = pred.es + pred.dur - t.dur + (d.lag || 0);
          if (d.type === 'SF') reqStart = pred.es - t.dur + (d.lag || 0);
          t.es = Math.max(t.es, reqStart);
        }
      });
    }
    t.ef = t.es + t.dur;
  });

  const maxEF = Math.max(...tasks.map(t => t.ef));

  // Backward pass (Late Start, Late Finish)
  const reversed = [...tasks].reverse();
  tasks.forEach(t => { t.lf = maxEF; });
  
  reversed.forEach(t => {
    // Find tasks that depend on this one
    const successors = tasks.filter(st => st.deps && st.deps.some(d => d.id === t.id));
    if (successors.length > 0) {
      successors.forEach(s => {
        const d = s.deps.find(dep => dep.id === t.id);
        let reqFinish = maxEF;
        if (d.type === 'FS') reqFinish = s.lf - s.dur;
        if (d.type === 'SS') reqFinish = s.lf - s.dur + t.dur - (d.lag || 0);
        if (d.type === 'FF') reqFinish = s.lf - (d.lag || 0);
        if (d.type === 'SF') reqFinish = s.lf + (d.lag || 0);
        t.lf = Math.min(t.lf, reqFinish);
      });
    }
    t.ls = t.lf - t.dur;
  });

  tasks.forEach(t => {
    t.slack = Math.round((t.ls - t.es) * 10) / 10;
    t.isCritical = t.slack <= 0;
  });

  return tasks;
}

/* ── Schedule Builder (full-page) ─────────────────────────── */
let _sbDraft = { projectId: '', tasks: [] };

function _ensureProdModal() {
  if (!document.getElementById('prodModal')) {
    const overlay = document.createElement('div');
    overlay.id = 'prodModal';
    overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:200;backdrop-filter:blur(4px)';
    overlay.setAttribute('onclick', 'closeProdModal()');
    overlay.innerHTML = '<div id="prodModalContent" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(500px,92vw)" onclick="event.stopPropagation()"></div>';
    document.body.appendChild(overlay);
  }
}

function renderProdScheduleBuilder() {
  const pid = ProdData.selectedProject;
  const proj = AppState.projects.find(p => p.id === pid) || { id: pid, name: pid };

  // Reset draft for the selected project (keep if already building)
  if (_sbDraft.projectId !== pid) {
    _sbDraft = { projectId: pid, tasks: [] };
  }

  const content = document.getElementById('pageContent');
  content.innerHTML = `
    <div style="display:grid;grid-template-columns:340px 1fr;gap:0;height:calc(100vh - 56px);overflow:hidden">

      <!-- ── Left panel: task sequencer ── -->
      <div style="background:var(--bg-surface);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden">

        <!-- Header -->
        <div style="padding:20px 20px 16px;border-bottom:1px solid var(--border);flex-shrink:0">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <button class="btn btn-ghost btn-sm" onclick="renderProdSubPage('projects')" style="padding:4px 8px;font-size:11px">← Back</button>
            <div style="font-size:15px;font-weight:700;color:var(--text-primary)">Schedule Builder</div>
          </div>
          <div style="font-size:11px;color:var(--text-muted)">${proj.id} — ${proj.name}</div>
        </div>

        <!-- Add Task form -->
        <div style="padding:16px 20px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;flex-direction:column;gap:10px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted)">Add Task</div>

          <div>
            <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:3px;text-transform:uppercase">Task Name *</label>
            <input id="sbTaskName" type="text" placeholder="e.g. Material Procurement" class="input-sm" style="width:100%"
              onkeydown="if(event.key==='Enter') sbAddTask()">
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div>
              <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:3px;text-transform:uppercase">Work Centre</label>
              <select id="sbTaskWC" class="input-sm" style="width:100%">
                ${['Planning','Procurement',...ProdData.workCentres.map(w=>w.name)].map(w=>`<option>${w}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:3px;text-transform:uppercase">Duration (wks)</label>
              <input id="sbTaskDur" type="number" value="2" min="1" max="52" class="input-sm" style="width:100%">
            </div>
          </div>

          <div id="sbDepWrapper">
            <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:3px;text-transform:uppercase">Depends On (FS)</label>
            <div id="sbDepArea" style="font-size:11px;color:var(--text-muted);padding:6px 0">Add tasks first</div>
          </div>

          <button class="btn btn-primary btn-sm" style="width:100%" onclick="sbAddTask()">+ Add Task to Sequence</button>
        </div>

        <!-- Task list -->
        <div style="flex:1;overflow-y:auto;padding:12px 20px" id="sbTaskList">
          <div style="text-align:center;padding:32px 0;color:var(--text-muted);font-size:12px">No tasks yet — add the first step above</div>
        </div>

        <!-- Footer actions -->
        <div style="padding:14px 20px;border-top:1px solid var(--border);flex-shrink:0;display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="renderProdSubPage('projects')" style="flex:1">Cancel</button>
          <button class="btn btn-primary btn-sm" style="flex:2" onclick="sbSaveSchedule()">Save Schedule →</button>
        </div>
      </div>

      <!-- ── Right panel: live mini-Gantt preview ── -->
      <div style="background:var(--bg-base);display:flex;flex-direction:column;overflow:hidden">
        <div style="padding:16px 24px 12px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text-primary)">Live Gantt Preview</div>
            <div style="font-size:11px;color:var(--text-muted)">Updates as you add tasks · CPM critical path highlighted</div>
          </div>
          <div id="sbGanttStats" style="font-size:11px;color:var(--text-muted)"></div>
        </div>
        <div style="flex:1;overflow:auto;padding:20px 24px" id="sbGanttArea">
          <div style="text-align:center;padding:60px 0;color:var(--text-muted);font-size:13px">
            Add tasks on the left to see the Gantt chart
          </div>
        </div>
      </div>

    </div>`;

  _sbRenderTaskList();
  _sbRenderGantt();
}

function _sbRenderDepCheckboxes() {
  const area = document.getElementById('sbDepArea');
  if (!area) return;
  const tasks = _sbDraft.tasks;
  if (tasks.length === 0) {
    area.innerHTML = '<span style="color:var(--text-muted);font-size:11px">Add tasks first</span>';
    return;
  }
  area.innerHTML = tasks.map(t => `
    <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-primary);cursor:pointer;margin-bottom:4px">
      <input type="checkbox" id="sbDep_${t.id}" style="accent-color:var(--brand)">
      <span style="font-family:var(--font-mono);font-size:10px;color:var(--brand);font-weight:600">${t.id}</span>
      ${t.name}
    </label>`).join('');
}

function _sbRenderTaskList() {
  const container = document.getElementById('sbTaskList');
  if (!container) return;
  const tasks = _sbDraft.tasks;

  _sbRenderDepCheckboxes();

  if (tasks.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:32px 0;color:var(--text-muted);font-size:12px">No tasks yet — add the first step above</div>';
    return;
  }

  container.innerHTML = `
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:8px">
      Task Sequence <span style="font-weight:400;color:var(--text-muted)">(${tasks.length})</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px">
      ${tasks.map((t, i) => {
        const depStr = t.deps.length ? t.deps.map(d => d.id).join(', ') : '—';
        return `
        <div id="sbRow_${i}" style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;padding:10px 12px;display:flex;gap:8px;align-items:flex-start">
          <!-- Reorder -->
          <div style="display:flex;flex-direction:column;gap:2px;padding-top:2px;flex-shrink:0">
            <button onclick="sbMoveTask(${i},-1)" ${i===0?'disabled':''} style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:11px;line-height:1;padding:1px 3px;${i===0?'opacity:0.3':''}" title="Move up">▲</button>
            <button onclick="sbMoveTask(${i},1)" ${i===tasks.length-1?'disabled':''} style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:11px;line-height:1;padding:1px 3px;${i===tasks.length-1?'opacity:0.3':''}" title="Move down">▼</button>
          </div>
          <!-- Sequence number -->
          <div style="width:28px;height:28px;border-radius:50%;background:var(--accent-dim,#dbeafe);color:var(--brand);font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:var(--font-mono)">${i+1}</div>
          <!-- Info -->
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name}</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">
              ${t.wc} · <strong>${t.dur}w</strong>
              ${t.deps.length ? ` · after: <span style="font-family:var(--font-mono);color:var(--brand)">${depStr}</span>` : ''}
            </div>
          </div>
          <!-- Edit inline -->
          <div style="display:flex;gap:4px;flex-shrink:0">
            <button class="btn btn-ghost btn-xs" onclick="sbEditTask(${i})" title="Edit" style="font-size:10px;padding:3px 6px">✏</button>
            <button class="btn btn-ghost btn-xs" onclick="sbRemoveTask(${i})" title="Remove" style="color:var(--red);font-size:10px;padding:3px 6px">✕</button>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

function _sbRenderGantt() {
  const ganttArea = document.getElementById('sbGanttArea');
  const statsEl   = document.getElementById('sbGanttStats');
  if (!ganttArea) return;

  const tasks = _sbDraft.tasks;
  if (tasks.length === 0) {
    ganttArea.innerHTML = '<div style="text-align:center;padding:60px 0;color:var(--text-muted);font-size:13px">Add tasks on the left to see the Gantt chart</div>';
    if (statsEl) statsEl.textContent = '';
    return;
  }

  // Run CPM on a copy with numeric IDs
  const cpmTasks = tasks.map((t, i) => ({
    ...t,
    id: t.id,
    dur: t.dur,
    deps: t.deps,
    es: 0, ef: 0, ls: 0, lf: 0, slack: 0, isCritical: false
  }));
  const computed = calculateCPM(cpmTasks);

  const maxEf = Math.max(...computed.map(t => t.ef), 4);
  const colW  = 48; // pixels per week
  const rowH  = 38;
  const labelW = 180;
  const totalW = labelW + maxEf * colW + 24;

  // Header weeks
  const headerCells = Array.from({ length: maxEf }, (_, i) =>
    `<div style="width:${colW}px;flex-shrink:0;text-align:center;font-size:10px;color:var(--text-muted);font-weight:600;border-right:1px solid var(--border)">W${i+1}</div>`
  ).join('');

  const critCount = computed.filter(t => t.isCritical).length;
  const totalWeeks = maxEf;
  if (statsEl) statsEl.innerHTML = `<span style="color:var(--red);font-weight:600">${critCount} critical</span> · ${totalWeeks}w total`;

  const rowsHTML = computed.map((t, i) => {
    const barLeft  = t.es * colW;
    const barWidth = Math.max(t.dur * colW - 4, 8);
    const isCrit   = t.isCritical;
    const barColor = isCrit ? 'var(--red,#ef4444)' : 'var(--brand)';
    const slackPx  = t.slack > 0 ? t.slack * colW : 0;

    return `
      <div style="display:flex;align-items:center;height:${rowH}px;border-bottom:1px solid var(--border);background:${i%2===0?'var(--bg-surface)':'var(--bg-base)'}">
        <!-- Label -->
        <div style="width:${labelW}px;flex-shrink:0;padding:0 12px;display:flex;align-items:center;gap:6px;border-right:1px solid var(--border)">
          <span style="font-family:var(--font-mono);font-size:9px;color:${barColor};font-weight:700;flex-shrink:0">${t.id}</span>
          <span style="font-size:11px;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1">${t.name}</span>
          ${isCrit ? `<span style="font-size:8px;background:var(--red,#ef4444);color:#fff;padding:1px 4px;border-radius:3px;flex-shrink:0">CP</span>` : ''}
        </div>
        <!-- Bars -->
        <div style="flex:1;position:relative;height:100%">
          <!-- Grid lines -->
          ${Array.from({length: maxEf}, (_, c) => `<div style="position:absolute;top:0;bottom:0;left:${(c+1)*colW}px;width:1px;background:var(--border);opacity:0.5"></div>`).join('')}
          <!-- Task bar -->
          <div style="position:absolute;top:8px;left:${barLeft}px;width:${barWidth}px;height:${rowH-16}px;background:${barColor};border-radius:4px;opacity:${isCrit?1:0.8};display:flex;align-items:center;padding:0 6px;overflow:hidden">
            <span style="font-size:9px;color:#fff;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.dur}w</span>
          </div>
          <!-- Float bar (slack) -->
          ${slackPx > 0 ? `<div style="position:absolute;top:12px;left:${barLeft + barWidth + 2}px;width:${slackPx - 4}px;height:${rowH-24}px;background:var(--border-md);border-radius:3px;opacity:0.5" title="Float: ${t.slack}w"></div>` : ''}
        </div>
      </div>`;
  }).join('');

  ganttArea.innerHTML = `
    <div style="width:${totalW}px;min-width:100%;font-family:var(--font-display)">
      <!-- Header -->
      <div style="display:flex;height:32px;border-bottom:2px solid var(--border-md);position:sticky;top:0;background:var(--bg-elevated);z-index:2">
        <div style="width:${labelW}px;flex-shrink:0;padding:0 12px;display:flex;align-items:center;border-right:1px solid var(--border)">
          <span style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase">Task</span>
        </div>
        <div style="flex:1;display:flex">
          ${headerCells}
        </div>
      </div>
      <!-- Rows -->
      <div>${rowsHTML}</div>
    </div>`;
}

function sbAddTask() {
  const name = (document.getElementById('sbTaskName')?.value || '').trim();
  if (!name) { showToast('Task name is required', 'error'); return; }

  const dur    = parseInt(document.getElementById('sbTaskDur')?.value, 10) || 1;
  const wc     = document.getElementById('sbTaskWC')?.value || 'Planning';

  // Gather checked deps
  const deps = _sbDraft.tasks
    .filter(t => document.getElementById(`sbDep_${t.id}`)?.checked)
    .map(t => ({ id: t.id, type: 'FS' }));

  const idx = _sbDraft.tasks.length + 1;
  const id  = `T${String(idx).padStart(2, '0')}`;
  _sbDraft.tasks.push({ id, name, wc, dur, status: 'pending', start: 0, holdType: null, deps });

  // Clear name input, reset dur to 2
  const nameEl = document.getElementById('sbTaskName');
  if (nameEl) { nameEl.value = ''; nameEl.focus(); }
  const durEl = document.getElementById('sbTaskDur');
  if (durEl) durEl.value = 2;

  _sbRenderTaskList();
  _sbRenderGantt();
}

function sbRemoveTask(idx) {
  _sbDraft.tasks.splice(idx, 1);
  // Re-index IDs and fix dep references
  _sbDraft.tasks.forEach((t, i) => {
    const oldId = t.id;
    t.id = `T${String(i + 1).padStart(2, '0')}`;
    // Update deps in subsequent tasks that referenced oldId
    _sbDraft.tasks.forEach(other => {
      other.deps = other.deps.map(d => d.id === oldId ? { ...d, id: t.id } : d);
    });
  });
  // Remove invalid dep references (those now past last task or self)
  const validIds = new Set(_sbDraft.tasks.map(t => t.id));
  _sbDraft.tasks.forEach(t => { t.deps = t.deps.filter(d => validIds.has(d.id) && d.id !== t.id); });

  _sbRenderTaskList();
  _sbRenderGantt();
}

function sbMoveTask(idx, dir) {
  const tasks = _sbDraft.tasks;
  const target = idx + dir;
  if (target < 0 || target >= tasks.length) return;

  // Swap
  [tasks[idx], tasks[target]] = [tasks[target], tasks[idx]];

  // Re-index IDs and remap dep references
  const idMap = {};
  tasks.forEach((t, i) => {
    const newId = `T${String(i + 1).padStart(2, '0')}`;
    idMap[t.id] = newId;
    t.id = newId;
  });
  tasks.forEach(t => { t.deps = t.deps.map(d => ({ ...d, id: idMap[d.id] || d.id })); });

  _sbRenderTaskList();
  _sbRenderGantt();
}

function sbEditTask(idx) {
  const t = _sbDraft.tasks[idx];
  if (!t) return;

  _ensureProdModal();
  const wcOptions = ['Planning', 'Procurement', ...ProdData.workCentres.map(w => w.name)];
  const otherTasks = _sbDraft.tasks.filter((_, i) => i !== idx);
  const depCheckboxes = otherTasks.length === 0
    ? '<span style="font-size:11px;color:var(--text-muted)">No other tasks</span>'
    : otherTasks.map(ot => `
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;margin-bottom:4px">
          <input type="checkbox" id="sbEditDep_${ot.id}" ${t.deps.some(d=>d.id===ot.id)?'checked':''} style="accent-color:var(--brand)">
          <span style="font-family:var(--font-mono);font-size:10px;color:var(--brand);font-weight:600">${ot.id}</span> ${ot.name}
        </label>`).join('');

  document.getElementById('prodModalContent').style.width = 'min(480px,94vw)';
  document.getElementById('prodModalContent').innerHTML = `
    <div style="background:var(--bg-surface);border:1px solid var(--border-md);border-radius:12px;overflow:hidden;box-shadow:var(--shadow-lg)">
      <div style="padding:18px 20px 14px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:14px;font-weight:700">Edit Task — <span style="font-family:var(--font-mono);color:var(--brand)">${t.id}</span></div>
        <button class="btn btn-ghost btn-sm" onclick="closeProdModal()">✕</button>
      </div>
      <div style="padding:18px 20px;display:flex;flex-direction:column;gap:12px">
        <div>
          <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:3px;text-transform:uppercase">Task Name *</label>
          <input id="sbEditName" class="input-sm" style="width:100%" value="${t.name}">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:3px;text-transform:uppercase">Work Centre</label>
            <select id="sbEditWC" class="input-sm" style="width:100%">
              ${wcOptions.map(w => `<option ${w===t.wc?'selected':''}>${w}</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:3px;text-transform:uppercase">Duration (wks)</label>
            <input id="sbEditDur" type="number" min="1" max="52" class="input-sm" style="width:100%" value="${t.dur}">
          </div>
        </div>
        <div>
          <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:6px;text-transform:uppercase">Depends On (FS)</label>
          ${depCheckboxes}
        </div>
      </div>
      <div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-ghost btn-sm" onclick="closeProdModal()">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="sbSaveEdit(${idx})">Save Changes</button>
      </div>
    </div>`;

  document.getElementById('prodModal').style.display = 'block';
}

function sbSaveEdit(idx) {
  const t = _sbDraft.tasks[idx];
  const name = (document.getElementById('sbEditName')?.value || '').trim();
  if (!name) { showToast('Task name required', 'error'); return; }

  t.name = name;
  t.wc   = document.getElementById('sbEditWC')?.value || t.wc;
  t.dur  = parseInt(document.getElementById('sbEditDur')?.value, 10) || t.dur;

  // Rebuild deps from checkboxes
  t.deps = _sbDraft.tasks
    .filter((ot, i) => i !== idx && document.getElementById(`sbEditDep_${ot.id}`)?.checked)
    .map(ot => ({ id: ot.id, type: 'FS' }));

  closeProdModal();
  _sbRenderTaskList();
  _sbRenderGantt();
}

function sbSaveSchedule() {
  const pid = _sbDraft.projectId;
  if (!pid) { showToast('No project selected', 'error'); return; }
  if (_sbDraft.tasks.length === 0) { showToast('Add at least one task', 'error'); return; }

  ProdData.schedule[pid] = JSON.parse(JSON.stringify(_sbDraft.tasks));
  ProdData.selectedProject = pid;

  // Remove from newly assigned list if present
  if (ProdData._newlyAssigned) {
    const idx = ProdData._newlyAssigned.indexOf(pid);
    if (idx !== -1) ProdData._newlyAssigned.splice(idx, 1);
    if (typeof buildProductionSidebar === 'function') buildProductionSidebar();
  }

  showToast(`Schedule saved — ${_sbDraft.tasks.length} tasks for ${pid}`, 'success');
  renderProdSubPage('schedule');
}

// Legacy compat — openNewScheduleModal now routes to schedule builder
function openNewScheduleModal() {
  renderProdSubPage('schedule-builder');
}

/* ── Gantt view + zoom state ─────────────────────────────── */
let _ganttViewMode = 'weekly';
let _ganttZoom     = 1.0;

function setGanttView(mode) {
  _ganttViewMode = mode;
  renderProdSubPage('schedule');
}

function setGanttZoom(val) {
  _ganttZoom = parseFloat(val);
  renderProdSubPage('schedule');
}

function renderProdSchedule() {
  const pid      = ProdData.selectedProject;
  const rawTasks = ProdData.schedule[pid] || [];
  const content  = document.getElementById('pageContent');

  const role = AppState.currentUser?.role || 'manager';
  const isOperator = role === 'user';

  if (rawTasks.length === 0) {
    content.innerHTML = prodPageHeader('Master Schedule', 'Critical Path Method (CPM) Analysis · Baseline Tracking · Resource Levelling') + `
      <div class="card stagger-in" style="padding:60px 32px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:16px">
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none" style="opacity:0.3">
          <rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" stroke-width="2"/>
          <path d="M4 16h40M14 8v8M34 8v8M12 26h8M12 32h14M28 26h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <div style="font-size:16px;font-weight:700;color:var(--text-primary)">No schedule for ${pid}</div>
        <div style="font-size:13px;color:var(--text-muted);max-width:400px">This project doesn't have a production schedule yet. Create one by defining the tasks, durations, and dependencies — CPM will calculate the critical path automatically.</div>
        ${!isOperator ? '<button class="btn btn-primary" style="margin-top:8px" onclick="openNewScheduleModal()">+ Create New Schedule</button>' : ''}
      </div>`;
    renderProjStrip();
    return;
  }

  const tasks = calculateCPM(JSON.parse(JSON.stringify(rawTasks)));
  const VIEW  = _ganttViewMode;

  // ── View config ───────────────────────────────────────────
  const VCFG = {
    daily:   { factor: 7,    colW: 36,  minCols: 60,  pad: 7  },
    weekly:  { factor: 1,    colW: 80,  minCols: 16,  pad: 4  },
    monthly: { factor: 0.25, colW: 110, minCols: 10,  pad: 2  },
  }[VIEW];
  const { factor, minCols, pad } = VCFG;
  const colW = Math.round(VCFG.colW * _ganttZoom);

  const maxEf   = Math.max(...tasks.map(t => t.ef), 1);
  const COLS    = Math.max(minCols, Math.ceil(maxEf * factor) + pad);
  const LW      = 220;   // label column width px
  const totalW  = COLS * colW;

  const startDate  = new Date('2025-01-06');
  const today      = new Date();
  const msPerUnit  = VIEW === 'daily' ? 86400000 : VIEW === 'weekly' ? 7 * 86400000 : 30.44 * 86400000;
  const todayCol   = Math.floor((today - startDate) / msPerUnit);
  const todayPx    = Math.round(todayCol * colW);

  // ── Column header labels ──────────────────────────────────
  const colHeaders = Array.from({ length: COLS }, (_, i) => {
    const d = new Date(startDate);
    if (VIEW === 'daily') {
      d.setDate(d.getDate() + i);
      const show = d.getDay() === 1; // only Mondays
      return show ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '';
    } else if (VIEW === 'weekly') {
      d.setDate(d.getDate() + i * 7);
      return `W${i + 1}<br><small>${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</small>`;
    } else {
      d.setMonth(d.getMonth() + i);
      return `${d.toLocaleDateString('en-GB', { month: 'short' })}<br><small>${d.getFullYear()}</small>`;
    }
  });

  // ── Header row HTML ───────────────────────────────────────
  const headerHTML = `
    <div style="display:flex;background:var(--bg-elevated);border-bottom:2px solid var(--border-md);min-width:${LW + totalW}px">
      <div style="width:${LW}px;min-width:${LW}px;flex-shrink:0;padding:8px 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);border-right:1px solid var(--border-md)">Task</div>
      <div style="display:flex;flex:none">
        ${colHeaders.map((lbl, i) => `
          <div style="width:${colW}px;min-width:${colW}px;flex:none;padding:4px 2px;text-align:center;font-size:${VIEW === 'daily' ? '8' : '10'}px;font-weight:600;color:${i === todayCol ? 'var(--brand)' : 'var(--text-muted)'};border-left:1px solid var(--border-subtle);overflow:hidden;white-space:nowrap;line-height:1.3">${lbl}</div>
        `).join('')}
      </div>
    </div>`;

  // ── Task row HTML ─────────────────────────────────────────
  const rowsHTML = tasks.map((task, idx) => {
    const esU      = task.es * factor;
    const durU     = Math.max(task.dur * factor, VIEW === 'daily' ? 1 : 0.5);
    const barLeft  = Math.round(esU * colW);
    const barWidth = Math.max(Math.round(durU * colW), 14);
    const floatW   = task.slack > 0 ? Math.round(task.slack * factor * colW) : 0;
    const floatL   = barLeft + barWidth;
    const barCls   = { done: 'gantt-bar-done', active: 'gantt-bar-active', pending: 'gantt-bar-pending', blocked: 'gantt-bar-blocked' }[task.status] || 'gantt-bar-pending';

    return `
      <div class="gantt-row" id="grow-${task.id}">
        <div class="gantt-task-label" style="width:${LW}px;min-width:${LW}px;flex-shrink:0">
          <div class="gantt-task-name">${task.name}${task.isCritical ? ' <span style="color:var(--red);font-size:8px;font-weight:700;vertical-align:middle">●</span>' : ''}</div>
          <div class="gantt-task-meta">${task.wc} · ${task.dur}w${task.slack > 0 ? ` · Float: ${task.slack}w` : ''}</div>
        </div>
        <div class="gantt-timeline" style="width:${totalW}px;min-width:${totalW}px;flex:none;position:relative;height:46px">
          <div style="display:flex;position:absolute;inset:0">
            ${colHeaders.map((_, i) => `<div class="gantt-cell${i === todayCol ? ' today-cell' : ''}" style="width:${colW}px;min-width:${colW}px;flex:none;height:100%"></div>`).join('')}
          </div>
          ${idx === 0 && todayCol >= 0 && todayCol < COLS ? `<div class="gantt-today-line" style="left:${todayPx}px"></div>` : ''}
          ${floatW > 3 ? `<div style="position:absolute;left:${floatL}px;width:${floatW}px;height:5px;top:50%;margin-top:10px;background:rgba(232,98,42,0.12);border:1px dashed var(--brand);border-radius:2px;z-index:2"></div>` : ''}
          <div class="gantt-bar ${barCls}${task.isCritical ? ' critical-path' : ''}"
               id="gbar-${task.id}"
               style="left:${barLeft}px;width:${barWidth}px;position:absolute;top:50%;transform:translateY(-50%);z-index:3">
            ${barWidth > 36 ? `<span style="font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${task.id}</span>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');

  // ── KPI cards ─────────────────────────────────────────────
  const critCount = tasks.filter(t => t.isCritical).length;
  const totalFloat = tasks.reduce((s, t) => s + t.slack, 0).toFixed(1);
  const doneTasks = tasks.filter(t => t.status === 'done').length;

  // ── View toggle buttons ───────────────────────────────────
  const toggleHTML = ['daily', 'weekly', 'monthly'].map(v => {
    const active = VIEW === v;
    return `<button onclick="setGanttView('${v}')" style="padding:5px 14px;font-size:11px;font-weight:600;border:none;cursor:pointer;text-transform:capitalize;background:${active ? 'var(--brand)' : 'transparent'};color:${active ? '#fff' : 'var(--text-secondary)'};transition:background 0.15s,color 0.15s">${v.charAt(0).toUpperCase() + v.slice(1)}</button>`;
  }).join('');

  // ── Zoom slider ───────────────────────────────────────────
  const pct0 = Math.round((_ganttZoom - 0.4) / 2.6 * 100);
  const zoomHTML = `
    <div style="display:flex;align-items:center;gap:6px;padding:0 4px" title="Zoom timeline">
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="opacity:0.45;flex-shrink:0"><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.3"/><line x1="3.5" y1="6" x2="8.5" y2="6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="10" y1="10" x2="12.5" y2="12.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
      <input type="range" min="0.4" max="3" step="0.05" value="${_ganttZoom}" oninput="setGanttZoom(this.value)"
             style="width:72px;height:4px;appearance:none;-webkit-appearance:none;background:linear-gradient(to right,var(--brand) 0%,var(--brand) ${pct0}%,var(--border-md) ${pct0}%,var(--border-md) 100%);border-radius:2px;outline:none;cursor:pointer" id="ganttZoomSlider">
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style="opacity:0.45;flex-shrink:0"><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.3"/><line x1="3.5" y1="6" x2="8.5" y2="6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="6" y1="3.5" x2="6" y2="8.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="10" y1="10" x2="12.5" y2="12.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
    </div>`;

  // ── Render ────────────────────────────────────────────────
  content.innerHTML = prodPageHeader('Master Schedule', 'Critical Path Method (CPM) Analysis · Baseline Tracking · Resource Levelling') + `
    <div style="display:grid;grid-template-columns:1fr auto;gap:20px;align-items:start;margin-bottom:20px">
      <div class="prod-kpi-grid stagger-in" style="grid-template-columns:repeat(4,1fr)">
        <div class="prod-kpi-card">
          <div class="prod-kpi-label">Duration</div>
          <div class="prod-kpi-value" style="color:var(--text-primary)">${maxEf}w</div>
          <div class="prod-kpi-sub">total project span</div>
        </div>
        <div class="prod-kpi-card">
          <div class="prod-kpi-label">Critical Path</div>
          <div class="prod-kpi-value" style="color:var(--red)">${critCount}</div>
          <div class="prod-kpi-sub">tasks on critical path</div>
        </div>
        <div class="prod-kpi-card">
          <div class="prod-kpi-label">Total Float</div>
          <div class="prod-kpi-value" style="color:var(--brand)">${totalFloat}w</div>
          <div class="prod-kpi-sub">schedule flexibility</div>
        </div>
        <div class="prod-kpi-card">
          <div class="prod-kpi-label">Complete</div>
          <div class="prod-kpi-value" style="color:var(--green)">${doneTasks}/${tasks.length}</div>
          <div class="prod-kpi-sub">tasks finished</div>
        </div>
      </div>
      <div class="card" style="padding:14px 16px;min-width:160px">
        <div class="prod-section-label" style="margin-bottom:10px">Legend</div>
        <div style="display:flex;flex-direction:column;gap:7px;font-size:12px;color:var(--text-secondary)">
          <div style="display:flex;align-items:center;gap:8px"><span style="width:12px;height:12px;background:var(--red);border-radius:3px;flex-shrink:0"></span>Critical Path</div>
          <div style="display:flex;align-items:center;gap:8px"><span style="width:12px;height:12px;background:var(--brand);border-radius:3px;flex-shrink:0"></span>In Progress</div>
          <div style="display:flex;align-items:center;gap:8px"><span style="width:12px;height:12px;background:var(--green);border-radius:3px;flex-shrink:0"></span>Completed</div>
          <div style="display:flex;align-items:center;gap:8px"><span style="width:12px;height:12px;border:1.5px dashed var(--border-md);border-radius:3px;flex-shrink:0"></span>Float / Slack</div>
        </div>
      </div>
    </div>

    <div class="card stagger-in">
      <div class="card-header" style="flex-wrap:wrap;gap:8px">
        <span class="card-title">Gantt — ${pid}</span>
        <div style="display:flex;gap:8px;align-items:center;margin-left:auto;flex-wrap:wrap">
          <div style="display:flex;border:1px solid var(--border);border-radius:6px;overflow:hidden;background:var(--bg-elevated)">
            ${toggleHTML}
          </div>
          <div style="display:flex;align-items:center;border:1px solid var(--border);border-radius:6px;background:var(--bg-elevated);padding:0 8px;height:30px">
            ${zoomHTML}
          </div>
          ${!isOperator ? `
          <button class="btn btn-secondary btn-sm" onclick="showToast('Schedule baselined','success')">Baseline</button>
          <button class="btn btn-primary btn-sm" onclick="renderProdSubPage('schedule-builder')">+ New Schedule</button>
          ` : ''}
        </div>
      </div>
      <div class="gantt-wrap" style="overflow-x:auto;position:relative">
        <svg id="ganttDeps" style="position:absolute;top:0;left:0;width:${LW + totalW}px;height:100%;pointer-events:none;z-index:10;overflow:visible"></svg>
        ${headerHTML}
        ${rowsHTML}
      </div>
    </div>`;

  renderProjStrip();
  setTimeout(() => drawGanttDependencies(tasks, LW, colW), 100);
}

function drawGanttDependencies(tasks, labelW, colW) {
  const svg = document.getElementById('ganttDeps');
  if (!svg) return;

  // Arrowhead marker
  svg.innerHTML = `
    <defs>
      <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <polygon points="0 0,6 3,0 6" fill="currentColor" opacity="0.6"/>
      </marker>
    </defs>`;

  const wrap = document.querySelector('.gantt-wrap');
  if (!wrap) return;
  const wrapRect = wrap.getBoundingClientRect();

  tasks.forEach(t => {
    if (!t.deps || !t.deps.length) return;
    t.deps.forEach(d => {
      const pred  = tasks.find(p => p.id === d.id);
      if (!pred) return;
      const fromEl = document.getElementById(`gbar-${pred.id}`);
      const toEl   = document.getElementById(`gbar-${t.id}`);
      if (!fromEl || !toEl) return;

      const fr = fromEl.getBoundingClientRect();
      const tr = toEl.getBoundingClientRect();
      const sl = wrap.scrollLeft;
      const st = wrap.scrollTop;

      const x1 = fr.right  - wrapRect.left + sl;
      const y1 = fr.top    + fr.height / 2 - wrapRect.top + st;
      const x2 = tr.left   - wrapRect.left + sl;
      const y2 = tr.top    + tr.height / 2 - wrapRect.top + st;

      const isCrit = t.isCritical && pred.isCritical;
      const midX   = x1 + (x2 - x1) / 2;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${x1} ${y1} L${midX} ${y1} L${midX} ${y2} L${x2} ${y2}`);
      path.setAttribute('class', `dep-line${isCrit?' critical':''}`);
      path.setAttribute('marker-end', 'url(#arr)');
      svg.appendChild(path);
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   TAB 6 — MRP / MATERIAL REQUIREMENTS
═══════════════════════════════════════════════════════════ */
function renderProdMRP() {
  const pid  = ProdData.selectedProject;
  const mrp  = ProdData.mrp[pid] || [];

  const statusMap = {
    ok:      ['badge-green',  'In stock'],
    partial: ['badge-amber',  'Partial'],
    low:     ['badge-amber',  'Low stock'],
    missing: ['badge-red',    'Missing'],
  };

  const shortfalls = mrp.filter(m => m.status !== 'ok').length;
  document.getElementById('pageContent').innerHTML = prodPageHeader('MRP / Materials', 'Material Resource Planning · Real-time inventory tracking · Shortage prediction') + `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 300px;gap:14px;margin-bottom:20px" class="stagger-in">
      <div class="prod-kpi-card">
        <div class="prod-kpi-label">Line Items</div>
        <div class="prod-kpi-value" style="color:var(--text-primary)">${mrp.length}</div>
        <div class="prod-kpi-sub">total material lines</div>
      </div>
      <div class="prod-kpi-card">
        <div class="prod-kpi-label">Fully Stocked</div>
        <div class="prod-kpi-value" style="color:var(--green)">${mrp.filter(m => m.status === 'ok').length}</div>
        <div class="prod-kpi-sub">items on hand</div>
      </div>
      <div class="prod-kpi-card">
        <div class="prod-kpi-label">Shortfalls</div>
        <div class="prod-kpi-value" style="color:${shortfalls > 0 ? 'var(--red)' : 'var(--text-muted)'}">${shortfalls}</div>
        <div class="prod-kpi-sub">missing or low stock</div>
      </div>
      <div class="prod-status-card ${shortfalls > 0 ? 'warn' : 'ok'}">
        <div class="prod-status-icon ${shortfalls > 0 ? 'warn' : 'ok'}">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v5M8 11v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/></svg>
        </div>
        <div>
          <div class="prod-status-label" style="color:${shortfalls > 0 ? 'var(--amber)' : 'var(--green)'}">${shortfalls > 0 ? 'Pull-in Alert' : 'All Clear'}</div>
          <div class="prod-status-text">${shortfalls > 0 ? `Task <strong>T03</strong> can be pulled in by 2 days if <strong>PLT-316L-12</strong> is expedited.` : 'All materials are on hand for scheduled tasks.'}</div>
        </div>
      </div>
    </div>

    <div class="card stagger-in">
      <div class="card-header">
        <span class="card-title">Material Requirements — ${pid}</span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="showToast('Shortfalls sent to Procurement queue','success')">Raise All PRs</button>
          <button class="btn btn-ghost btn-sm" onclick="showToast('MRP report exported','success')">Export CSV</button>
        </div>
      </div>
      <div style="overflow-x:auto">
        <table class="data-table" style="min-width:680px">
          <thead>
            <tr>
              <th>Item / Description</th>
              <th style="text-align:right">Required</th>
              <th style="text-align:right">On Hand</th>
              <th>Need By</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${mrp.map(m => {
              const [badgeCls, badgeLabel] = statusMap[m.status] || ['badge-muted', '—'];
              return `
              <tr>
                <td>
                  <div style="font-weight:600;font-size:13px;color:var(--text-primary)">${m.item}</div>
                  <div style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono);margin-top:2px">${m.pn}</div>
                </td>
                <td style="text-align:right;font-family:var(--font-mono);font-size:12px;font-weight:500">${m.required}</td>
                <td style="text-align:right;font-family:var(--font-mono);font-size:12px;color:${m.onHand === '0 SHT' ? 'var(--red)' : 'var(--text-primary)'}">${m.onHand}</td>
                <td style="font-size:12px;color:var(--text-secondary)">${fmtDate(m.needDate)}</td>
                <td><span class="badge ${badgeCls}">${badgeLabel}</span></td>
                <td style="text-align:right">
                  ${m.status !== 'ok'
                    ? `<button class="btn btn-secondary btn-xs" onclick="showToast('PR raised for ${m.pn}','success')">Expedite</button>`
                    : `<span style="color:var(--green);font-size:13px;font-weight:700">✓</span>`}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ── Raise RM modal ─────────────────────────────────────── */
function showProdRaiseRM() {
  _ensureProdModal();
  document.getElementById('prodModalContent').innerHTML = `
    <div style="background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg)">
      <div style="padding:18px 22px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Raise Material Request</div>
        <button class="btn-icon" onclick="closeProdModal()">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div style="padding:20px 22px;display:flex;flex-direction:column;gap:14px">
        ${[
          ['Project', 'select', ['P-2401 — 316L Storage Tank','P-2402 — Pressure Vessel','P-2403 — Heat Exchanger']],
          ['Item / description', 'text', 'e.g. Shell plate 316L 10mm'],
          ['Part number', 'text', 'e.g. PLT-316L-10'],
          ['Quantity required', 'number', 'e.g. 8'],
          ['Unit', 'text', 'SHT / KG / EA / M'],
          ['Required by date', 'date', ''],
        ].map(([label, type, opts]) => `
          <div>
            <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.09em;display:block;margin-bottom:4px">${label}</label>
            ${type === 'select'
              ? `<select style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;font-family:var(--font-body)">
                   ${opts.map(o=>`<option>${o}</option>`).join('')}
                 </select>`
              : `<input type="${type}" placeholder="${opts}"
                   style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;font-family:var(--font-body)"
                   onfocus="this.style.borderColor='var(--brand)'" onblur="this.style.borderColor='var(--border-md)'"/>`}
          </div>`).join('')}
        <div style="display:flex;gap:10px;margin-top:4px">
          <button class="btn btn-primary" style="flex:1" onclick="closeProdModal();showToast('RM submitted — routed to Store for stock check','success')">Submit RM</button>
          <button class="btn btn-secondary" onclick="closeProdModal()">Cancel</button>
        </div>
      </div>
    </div>`;
  document.getElementById('prodModal').style.display = 'block';
}

function closeProdModal() {
  const modal = document.getElementById('prodModal');
  if (!modal) return;
  modal.style.display = 'none';
  const mc = document.getElementById('prodModalContent');
  if (mc) mc.style.width = 'min(500px,92vw)';
}

function openScrapModal(stepNum, stepName) {
  _ensureProdModal();
  const pid = ProdData.selectedProject;
  document.getElementById('prodModalContent').innerHTML = `
    <div style="background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg)">
      <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-family:var(--font-display);font-size:14px;font-weight:700">Log In-Process Scrap / Rework</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Step ${stepNum} — ${stepName}</div>
        </div>
        <button class="btn-icon" onclick="closeProdModal()">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div style="padding:18px 20px;display:flex;flex-direction:column;gap:12px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label style="font-size:10px;color:var(--text-muted);text-transform:uppercase;display:block;margin-bottom:4px">Qty Scrapped</label>
            <input id="scrapQty" type="number" value="1" min="0.1" step="0.1" class="input-sm" style="width:100%">
          </div>
          <div>
            <label style="font-size:10px;color:var(--text-muted);text-transform:uppercase;display:block;margin-bottom:4px">Unit</label>
            <select id="scrapUnit" class="input-sm" style="width:100%">
              <option>EA</option><option>KG</option><option>M</option><option>SHT</option>
            </select>
          </div>
        </div>
        <div>
          <label style="font-size:10px;color:var(--text-muted);text-transform:uppercase;display:block;margin-bottom:4px">Disposition</label>
          <select id="scrapDisposition" class="input-sm" style="width:100%">
            <option value="scrap">Scrap</option>
            <option value="rework">Rework</option>
            <option value="use-as-is">Use As-Is (UAI)</option>
          </select>
        </div>
        <div>
          <label style="font-size:10px;color:var(--text-muted);text-transform:uppercase;display:block;margin-bottom:4px">Reason / Description</label>
          <textarea id="scrapReason" placeholder="e.g. Dimensional out of tolerance on shell plate rolling" style="width:100%;height:64px;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px;font-size:12px;resize:none;color:var(--text-primary)"></textarea>
        </div>
        <div style="display:flex;gap:10px;margin-top:4px">
          <button class="btn btn-warn" style="flex:1" onclick="submitScrap(${stepNum},'${stepName}')">Submit NCR</button>
          <button class="btn btn-secondary" onclick="closeProdModal()">Cancel</button>
        </div>
      </div>
    </div>`;
  document.getElementById('prodModal').style.display = 'block';
}

function submitScrap(stepNum, stepName) {
  const qty    = parseFloat(document.getElementById('scrapQty').value) || 1;
  const unit   = document.getElementById('scrapUnit').value;
  const reason = document.getElementById('scrapReason').value.trim();
  const disp   = document.getElementById('scrapDisposition').value;
  if (!reason) { showToast('Please enter a reason before submitting', 'warn'); return; }

  const ncrId = `NCR-${new Date().getFullYear()}-${String(ProdData.scrapLog.length + 1).padStart(3,'0')}`;
  ProdData.scrapLog.unshift({
    id: ncrId,
    step: stepNum,
    stepName,
    qty,
    unit,
    disposition: disp,
    reason,
    project: ProdData.selectedProject,
    time: new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }),
  });

  closeProdModal();
  showToast(`${ncrId} raised — routed to Quality for disposition`, 'warn');
  renderProdSubPage('routing');
}

function logJobEvent(taskId, type) {
  const time = new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
  const pid  = ProdData.selectedProject;
  const dot  = type === 'Start' ? '#4a9eff' : '#718096';
  
  ProdData.sfLog.unshift({
    time, project: pid, dot, tag: type,
    tagBg: type === 'Start' ? 'var(--blue-bg)' : 'var(--bg-elevated)',
    tagColor: type === 'Start' ? 'var(--blue)' : 'var(--text-muted)',
    text: `Job event <strong>${type}</strong> logged for Task ${taskId}.`
  });
  
  showToast(`Event '${type}' recorded for ${taskId}`, 'success');
  renderProdSubPage('manufacturing');
}

function disposeInspectionCall(callId, disposition) {
  const call = ProdData.inspectionCalls.find(c => c.id === callId);
  if (!call) return;

  const dispositionLabels = { accept: 'Accepted — proceed', rework: 'Rework required', reject: 'Rejected — raise NCR' };
  call.status = disposition === 'reject' ? 'rejected' : 'resolved';
  call.disposition = dispositionLabels[disposition];
  call.disposedAt = new Date().toLocaleString('en-GB');
  call.disposedBy = 'QC Inspector';

  if (disposition === 'reject') {
    showToast(`${callId} REJECTED — NCR auto-raised and routed to Quality.`, 'error');
  } else if (disposition === 'rework') {
    showToast(`${callId} dispositioned: Rework required. Step remains locked until rework complete.`, 'warn');
  } else {
    showToast(`${callId} accepted — production lock cleared.`, 'success');
  }

  // Refresh badge immediately without sidebar rebuild
  if (typeof refreshQcBadge === 'function') refreshQcBadge();
  renderProdSubPage('quality');
}

function raiseInspectionCall(taskId) {
  const time = new Date().toLocaleString('en-GB');
  const pid  = ProdData.selectedProject;
  const step = (ProdData.routing[pid] || []).find(s => String(s.step) === String(taskId) || s.id === taskId);
  
  ProdData.inspectionCalls.unshift({
    id: `IC-2025-${Math.floor(Math.random()*1000)}`,
    taskId,
    type: 'In-process Inspection',
    status: 'locked',
    raisedAt: time,
    raisedBy: 'Current Operator',
    project: pid,
    note: `Inspection call raised for ${step ? step.name : taskId}`
  });
  
  showToast(`Quality Gate raised for ${taskId}. Step is now LOCKED.`, 'warn');
  renderProdSubPage('manufacturing');
}

function showAllocationModal(wcId) {
  showToast(`Operator reallocation for ${wcId} — Skills matrix check required.`, 'info');
}

function checkWPQAndAssign(opId, opName) {
  const op = ProdData.skillMatrix.find(o => o.id === opId);
  if (!op) return;
  const expired = op.certifications.filter(c => c.status === 'expired');
  if (expired.length > 0) {
    showToast(`BLOCKED: ${opName} has ${expired.length} expired certification${expired.length > 1 ? 's' : ''} (${expired.map(c => c.code).join(', ')}). Renew before assigning to work.`, 'error');
    return;
  }
  const expiring = op.certifications.filter(c => c.status === 'expiring');
  if (expiring.length > 0) {
    showToast(`WARNING: ${opName} assigned — but ${expiring.length} cert${expiring.length > 1 ? 's' : ''} expiring soon (${expiring.map(c => c.code).join(', ')}). Schedule renewal.`, 'warn');
  } else {
    showToast(`${opName} assigned — all certifications valid.`, 'success');
  }
}

/* ═══════════════════════════════════════════════════════════
   ASSETS & TOOLING
═══════════════════════════════════════════════════════════ */
function renderProdAssets() {
  const el = document.getElementById('pageContent');
  el.innerHTML = prodPageHeader('Assets & Tooling', 'ISA-95 Equipment Resource Model · Tooling lifecycle management · Asset health monitor') + `
    <div style="display:grid;grid-template-columns:1fr 400px;gap:20px" class="stagger-in">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Shop-Floor Machine Registry</span>
          <button class="btn btn-secondary btn-xs" onclick="showToast('Initiating remote asset scan...','info')">Scan Assets</button>
        </div>
        <div style="padding:16px;display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:16px">
          ${ProdData.equipment.map(eq => `
            <div class="prod-asset-card">
              <div class="prod-asset-header">
                <span class="prod-asset-id">${eq.assetId}</span>
                <span class="badge ${eq.status==='running'?'badge-green':eq.status==='stopped'?'badge-muted':'badge-red'}">${eq.status.toUpperCase()}</span>
              </div>
              <div class="prod-asset-name">${eq.name}</div>
              <div class="prod-asset-model">${eq.model} · ${eq.location}</div>
              <div class="prod-asset-health">
                <div class="prod-asset-health-label">
                  <span>Health Index</span>
                  <span style="font-weight:700;color:${eq.health > 85 ? 'var(--green)' : eq.health > 70 ? 'var(--amber)' : 'var(--red)'}">${eq.health}%</span>
                </div>
                <div class="progress-bar" style="height:5px">
                  <div class="progress-fill" style="width:${eq.health}%;background:${eq.health>85?'var(--green)':eq.health>70?'var(--amber)':'var(--red)'}"></div>
                </div>
              </div>
              <div class="prod-asset-footer">
                <span class="prod-asset-service">Last service: ${eq.lastServiced}</span>
                <button class="btn btn-ghost btn-xs" onclick="showToast('Asset telemetry detailed view','info')">Telemetry</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:20px">
        <div class="card">
          <div class="card-header"><span class="card-title">Tooling Lifecycle</span></div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th>Tooling ID</th><th>Status</th><th>Usage</th></tr>
              </thead>
              <tbody>
                ${ProdData.tooling.map(t => `
                  <tr>
                    <td>
                      <div style="font-weight:600;font-size:12px">${t.name}</div>
                      <div style="font-size:10px;color:var(--text-muted)">${t.type} · Mod: ${t.modification}</div>
                    </td>
                    <td><span class="badge ${t.lifecycle==='Active'?'badge-green':'badge-amber'}">${t.lifecycle}</span></td>
                    <td style="font-family:var(--font-mono);font-size:12px;text-align:right">${t.usage} cyc</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="prod-status-card warn">
          <div class="prod-status-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L1.5 15.5h15L9 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 7v4M9 13v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div>
            <div class="prod-status-label">Tooling Critical Alert</div>
            <div class="prod-status-text"><strong>Die-771</strong> reached 92% of rated life. Replacement scheduled for next downtime.</div>
          </div>
        </div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   MAINTENANCE (MOM)
═══════════════════════════════════════════════════════════ */
function renderProdMaintenance() {
  const el = document.getElementById('pageContent');
  const role = AppState.currentUser?.role || 'manager';
  const isOperator = role === 'user';

  el.innerHTML = prodPageHeader('Maintenance (MOM)', 'Manufacturing Operations Management · PM scheduling · Failure logbook · Reliability engineering') + `
    <div class="prod-kpi-grid stagger-in" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
      ${[
        { label: 'MTBF (Avg)', value: '142h', sub: 'Mean time between failures', color: 'var(--green)' },
        { label: 'MTTR (Avg)', value: '2.4h', sub: 'Mean time to repair', color: 'var(--amber)' },
        { label: 'Availability', value: '98.2%', sub: 'Overall equipment availability', color: 'var(--blue)' },
      ].map(k => `
        <div class="prod-kpi-card">
          <div class="prod-kpi-label">${k.label}</div>
          <div class="prod-kpi-value" style="color:${k.color}">${k.value}</div>
          <div class="prod-kpi-sub">${k.sub}</div>
        </div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px" class="stagger-in">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Preventive Maintenance Schedule</span>
          ${!isOperator ? '<button class="btn btn-secondary btn-xs" onclick="showToast(\'PM schedule optimized via AI\',\'success\')">Auto-Schedule</button>' : ''}
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Asset / Task</th><th>Frequency</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${ProdData.maintenance.schedule.map(pm => {
                const eq = ProdData.equipment.find(e => e.id === pm.machineId);
                return `
                <tr>
                  <td>
                    <div style="font-weight:600;font-size:12px">${eq ? eq.name : pm.machineId}</div>
                    <div style="font-size:10px;color:var(--text-muted)">${pm.task}</div>
                  </td>
                  <td style="font-size:11px">${pm.type}</td>
                  <td><span class="badge ${pm.status==='ok'?'badge-green':pm.status==='due'?'badge-amber':'badge-red'}">${pm.status.toUpperCase()}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Failure Log & Root Cause</span>
          ${!isOperator ? '<button class="btn btn-primary btn-xs" onclick="showToast(\'Breakdown report initiated\',\'info\')">+ Log breakdown</button>' : ''}
        </div>
        <div style="padding:12px;display:flex;flex-direction:column;gap:10px">
          ${ProdData.maintenance.logs.map(log => `
            <div class="prod-maint-log">
              <div class="prod-maint-log-header">
                <span class="prod-maint-log-action">${log.action}</span>
                <span class="prod-maint-log-date">${log.date}</span>
              </div>
              <div class="prod-maint-log-detail">${log.machineId} · ${log.measurements}</div>
              <div class="prod-maint-log-footer">
                <span class="prod-maint-log-tech">Tech: <strong>${log.technician}</strong></span>
                <span class="badge badge-muted">${log.type.toUpperCase()}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   INVENTORY (MRF)
═══════════════════════════════════════════════════════════ */
function renderProdInventory() {
  const el = document.getElementById('pageContent');
  const role = AppState.currentUser?.role || 'manager';
  const isManager = role === 'manager' || role === 'gm';
  el.innerHTML = prodPageHeader('Inventory (MRF)', 'Material Requisition Workflow · Shop-floor supply chain integration · Stock-out prevention') + `
    <div style="display:grid;grid-template-columns:360px 1fr;gap:20px;align-items:flex-start" class="stagger-in">
      <div class="card">
        <div class="card-header"><span class="card-title">New Material Request (MRF)</span></div>
        <div style="display:flex;flex-direction:column;gap:12px;padding:16px">
          <div style="font-size:11px;color:var(--text-muted)">ISA-95 compliant shop-floor requisition.</div>
          <div>
            <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.06em">Project</label>
            <select id="mrfProj" class="input-sm" style="width:100%">
              ${AppState.projects.map(p => `<option value="${p.id}">${p.id} — ${p.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.06em">Item / Description</label>
            <input id="mrfItem" type="text" placeholder="e.g. 7018 Electrodes 3.2mm" class="input-sm" style="width:100%" oninput="mrfStockHint(this.value)">
            <div id="mrfStockHint" style="font-size:10px;color:var(--text-muted);margin-top:3px;min-height:14px"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div>
              <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.06em">Qty</label>
              <input id="mrfQty" type="number" value="1" class="input-sm" style="width:100%">
            </div>
            <div>
              <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.06em">Unit</label>
              <select id="mrfUnit" class="input-sm" style="width:100%">
                <option>EA</option><option>PKT</option><option>KG</option><option>M</option>
              </select>
            </div>
          </div>
          <button class="btn btn-primary" style="margin-top:4px" onclick="submitMRF()">Submit Requisition</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Open Requisitions</span>
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost btn-xs">Filter</button>
            <button class="btn btn-secondary btn-xs" onclick="showToast('Registry exported to PDF','success')">Export Registry</button>
          </div>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>MRF ID</th><th>Details</th><th>Qty</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${ProdData.mrf.map(m => `
                <tr>
                  <td style="font-family:var(--font-mono);font-size:11px;font-weight:700">${m.id}</td>
                  <td>
                    <div style="font-weight:600;font-size:12px">${m.item}</div>
                    <div style="font-size:10px;color:var(--text-muted)">Project: ${m.project} · Req: ${m.requester}</div>
                    ${m.prId ? `<div style="font-size:10px;color:var(--green)">PR: ${m.prId}</div>` : ''}
                  </td>
                  <td style="font-size:12px">${m.qty} ${m.unit}</td>
                  <td><span class="badge ${m.status==='approved'?'badge-green':m.status==='pending_approval'?'badge-amber':'badge-neutral'}">${m.status.toUpperCase().replace('_',' ')}</span></td>
                  <td>${m.status === 'pending_approval'
                    ? (isManager ? `<button class="btn btn-xs btn-secondary" onclick="approveMRF('${m.id}')">Approve → PR</button>` : `<span style="font-size:11px;color:var(--text-muted)">Pending approval</span>`)
                    : `<span style="font-size:10px;color:var(--text-muted)">${m.prId || '—'}</span>`
                  }</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

function mrfStockHint(val) {
  const hint = document.getElementById('mrfStockHint');
  if (!hint) return;
  if (!val || val.length < 3) { hint.textContent = ''; return; }
  const onHand = queryStock(val);
  if (onHand === null) {
    hint.textContent = 'Stock level: inventory module not loaded';
    hint.style.color = 'var(--text-muted)';
  } else if (onHand === 0) {
    hint.textContent = 'Stock level: OUT OF STOCK';
    hint.style.color = 'var(--red, #e53e3e)';
  } else {
    hint.textContent = `Stock level: ${onHand} on hand`;
    hint.style.color = 'var(--green, #38a169)';
  }
}

function queryStock(itemName) {
  // Seam: query AppState.inventory if available, else return null (unknown)
  if (typeof AppState !== 'undefined' && AppState.inventory && Array.isArray(AppState.inventory)) {
    const match = AppState.inventory.find(i =>
      i.name && i.name.toLowerCase().includes(itemName.toLowerCase())
    );
    return match ? match.onHand : 0;
  }
  return null; // inventory module not loaded
}

function submitMRF() {
  const item = document.getElementById('mrfItem').value.trim();
  const proj = document.getElementById('mrfProj').value;
  const qty  = document.getElementById('mrfQty').value;
  const unit = document.getElementById('mrfUnit').value;

  if (!item) { showToast('Please enter item name', 'error'); return; }

  const mrfId = `MRF-${new Date().getFullYear()}-${String(ProdData.mrf.length + 1).padStart(3, '0')}`;
  const mrfRow = {
    id: mrfId,
    date: new Date().toLocaleDateString('en-GB'),
    project: proj,
    item,
    qty: parseFloat(qty),
    unit,
    activity: 'Shop-floor request',
    status: 'pending_approval',
    requester: 'Current Operator',
    prId: null,
  };
  ProdData.mrf.unshift(mrfRow);
  showToast(`MRF ${mrfId} submitted to Store queue`, 'success');
  renderProdSubPage('inventory');
}

function approveMRF(mrfId) {
  const role = AppState.currentUser?.role || 'manager';
  if (role !== 'manager' && role !== 'gm') {
    showToast('Permission denied: Production Manager role required', 'error');
    return;
  }
  const mrf = ProdData.mrf.find(m => m.id === mrfId);
  if (!mrf) return;

  mrf.status = 'approved';

  // Create a linked Purchase Request in AppState
  const prId = `PR-${new Date().getFullYear()}-MRF-${String(AppState.purchaseRequests.length + 1).padStart(3, '0')}`;
  AppState.purchaseRequests.push({
    id: prId,
    source: mrfId,
    date: new Date().toLocaleDateString('en-GB'),
    project: mrf.project,
    item: mrf.item,
    qty: mrf.qty,
    unit: mrf.unit,
    status: 'open',
    requester: mrf.requester,
  });
  mrf.prId = prId;

  showToast(`MRF approved → ${prId} raised`, 'success');
  renderProdSubPage('inventory');
}

/* ═══════════════════════════════════════════════════════════
   QUALITY GATES
═══════════════════════════════════════════════════════════ */
function renderProdQuality() {
  const el = document.getElementById('pageContent');
  const pid      = ProdData.selectedProject;
  const allCalls = ProdData.inspectionCalls;
  const locked   = allCalls.filter(c => c.status === 'locked');
  const cleared  = allCalls.filter(c => c.status !== 'locked');
  const allSteps = ProdData.routing[pid] || [];
  const gates    = allSteps.filter(s => s.hold === 'H');
  const gatesDone= gates.filter(s => s.status === 'done').length;

  el.innerHTML = prodPageHeader('Quality Gates — Overview', 'Production-side QC summary · Inspection call status · Gate pipeline · Full disposition in QC module') + `

    <!-- QC module redirect notice -->
    <div class="prod-status-card ok stagger-in" style="margin-bottom:20px">
      <div class="prod-status-icon">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L3 5v5c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V5L9 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6.5 9l2 2 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div style="flex:1">
        <div class="prod-status-label">Read-Only View</div>
        <div class="prod-status-text">This is a production-side summary. Inspection disposition, NCR management, and full audit trails are handled in the <strong>Quality Control module</strong>.</div>
      </div>
      <button class="btn btn-secondary btn-sm" style="flex-shrink:0" onclick="navigateTo('quality')">Open QC Module</button>
    </div>

    <!-- KPIs -->
    <div class="prod-kpi-grid stagger-in" style="grid-template-columns:repeat(5,1fr);margin-bottom:20px">
      ${[
        { label: 'Inspection Calls', value: allCalls.length, sub: 'total raised', color: 'var(--text-primary)' },
        { label: 'Active Locks',     value: locked.length,   sub: locked.length > 0 ? 'blocking production' : 'no holds', color: locked.length > 0 ? 'var(--red)' : 'var(--text-muted)' },
        { label: 'Cleared',          value: cleared.length,  sub: 'dispositioned', color: 'var(--green)' },
        { label: 'Pass Rate',        value: '96.2%',          sub: '30-day rolling', color: 'var(--green)' },
        { label: 'Gates Passed',     value: gatesDone + ' / ' + gates.length, sub: 'for ' + pid, color: 'var(--text-primary)' },
      ].map(k => `
        <div class="prod-kpi-card">
          <div class="prod-kpi-label">${k.label}</div>
          <div class="prod-kpi-value" style="color:${k.color}">${k.value}</div>
          <div class="prod-kpi-sub">${k.sub}</div>
        </div>`).join('')}
    </div>

    <!-- Gate Flow Strip -->
    <div class="card stagger-in" style="margin-bottom:20px">
      <div class="card-header">
        <div>
          <span class="card-title">Quality Gate Pipeline — ${pid}</span>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Read-only step status. Use QC module to release holds.</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="navigateTo('quality')">Manage in QC</button>
      </div>
      <div class="qg-pipeline">
        ${allSteps.map((s, idx) => {
          const isGate   = s.hold === 'H';
          const isDone   = s.status === 'done';
          const isActive = s.status === 'active';
          const isLocked = isGate && !isDone;
          const nodeClass = isDone ? 'qg-node-done' : isLocked ? 'qg-node-locked' : isActive ? 'qg-node-active' : 'qg-node-pending';
          return `
          <div class="qg-step-wrap">
            <div class="qg-node ${nodeClass}" title="Step ${s.step}: ${s.name}">
              ${isDone
                ? '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 6.5L5.5 9.5L10.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                : isLocked
                  ? '<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="1.5" y="5" width="8" height="5.5" rx="1.2" stroke="currentColor" stroke-width="1.3"/><path d="M3 5V4a2.5 2.5 0 015 0v1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>'
                  : `<span style="font-size:10px;font-weight:700">${s.step}</span>`}
              ${isGate ? '<div class="qg-gate-marker"></div>' : ''}
            </div>
            <div class="qg-step-label">${s.name.split(' ').slice(0,3).join(' ')}${s.name.split(' ').length > 3 ? '…' : ''}</div>
            ${idx < allSteps.length - 1 ? `<div class="qg-connector ${isDone ? 'qg-line-done' : 'qg-line-pending'}"></div>` : ''}
          </div>`;
        }).join('')}
      </div>
      <div class="qg-legend">
        <div class="qg-legend-item"><div class="qg-node qg-node-done" style="width:16px;height:16px"></div>Done</div>
        <div class="qg-legend-item"><div class="qg-node qg-node-active" style="width:16px;height:16px"></div>Active</div>
        <div class="qg-legend-item"><div class="qg-node qg-node-locked" style="width:16px;height:16px"></div>QC Hold</div>
        <div class="qg-legend-item"><div class="qg-node qg-node-pending" style="width:16px;height:16px"></div>Pending</div>
        <div class="qg-legend-item"><div class="qg-gate-marker" style="position:static;transform:none"></div>Quality Gate</div>
      </div>
    </div>

    <!-- Inspection summary + compliance -->
    <div style="display:grid;grid-template-columns:1fr 360px;gap:20px" class="stagger-in">

      <!-- Read-only inspection log -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Inspection Call Summary</span>
          <span style="font-size:11px;color:var(--text-muted)">Disposition managed in QC module</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Call ID</th><th>Project / Step</th><th>Type</th><th>Raised by</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${allCalls.map(c => `
                <tr>
                  <td style="font-family:var(--font-mono);font-size:11px;font-weight:700">${c.id}</td>
                  <td>
                    <div style="font-weight:600;font-size:12px">${c.project}</div>
                    <div style="font-size:10px;color:var(--text-muted)">Step ${c.stepNum || c.taskId}</div>
                  </td>
                  <td style="font-size:12px">${c.type}</td>
                  <td>
                    <div style="font-size:11px">${c.raisedBy}</div>
                    <div style="font-size:10px;color:var(--text-muted)">${c.raisedAt.split(' ')[0]}</div>
                  </td>
                  <td>
                    <span class="badge ${c.status === 'locked' ? 'badge-red' : 'badge-green'}">${c.status.toUpperCase()}</span>
                    ${c.disposition ? `<div style="font-size:10px;color:var(--text-muted);margin-top:3px">${c.disposition}</div>` : ''}
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Compliance summary -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Compliance Status</span>
          <button class="btn btn-ghost btn-xs" onclick="navigateTo('quality')">Full Matrix in QC</button>
        </div>
        <div style="display:flex;flex-direction:column">
          ${[
            { name: 'ASME Section IX',   scope: 'Welder qualifications',       status: 'compliant', date: '2025-04-10' },
            { name: 'ISO 9001:2015',     scope: 'QMS audit — full scope',      status: 'compliant', date: '2025-04-12' },
            { name: 'AWS D1.1',          scope: 'Structural weld procedure',    status: 'pending',   date: 'Next shift'  },
            { name: 'PED 2014/68/EU',    scope: 'Pressure equipment directive', status: 'compliant', date: '2025-03-20' },
            { name: 'ATEX Zone 1',       scope: 'Hazardous area equipment',     status: 'pending',   date: 'Due 2025-06' },
          ].map((ch, i, arr) => `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;${i < arr.length-1 ? 'border-bottom:1px solid var(--border)' : ''}">
              <div class="qg-compliance-icon ${ch.status}">
                ${ch.status === 'compliant'
                  ? '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                  : '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 3v4M6 9v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'}
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:12px">${ch.name}</div>
                <div style="font-size:10px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ch.scope} · ${ch.date}</div>
              </div>
              <span class="badge ${ch.status === 'compliant' ? 'badge-green' : 'badge-amber'}" style="flex-shrink:0">${ch.status.toUpperCase()}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   SKILL MATRIX
═══════════════════════════════════════════════════════════ */
let _smHighlightCert = null;

function renderProdSkillMatrix() {
  const el = document.getElementById('pageContent');
  const today = new Date();
  const ops = ProdData.skillMatrix;

  // Collect all unique certs across all operators
  const allCerts = [];
  ops.forEach(op => op.certifications.forEach(c => {
    if (!allCerts.includes(c.cert)) allCerts.push(c.cert);
  }));

  // Training gap analysis
  const gapAlerts = [];
  ops.forEach(op => {
    op.certifications.forEach(c => {
      const daysLeft = Math.ceil((new Date(c.expiry) - today) / 86400000);
      if (c.status === 'expired' || daysLeft <= 60) {
        gapAlerts.push({ opName: op.name, cert: c.cert, code: c.code, daysLeft: c.status === 'expired' ? 0 : daysLeft, status: c.status });
      }
    });
  });

  const totalCerts    = ops.reduce((n, op) => n + op.certifications.length, 0);
  const validCount    = ops.reduce((n, op) => n + op.certifications.filter(c => c.status === 'valid').length, 0);
  const expiringCount = ops.reduce((n, op) => n + op.certifications.filter(c => c.status === 'expiring').length, 0);
  const expiredCount  = ops.reduce((n, op) => n + op.certifications.filter(c => c.status === 'expired').length, 0);

  el.innerHTML = prodPageHeader('Skill Matrix', 'Personnel certification tracking · Competency heatmap · Training gap analysis · WPQ management') + `

    <!-- KPIs -->
    <div class="prod-kpi-grid stagger-in" style="grid-template-columns:repeat(5,1fr);margin-bottom:20px">
      ${[
        { label: 'Personnel',       value: ops.length,    sub: 'registered operators',   color: 'var(--text-primary)' },
        { label: 'Total Certs',     value: totalCerts,    sub: 'across all operators',   color: 'var(--text-primary)' },
        { label: 'Valid',           value: validCount,    sub: 'current & in-scope',     color: 'var(--green)' },
        { label: 'Expiring ≤30d',   value: expiringCount, sub: 'renewal action needed',  color: expiringCount > 0 ? 'var(--amber)' : 'var(--text-muted)' },
        { label: 'Expired',         value: expiredCount,  sub: 'assignment blocked',     color: expiredCount > 0 ? 'var(--red)' : 'var(--text-muted)' },
      ].map(k => `
        <div class="prod-kpi-card">
          <div class="prod-kpi-label">${k.label}</div>
          <div class="prod-kpi-value" style="color:${k.color}">${k.value}</div>
          <div class="prod-kpi-sub">${k.sub}</div>
        </div>`).join('')}
    </div>

    <!-- Training Gap Alert -->
    ${gapAlerts.length ? `
    <div class="prod-status-card warn stagger-in" style="margin-bottom:20px;flex-direction:column;align-items:flex-start;gap:10px">
      <div style="display:flex;align-items:center;gap:10px;width:100%">
        <div class="prod-status-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2L1.5 15.5h15L9 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 7v4M9 13v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </div>
        <div>
          <div class="prod-status-label">Training Gap Alerts — ${gapAlerts.length} action${gapAlerts.length > 1 ? 's' : ''} required</div>
          <div class="prod-status-text">The following certifications require immediate renewal action before operators can be assigned.</div>
        </div>
        <button class="btn btn-secondary btn-sm" style="margin-left:auto;flex-shrink:0" onclick="showToast('Training schedule opened','info')">Schedule Training</button>
      </div>
      <div style="width:100%;display:flex;flex-direction:column;gap:0;border-top:1px solid rgba(245,158,11,0.2);padding-top:8px">
        ${gapAlerts.map((g, i, arr) => `
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:6px 0;${i < arr.length-1 ? 'border-bottom:1px solid rgba(245,158,11,0.12)' : ''}">
            <div>
              <strong>${g.opName}</strong>
              <span style="color:var(--text-secondary)"> — ${g.cert}</span>
              <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);margin-left:6px">${g.code}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-weight:700;color:${g.daysLeft === 0 ? 'var(--red)' : 'var(--amber)'}">${g.daysLeft === 0 ? 'EXPIRED' : g.daysLeft + 'd left'}</span>
              <button class="btn btn-xs btn-secondary" onclick="showToast('Renewal form for ${g.opName}','info')">Renew</button>
            </div>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- Competency Heat Map -->
    <div class="card stagger-in" style="margin-bottom:20px">
      <div class="card-header">
        <div>
          <span class="card-title">Competency Heat Map</span>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Click a skill column to highlight coverage — shows who holds each certification</div>
        </div>
        <div style="display:flex;gap:12px;align-items:center">
          <div style="display:flex;gap:8px;align-items:center">
            <div class="sm-legend-item sm-valid">Valid</div>
            <div class="sm-legend-item sm-expiring">Expiring</div>
            <div class="sm-legend-item sm-expired">Expired</div>
            <div class="sm-legend-item sm-none">Not held</div>
          </div>
        </div>
      </div>
      <div style="overflow-x:auto;padding-bottom:4px">
        <table class="sm-heatmap" id="smHeatmap">
          <thead>
            <tr>
              <th class="sm-op-col">Operator</th>
              <th class="sm-op-col" style="color:var(--text-muted);font-weight:400">Role</th>
              ${allCerts.map(cert => `
                <th class="sm-cert-col ${_smHighlightCert === cert ? 'sm-col-highlight' : ''}"
                    onclick="_smHighlight('${cert.replace(/'/g,"\\'")}')"
                    title="${cert}">${cert}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${ops.map(op => {
              const certMap = {};
              op.certifications.forEach(c => certMap[c.cert] = c);
              const hasExpired = op.certifications.some(c => c.status === 'expired');
              return `
              <tr>
                <td class="sm-op-cell">
                  <div style="font-weight:600;font-size:12px;white-space:nowrap">${op.name}</div>
                  <div style="font-size:10px;color:var(--text-muted);white-space:nowrap">ID: ${op.id} · ${op.shift}</div>
                </td>
                <td style="font-size:11px;color:var(--text-secondary);white-space:nowrap;padding:8px 12px">${op.role}</td>
                ${allCerts.map(cert => {
                  const c = certMap[cert];
                  const hlCol = _smHighlightCert === cert;
                  if (!c) return `<td class="sm-cell sm-none ${hlCol ? 'sm-cell-highlight' : ''}"><div class="sm-dot sm-dot-none"></div></td>`;
                  const cls = c.status === 'valid' ? 'sm-valid' : c.status === 'expiring' ? 'sm-expiring' : 'sm-expired';
                  const title = `${op.name} · ${cert} · ${c.code} · Exp: ${c.expiry}`;
                  return `<td class="sm-cell ${cls} ${hlCol ? 'sm-cell-highlight' : ''}" title="${title}">
                    <div class="sm-dot sm-dot-${c.status}"></div>
                    <div style="font-size:9px;line-height:1.2;color:inherit;text-align:center;max-width:52px;word-break:break-word">${c.code.split('-').slice(-1)[0]}</div>
                  </td>`;
                }).join('')}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Operator Certifications Detail -->
    <div class="card stagger-in">
      <div class="card-header">
        <span class="card-title">Operator Certification Register</span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="showToast('Training records loading...','info')">Training Logs</button>
          <button class="btn btn-primary btn-sm" onclick="showToast('New certification entry form','info')">+ Add Cert</button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:0">
        ${ops.map((op, i, arr) => {
          const hasExpired  = op.certifications.some(c => c.status === 'expired');
          const hasExpiring = op.certifications.some(c => c.status === 'expiring');
          const overallStatus = hasExpired ? 'expired' : hasExpiring ? 'expiring' : 'valid';
          const statusColor = { expired: 'var(--red)', expiring: 'var(--amber)', valid: 'var(--green)' }[overallStatus];
          return `
          <div class="sm-op-row ${i < arr.length-1 ? 'sm-op-row-border' : ''}">
            <div class="sm-op-profile">
              <div class="sm-op-avatar" style="background:${statusColor}22;color:${statusColor}">
                ${op.name.split('.').pop().trim().charAt(0) || op.name.charAt(0)}
              </div>
              <div>
                <div style="font-weight:700;font-size:13px">${op.name}</div>
                <div style="font-size:11px;color:var(--text-muted)">${op.role}</div>
                <div style="font-size:10px;color:var(--text-muted);margin-top:2px">
                  ${op.id} · WC: ${op.assignedWC || '—'} · ${op.shift} shift
                </div>
              </div>
            </div>
            <div class="sm-cert-chips">
              ${op.certifications.map(c => `
                <div class="sm-cert-chip sm-cert-${c.status}">
                  <div class="sm-cert-chip-header">
                    <span class="sm-cert-chip-name">${c.cert}</span>
                    <span class="badge ${c.status==='valid'?'badge-green':c.status==='expiring'?'badge-amber':'badge-red'}" style="font-size:9px">${c.status.toUpperCase()}</span>
                  </div>
                  <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);margin-top:3px">${c.code}</div>
                  <div style="font-size:10px;color:var(--text-muted)">Exp: <strong style="color:${c.status==='expired'?'var(--red)':c.status==='expiring'?'var(--amber)':'inherit'}">${c.expiry}</strong></div>
                </div>`).join('')}
            </div>
            <div class="sm-op-actions">
              <button class="btn btn-sm ${hasExpired ? 'btn-warn' : 'btn-secondary'}"
                      onclick="checkWPQAndAssign('${op.id}','${op.name}')">
                ${hasExpired ? 'Assignment Blocked' : hasExpiring ? 'Assign (Caution)' : 'Assign to Job'}
              </button>
              <button class="btn btn-ghost btn-sm" onclick="showToast('${op.name} training history','info')">History</button>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

window._smHighlight = function(cert) {
  _smHighlightCert = _smHighlightCert === cert ? null : cert;
  renderProdSkillMatrix();
};

/* ═══════════════════════════════════════════════════════════
   PRODUCTION ANALYTICS
═══════════════════════════════════════════════════════════ */
function renderProdAnalytics() {
  const el = document.getElementById('pageContent');
  el.innerHTML = prodPageHeader('Production Analytics', 'Manufacturing Performance KPIs · OEE breakdown · Shop-floor utilisation') + `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'Overall Equipment Effectiveness', value:'82.4%', color:'var(--green)' },
        { label:'Availability', value:'91.2%', color:'var(--blue)' },
        { label:'Performance', value:'94.5%', color:'var(--indigo)' },
        { label:'Quality Yield', value:'95.8%', color:'var(--green)' },
      ].map(k=>`
        <div class="metric-card">
          <div class="metric-label">${k.label}</div>
          <div class="metric-value" style="color:${k.color}">${k.value}</div>
        </div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div class="card">
        <div class="card-header"><span class="card-title">WC Utilisation Trend</span></div>
        <div style="height:240px;display:flex;align-items:flex-end;gap:12px;padding:20px">
          ${[65, 82, 45, 92, 78, 88].map(h => `
            <div style="flex:1;background:var(--brand-light);height:${h}%;border-radius:4px;position:relative">
              <div style="position:absolute;top:-20px;width:100%;text-align:center;font-size:10px;font-family:var(--font-mono)">${h}%</div>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;justify-content:space-around;padding:0 20px 10px;font-size:10px;color:var(--text-muted)">
          <span>WC-01</span><span>WC-02</span><span>WC-03</span><span>WC-04</span><span>WC-05</span><span>WC-06</span>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header"><span class="card-title">Material Waste Breakdown</span></div>
        <div style="padding:20px">
          ${[
            { label: 'Plate Offcuts', val: 12, col: 'var(--blue)' },
            { label: 'Welding Consumables', val: 5, col: 'var(--amber)' },
            { label: 'Rework Scrap', val: 3, col: 'var(--red)' },
            { label: 'Grinding Discs', val: 2, col: 'var(--indigo)' },
          ].map(w => `
            <div style="margin-bottom:15px">
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">
                <span>${w.label}</span>
                <span>${w.val}%</span>
              </div>
              <div class="progress-bar" style="height:8px">
                <div class="progress-fill" style="width:${w.val*4}%;background:${w.col}"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
}
