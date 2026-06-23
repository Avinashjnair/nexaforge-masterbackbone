/* ============================================================
   NexaForge ERP — Welding / WPS Module
   Covers: WPS library · PQR records · WPQ / welder passports
           Weld map & joint register · IIoT machine telemetry
           NDE / NDT coordination · Continuity logs
           Weld traveller · Heat input monitoring
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   WELDING DATA STORE
───────────────────────────────────────────────────────────── */
const WeldData = {
  activeTab: 'overview',
  selectedProject: 'P-2401',

  /* ── Welding Procedure Specifications ── */
  wps: [
    {
      ref: 'WPS-316L-04', rev: 'B', status: 'approved',
      title: 'GTAW — 316L Stainless Steel, Butt Joint',
      process: 'GTAW (TIG)', standard: 'ASME IX', material: '316L SS',
      thickness: '6–25mm', diameter: '≥ 50mm NB',
      position: '1G, 2G, 5G, 6G', preheat: '15°C min',
      interpass: '150°C max', pwht: 'Not required',
      fillerMetal: 'ER316L (2.4mm / 3.2mm)',
      shieldingGas: 'Argon 99.99% · 12–15 L/min',
      currentType: 'DCEN', polarity: 'Straight',
      voltage: '10–14V', amperage: '80–140A',
      travelSpeed: '50–120mm/min', heatInput: '0.5–2.0 kJ/mm',
      approved: '2025-01-20', approvedBy: 'Chief Eng.',
      linkedPQR: 'PQR-316L-04', projects: ['P-2401', 'P-2403'],
      color: '#2dd4a0',
    },
    {
      ref: 'WPS-316L-06', rev: 'A', status: 'approved',
      title: 'SMAW — 316L Stainless Steel, Nozzle & Fillet',
      process: 'SMAW (MMA)', standard: 'ASME IX', material: '316L SS',
      thickness: '6–20mm', diameter: 'All',
      position: '1F, 2F, 3F, 4F', preheat: '15°C min',
      interpass: '175°C max', pwht: 'Not required',
      fillerMetal: 'E316L-16 (2.5mm / 3.2mm)',
      shieldingGas: 'N/A',
      currentType: 'DCEP', polarity: 'Reverse',
      voltage: '22–28V', amperage: '70–110A',
      travelSpeed: '80–200mm/min', heatInput: '0.5–1.8 kJ/mm',
      approved: '2025-02-01', approvedBy: 'Chief Eng.',
      linkedPQR: 'PQR-316L-06', projects: ['P-2401'],
      color: '#4a9eff',
    },
    {
      ref: 'WPS-CS-01', rev: 'C', status: 'approved',
      title: 'SMAW — Carbon Steel A36/A516, Butt Joint',
      process: 'SMAW (MMA)', standard: 'ASME IX', material: 'CS A36 / A516-70',
      thickness: '6–50mm', diameter: '≥ 50mm NB',
      position: '1G, 2G, 3G, 4G', preheat: '10°C min (>25mm: 80°C)',
      interpass: '250°C max', pwht: '595–650°C (t > 38mm)',
      fillerMetal: 'E7018 (2.5mm / 3.2mm / 4.0mm)',
      shieldingGas: 'N/A',
      currentType: 'DCEP', polarity: 'Reverse',
      voltage: '22–32V', amperage: '80–160A',
      travelSpeed: '100–300mm/min', heatInput: '0.8–3.5 kJ/mm',
      approved: '2024-08-10', approvedBy: 'Chief Eng.',
      linkedPQR: 'PQR-CS-01', projects: [],
      color: '#7F77DD',
    },
    {
      ref: 'WPS-304-02', rev: 'A', status: 'approved',
      title: 'GTAW — 304 Stainless Steel, Tube-to-Tubesheet',
      process: 'GTAW (TIG)', standard: 'ASME IX / TEMA', material: '304 SS',
      thickness: '2–12mm', diameter: '≥ 19mm OD tube',
      position: '1G, 5G', preheat: '15°C min',
      interpass: '150°C max', pwht: 'Not required',
      fillerMetal: 'ER308L (1.6mm / 2.4mm)',
      shieldingGas: 'Argon 99.99% · 10–14 L/min',
      currentType: 'DCEN', polarity: 'Straight',
      voltage: '8–13V', amperage: '60–110A',
      travelSpeed: '40–100mm/min', heatInput: '0.3–1.5 kJ/mm',
      approved: '2025-01-05', approvedBy: 'Chief Eng.',
      linkedPQR: 'PQR-304-02', projects: ['P-2403'],
      color: '#f59e0b',
    },
    {
      ref: 'WPS-2205-01', rev: 'A', status: 'draft',
      title: 'GTAW/SMAW — Duplex 2205, Butt & Fillet',
      process: 'GTAW + SMAW', standard: 'ASME IX', material: 'Duplex 2205',
      thickness: '6–30mm', diameter: '≥ 50mm NB',
      position: '1G, 2G, 5G', preheat: '15°C min',
      interpass: '150°C max', pwht: 'Solution anneal if required',
      fillerMetal: 'ER2209 (2.4mm) / E2209-16 (3.2mm)',
      shieldingGas: 'Ar+2%N2 · 12–15 L/min',
      currentType: 'DCEN/DCEP', polarity: 'Per process',
      voltage: '10–28V', amperage: '80–130A',
      travelSpeed: '60–150mm/min', heatInput: '0.5–2.5 kJ/mm',
      approved: null, approvedBy: 'Pending',
      linkedPQR: 'PQR-2205-01 (pending)', projects: [],
      color: '#e8622a',
    },
  ],

  /* ── Procedure Qualification Records ── */
  pqr: [
    {
      ref: 'PQR-316L-04', linkedWPS: 'WPS-316L-04',
      date: '2023-01-05', lab: 'SGS UAE — Dubai',
      material: '316L SS', process: 'GTAW',
      thickness: '12mm', tensileResult: 'Pass — 538 MPa',
      bendResult: 'Pass — No cracks',
      impactResult: 'N/A', hardnessResult: 'Pass — 182 HV10',
      radiographyResult: 'Pass — Level 2 RT',
      status: 'approved', validUntil: '2026-01-05',
    },
    {
      ref: 'PQR-316L-06', linkedWPS: 'WPS-316L-06',
      date: '2023-06-10', lab: 'Bureau Veritas Dubai',
      material: '316L SS', process: 'SMAW',
      thickness: '10mm', tensileResult: 'Pass — 520 MPa',
      bendResult: 'Pass — No cracks',
      impactResult: 'N/A', hardnessResult: 'Pass — 178 HV10',
      radiographyResult: 'Pass — Level 2 RT',
      status: 'approved', validUntil: '2026-06-10',
    },
    {
      ref: 'PQR-CS-01', linkedWPS: 'WPS-CS-01',
      date: '2022-07-20', lab: 'Intertek Abu Dhabi',
      material: 'CS A36', process: 'SMAW',
      thickness: '25mm', tensileResult: 'Pass — 508 MPa',
      bendResult: 'Pass — No cracks',
      impactResult: 'Pass — 42J @ -20°C', hardnessResult: 'Pass — 205 HV10',
      radiographyResult: 'Pass',
      status: 'approved', validUntil: '2025-07-20',
    },
    {
      ref: 'PQR-304-02', linkedWPS: 'WPS-304-02',
      date: '2024-12-10', lab: 'TÜV Rheinland Dubai',
      material: '304 SS', process: 'GTAW',
      thickness: '6mm', tensileResult: 'Pass — 512 MPa',
      bendResult: 'Pass — No cracks',
      impactResult: 'N/A', hardnessResult: 'Pass — 170 HV10',
      radiographyResult: 'Pass — Level 2 RT',
      status: 'approved', validUntil: '2027-12-10',
    },
    {
      ref: 'PQR-2205-01', linkedWPS: 'WPS-2205-01',
      date: null, lab: 'TBD',
      material: 'Duplex 2205', process: 'GTAW+SMAW',
      thickness: '—', tensileResult: '—', bendResult: '—',
      impactResult: '—', hardnessResult: '—', radiographyResult: '—',
      status: 'pending', validUntil: null,
    },
  ],

  /* ── Welder Performance Qualifications ── */
  wpq: [
    {
      welderId: 'E-002', welderName: 'Kumar Suresh', stampNo: 'KS-007',
      qualifications: [
        { code: 'WPQ-GTAW-316L', process: 'GTAW', material: '316L SS', thickness: '6–25mm', position: '1G-6G', issued: '2023-04-20', expiry: '2025-04-20', status: 'expiring', continuityMonths: 22 },
        { code: 'WPQ-GTAW-CS',   process: 'GTAW', material: 'CS',       thickness: '6–25mm', position: '1G-6G', issued: '2023-04-20', expiry: '2025-04-20', status: 'expiring', continuityMonths: 22 },
        { code: 'WPQ-SMAW-316L', process: 'SMAW', material: '316L SS', thickness: '6–20mm', position: '1F-4F', issued: '2024-01-15', expiry: '2026-01-15', status: 'valid',    continuityMonths: 15 },
        { code: 'WPQ-SMAW-CS',   process: 'SMAW', material: 'CS',       thickness: '6–50mm', position: '1G-4G', issued: '2024-01-15', expiry: '2026-01-15', status: 'valid',    continuityMonths: 15 },
      ],
      avatarBg: '#185FA5', avatarColor: '#85B7EB',
    },
    {
      welderId: 'E-001', welderName: 'Khalid Al-Rashid', stampNo: 'KR-003',
      qualifications: [
        { code: 'WPQ-GTAW-316L', process: 'GTAW', material: '316L SS', thickness: '6–25mm', position: '1G-5G', issued: '2023-01-10', expiry: '2025-01-10', status: 'expired',  continuityMonths: 24 },
        { code: 'WPQ-SMAW-CS',   process: 'SMAW', material: 'CS',       thickness: '6–25mm', position: '1G-4G', issued: '2023-06-15', expiry: '2025-06-15', status: 'valid',    continuityMonths: 21 },
      ],
      avatarBg: '#0F6E56', avatarColor: '#9FE1CB',
    },
    {
      welderId: 'E-008', welderName: 'Ali Hassan', stampNo: 'AH-012',
      qualifications: [
        { code: 'WPQ-GTAW-CS',   process: 'GTAW', material: 'CS',       thickness: '6–19mm', position: '1G-2G', issued: '2021-10-01', expiry: '2023-10-01', status: 'expired',  continuityMonths: 0 },
        { code: 'WPQ-SMAW-CS',   process: 'SMAW', material: 'CS',       thickness: '6–25mm', position: '1G-4G', issued: '2022-03-01', expiry: '2024-03-01', status: 'expired',  continuityMonths: 0 },
      ],
      avatarBg: '#0F6E56', avatarColor: '#9FE1CB',
    },
  ],

  /* ── Weld joint register per project ── */
  joints: {
    'P-2401': [
      { id:'WJ-01', type:'Long seam',  desc:'Shell course 1 — longitudinal seam',    wps:'WPS-316L-04', welder:'KS-007', nde:'RT', status:'complete', result:'Accept', date:'2025-04-02' },
      { id:'WJ-02', type:'Long seam',  desc:'Shell course 2 — longitudinal seam',    wps:'WPS-316L-04', welder:'KS-007', nde:'RT', status:'complete', result:'Accept', date:'2025-04-05' },
      { id:'WJ-03', type:'Long seam',  desc:'Shell course 3 — longitudinal seam',    wps:'WPS-316L-04', welder:'KS-007', nde:'RT', status:'in-progress', result:'Pending', date:null },
      { id:'WJ-04', type:'Long seam',  desc:'Shell course 4 — longitudinal seam',    wps:'WPS-316L-04', welder:'KS-007', nde:'RT', status:'ncr',       result:'Reject',  date:'2025-04-10' },
      { id:'WJ-05', type:'Circ seam',  desc:'Circumferential B1 (courses 1-2)',      wps:'WPS-316L-04', welder:null,     nde:'RT', status:'pending',     result:'—',      date:null },
      { id:'WJ-06', type:'Circ seam',  desc:'Circumferential B2 (courses 2-3)',      wps:'WPS-316L-04', welder:null,     nde:'RT', status:'pending',     result:'—',      date:null },
      { id:'WJ-07', type:'Circ seam',  desc:'Circumferential B3 (courses 3-4)',      wps:'WPS-316L-04', welder:null,     nde:'RT', status:'pending',     result:'—',      date:null },
      { id:'WJ-08', type:'Nozzle',     desc:'Nozzle N1 (DN150) — shell attachment', wps:'WPS-316L-06', welder:'KS-007', nde:'VT+PT', status:'in-progress', result:'Pending', date:null },
      { id:'WJ-09', type:'Nozzle',     desc:'Nozzle N2 (DN150) — shell attachment', wps:'WPS-316L-06', welder:'KS-007', nde:'VT+PT', status:'in-progress', result:'Pending', date:null },
      { id:'WJ-10', type:'Nozzle',     desc:'Nozzle N3 (DN100) — shell attachment', wps:'WPS-316L-06', welder:null,     nde:'VT+PT', status:'pending',     result:'—',      date:null },
      { id:'WJ-11', type:'Bottom dish',desc:'Bottom dish end — circumferential',     wps:'WPS-316L-04', welder:'KS-007', nde:'RT+UT', status:'complete',  result:'Accept',  date:'2025-03-28' },
    ],
    'P-2402': [
      { id:'WJ-20', type:'Long seam',  desc:'PV shell — longitudinal seam',          wps:'WPS-304-02',  welder:null,     nde:'RT', status:'pending', result:'—', date:null },
      { id:'WJ-21', type:'Head attach',desc:'Ellipsoidal head 1 — circumferential', wps:'WPS-304-02',  welder:null,     nde:'RT+UT', status:'pending', result:'—', date:null },
      { id:'WJ-22', type:'Head attach',desc:'Ellipsoidal head 2 — circumferential', wps:'WPS-304-02',  welder:null,     nde:'RT+UT', status:'pending', result:'—', date:null },
    ],
    'P-2403': [
      { id:'WJ-30', type:'Tube-TS',    desc:'Tube bundle to tubesheet — front',      wps:'WPS-304-02',  welder:'KS-007', nde:'VT+PT', status:'blocked',   result:'Hold',   date:null },
      { id:'WJ-31', type:'Tube-TS',    desc:'Tube bundle to tubesheet — rear',       wps:'WPS-304-02',  welder:null,     nde:'VT+PT', status:'pending',    result:'—',      date:null },
      { id:'WJ-32', type:'Circ seam',  desc:'Shell to channel head — front',         wps:'WPS-304-02',  welder:null,     nde:'RT',    status:'pending',    result:'—',      date:null },
    ],
  },

  /* ── IIoT welding machine data ── */
  machines: [
    {
      id: 'WM-001', name: 'Miller Dynasty 400 — Bay 1',
      type: 'GTAW', status: 'active', operator: 'Kumar Suresh',
      project: 'P-2401', joint: 'WJ-03', wps: 'WPS-316L-04',
      current: 118, voltage: 12.4, travelSpeed: 78,
      heatInput: 1.12, arcTime: 142, wireSpeed: null,
      gasFlow: 13.2, interpassTemp: 88,
      alert: null,
    },
    {
      id: 'WM-002', name: 'Lincoln Invertec V275-S — Bay 1',
      type: 'SMAW', status: 'active', operator: 'Khalid Al-Rashid',
      project: 'P-2401', joint: 'WJ-08', wps: 'WPS-316L-06',
      current: 92, voltage: 24.8, travelSpeed: 140,
      heatInput: 0.98, arcTime: 68, wireSpeed: null,
      gasFlow: null, interpassTemp: 122,
      alert: 'Interpass temp approaching limit (175°C max)',
    },
    {
      id: 'WM-003', name: 'ESAB Aristo Mig 4004i — Bay 2',
      type: 'GMAW', status: 'idle', operator: null,
      project: null, joint: null, wps: null,
      current: 0, voltage: 0, travelSpeed: 0,
      heatInput: 0, arcTime: 0, wireSpeed: 0,
      gasFlow: 0, interpassTemp: null,
      alert: null,
    },
    {
      id: 'WM-004', name: 'Kemppi Master M 323 — Bay 2',
      type: 'GTAW', status: 'fault', operator: null,
      project: null, joint: null, wps: null,
      current: 0, voltage: 0, travelSpeed: 0,
      heatInput: 0, arcTime: 0, wireSpeed: null,
      gasFlow: 0, interpassTemp: null,
      alert: 'FAULT: Gas solenoid valve failure — maintenance required',
    },
  ],

  /* ── NDE / NDT records ── */
  nde: [
    { id:'NDE-041', joint:'WJ-01', project:'P-2401', method:'RT', technique:'Single wall', film:'IQI wire', date:'2025-04-03', contractor:'NDT Services UAE', operator:'Mohammed Al-Sayed', result:'Accept', density:'2.1', sensitivity:'2%', report:'RT-2401-041' },
    { id:'NDE-042', joint:'WJ-02', project:'P-2401', method:'RT', technique:'Single wall', film:'IQI wire', date:'2025-04-06', contractor:'NDT Services UAE', operator:'Mohammed Al-Sayed', result:'Accept', density:'2.0', sensitivity:'2%', report:'RT-2401-042' },
    { id:'NDE-043', joint:'WJ-11', project:'P-2401', method:'RT', technique:'Single wall', film:'IQI wire', date:'2025-03-29', contractor:'NDT Services UAE', operator:'Mohammed Al-Sayed', result:'Accept', density:'2.2', sensitivity:'2%', report:'RT-2401-043' },
    { id:'NDE-044', joint:'WJ-11', project:'P-2401', method:'UT', technique:'A-scan contact', date:'2025-03-29', contractor:'NDT Services UAE', operator:'Raj Patel', result:'Accept', density:'—', sensitivity:'6dB', report:'UT-2401-044' },
    { id:'NDE-045', joint:'WJ-04', project:'P-2401', method:'RT', technique:'Single wall', film:'IQI wire', date:'2025-04-10', contractor:'NDT Services UAE', operator:'Mohammed Al-Sayed', result:'Reject', density:'2.1', sensitivity:'2%', report:'RT-2401-045' },
    { id:'NDE-046', joint:'WJ-03', project:'P-2401', method:'RT', technique:'Single wall', film:'IQI wire', date:null, contractor:'NDT Services UAE', operator:'TBD', result:'Pending', density:'—', sensitivity:'—', report:null },
    { id:'NDE-047', joint:'WJ-30', project:'P-2403', method:'VT', technique:'Direct visual', date:null, contractor:'Internal QC', operator:'F. Nair', result:'Pending', density:'—', sensitivity:'N/A', report:null },
  ],

  /* ── Weld consumable heat records ── */
  consumables: [
    { id:'cb-001', lot:'FW-2231', batch_no:'FW-2231', material:'ER316L 2.4mm', material_spec:'ER316L 2.4mm', brand:'Lincoln Electric', qty:'45kg', qty_received:45, qty_unit:'KG', received:'2025-03-01', received_date:'2025-03-01', heatNo:'FW22310456', heat_no:'FW22310456', certified:true, mtc_available:true, cert:'MTC-FW2231', project:'P-2401', storage_location:'Cold Store A' },
    { id:'cb-002', lot:'FW-2248', batch_no:'FW-2248', material:'E316L-16 3.2mm', material_spec:'E316L-16 3.2mm', brand:'ESAB', qty:'15kg', qty_received:15, qty_unit:'KG', received:'2025-03-15', received_date:'2025-03-15', heatNo:'FW22480021', heat_no:'FW22480021', certified:true, mtc_available:true, cert:'MTC-FW2248', project:'P-2401', storage_location:'Cold Store A' },
    { id:'cb-003', lot:'FW-2301', batch_no:'FW-2301', material:'ER308L 1.6mm', material_spec:'ER308L 1.6mm', brand:'Lincoln Electric', qty:'20kg', qty_received:20, qty_unit:'KG', received:'2025-01-10', received_date:'2025-01-10', heatNo:'FW23010088', heat_no:'FW23010088', certified:true, mtc_available:true, cert:'MTC-FW2301', project:'P-2403', storage_location:'Cold Store B' },
  ],

  /* ── PWHT records — seed data; replaced by API loader ── */
  pwht: {
    'P-2401': [],
    'P-2402': [
      { id:'pwht-001', pwht_no:'PWHT-2402-001', joint_no:'WJ-101', furnace_id:'F-01', hold_temp_c:620, hold_duration_min:120, heat_rate_per_hr:150, cool_rate_per_hr:150, start_time:'2025-04-10T08:00:00', end_time:'2025-04-10T14:00:00', witnessed_by:'J. Williams (AI)', result:'pass', notes:'Temp ±8°C — within ASME UW-40 tolerance' },
    ],
    'P-2403': [],
  },
};

/* ─────────────────────────────────────────────────────────────
   MAIN RENDERER
───────────────────────────────────────────────────────────── */
async function renderWelding() {
  const el = document.getElementById('pageContent');

  // Load live data
  const [wpsRes, machinesRes] = await Promise.allSettled([
    WeldingAPI.wpsList({ limit: 100 }),
    IiotAPI.machines()
  ]);

  if (wpsRes.status === 'fulfilled') {
    const rawWps = wpsRes.value.wps || wpsRes.value || [];
    WeldData.wps = rawWps.map(w => ({
      ref: w.ref || w.id,
      rev: w.rev || 'A',
      status: w.status,
      title: w.title || '—',
      process: w.process || '—',
      standard: w.standard || '—',
      material: w.material || '—',
      thickness: w.thickness_range || '—',
      approved: w.created_at || new Date(),
      color: w.status === 'approved' ? '#2dd4a0' : '#e8622a'
    }));
  }

  if (machinesRes.status === 'fulfilled') {
    const rawMachines = machinesRes.value.machines || machinesRes.value || [];
    WeldData.machines = rawMachines.map(m => ({
      id: m.id,
      name: m.name || '—',
      type: m.type || '—',
      status: m.status === 'running' ? 'active' : m.status === 'stopped' ? 'idle' : 'fault',
      operator: m.operator_name || '—',
      current: m.telemetry ? m.telemetry.current : 0,
      voltage: m.telemetry ? m.telemetry.voltage : 0,
      alert: m.status === 'fault' ? 'Machine fault reported' : null
    }));
    // Subscribe to live telemetry rooms for each machine
    if (typeof joinMachineRoom === 'function') {
      WeldData.machines.forEach(m => joinMachineRoom(m.id));
    }
  }

  // Load WPQ passports + weld joints for current project
  if (!(typeof AppState !== 'undefined' && AppState.isDemoMode)) {
    const selectedPid = WeldData.selectedProject || (AppState.projects && AppState.projects[0]?.project_no);
    const [wpqRes, jointsRes, pqrRes] = await Promise.allSettled([
      WeldingAPI.wpqList({ limit: 200 }),
      selectedPid ? WeldingAPI.joints(selectedPid) : Promise.reject('no project'),
      WeldingAPI.pqrList(),
    ]);

    if (wpqRes.status === 'fulfilled') {
      const raw = wpqRes.value.records || wpqRes.value || [];
      if (raw.length) {
        WeldData.wpq = raw.map(r => ({
          id: r.id,
          welder: r.welder_name || r.employee_name || r.employee_id || '',
          welderId: r.employee_no || r.employee_id || '',
          qualifications: (r.qualifications || []).map(q => ({
            process: q.process || '', position: q.position || '',
            material: q.base_material || '', thickness: q.thickness_range || '',
            issued: (q.qualified_date || '').slice(0, 10),
            expiry: (q.expiry_date || '').slice(0, 10),
            status: q.status || 'valid',
            wpsRef: q.wps_no || '',
          })),
        }));
      }
    }

    if (jointsRes.status === 'fulfilled') {
      const raw = jointsRes.value.joints || jointsRes.value || [];
      if (raw.length && selectedPid) {
        WeldData.joints[selectedPid] = raw.map(j => ({
          id: j.joint_no || j.id,
          _dbId: j.id,
          weld: j.joint_no || j.id,
          dwg: j.drawing_ref || '',
          seam: j.seam_type || '',
          process: j.wps_process || j.process || '',
          wps: j.wps_no || '',
          welder: j.welder_name || j.welder_id || '',
          size: j.size || '',
          material: j.material || '',
          thick: j.thickness_mm || 0,
          status: j.status || 'pending',
          nde: j.nde_method || '',
          ndeResult: j.nde_result || 'Pending',
          repair: j.repair_count || 0,
        }));
      }
    }

    if (pqrRes.status === 'fulfilled') {
      const raw = pqrRes.value.pqrs || pqrRes.value || [];
      if (raw.length) {
        WeldData.pqr = raw.map(r => ({
          ref: r.pqr_no || r.id,
          process: r.process || '',
          material: r.base_material || '',
          thickness: r.thickness_range || '',
          positions: r.positions || '',
          tested: (r.test_date || '').slice(0, 10),
          status: r.status || 'approved',
          lab: r.test_lab || '',
        }));
      }
    }
  }

  // Load PWHT + consumables for selected project
  if (selectedPid && !(typeof AppState !== 'undefined' && AppState.isDemoMode)) {
    const [pwhtRes, consumRes] = await Promise.allSettled([
      WeldingAPI.pwhtList(selectedPid),
      WeldingAPI.consumableBatches({ projectId: selectedPid }),
    ]);
    if (pwhtRes.status === 'fulfilled') {
      const raw = pwhtRes.value || [];
      if (raw.length) WeldData.pwht[selectedPid] = raw;
    }
    if (consumRes.status === 'fulfilled') {
      const raw = consumRes.value || [];
      if (raw.length) {
        const existing = WeldData.consumables.filter(c => c.project !== selectedPid);
        WeldData.consumables = [
          ...existing,
          ...raw.map(r => ({
            id: r.id, lot: r.batch_no, batch_no: r.batch_no,
            material: r.material_spec, material_spec: r.material_spec,
            brand: r.brand || '', qty: `${r.qty_received}${r.qty_unit}`,
            qty_received: r.qty_received, qty_unit: r.qty_unit,
            received: r.received_date, received_date: r.received_date,
            heatNo: r.heat_no, heat_no: r.heat_no,
            certified: r.mtc_available, mtc_available: r.mtc_available,
            storage_location: r.storage_location || '',
            project: selectedPid, joint_count: r.joint_count || 0,
          })),
        ];
      }
    }
  }

  const expiredWPQ  = WeldData.wpq.reduce((s,w) => s + w.qualifications.filter(q=>q.status==='expired').length, 0);
  const expiringWPQ = WeldData.wpq.reduce((s,w) => s + w.qualifications.filter(q=>q.status==='expiring').length, 0);
  const draftWPS    = WeldData.wps.filter(w=>w.status==='draft').length;
  const activeM     = WeldData.machines.filter(m=>m.status==='active').length;
  const faultM      = WeldData.machines.filter(m=>m.status==='fault').length;

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Welding / WPS</div>
        <div class="page-subtitle">WPS library · PQR records · WPQ passports · Weld map · IIoT telemetry · NDE coordination</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="renderWelding()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Refresh
        </button>
        <button class="btn btn-primary btn-sm" onclick="openNewWPSModal()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M3 4h9M3 7.5h6M3 11h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          New WPS
        </button>
      </div>
    </div>

    <!-- Project selector -->
    <div class="proj-select-strip" id="wldProjStrip"></div>

    <!-- Sub-tabs (hidden when driven by the QC-embedded sidebar) -->
    ${window._weldSidebarMode ? '' : `
    <div class="wld-tabs">
      <button class="wld-tab ${WeldData.activeTab==='overview'?'active':''}"   data-wtab="overview"   onclick="switchWldTab('overview')">Overview</button>
      <button class="wld-tab ${WeldData.activeTab==='wps'?'active':''}"        data-wtab="wps"        onclick="switchWldTab('wps')">
        WPS library <span class="wld-tab-pill">${WeldData.wps.length}</span>
      </button>
      <button class="wld-tab ${WeldData.activeTab==='pqr'?'active':''}"        data-wtab="pqr"        onclick="switchWldTab('pqr')">PQR records</button>
      <button class="wld-tab ${WeldData.activeTab==='wpq'?'active':''}"        data-wtab="wpq"        onclick="switchWldTab('wpq')">
        WPQ passports
        ${expiredWPQ  ? `<span class="wld-tab-pill alert">${expiredWPQ} expired</span>`  : ''}
        ${expiringWPQ ? `<span class="wld-tab-pill warn">${expiringWPQ} expiring</span>` : ''}
      </button>
      <button class="wld-tab ${WeldData.activeTab==='joints'?'active':''}"     data-wtab="joints"     onclick="switchWldTab('joints')">Weld register</button>
      <button class="wld-tab ${WeldData.activeTab==='iot'?'active':''}"        data-wtab="iot"        onclick="switchWldTab('iot')">
        IIoT live
        ${faultM ? `<span class="wld-tab-pill alert">${faultM} fault</span>` : `<span class="wld-tab-pill" style="background:var(--green-bg);color:var(--green)">${activeM} active</span>`}
      </button>
      <button class="wld-tab ${WeldData.activeTab==='nde'?'active':''}"        data-wtab="nde"        onclick="switchWldTab('nde')">NDE / NDT</button>
      <button class="wld-tab ${WeldData.activeTab==='continuity'?'active':''}" data-wtab="continuity" onclick="switchWldTab('continuity')">Continuity</button>
      <button class="wld-tab ${WeldData.activeTab==='pwht'?'active':''}"       data-wtab="pwht"       onclick="switchWldTab('pwht')">PWHT</button>
      <button class="wld-tab ${WeldData.activeTab==='consumables'?'active':''}" data-wtab="consumables" onclick="switchWldTab('consumables')">Consumables</button>
    </div>`}

    <div id="wldTabContent"></div>

    <!-- Modal -->
    <div id="wldModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:200;backdrop-filter:blur(5px)" onclick="closeWldModal()">
      <div id="wldModalContent" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(640px,95vw);max-height:92vh;overflow-y:auto" onclick="event.stopPropagation()"></div>
    </div>
  `;

  renderWldProjStrip();
  switchWldTab(WeldData.activeTab);
}

function renderWldProjStrip() {
  const colours = { active:'var(--green)', planning:'var(--blue)', 'qc-hold':'var(--amber)' };
  document.getElementById('wldProjStrip').innerHTML = AppState.projects.map(p => {
    const joints = WeldData.joints[p.id] || [];
    const done   = joints.filter(j=>j.status==='complete').length;
    return `
    <div class="proj-chip ${p.id === WeldData.selectedProject ? 'selected' : ''}" onclick="selectWldProject('${p.id}')">
      <span class="proj-chip-dot" style="background:${colours[p.status]||'var(--text-muted)'}"></span>
      <span style="font-family:var(--font-mono);font-size:11px">${p.id}</span>
      <span style="color:var(--text-muted)">·</span>
      <span style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name.split('—')[0].trim()}</span>
      <span style="font-size:10px;color:var(--text-muted)">${done}/${joints.length} joints</span>
    </div>`;
  }).join('');
}

function selectWldProject(id) {
  WeldData.selectedProject = id;
  renderWldProjStrip();
  switchWldTab(WeldData.activeTab);
}

function switchWldTab(tab) {
  WeldData.activeTab = tab;
  document.querySelectorAll('.wld-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.wtab === tab));
  const map = {
    overview: renderWldOverview,
    wps:      renderWldWPS,
    pqr:      renderWldPQR,
    wpq:      renderWldWPQ,
    joints:   renderWldJoints,
    iot:      renderWldIoT,
    nde:         renderWldNDE,
    continuity:  renderWldContinuity,
    pwht:        renderWldPWHT,
    consumables: renderWldConsumables,
    analytics: () => mountAnaCockpit('welding', { container: document.getElementById('wldTabContent') }),
  };
  if (map[tab]) map[tab]();
}

function closeWldModal() { document.getElementById('wldModal').style.display = 'none'; }
function openWldModal(html) {
  document.getElementById('wldModalContent').innerHTML = html;
  document.getElementById('wldModal').style.display = 'block';
}

/* ── Helpers ── */
function wldDaysLeft(str) {
  if (!str) return null;
  return Math.ceil((new Date(str) - new Date()) / 86400000);
}
function wpqStatusColor(s) {
  return { valid:'var(--green)', expiring:'var(--amber)', expired:'var(--red)' }[s] || 'var(--text-muted)';
}
function jointStatusBadge(s) {
  const map = {
    'complete':    ['badge-green',  'Complete'],
    'in-progress': ['badge-accent', 'In progress'],
    'pending':     ['badge-muted',  'Pending'],
    'ncr':         ['badge-red',    'NCR raised'],
    'blocked':     ['badge-amber',  'Blocked'],
  };
  const [cls, lbl] = map[s] || ['badge-muted', s];
  return `<span class="badge ${cls}" style="font-size:10px">${lbl}</span>`;
}
function ndeResultEl(r) {
  const cls = r === 'Accept' ? 'nde-accept' : r === 'Reject' ? 'nde-reject' : 'nde-pending';
  return `<span class="nde-result ${cls}">${r}</span>`;
}
