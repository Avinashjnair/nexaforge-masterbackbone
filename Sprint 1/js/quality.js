/* ============================================================
   NexaForge ERP — Quality Control Module
   Covers: ITP · Hold/Witness/Review points · NCR workflow
           Incoming inspection · Weld map · MRB dossier
           Supplier quality scorecards
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   QC DATA STORE
───────────────────────────────────────────────────────────── */
Object.assign(QCData, {
  selectedProject: 'P-2401',
  activeTab: 'overview',
  cpView: 'project',   // 'standard' | 'project'

  /* ── Inspection & Test Plans ── */
  itp: {
    'P-2401': [
      { seq:'1.1', activity:'Incoming material inspection — shell plates',          ref:'IR-001',              parameters:'Thickness ±0.3mm, flatness Class N; no laminations',                    responsible:'QC Inspector', internal:'H', customer:'R', tpi:'H', status:'done',    inspector:'F. Nair',   date:'2025-03-10', result:'Pass',  remarks:'' },
      { seq:'1.2', activity:'Mill test certificate (MTC) verification',             ref:'MTC-316L-HN44810',    parameters:'Chemical comp & mech props per ASTM A240; heat traceability',             responsible:'QC Inspector', internal:'H', customer:'R', tpi:'H', status:'done',    inspector:'F. Nair',   date:'2025-03-10', result:'Pass',  remarks:'Verified. Meets UNS S31600' },
      { seq:'2.1', activity:'Dimensional check — plate cutting & marking',          ref:'IR-002',              parameters:'Plate dims per DWG-SH-001; ±1mm; markings legible',                      responsible:'QC Inspector', internal:'P', customer:null, tpi:'R', status:'done',    inspector:'A. Thomas', date:'2025-03-18', result:'Pass',  remarks:'' },
      { seq:'3.1', activity:'Shell rolling — roundness tolerance ±2mm',             ref:'IR-003',              parameters:'Out-of-roundness ≤1% dia (max 25mm) per API 650 §5.6.5',                responsible:'QC Inspector', internal:'W', customer:null, tpi:'W', status:'done',    inspector:'A. Thomas', date:'2025-04-02', result:'Pass',  remarks:'' },
      { seq:'4.1', activity:'Fit-up check — longitudinal seam pre-weld',            ref:'IR-004',              parameters:'Mismatch ≤3mm; gap 2–4mm; tack welds per WPS',                          responsible:'QC Inspector', internal:'W', customer:'W',  tpi:'H', status:'active',  inspector:'F. Nair',   date:null,         result:null,    remarks:'' },
      { seq:'4.2', activity:'Visual examination — longitudinal seam (post-weld)',   ref:null,                  parameters:'No cracks, porosity, undercut ≤0.4mm per API 650 §7.3.4',               responsible:'QC Inspector', internal:'P', customer:'R',  tpi:'W', status:'pending', inspector:null,        date:null,         result:null,    remarks:'' },
      { seq:'4.3', activity:'Radiographic testing (RT) — longitudinal seam',        ref:null,                  parameters:'Film density 2.0–4.0; IQI ≤2%; 100% seam coverage',                    responsible:'NDT Contractor',internal:'H', customer:'W',  tpi:'H', status:'pending', inspector:null,        date:null,         result:null,    remarks:'' },
      { seq:'5.1', activity:'Fit-up check — circumferential seam pre-weld',         ref:null,                  parameters:'Mismatch ≤3mm; peaking ≤3mm per API 650 §7.3',                         responsible:'QC Inspector', internal:'W', customer:'W',  tpi:'H', status:'pending', inspector:null,        date:null,         result:null,    remarks:'' },
      { seq:'5.2', activity:'RT — circumferential seam',                             ref:null,                  parameters:'Same acceptance criteria as longitudinal seam',                         responsible:'NDT Contractor',internal:'H', customer:'W',  tpi:'H', status:'pending', inspector:null,        date:null,         result:null,    remarks:'' },
      { seq:'6.1', activity:'Nozzle orientation & dimensional check',                ref:null,                  parameters:'Orientation ±5mm; projection ±3mm; flange face level ±1mm',            responsible:'QC Inspector', internal:'W', customer:'R',  tpi:'W', status:'active',  inspector:'A. Thomas', date:null,         result:null,    remarks:'' },
      { seq:'7.1', activity:'Final assembly visual + dimensional inspection',        ref:null,                  parameters:'All dims per GA drawing; plumb ≤30mm/10m height',                      responsible:'QC Inspector', internal:'H', customer:'H',  tpi:'H', status:'pending', inspector:null,        date:null,         result:null,    remarks:'' },
      { seq:'8.1', activity:'Hydrostatic pressure test — 1.5× MAWP (1.35 bar)',    ref:null,                  parameters:'24 hr water fill; no leaks; no settlement per API 650 §7.3.6',          responsible:'QC Manager',   internal:'H', customer:'H',  tpi:'H', status:'pending', inspector:null,        date:null,         result:null,    remarks:'' },
      { seq:'9.1', activity:'Final dimensional, marking & painting inspection',     ref:null,                  parameters:'DFT ±10%; holiday test pass; nameplate correct; MDR complete',           responsible:'QC Manager',   internal:'H', customer:'H',  tpi:'H', status:'pending', inspector:null,        date:null,         result:null,    remarks:'' },
      { seq:'9.2', activity:'Client witness — pre-dispatch review',                 ref:null,                  parameters:'Visual walkdown + MDR review + sign-off',                               responsible:'QC Manager',   internal:'H', customer:'H',  tpi:'H', status:'pending', inspector:null,        date:null,         result:null,    remarks:'' },
    ],
    'P-2402': [
      { seq:'1.1', activity:'Incoming plate inspection — SA-240 CS',                ref:null,                  parameters:'MTC, visual, dimensional per ASME II / SA-240',                        responsible:'QC Inspector', internal:'H', customer:'R', tpi:'H', status:'pending', inspector:null, date:null, result:null, remarks:'' },
      { seq:'2.1', activity:'WPS/PQR documentation review',                         ref:null,                  parameters:'All WPS qualified; PQR test results meet ASME IX; welder certs current', responsible:'QC Manager',  internal:'H', customer:'R', tpi:'H', status:'pending', inspector:null, date:null, result:null, remarks:'' },
      { seq:'3.1', activity:'Shell course longitudinal seam fit-up',                ref:null,                  parameters:'Mismatch ≤¼T (max 3mm); gap 2–4mm; per ASME VIII UW-35',               responsible:'QC Inspector', internal:'W', customer:'W', tpi:'H', status:'pending', inspector:null, date:null, result:null, remarks:'' },
      { seq:'4.1', activity:'Visual examination — all Cat A/B welds (post-weld)',   ref:null,                  parameters:'No cracks; undercut ≤0.8mm; weld profile per ASME VIII UW-35',          responsible:'QC Inspector', internal:'P', customer:'R', tpi:'W', status:'pending', inspector:null, date:null, result:null, remarks:'' },
      { seq:'5.1', activity:'PWHT time-temperature chart review',                   ref:null,                  parameters:'Peak temp ±14°C; hold time per ASME VIII UW-40 Table',                  responsible:'QC Inspector', internal:'H', customer:'R', tpi:'H', status:'pending', inspector:null, date:null, result:null, remarks:'' },
      { seq:'6.1', activity:'Radiographic examination (RT) — all seams',           ref:null,                  parameters:'Film density 2.0–4.0 H&D; IQI ≤2%; per ASME VIII UW-51',               responsible:'NDT Contractor',internal:'H', customer:'W', tpi:'H', status:'pending', inspector:null, date:null, result:null, remarks:'' },
      { seq:'7.1', activity:'Hydrostatic pressure test',                             ref:null,                  parameters:'1.3 × MAWP × stress ratio; 30 min hold per ASME VIII UG-99',           responsible:'QC Manager',   internal:'H', customer:'H',  tpi:'H', status:'pending', inspector:null, date:null, result:null, remarks:'' },
      { seq:'8.1', activity:'ASME nameplate (U-stamp) verification',                ref:null,                  parameters:'All required fields stamped; NB# assigned; AI signature',               responsible:'AI (Auth. Inspector)', internal:'H', customer:'H',  tpi:'H', status:'pending', inspector:null, date:null, result:null, remarks:'' },
    ],
    'P-2403': [
      { seq:'1.1', activity:'Shell material incoming inspection',                   ref:'IR-020',              parameters:'MTC; OD ±1mm, WT ±10%; no laminations',                               responsible:'QC Inspector', internal:'H', customer:'R', tpi:'H', status:'done',    inspector:'F. Nair',   date:'2025-02-10', result:'Pass', remarks:'' },
      { seq:'1.2', activity:'Tube material incoming inspection',                    ref:'IR-020B',             parameters:'MTC; OD ±0.1mm, WT ±10%; eddy current cert verified',                  responsible:'QC Inspector', internal:'H', customer:'R', tpi:'H', status:'done',    inspector:'F. Nair',   date:'2025-02-10', result:'Pass', remarks:'' },
      { seq:'1.3', activity:'Tube sheet incoming — MTC verification',               ref:'NCR-031',             parameters:'Chemical comp (Mo ≥2.10%); dimensions per drawing — BLOCKED',           responsible:'QC Inspector', internal:'H', customer:'R', tpi:'H', status:'blocked', inspector:'F. Nair',   date:'2025-04-01', result:'Fail', remarks:'NCR-031 raised. Mo content 2.08% fails spec. Return to vendor.' },
      { seq:'2.1', activity:'Tube bundle assembly — baffle & spacing check',        ref:'IR-021',              parameters:'Baffle spacing ±3mm; tube protrusion 3–6mm; no bow',                   responsible:'QC Inspector', internal:'W', customer:'R', tpi:'W', status:'done',    inspector:'A. Thomas', date:'2025-03-01', result:'Pass', remarks:'' },
      { seq:'3.1', activity:'Tube-to-tubesheet rolling expansion',                  ref:null,                  parameters:'Expansion depth 100% groove; pull-out test ≥ spec — PENDING TUBE SHEET', responsible:'QC Inspector',internal:'H', customer:'W', tpi:'H', status:'pending', inspector:null,        date:null,         result:null,   remarks:'' },
      { seq:'4.1', activity:'Hydrostatic test — shell side & tube side',            ref:null,                  parameters:'1.3 × MAWP each side; 30 min hold; no leaks per ASME VIII UG-99',    responsible:'QC Manager',   internal:'H', customer:'H',  tpi:'H', status:'pending', inspector:null,        date:null,         result:null,   remarks:'' },
      { seq:'5.1', activity:'Final dimensional inspection & pre-dispatch review',   ref:null,                  parameters:'Shell OD ±1mm; nozzle orientation ±5mm; MDR complete',                 responsible:'QC Manager',   internal:'H', customer:'H',  tpi:'H', status:'pending', inspector:null,        date:null,         result:null,   remarks:'' },
    ]
  },

  /* ── Control Plans ── */
  controlPlan: {},     // keyed by project id (project-specific CP items)
  cpTemplates:  [],    // standard template library

  /* ── NCR / Complaint log sub-view ── */
  ncrView: 'ncr',   // 'ncr' | 'complaints'

  /* ── Customer Complaint Log ── */
  complaints: [
    {
      id: 'CC-005', date: '2025-04-18', customer: 'Saudi Aramco', project: 'P-2401',
      category: 'Documentation', severity: 'major', status: 'open',
      subject: 'MRB dossier incomplete — hydrostatic test records missing',
      description: 'Customer engineer flagged during pre-dispatch review that hydrostatic test report (HT-2401) and final inspection certificate are not included in the MRB package as required by purchase order clause 14.3.',
      receivedBy: 'QC Manager', receivedVia: 'Email',
      actionTaken: 'MRB coordinator notified. Documents being compiled.',
      targetDate: '2025-05-02', closedDate: null,
      comments: [
        { by: 'QC Manager', time: '18 Apr 10:30', text: 'Complaint received via email from client QC rep. MRB team notified immediately.' },
        { by: 'MRB Coordinator', time: '18 Apr 14:00', text: 'HT-2401 pending completion of test. Estimated 2 weeks.' },
      ]
    },
    {
      id: 'CC-004', date: '2025-03-22', customer: 'Saudi Aramco', project: 'P-2401',
      category: 'Quality', severity: 'critical', status: 'closed',
      subject: 'Weld undercut — longitudinal seam — exceeds API 650 tolerance',
      description: 'Customer inspector identified undercut >0.4mm on WJ-04 during witness inspection. Condition linked to NCR-030. Customer requested immediate repair hold.',
      receivedBy: 'A. Thomas', receivedVia: 'Site meeting',
      actionTaken: 'Hold point applied. NCR-030 raised. Weld repair completed and re-inspected.',
      targetDate: '2025-04-10', closedDate: '2025-04-12',
      comments: [
        { by: 'A. Thomas', time: '22 Mar 15:00', text: 'Customer raised concern during witness inspection of WJ-04. NCR-030 linked.' },
        { by: 'QC Manager', time: '12 Apr 09:00', text: 'Repair completed, customer re-inspected and accepted. Complaint closed.' },
      ]
    },
    {
      id: 'CC-003', date: '2025-02-14', customer: 'Petronas', project: 'P-2403',
      category: 'Delivery', severity: 'minor', status: 'closed',
      subject: 'Delivery date slippage — tube sheet delay',
      description: 'Customer raised concern about delay to delivery schedule due to tube sheet material shortage. Original promise date was 2025-03-15.',
      receivedBy: 'Project Manager', receivedVia: 'Phone call',
      actionTaken: 'Expediting report sent. New delivery date agreed: 2025-04-30.',
      targetDate: '2025-03-20', closedDate: '2025-03-21',
      comments: [
        { by: 'PM', time: '14 Feb 11:00', text: 'Customer called regarding schedule slip. Expediting action initiated.' },
      ]
    },
  ],

  /* ── Non-Conformance Reports ── */
  ncrs: [
    {
      id: 'NCR-031', project: 'P-2403', severity: 'critical', status: 'open',
      title: 'MTC failure — tube sheet batch HN-44821',
      desc: 'Chemical composition analysis from external lab (SGS) shows Mo content 2.08% against spec minimum 2.10%. Batch HN-44821 fails API 650 Annex A requirements.',
      raised: '2025-04-01', raisedBy: 'F. Nair',
      area: 'Incoming inspection', drawing: 'DWG-HX-001-A', weldJoint: null,
      disposition: 'Return to vendor',
      workflow: ['raised','review','disposition','closed'],
      currentStep: 1,
      attachments: ['SGS-Lab-Report-HN44821.pdf','NCR-031-Photos.zip'],
      comments: [
        { by: 'F. Nair', time: '01 Apr 09:14', text: 'NCR raised. SGS report uploaded. Awaiting QC Manager disposition.' },
        { by: 'QC Manager', time: '01 Apr 14:30', text: 'Reviewed. Disposition: Return to Vendor. Procurement notified.' },
      ]
    },
    {
      id: 'NCR-030', project: 'P-2401', severity: 'major', status: 'review',
      title: 'Weld undercut — longitudinal seam WJ-04',
      desc: 'Visual inspection reveals undercut >0.4mm depth on weld joint WJ-04 (Shell course 3). Exceeds API 650 allowable limit of 0.4mm. Requires grinding and weld repair.',
      raised: '2025-03-28', raisedBy: 'A. Thomas',
      area: 'Weld inspection', drawing: 'DWG-SH-001-A', weldJoint: 'WJ-04',
      disposition: 'Rework — grind & repair weld',
      workflow: ['raised','review','disposition','closed'],
      currentStep: 1,
      attachments: ['NCR-030-VisualReport.pdf'],
      comments: [
        { by: 'A. Thomas', time: '28 Mar 11:05', text: 'Undercut found during visual. Marked with blue chalk. Photo attached.' },
      ]
    },
    {
      id: 'NCR-029', project: 'P-2401', severity: 'minor', status: 'closed',
      title: 'Plate edge prep — excessive bevel angle on plate PLT-07',
      desc: 'Bevel angle measured at 37° against specified 35°±1°. Minor deviation. Accepted with engineering concession.',
      raised: '2025-03-15', raisedBy: 'F. Nair',
      area: 'Fit-up inspection', drawing: 'DWG-SH-001-A', weldJoint: null,
      disposition: 'Accept as-is — engineering concession EC-2025-004',
      workflow: ['raised','review','disposition','closed'],
      currentStep: 3,
      attachments: ['EC-2025-004.pdf'],
      comments: [
        { by: 'F. Nair', time: '15 Mar 14:00', text: 'Minor deviation. Engineering concession requested.' },
        { by: 'Eng. Manager', time: '16 Mar 09:30', text: 'Concession EC-2025-004 approved. Accept as-is.' },
        { by: 'QC Manager', time: '16 Mar 10:15', text: 'NCR closed. Concession filed in MRB.' },
      ]
    },
    {
      id: 'NCR-028', project: 'P-2402', severity: 'major', status: 'open',
      title: 'Material shortage — SA-240 304 plates not received',
      desc: 'SA-240 Grade 304 plates (12mm, heat no. pending) not received by required date 2025-07-01. Project at risk of schedule delay.',
      raised: '2025-04-20', raisedBy: 'Store Manager',
      area: 'Incoming', drawing: null, weldJoint: null,
      disposition: null,
      workflow: ['raised','review','disposition','closed'],
      currentStep: 0,
      attachments: [],
      comments: [
        { by: 'Store Mgr', time: '20 Apr 08:00', text: 'Material not delivered by PO due date. Procurement escalated.' },
      ]
    },
  ],

  /* ── Incoming Inspections ── */
  inspections: [
    {
      id: 'INSP-089', project: 'P-2402', status: 'pending',
      item: 'Dish ends — 2:1 ellipsoidal SA-240 304',
      lot: 'GRN-089 / Lot DH-2204', supplier: 'Endress+Hauser',
      received: '2025-04-28', qty: '6 EA',
      checks: [
        { label: 'Dimensional check',          done: false },
        { label: 'MTC verification (chem)',     done: false },
        { label: 'MTC verification (mech)',     done: false },
        { label: 'Visual surface inspection',   done: false },
        { label: 'Hardness test (HRC)',         done: false },
      ]
    },
    {
      id: 'INSP-088', project: 'P-2401', status: 'pass',
      item: 'Shell plates 316L 12mm — bottom course',
      lot: 'GRN-086 / Heat HN-44810', supplier: 'Outokumpu',
      received: '2025-03-10', qty: '4 SHT',
      checks: [
        { label: 'Dimensional check',          done: true },
        { label: 'MTC verification (chem)',     done: true },
        { label: 'MTC verification (mech)',     done: true },
        { label: 'Visual surface inspection',   done: true },
        { label: 'External lab (PMI)',          done: true },
      ]
    },
    {
      id: 'INSP-087', project: 'P-2403', status: 'fail',
      item: 'Tube sheet — 316L TS-01',
      lot: 'GRN-085 / Heat HN-44821', supplier: 'Rolled Alloys',
      received: '2025-04-01', qty: '2 EA',
      checks: [
        { label: 'Dimensional check',          done: true },
        { label: 'MTC verification (chem)',     done: true },
        { label: 'External lab analysis (Mo)', done: true },
        { label: 'MTC verification (mech)',     done: false },
        { label: 'Final clearance',            done: false },
      ]
    },
  ],

  /* ── Weld joints for weld map ── */
  weldJoints: {
    'P-2401': [
      { id:'WJ-01', type:'Long seam',  course:'1', status:'done',   welder:'K. Suresh', wps:'WPS-316L-04', ndt:'RT-Pass', x:120, y:80 },
      { id:'WJ-02', type:'Long seam',  course:'2', status:'done',   welder:'K. Suresh', wps:'WPS-316L-04', ndt:'RT-Pass', x:190, y:80 },
      { id:'WJ-03', type:'Long seam',  course:'3', status:'active', welder:'K. Suresh', wps:'WPS-316L-04', ndt:'Pending', x:260, y:80 },
      { id:'WJ-04', type:'Long seam',  course:'4', status:'ncr',    welder:'K. Suresh', wps:'WPS-316L-04', ndt:'NCR-030', x:330, y:80 },
      { id:'WJ-05', type:'Circ seam',  course:'B1', status:'pending', welder:null, wps:'WPS-316L-04', ndt:'Pending', x:155, y:140 },
      { id:'WJ-06', type:'Circ seam',  course:'B2', status:'pending', welder:null, wps:'WPS-316L-04', ndt:'Pending', x:225, y:140 },
      { id:'WJ-07', type:'Circ seam',  course:'B3', status:'pending', welder:null, wps:'WPS-316L-04', ndt:'Pending', x:295, y:140 },
      { id:'WJ-08', type:'Nozzle',     course:'N1', status:'active', welder:'T. Kumar', wps:'WPS-316L-06', ndt:'Pending', x:160, y:200 },
      { id:'WJ-09', type:'Nozzle',     course:'N2', status:'active', welder:'T. Kumar', wps:'WPS-316L-06', ndt:'Pending', x:240, y:200 },
      { id:'WJ-10', type:'Nozzle',     course:'N3', status:'pending', welder:null, wps:'WPS-316L-06', ndt:'Pending', x:320, y:200 },
      { id:'WJ-11', type:'Bottom dish',course:'BD', status:'done',   welder:'K. Suresh', wps:'WPS-316L-04', ndt:'UT-Pass', x:210, y:240 },
    ]
  },

  /* ── MRB / Dossier document list ── */
  mrb: {
    'P-2401': {
      sections: [
        {
          title: 'Project quality plan', icon: 'QP', iconBg: 'var(--blue-bg)', iconColor: 'var(--blue)',
          docs: [
            { name: 'Quality Control Plan (QCP) rev.2', ref: 'QCP-2401-R2', date: '2025-02-15', status: 'approved', pages: 24 },
            { name: 'Inspection & Test Plan (ITP) rev.1', ref: 'ITP-2401-R1', date: '2025-02-18', status: 'approved', pages: 18 },
          ]
        },
        {
          title: 'Material traceability', icon: 'MT', iconBg: 'var(--green-bg)', iconColor: 'var(--green)',
          docs: [
            { name: 'MTC — Shell plate 316L 10mm (HN-44808)', ref: 'MTC-HN44808', date: '2025-03-05', status: 'approved', pages: 4 },
            { name: 'MTC — Shell plate 316L 12mm (HN-44810)', ref: 'MTC-HN44810', date: '2025-03-10', status: 'approved', pages: 4 },
            { name: 'MTC — Filler wire ER316L (Lot FW-2231)', ref: 'MTC-FW2231',  date: '2025-03-01', status: 'approved', pages: 2 },
            { name: 'MTC — Bottom dish end (HN-44815)',        ref: 'MTC-HN44815', date: '2025-03-12', status: 'approved', pages: 3 },
            { name: 'MTC — Nozzle flanges DN150 (HN-44822)',   ref: 'MTC-HN44822', date: '2025-04-10', status: 'pending',  pages: 3 },
          ]
        },
        {
          title: 'Welding documentation', icon: 'WD', iconBg: 'var(--brand-light)', iconColor: 'var(--brand)',
          docs: [
            { name: 'WPS — 316L GTAW (WPS-316L-04)',   ref: 'WPS-316L-04', date: '2025-01-20', status: 'approved', pages: 6 },
            { name: 'PQR — WPS-316L-04',               ref: 'PQR-316L-04', date: '2025-01-25', status: 'approved', pages: 8 },
            { name: 'WPS — 316L SMAW nozzle (WPS-316L-06)', ref: 'WPS-316L-06', date: '2025-02-01', status: 'approved', pages: 6 },
            { name: 'Welder continuity logs — K. Suresh', ref: 'WCL-KS-2025', date: '2025-04-01', status: 'approved', pages: 3 },
            { name: 'Welder continuity logs — T. Kumar',  ref: 'WCL-TK-2025', date: '2025-04-01', status: 'approved', pages: 3 },
          ]
        },
        {
          title: 'Inspection reports', icon: 'IR', iconBg: 'var(--green-bg)', iconColor: 'var(--green)',
          docs: [
            { name: 'IR-001 — Incoming plate inspection', ref: 'IR-001', date: '2025-03-10', status: 'approved', pages: 5 },
            { name: 'IR-002 — Plate cutting dimensional', ref: 'IR-002', date: '2025-03-18', status: 'approved', pages: 3 },
            { name: 'IR-003 — Shell rolling roundness',   ref: 'IR-003', date: '2025-04-02', status: 'approved', pages: 4 },
            { name: 'IR-004 — Seam fit-up (in progress)', ref: 'IR-004', date: null, status: 'draft', pages: null },
          ]
        },
        {
          title: 'NDT reports', icon: 'NDT', iconBg: 'var(--blue-bg)', iconColor: 'var(--blue)',
          docs: [
            { name: 'RT Report — Longitudinal seams WJ-01, WJ-02', ref: 'RT-001', date: '2025-04-05', status: 'approved', pages: 12 },
            { name: 'RT Report — WJ-03 (pending)',  ref: 'RT-002', date: null, status: 'pending', pages: null },
            { name: 'RT Report — WJ-04 NCR-030',   ref: 'RT-003', date: '2025-04-10', status: 'ncr',     pages: 8 },
          ]
        },
        {
          title: 'NCRs & concessions', icon: 'NCR', iconBg: 'var(--red-bg)', iconColor: 'var(--red)',
          docs: [
            { name: 'NCR-030 — Weld undercut WJ-04',        ref: 'NCR-030', date: '2025-03-28', status: 'open',    pages: 4 },
            { name: 'NCR-029 — Plate bevel angle (closed)',  ref: 'NCR-029', date: '2025-03-15', status: 'closed',  pages: 3 },
            { name: 'EC-2025-004 — Engineering concession',  ref: 'EC-004',  date: '2025-03-16', status: 'approved',pages: 2 },
          ]
        },
        {
          title: 'Hydrostatic & final test', icon: 'HT', iconBg: 'var(--bg-elevated)', iconColor: 'var(--text-secondary)',
          docs: [
            { name: 'Hydrostatic test record (pending)', ref: 'HT-2401', date: null, status: 'pending', pages: null },
            { name: 'Final inspection report (pending)', ref: 'FIR-2401', date: null, status: 'pending', pages: null },
          ]
        },
      ]
    }
  },

  /* ── Supplier quality scores ── */
  suppliers: [
    { name: 'Outokumpu', category: '316L / 304 Plate & coil', score: 94, onTime: 91, ncrRate: 1.2, orders: 14, trend: 'up' },
    { name: 'Rolled Alloys', category: 'Specialty alloy plate', score: 72, onTime: 78, ncrRate: 4.8, orders: 6, trend: 'down' },
    { name: 'Sandvik', category: 'Tube & pipe stainless', score: 88, onTime: 93, ncrRate: 1.8, orders: 9, trend: 'stable' },
    { name: 'Boltun / ITW', category: 'Flanges & fittings', score: 95, onTime: 97, ncrRate: 0.5, orders: 22, trend: 'up' },
    { name: 'Lincoln Electric', category: 'Welding consumables', score: 98, onTime: 99, ncrRate: 0.2, orders: 31, trend: 'up' },
    { name: 'SGS Inspection', category: 'External lab / NDT', score: 91, onTime: 88, ncrRate: 0.8, orders: 8, trend: 'stable' },
  ]
});

/* ─────────────────────────────────────────────────────────────
   MAIN RENDERER
───────────────────────────────────────────────────────────── */
async function renderQuality() {
  const el = document.getElementById('pageContent');

  // Load live data for current project
  const pid = QCData.selectedProject;
  const [itpRes, ncrRes, inspRes, cpRes, tplRes] = await Promise.allSettled([
    QCAPI.itp(pid),
    QCAPI.ncrList({ limit: 100 }),
    QCAPI.inspections({ limit: 100 }),
    QCAPI.projectCP(pid),
    QCAPI.cpTemplates(),
  ]);

  if (itpRes.status  === 'fulfilled') QCData.itp[pid]      = itpRes.value.steps  || itpRes.value.itp  || itpRes.value || [];
  if (ncrRes.status  === 'fulfilled') QCData.ncrs           = ncrRes.value.ncrs   || ncrRes.value       || [];
  if (inspRes.status === 'fulfilled') QCData.inspections    = inspRes.value.inspections || inspRes.value || [];
  if (cpRes.status   === 'fulfilled') QCData.controlPlan[pid] = cpRes.value.items || [];
  if (tplRes.status  === 'fulfilled') QCData.cpTemplates    = tplRes.value        || [];

  const openNCRs = QCData.ncrs.filter(n => n.status !== 'closed').length;
  const pendingInsp = QCData.inspections.filter(i => i.status === 'pending').length;

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Quality Control</div>
        <div class="page-subtitle">ITP · Control Plan · NCR workflow · Incoming inspection · Weld map · MRB dossier · Supplier quality</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="renderQuality()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Refresh
        </button>
        <button class="btn btn-primary btn-sm" onclick="openNewNCRModal()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Raise NCR
        </button>
      </div>
    </div>

    <!-- Project selector -->
    <div class="proj-select-strip" id="qcProjStrip"></div>

    <!-- Sub-tabs -->
    <div class="qc-tabs">
      <button class="qc-tab ${QCData.activeTab==='overview'?'active':''}"    data-qtab="overview"    onclick="switchQCTab('overview')">Overview</button>
      <button class="qc-tab ${QCData.activeTab==='itp'?'active':''}"          data-qtab="itp"          onclick="switchQCTab('itp')">
        ITP <span class="qc-tab-count">${(QCData.itp[QCData.selectedProject]||[]).length}</span>
      </button>
      <button class="qc-tab ${QCData.activeTab==='control_plan'?'active':''}" data-qtab="control_plan" onclick="switchQCTab('control_plan')">
        Control Plan
      </button>
      <button class="qc-tab ${QCData.activeTab==='ncr'?'active':''}"         data-qtab="ncr"         onclick="switchQCTab('ncr')">
        NCRs <span class="qc-tab-count err">${openNCRs} open</span>
      </button>
      <button class="qc-tab ${QCData.activeTab==='inspection'?'active':''}"  data-qtab="inspection"  onclick="switchQCTab('inspection')">
        Incoming <span class="qc-tab-count warn">${pendingInsp} pending</span>
      </button>
      <button class="qc-tab ${QCData.activeTab==='weldmap'?'active':''}"     data-qtab="weldmap"     onclick="switchQCTab('weldmap')">Weld map</button>
      <button class="qc-tab ${QCData.activeTab==='mrb'?'active':''}"         data-qtab="mrb"         onclick="switchQCTab('mrb')">MRB dossier</button>
      <button class="qc-tab ${QCData.activeTab==='suppliers'?'active':''}"   data-qtab="suppliers"   onclick="switchQCTab('suppliers')">Supplier quality</button>
    </div>

    <div id="qcTabContent"></div>

    <!-- Modal -->
    <div id="qcModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:200" onclick="closeQCModal()">
      <div id="qcModalContent" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(560px,94vw)" onclick="event.stopPropagation()"></div>
    </div>
  `;

  renderQCProjStrip();
  switchQCTab(QCData.activeTab);
}

/* Project strip */
function renderQCProjStrip() {
  const colours = { active:'var(--green)', planning:'var(--blue)', 'qc-hold':'var(--amber)' };
  document.getElementById('qcProjStrip').innerHTML = AppState.projects.map(p => `
    <div class="proj-chip ${p.id === QCData.selectedProject ? 'active' : ''}" onclick="selectQCProject('${p.id}')">
      <span class="proj-chip-dot" style="background:${colours[p.status]||'var(--text-muted)'}"></span>
      <span style="font-family:var(--font-mono);font-size:11px">${p.id}</span>
      <span style="color:var(--text-muted)">·</span>
      <span style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name.split('—')[0].trim()}</span>
      ${p.status === 'qc-hold' ? '<span class="badge badge-amber" style="font-size:9px;padding:1px 5px">Hold</span>' : ''}
    </div>`).join('');
}

function selectQCProject(id) {
  QCData.selectedProject = id;
  renderQCProjStrip();
  switchQCTab(QCData.activeTab);
}

function switchQCTab(tab) {
  QCData.activeTab = tab;
  document.querySelectorAll('.qc-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.qtab === tab);
  });
  const map = {
    overview:     renderQCOverview,
    itp:          renderQCITP,
    control_plan: renderQCControlPlan,
    ncr:        renderQCNCR,
    inspection: renderQCInspection,
    weldmap:    renderQCWeldMap,
    mrb:        renderQCMRB,
    suppliers:  renderQCSuppliers,
  };
  if (map[tab]) map[tab]();
}

function closeQCModal() { document.getElementById('qcModal').style.display = 'none'; }
function openQCModal(html) {
  document.getElementById('qcModalContent').innerHTML = html;
  document.getElementById('qcModal').style.display = 'block';
}
function generateMRB() { switchQCTab('mrb'); showToast('MRB dossier compiled — ready for export','success'); }

// Bind to global router for sidebar navigation link
window.renderQC_itp = renderQuality;
