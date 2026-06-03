/* ============================================================
   NexaForge ERP — Quality Control (QC) Module
   Covers: ITP · Inspections · Audits · Calibration · NCR (8D/RCA)
           Incoming QC · Skills Matrix · Training · Analytics
   ============================================================ */

'use strict';

/* ── QC Data ────────────────────────────────────────────────── */
const QCData = {
  /* Projects QC Status */
  projects: [
    { id: 'P-2401', name: '316L Storage Tank', client: 'ADNOC', yield: 98.2, openNCRs: 0, pendingRFIs: 2, itpProgress: 85, pqmRef: 'PQM-2401-R2' },
    { id: 'P-2402', name: 'Pressure Vessel ASME VIII', client: 'Petrofac', yield: 94.5, openNCRs: 1, pendingRFIs: 4, itpProgress: 40, pqmRef: 'PQM-2402-R0' },
    { id: 'P-2403', name: '304 Stainless Heat Exchanger', client: 'ENOC', yield: 89.0, openNCRs: 2, pendingRFIs: 1, itpProgress: 95, pqmRef: 'PQM-2403-R1' },
  ],

  /* Inspection & Test Plans (ITP) — columns: step, activity, ref, parameters, responsible, internal, customer, tpi, status, date, result, remarks */
  itp: {
    'P-2401': [
      { step:'1.1', activity:'Incoming material inspection — shell plates',         ref:'IR-001',           parameters:'Thickness ±0.3mm, flatness Class N; no laminations or scale',              responsible:'QC Inspector',        internal:'H', customer:'R',  tpi:'H', status:'done',    date:'2025-03-10', result:'Pass', remarks:'' },
      { step:'1.2', activity:'Mill test certificate (MTC) verification',            ref:'MTC-316L-HN44810', parameters:'Chemical comp & mech props per ASTM A240; heat traceability confirmed',     responsible:'QC Inspector',        internal:'H', customer:'R',  tpi:'H', status:'done',    date:'2025-03-10', result:'Pass', remarks:'Verified — meets UNS S31600' },
      { step:'2.1', activity:'Dimensional check — plate cutting & marking',         ref:'IR-002',           parameters:'Plate dims per DWG-SH-001; ±1mm; markings legible and correct',             responsible:'QC Inspector',        internal:'P', customer:null, tpi:'R', status:'done',    date:'2025-03-18', result:'Pass', remarks:'' },
      { step:'3.1', activity:'Shell rolling — roundness tolerance check',           ref:'IR-003',           parameters:'Out-of-roundness ≤1% dia (max 25mm) per API 650 §5.6.5',                  responsible:'QC Inspector',        internal:'W', customer:null, tpi:'W', status:'done',    date:'2025-04-02', result:'Pass', remarks:'' },
      { step:'4.1', activity:'Fit-up check — longitudinal seam pre-weld',           ref:'IR-004',           parameters:'Mismatch ≤3mm; gap 2–4mm; tack welds per WPS',                           responsible:'QC Inspector',        internal:'W', customer:'W',  tpi:'H', status:'active',  date:null,         result:null,   remarks:'' },
      { step:'4.2', activity:'Visual examination — longitudinal seam (post-weld)',  ref:null,               parameters:'No cracks, porosity; undercut ≤0.4mm per API 650 §7.3.4',                 responsible:'QC Inspector',        internal:'P', customer:'R',  tpi:'W', status:'pending', date:null,         result:null,   remarks:'' },
      { step:'4.3', activity:'Radiographic testing (RT) — longitudinal seam',       ref:null,               parameters:'Film density 2.0–4.0; IQI sensitivity ≤2%; 100% seam coverage',           responsible:'NDT Contractor',      internal:'H', customer:'W',  tpi:'H', status:'pending', date:null,         result:null,   remarks:'' },
      { step:'5.1', activity:'Fit-up check — circumferential seam pre-weld',        ref:null,               parameters:'Mismatch ≤3mm; peaking ≤3mm per API 650 §7.3',                           responsible:'QC Inspector',        internal:'W', customer:'W',  tpi:'H', status:'pending', date:null,         result:null,   remarks:'' },
      { step:'5.2', activity:'RT — circumferential seam',                           ref:null,               parameters:'Same acceptance criteria as longitudinal seam — API 650 Annex A',          responsible:'NDT Contractor',      internal:'H', customer:'W',  tpi:'H', status:'pending', date:null,         result:null,   remarks:'' },
      { step:'6.1', activity:'Nozzle orientation & dimensional check',              ref:null,               parameters:'Orientation ±5mm; projection ±3mm; flange face level ±1mm',              responsible:'QC Inspector',        internal:'W', customer:'R',  tpi:'W', status:'active',  date:null,         result:null,   remarks:'' },
      { step:'7.1', activity:'Vacuum box test — bottom plate seams',                ref:null,               parameters:'No leaks at 35 mbar; wetting agent applied; 100% coverage',               responsible:'QC Inspector',        internal:'P', customer:'W',  tpi:'W', status:'pending', date:null,         result:null,   remarks:'' },
      { step:'8.1', activity:'Hydrostatic leak test — 24 hr water fill',            ref:null,               parameters:'Fill to design level; 24 hr hold; no leaks or settlement per API 650 §7.3.6', responsible:'QC Manager',       internal:'H', customer:'H',  tpi:'H', status:'pending', date:null,         result:null,   remarks:'' },
      { step:'9.1', activity:'Final dimensional survey — plumb, radius & height',   ref:null,               parameters:'Plumb ≤30mm/10m; radius ±13mm; height ±3%',                              responsible:'QC Inspector',        internal:'H', customer:'H',  tpi:'H', status:'pending', date:null,         result:null,   remarks:'' },
      { step:'9.2', activity:'Surface preparation & coating inspection',            ref:null,               parameters:'DFT ±10%; holiday test pass; no runs or sags',                           responsible:'QC Inspector',        internal:'P', customer:'R',  tpi:'W', status:'pending', date:null,         result:null,   remarks:'' },
      { step:'9.3', activity:'Nameplate & documentation (MDR) review',              ref:null,               parameters:'Nameplate data correct; MDR complete: certs, test records, drawings',     responsible:'QC Manager',          internal:'H', customer:'H',  tpi:'H', status:'pending', date:null,         result:null,   remarks:'' },
      { step:'9.4', activity:'Pre-dispatch client witness inspection',              ref:null,               parameters:'Visual walkdown + MDR sign-off + punch list clearance',                   responsible:'QC Manager',          internal:'H', customer:'H',  tpi:'H', status:'pending', date:null,         result:null,   remarks:'' },
    ],
    'P-2402': [
      { step:'1.1', activity:'Shell plate incoming inspection — visual + dimensional',   ref:null, parameters:'MTC, visual, dimensional per ASME II / SA-240',                             responsible:'QC Inspector',  internal:'H', customer:'R', tpi:'H', status:'pending', date:null, result:null, remarks:'' },
      { step:'2.1', activity:'WPS/PQR documentation review',                            ref:null, parameters:'All WPS qualified; PQR test results meet ASME IX; welder certs current',    responsible:'QC Manager',    internal:'H', customer:'R', tpi:'H', status:'pending', date:null, result:null, remarks:'' },
      { step:'3.1', activity:'Shell course longitudinal seam fit-up',                   ref:null, parameters:'Mismatch ≤¼T (max 3mm); gap 2–4mm per ASME VIII UW-35',                    responsible:'QC Inspector',  internal:'W', customer:'W', tpi:'H', status:'pending', date:null, result:null, remarks:'' },
      { step:'4.1', activity:'Visual examination — all Cat A/B welds (post-weld)',      ref:null, parameters:'No cracks; undercut ≤0.8mm; weld profile per ASME VIII UW-35',             responsible:'QC Inspector',  internal:'P', customer:'R', tpi:'W', status:'pending', date:null, result:null, remarks:'' },
      { step:'5.1', activity:'PWHT time-temperature chart review',                      ref:null, parameters:'Peak temp ±14°C; hold time per ASME VIII UW-40 Table',                     responsible:'QC Inspector',  internal:'H', customer:'R', tpi:'H', status:'pending', date:null, result:null, remarks:'' },
      { step:'6.1', activity:'Radiographic examination (RT) — all seams',              ref:null, parameters:'Film density 2.0–4.0; IQI ≤2%; per ASME VIII UW-51',                       responsible:'NDT Contractor', internal:'H', customer:'W', tpi:'H', status:'pending', date:null, result:null, remarks:'' },
      { step:'7.1', activity:'Hydrostatic pressure test',                               ref:null, parameters:'1.3 × MAWP × stress ratio; 30 min hold per ASME VIII UG-99',              responsible:'QC Manager',    internal:'H', customer:'H', tpi:'H', status:'pending', date:null, result:null, remarks:'' },
      { step:'8.1', activity:'ASME nameplate (U-stamp) verification',                  ref:null, parameters:'All required fields stamped; NB# assigned; AI signature',                   responsible:'AI (Auth. Inspector)', internal:'H', customer:'H', tpi:'H', status:'pending', date:null, result:null, remarks:'' },
    ],
    'P-2403': [
      { step:'1.1', activity:'Shell material incoming inspection',                 ref:'IR-020',  parameters:'MTC; OD ±1mm, WT ±10%; no laminations',                                 responsible:'QC Inspector',  internal:'H', customer:'R', tpi:'H', status:'done',    date:'2025-02-10', result:'Pass', remarks:'' },
      { step:'1.2', activity:'Tube material incoming inspection',                  ref:'IR-020B', parameters:'MTC; OD ±0.1mm, WT ±10%; eddy current cert verified',                  responsible:'QC Inspector',  internal:'H', customer:'R', tpi:'H', status:'done',    date:'2025-02-10', result:'Pass', remarks:'' },
      { step:'1.3', activity:'Tube sheet MTC — BLOCKED (NCR-2025-042)',           ref:'NCR-2025-042', parameters:'Mo content 2.08% vs spec 2.10% minimum — MTC failed',             responsible:'QC Inspector',  internal:'H', customer:'R', tpi:'H', status:'blocked', date:'2025-04-01', result:'Fail', remarks:'NCR-2025-042 raised. Return to vendor pending.' },
      { step:'2.1', activity:'Tube bundle assembly — baffle & spacing check',     ref:'IR-021',  parameters:'Baffle spacing ±3mm; tube protrusion 3–6mm; no bow',                   responsible:'QC Inspector',  internal:'W', customer:'R', tpi:'W', status:'done',    date:'2025-03-01', result:'Pass', remarks:'' },
      { step:'3.1', activity:'Tube-to-tubesheet rolling expansion',               ref:null,      parameters:'Expansion depth 100% groove; pull-out test ≥ spec — PENDING TUBE SHEET', responsible:'QC Inspector', internal:'H', customer:'W', tpi:'H', status:'pending', date:null,         result:null,   remarks:'' },
      { step:'4.1', activity:'Hydrostatic test — shell side & tube side',         ref:null,      parameters:'1.3 × MAWP each side; 30 min hold per ASME VIII UG-99',                responsible:'QC Manager',    internal:'H', customer:'H', tpi:'H', status:'pending', date:null,         result:null,   remarks:'' },
      { step:'5.1', activity:'Final dimensional inspection & pre-dispatch review',ref:null,      parameters:'Shell OD ±1mm; nozzle orientation ±5mm; MDR complete',                 responsible:'QC Manager',    internal:'H', customer:'H', tpi:'H', status:'pending', date:null,         result:null,   remarks:'' },
    ],
  },

  /* Control Plan — project-specific items (keyed by project id) */
  controlPlan: {
    'P-2401': [
      { stage_no:1, stage:'Material Incoming',   activity:'Incoming plate & fitting inspection',                     ref:'API 650 Table 7.2',    parameters:'Thickness ±0.3mm; no laminations; MTC heat traceability',  responsible:'QC Inspector',  internal:'H', customer:'R', tpi:'H', status:'passed', remarks:'' },
      { stage_no:1, stage:'Material Incoming',   activity:'Mill test certificate (MTC) review',                      ref:'ASTM A240 / EN 10028-7',parameters:'Chemical comp & mech props per spec',                       responsible:'QC Inspector',  internal:'H', customer:'R', tpi:'H', status:'passed', remarks:'' },
      { stage_no:2, stage:'Plate Preparation',   activity:'Plate cutting & marking dimensional check',               ref:'Approved drawing',     parameters:'±1mm on cut dims; marks legible',                           responsible:'QC Inspector',  internal:'P', customer:null,tpi:'R', status:'passed', remarks:'' },
      { stage_no:3, stage:'Shell Rolling',        activity:'Shell rolling roundness & seam alignment',                ref:'API 650 §5.6.5',       parameters:'Out-of-roundness ≤1% dia (max 25mm)',                       responsible:'QC Inspector',  internal:'W', customer:null,tpi:'W', status:'passed', remarks:'' },
      { stage_no:4, stage:'Fit-up',              activity:'Shell course longitudinal seam fit-up',                   ref:'API 650 §7.3',         parameters:'Mismatch ≤3mm; peaking ≤3mm; gap 2–4mm',                   responsible:'QC Inspector',  internal:'W', customer:'W', tpi:'H', status:'in_progress', remarks:'' },
      { stage_no:4, stage:'Fit-up',              activity:'Nozzle/manway orientation & fit-up',                      ref:'API 650 §7.3',         parameters:'Orientation ±5mm; flange face level ±1mm',                  responsible:'QC Inspector',  internal:'W', customer:'R', tpi:'W', status:'in_progress', remarks:'' },
      { stage_no:5, stage:'Welding',             activity:'Visual examination — all welds (post-weld)',              ref:'API 650 §7.3.4',       parameters:'No cracks, porosity; undercut ≤0.4mm',                     responsible:'QC Inspector',  internal:'P', customer:'R', tpi:'W', status:'pending', remarks:'' },
      { stage_no:6, stage:'NDE',                 activity:'Radiographic testing (RT) — all seams',                  ref:'API 650 Annex A',      parameters:'Film density 2.0–4.0; IQI ≤2%; 100% coverage',             responsible:'NDT Contractor', internal:'H', customer:'W', tpi:'H', status:'pending', remarks:'' },
      { stage_no:6, stage:'NDE',                 activity:'Vacuum box test — bottom plate laps',                     ref:'API 650 §7.3.5',       parameters:'No leaks at 35 mbar pressure; 100% coverage',               responsible:'QC Inspector',  internal:'P', customer:'W', tpi:'W', status:'pending', remarks:'' },
      { stage_no:7, stage:'Hydrostatic Test',    activity:'Hydrostatic leak test — 24 hr water fill',               ref:'API 650 §7.3.6',       parameters:'24 hr hold; no leaks; no settlement',                       responsible:'QC Manager',    internal:'H', customer:'H', tpi:'H', status:'pending', remarks:'' },
      { stage_no:8, stage:'Final Inspection',    activity:'Final dimensional survey',                                ref:'API 650 §7.3.8',       parameters:'Plumb ≤30mm/10m; radius ±13mm; height ±3%',                responsible:'QC Inspector',  internal:'H', customer:'H', tpi:'H', status:'pending', remarks:'' },
      { stage_no:8, stage:'Final Inspection',    activity:'Pre-dispatch client witness inspection',                  ref:'Client PO / ITP',      parameters:'Visual walkdown + MDR sign-off',                            responsible:'QC Manager',    internal:'H', customer:'H', tpi:'H', status:'pending', remarks:'' },
    ],
    'P-2402': [
      { stage_no:1, stage:'Material Incoming',   activity:'Shell plate incoming inspection',                         ref:'ASME II / SA-240',     parameters:'MTC; dims per data sheet; no visual defects',               responsible:'QC Inspector',  internal:'H', customer:'R', tpi:'H', status:'pending', remarks:'' },
      { stage_no:2, stage:'WPS/PQR Review',      activity:'Welding procedure documentation review',                  ref:'ASME IX',              parameters:'All WPS qualified; PQR test results meet code',             responsible:'QC Manager',    internal:'H', customer:'R', tpi:'H', status:'pending', remarks:'' },
      { stage_no:3, stage:'Fit-up',              activity:'Shell course longitudinal seam fit-up',                   ref:'ASME VIII UW-35',      parameters:'Mismatch ≤¼T (max 3mm); gap 2–4mm',                        responsible:'QC Inspector',  internal:'W', customer:'W', tpi:'H', status:'pending', remarks:'' },
      { stage_no:5, stage:'PWHT',                activity:'PWHT time-temperature chart review',                      ref:'ASME VIII UW-40',      parameters:'Peak temp ±14°C; hold time per Table',                     responsible:'QC Inspector',  internal:'H', customer:'R', tpi:'H', status:'pending', remarks:'' },
      { stage_no:6, stage:'NDE',                 activity:'Radiographic examination — all seams',                    ref:'ASME VIII UW-51',      parameters:'Film density 2.0–4.0; IQI ≤2%',                           responsible:'NDT Contractor', internal:'H', customer:'W', tpi:'H', status:'pending', remarks:'' },
      { stage_no:7, stage:'Pressure Test',       activity:'Hydrostatic pressure test',                               ref:'ASME VIII UG-99',      parameters:'1.3 × MAWP × stress ratio; 30 min hold',                   responsible:'QC Manager',    internal:'H', customer:'H', tpi:'H', status:'pending', remarks:'' },
    ],
    'P-2403': [
      { stage_no:1, stage:'Material Incoming',   activity:'Shell & tube material incoming inspection',               ref:'ASME II',              parameters:'MTC; OD/WT per spec; no laminations',                       responsible:'QC Inspector',  internal:'H', customer:'R', tpi:'H', status:'passed', remarks:'' },
      { stage_no:1, stage:'Material Incoming',   activity:'Tube sheet material incoming — BLOCKED',                  ref:'ASME II',              parameters:'Mo ≥2.10% required — FAILED (NCR-2025-042)',               responsible:'QC Inspector',  internal:'H', customer:'R', tpi:'H', status:'failed', remarks:'Return to vendor' },
      { stage_no:2, stage:'Tube Bundle',         activity:'Tube bundle assembly check',                              ref:'TEMA / drawing',       parameters:'Baffle spacing ±3mm; tube protrusion 3–6mm',               responsible:'QC Inspector',  internal:'W', customer:'R', tpi:'W', status:'passed', remarks:'' },
      { stage_no:3, stage:'Tube-to-Tubesheet',   activity:'Tube-to-tubesheet rolling expansion',                     ref:'TEMA / Mfr proc.',     parameters:'Expansion depth 100% groove; pull-out test ≥ spec',         responsible:'QC Inspector',  internal:'H', customer:'W', tpi:'H', status:'pending', remarks:'' },
      { stage_no:5, stage:'Pressure Test',       activity:'Hydrostatic test — shell side & tube side',              ref:'ASME VIII UG-99',      parameters:'1.3 × MAWP each side; 30 min hold',                        responsible:'QC Manager',    internal:'H', customer:'H', tpi:'H', status:'pending', remarks:'' },
    ],
  },

  /* Standard Control Plan templates (loaded from API, stubbed here) */
  cpTemplates: [],
  cpView: 'project',  // 'project' | 'standard'

  /* NCR / Complaint log sub-view */
  ncrView: 'ncr',   // 'ncr' | 'complaints'

  /* Customer Complaint Log */
  complaints: [
    {
      id: 'CC-005', date: '2025-04-18', customer: 'Saudi Aramco', project: 'P-2401',
      category: 'Documentation', severity: 'major', status: 'open',
      subject: 'MRB dossier incomplete — hydrostatic test records missing',
      description: 'Customer engineer flagged during pre-dispatch review that hydrostatic test report and final inspection certificate are not included in the MRB package as required by PO clause 14.3.',
      receivedBy: 'QC Manager', receivedVia: 'Email',
      actionTaken: 'MRB coordinator notified. Documents being compiled.',
      targetDate: '2025-05-02', closedDate: null,
      comments: [
        { by: 'QC Manager', time: '18 Apr 10:30', text: 'Complaint received via email. MRB team notified immediately.' },
      ],
      capa: {
        C1: { title:'Problem Statement', status:'done',
              statement:'MRB dossier for P-2401 (316L Storage Tank) delivered to Saudi Aramco is missing the hydrostatic test report and final inspection certificate, as mandated by PO clause 14.3. Customer cannot proceed with pre-commissioning acceptance.',
              isIs:{ is:'MRB package missing 2 critical documents (hydro report + final cert)', isNot:'Not a quality defect on the physical product',
                     whenIs:'Identified at pre-dispatch review 18-Apr-2025', whenIsNot:'Documents were completed but not compiled into MRB',
                     whereIs:'Documentation control / MRB compilation stage', whereIsNot:'Not a site or fabrication issue',
                     howMuchIs:'2 of 34 required documents missing', howMuchIsNot:'All physical inspection records were completed' }},
        C2: { title:'Containment', status:'in-progress',
              actions:[
                { action:'Dispatch hold placed on MRB package', owner:'QC Manager', date:'2025-04-18', verified:true },
                { action:'MRB coordinator notified; document compilation assigned', owner:'MRB Coordinator', date:'2025-04-18', verified:true },
                { action:'Hydrostatic test report retrieved from test bay records', owner:'QC Inspector', date:'2025-04-19', verified:false },
              ]},
        C3: { title:'Root Cause Analysis', status:'in-progress',
              whys:[
                'Hydrostatic test report and final cert missing from MRB',
                'MRB checklist not cross-checked against PO clause 14.3 requirements',
                'MRB compilation was handed over between two coordinators without full briefing',
                'No formal handover procedure exists for in-progress MRB packages',
                'Document control procedure does not mandate a PO-clause-specific final review gate',
              ],
              rootCause:'Absence of a formal handover procedure for in-progress MRB packages, leading to gaps during transition between coordinators.',
              fishbone:{ man:['Coordinator handover gap','No cross-check by QC reviewer'], machine:[], material:['Test report filed separately from MRB folder'], method:['MRB checklist not mapped to PO clause 14.3','No final-gate review before dispatch'], measurement:['Completeness check not performed'], environment:[] }},
        C4: { title:'Corrective Actions', status:'pending',
              actions:[
                { action:'Compile missing hydrostatic report and final inspection cert into MRB', owner:'MRB Coordinator', dueDate:'2025-04-22', status:'in-progress', evidence:'' },
                { action:'Submit revised MRB to customer for acceptance', owner:'QC Manager', dueDate:'2025-04-25', status:'pending', evidence:'' },
              ]},
        C5: { title:'Preventive Actions', status:'pending',
              actions:[
                { action:'Create formal MRB handover checklist procedure (MRB-PROC-004)', scope:'All projects', owner:'Document Control', dueDate:'2025-05-15', status:'pending' },
                { action:'Add PO-clause-mapped final review gate to MRB release workflow', scope:'All projects', owner:'QC Manager', dueDate:'2025-05-20', status:'pending' },
                { action:'Train all MRB coordinators on updated procedure', scope:'QC Dept', owner:'QC Manager', dueDate:'2025-05-25', status:'pending' },
              ]},
        C6: { title:'Implementation', status:'pending', evidence:'', verifiedBy:'', verifiedDate:'', effective:null },
        C7: { title:'Customer Response', status:'pending', responseDate:'', respondedBy:'', method:'', summary:'', customerAccepted:null },
        C8: { title:'Closure', status:'pending', reviewDate:'', reviewedBy:'', lessons:'', closedDate:null },
      }
    },
    {
      id: 'CC-004', date: '2025-03-22', customer: 'Saudi Aramco', project: 'P-2401',
      category: 'Quality', severity: 'critical', status: 'closed',
      subject: 'Weld undercut on longitudinal seam exceeds API 650 tolerance',
      description: 'Customer inspector identified undercut >0.4mm on WJ-04 during witness inspection. Linked to NCR-2025-039. Customer requested immediate repair hold.',
      receivedBy: 'QC Inspector', receivedVia: 'Site meeting',
      actionTaken: 'Hold point applied. NCR raised. Weld repair completed and re-inspected. Customer accepted.',
      targetDate: '2025-04-10', closedDate: '2025-04-12',
      comments: [
        { by: 'QC Inspector', time: '22 Mar 15:00', text: 'Customer raised concern during witness inspection. NCR linked.' },
        { by: 'QC Manager', time: '12 Apr 09:00', text: 'Repair complete, customer accepted. Complaint closed.' },
      ],
      capa: {
        C1: { title:'Problem Statement', status:'done',
              statement:'Undercut depth on weld joint WJ-04 (longitudinal seam, Shell Course 2) measured at 0.55mm, exceeding the 0.4mm maximum permitted by API 650 §7.3.4. Customer inspector raised immediate hold during witness inspection.',
              isIs:{ is:'Undercut >0.4mm on WJ-04, Shell Course 2 (0.55mm measured)', isNot:'Not a through-crack or loss of mechanical toughness',
                     whenIs:'Detected during customer witness inspection 22-Mar-2025', whenIsNot:'Not identified at internal VT — missed at routine check',
                     whereIs:'WJ-04, longitudinal seam, Shell Course 2', whereIsNot:'No undercut on Shell Course 1 or circumferential seams',
                     howMuchIs:'Max 0.55mm over 120mm length — 1 location', howMuchIsNot:'Remainder of seam within tolerance' }},
        C2: { title:'Containment', status:'done',
              actions:[
                { action:'Hold tag applied to WJ-04; production stop on Shell Course 2 welding', owner:'QC Inspector', date:'2025-03-22', verified:true },
                { action:'NCR-2025-039 raised and linked to this complaint', owner:'QC Manager', date:'2025-03-22', verified:true },
                { action:'Customer formally notified; hold point accepted by customer inspector', owner:'QC Manager', date:'2025-03-22', verified:true },
              ]},
        C3: { title:'Root Cause Analysis', status:'done',
              whys:[
                'Undercut >0.4mm formed on WJ-04 longitudinal seam',
                'Welder used travel speed slightly above the upper WPS limit during pass 3',
                'Welder had recently returned from extended leave — first week back on critical seam work',
                'No supervised re-qualification run performed after leave >14 days',
                'Welder return-to-work procedure does not require supervised trial weld for ASME/API work',
              ],
              rootCause:'Welder return-to-work procedure does not mandate a supervised trial weld after extended absence, allowing skill degradation to go undetected on critical seam work.',
              fishbone:{ man:['Welder returning from leave — skill drift','No supervised trial weld on return'], machine:[], material:[], method:['Travel speed exceeded WPS upper limit on pass 3','Return-to-work procedure insufficient'], measurement:['Visual inspection — insufficient lighting in bay during night shift'], environment:[] }},
        C4: { title:'Corrective Actions', status:'done',
              actions:[
                { action:'Grind and repair undercut on WJ-04 per WPS-GT-03 (repair weld procedure)', owner:'Lead Welder', dueDate:'2025-04-05', status:'done', evidence:'IR-005 repair record; VT pass confirmed' },
                { action:'RT re-examination of repaired section — 100% coverage', owner:'NDT Contractor', dueDate:'2025-04-08', status:'done', evidence:'RT Report RT-WJ04-R1, all clear' },
                { action:'Customer re-witness inspection of repaired WJ-04', owner:'QC Manager', dueDate:'2025-04-10', status:'done', evidence:'Customer sign-off on IR-005 received 10-Apr' },
              ]},
        C5: { title:'Preventive Actions', status:'done',
              actions:[
                { action:'Revise Welder Return-to-Work Procedure to mandate supervised trial weld after ≥7 days absence on API/ASME projects', scope:'All fabrication projects', owner:'QC Manager', dueDate:'2025-04-20', status:'done' },
                { action:'Add welder absence tracking to daily production report', scope:'All projects', owner:'Production Supervisor', dueDate:'2025-04-15', status:'done' },
              ]},
        C6: { title:'Implementation', status:'done', evidence:'Revised procedure WP-QC-017 Rev 2 issued. Training record signed by 4 qualified welders. Effective 21-Apr-2025.', verifiedBy:'QC Manager', verifiedDate:'2025-04-21', effective:true },
        C7: { title:'Customer Response', status:'done', responseDate:'2025-04-11', respondedBy:'QC Manager', method:'Email + formal CAPA report', summary:'Full CAPA report submitted. Customer accepted repair and preventive actions. No further hold or commercial claim.', customerAccepted:true },
        C8: { title:'Closure', status:'done', reviewDate:'2025-04-12', reviewedBy:'QC Manager', lessons:'Welder return-to-work gap is a systemic risk on multi-project sites. Procedure revised and extended to all API 650 / ASME VIII projects. Effectiveness to be reviewed at next internal audit.', closedDate:'2025-04-12' },
      }
    },
    {
      id: 'CC-003', date: '2025-02-14', customer: 'Petronas', project: 'P-2403',
      category: 'Delivery', severity: 'minor', status: 'closed',
      subject: 'Delivery date slippage — tube sheet material delay',
      description: 'Customer raised concern about schedule slippage due to tube sheet material shortage. Original promise date was 2025-03-15.',
      receivedBy: 'Project Manager', receivedVia: 'Phone call',
      actionTaken: 'Expediting report issued. New delivery date agreed: 2025-04-30.',
      targetDate: '2025-03-20', closedDate: '2025-03-21',
      comments: [
        { by: 'PM', time: '14 Feb 11:00', text: 'Customer called regarding schedule slip. Expediting action initiated.' },
      ],
      capa: {
        C1: { title:'Problem Statement', status:'done',
              statement:'Tube sheet material for P-2403 (304 SS Heat Exchanger) delayed by supplier, causing ~6-week slippage against contractual delivery date of 2025-03-15. Customer at risk of commissioning delay.',
              isIs:{ is:'Tube sheet material not delivered by required date', isNot:'Not a quality defect — no non-conformance on fabricated parts',
                     whenIs:'Slippage identified 14-Feb-2025', whenIsNot:'Shell and baffle fabrication on schedule',
                     whereIs:'Procurement / supply chain stage', whereIsNot:'Not a fabrication floor or QC issue',
                     howMuchIs:'~6 weeks delay; new ETA 2025-04-10', howMuchIsNot:'No impact on other P-2403 work packages' }},
        C2: { title:'Containment', status:'done',
              actions:[
                { action:'Customer proactively informed before contractual deadline impact', owner:'Project Manager', date:'2025-02-14', verified:true },
                { action:'Formal expediting report raised with supplier (priority flag)', owner:'Procurement', date:'2025-02-15', verified:true },
              ]},
        C3: { title:'Root Cause Analysis', status:'done',
              whys:[
                'Tube sheet material not delivered by 2025-02-28 as required',
                'Supplier experienced stock shortage of 304 SS thick plate (≥50mm)',
                'Order placed with single-source supplier with no lead time buffer',
                'Procurement policy does not require alternative-source qualification for long-lead items',
                'No supply risk review performed at project kick-off for thick-plate items',
              ],
              rootCause:'Single-source procurement for long-lead thick-plate material without an alternative supplier or lead-time buffer.',
              fishbone:{ man:[], machine:[], material:['304 SS thick plate ≥50mm — limited market availability','Supplier stock shortage'], method:['Single-source procurement — no approved alternative','No supply risk review at project kick-off'], measurement:[], environment:['Global SS plate demand spike Q1 2025'] }},
        C4: { title:'Corrective Actions', status:'done',
              actions:[
                { action:'Issue formal expediting notice; negotiate priority delivery slot with supplier', owner:'Procurement', dueDate:'2025-02-20', status:'done', evidence:'Supplier confirmed priority delivery: 2025-04-10' },
                { action:'Communicate revised delivery date (2025-04-30) to Petronas with mitigation plan', owner:'Project Manager', dueDate:'2025-02-21', status:'done', evidence:'Customer email accepted revised date 21-Feb' },
              ]},
        C5: { title:'Preventive Actions', status:'done',
              actions:[
                { action:'Qualify minimum 2 approved suppliers for all thick-plate (≥40mm) SS/CS materials', scope:'Procurement', owner:'Procurement Manager', dueDate:'2025-05-01', status:'done' },
                { action:'Add supply-risk review to project kick-off checklist for lead time > 8 weeks', scope:'All projects', owner:'PM Office', dueDate:'2025-04-01', status:'done' },
              ]},
        C6: { title:'Implementation', status:'done', evidence:'Two additional suppliers qualified: Acerinox & ThyssenKrupp. Project kick-off checklist updated and communicated to all PMs.', verifiedBy:'Procurement Manager', verifiedDate:'2025-05-02', effective:true },
        C7: { title:'Customer Response', status:'done', responseDate:'2025-03-21', respondedBy:'Project Manager', method:'Email', summary:'Petronas accepted revised schedule and CAPA actions. No commercial claim raised. Customer satisfied with proactive communication.', customerAccepted:true },
        C8: { title:'Closure', status:'done', reviewDate:'2025-03-21', reviewedBy:'Project Manager', lessons:'Long-lead material supply risk must be assessed at project kick-off. Single-source procurement unacceptable for items with lead time > 8 weeks.', closedDate:'2025-03-21' },
      }
    },
  ],

  /* Non-Conformance Reports (NCR) with 8D Workflow */
  ncr: [
    { 
      id: 'NCR-2025-042', project: 'P-2403', type: 'Material', status: 'open', severity: 'high', 
      title: 'MTC Discrepancy', raisedDate: '2025-05-04', age: 6, rcaStatus: 'in-progress',
      d_steps: {
        D1: { title: 'Team', status: 'done', members: ['Sarah Ahmed', 'John Doe'] },
        D2: { title: 'Description', status: 'done', text: 'Chemical composition of Heat #HN-44821 exceeds Carbon limits (0.04 vs 0.03 max).' },
        D3: { title: 'Containment', status: 'done', text: 'Plates quarantined in Zone B. Production hold issued.' },
        D4: { title: 'Root Cause', status: 'in-progress', methodology: 'Fishbone', findings: 'Vendor certification error during pre-dispatch.' },
        D5: { title: 'Action Plan', status: 'pending' },
        D6: { title: 'Implementation', status: 'pending' },
        D7: { title: 'Prevention', status: 'pending' },
        D8: { title: 'Closure', status: 'pending' }
      },
      fishbone: {
        man: ['Inadequate training on MTC verification'],
        machine: [],
        material: ['Vendor stock mix-up'],
        method: ['Sampling rate too low (10%)'],
        measurement: ['Spectrometer out of calibration'],
        env: []
      }
    },
    { id: 'NCR-2025-039', project: 'P-2402', type: 'Welding', status: 'open', severity: 'medium', title: 'Undercut on Seam B', raisedDate: '2025-05-02', age: 8, rcaStatus: 'pending' }
  ],

  /* Calibration Registry with Traceability */
  calibration: [
    { 
      id: 'CAL-101', instrument: 'Digital Vernier Caliper', sn: 'VC-8821', inductionDate: '2022-01-15', 
      lastCal: '2024-11-15', due: '2025-11-15', certNo: 'CRT/VC/24/011', location: 'Machine Shop A',
      status: 'valid', health: 92, usageTrace: ['P-2401', 'P-2403'], certFile: 'CERT-VC8821.pdf' 
    },
    { 
      id: 'CAL-102', instrument: 'Ultrasonic Thickness Gauge', sn: 'UT-440', inductionDate: '2022-06-20', 
      lastCal: '2024-05-20', due: '2025-05-20', certNo: 'CRT/UT/24/044', location: 'QC Lab',
      status: 'warn', health: 75, usageTrace: ['P-2402'], certFile: 'CERT-UT440.pdf'
    },
    { 
      id: 'CAL-103', instrument: 'Pressure Gauge (0-600 PSI)', sn: 'PG-600-01', inductionDate: '2023-03-12', 
      lastCal: '2025-03-01', due: '2026-03-01', certNo: 'CRT/PG/25/112', location: 'Hydro-test Bay',
      status: 'valid', health: 100, usageTrace: [], certFile: 'CERT-PG01.pdf'
    },
    { 
      id: 'CAL-104', instrument: 'Magnetic Yoke', sn: 'MY-112', inductionDate: '2021-11-10', 
      lastCal: '2023-12-10', due: '2024-12-10', certNo: 'CRT/MY/23/088', location: 'NDT Area',
      status: 'expired', health: 0, usageTrace: [], certFile: null 
    },
    { 
      id: 'CAL-105', instrument: 'Coating Thickness Gauge', sn: 'CTG-99', inductionDate: '2023-08-05', 
      lastCal: '2024-08-05', due: '2025-08-05', certNo: 'CRT/CTG/24/099', location: 'Blasting Bay',
      status: 'valid', health: 85, usageTrace: [], certFile: 'CERT-CTG99.pdf' 
    },
  ],
  
  /* Inspection Requests (RFI) Workflow */
  inspectionRequests: [
    { id: 'RFI-2025-001', project: 'P-2401', itpStep: '4.1', activity: 'Shell Fit-up — Long Seam WJ-01', type: 'Fit-up', priority: 'Urgent', requestedBy: 'M. Ibrahim', requestedDate: '2025-05-10', scheduledDate: '2025-05-14', location: 'Bay 3', drawingRef: 'DWG-SH-001', description: 'Longitudinal seam fit-up for Shell Course 1. Ready for QC inspection.', assignedInspector: 'Sarah Ahmed', status: 'submitted', result: null, reportRef: null, ncrRef: null, holdPoint: true, witnessParties: ['Internal', 'Customer', 'TPI'], comments: [{ by: 'M. Ibrahim', time: '10 May 14:20', text: 'Joint prepared, tack welds per WPS. Ready for inspection.' }], attachments: 2 },
    { id: 'RFI-2025-002', project: 'P-2401', itpStep: '4.2', activity: 'Visual Weld — Long Seam WJ-01', type: 'Welding VT', priority: 'Normal', requestedBy: 'R. Kumar', requestedDate: '2025-05-11', scheduledDate: '2025-05-15', location: 'Bay 3', drawingRef: 'WPS-SS-01', description: 'Post-weld visual examination of WJ-01.', assignedInspector: null, status: 'draft', result: null, reportRef: null, ncrRef: null, holdPoint: false, witnessParties: ['Internal'], comments: [], attachments: 0 },
    { id: 'RFI-2025-003', project: 'P-2402', itpStep: '1.1', activity: 'Incoming Material — Shell Plates', type: 'Material', priority: 'Normal', requestedBy: 'S. Wong', requestedDate: '2025-05-08', scheduledDate: '2025-05-09', location: 'Material Yard', drawingRef: 'PO-2402-01', description: 'Verification of shell plates vs MTC.', assignedInspector: 'John Doe', status: 'completed', result: 'Pass', reportRef: 'IR-MAT-001', ncrRef: null, holdPoint: true, witnessParties: ['Internal', 'TPI'], comments: [{ by: 'John Doe', time: '09 May 10:00', text: 'MTC verified, dimensions OK. Report IR-MAT-001 issued.' }], attachments: 4 },
    { id: 'RFI-2025-004', project: 'P-2401', itpStep: '6.1', activity: 'Nozzle Orientation Check', type: 'Dimensional', priority: 'Critical', requestedBy: 'M. Ibrahim', requestedDate: '2025-05-12', scheduledDate: '2025-05-13', location: 'Bay 4', drawingRef: 'DWG-SH-002', description: 'Orientation check for Nozzles N1-N4.', assignedInspector: 'Sarah Ahmed', status: 'accepted', result: null, reportRef: null, ncrRef: null, holdPoint: true, witnessParties: ['Internal', 'Customer'], comments: [{ by: 'Sarah Ahmed', time: '12 May 16:00', text: 'Scheduled for tomorrow morning.' }], attachments: 1 },
    { id: 'RFI-2025-005', project: 'P-2403', itpStep: '2.1', activity: 'Tube Bundle Assembly Check', type: 'Dimensional', priority: 'Normal', requestedBy: 'A. Hassan', requestedDate: '2025-05-05', scheduledDate: '2025-05-06', location: 'Bay 1', drawingRef: 'DWG-HE-005', description: 'Baffle spacing and tube protrusion check.', assignedInspector: 'John Doe', status: 'closed', result: 'Pass', reportRef: 'IR-021', ncrRef: null, holdPoint: false, witnessParties: ['Internal'], comments: [], attachments: 2 },
    { id: 'RFI-2025-006', project: 'P-2401', itpStep: '8.1', activity: 'Hydrostatic Test — Main Tank', type: 'Hydro', priority: 'Critical', requestedBy: 'M. Ibrahim', requestedDate: '2025-05-13', scheduledDate: '2025-05-16', location: 'Hydro Bay', drawingRef: 'DWG-SH-010', description: 'Final 24hr water fill test.', assignedInspector: 'QC Manager', status: 'submitted', result: null, reportRef: null, ncrRef: null, holdPoint: true, witnessParties: ['Internal', 'Customer', 'TPI'], comments: [], attachments: 0 },
    { id: 'RFI-2025-007', project: 'P-2402', itpStep: '4.1', activity: 'Visual Examination — Seam B', type: 'Welding VT', priority: 'Urgent', requestedBy: 'W. Chen', requestedDate: '2025-05-12', scheduledDate: '2025-05-13', location: 'Bay 2', drawingRef: 'WPS-CS-01', description: 'Visual check for WJ-04. Previous concern on WJ-03.', assignedInspector: 'John Doe', status: 'in-progress', result: null, reportRef: null, ncrRef: null, holdPoint: false, witnessParties: ['Internal'], comments: [{ by: 'John Doe', time: '13 May 09:30', text: 'Started visual inspection. Initial pass looks OK.' }], attachments: 3 },
    { id: 'RFI-2025-008', project: 'P-2403', itpStep: '1.3', activity: 'Tube Sheet MTC Review', type: 'Material', priority: 'Normal', requestedBy: 'S. Wong', requestedDate: '2025-04-01', scheduledDate: '2025-04-01', location: 'QC Office', drawingRef: 'PO-2403-05', description: 'Review of vendor MTC for tube sheet.', assignedInspector: 'John Doe', status: 'rejected', result: 'Fail', reportRef: null, ncrRef: 'NCR-2025-042', holdPoint: true, witnessParties: ['Internal'], comments: [{ by: 'John Doe', time: '01 Apr 11:00', text: 'MTC failed Mo content check. Raising NCR.' }], attachments: 1 }
  ],
  rfiView: 'list', // 'list' | 'calendar'
  selectedRfiId: null,

  /* Skill Matrix & Authority — Enriched Personnel Records */
  skills: [
    { 
      id: 'QE-01', name: 'Sarah Ahmed', role: 'Senior QC Engineer', designation: 'Grade A — Lead', 
      joiningDate: '2019-03-15', avatar: { initials: 'SA', color: 'var(--brand)' },
      certs: [
        { name: 'ASME Level III', issuedBy: 'ASME', expiry: '2026-12-10', status: 'valid' },
        { name: 'ISO 9001 Lead Auditor', issuedBy: 'IRCA', expiry: '2025-06-20', status: 'valid' }
      ],
      eyeTestExpiry: '2025-12-30', assignedProjects: ['P-2401', 'P-2402'], 
      auth: ['Hydro Sign-off', 'Final Release', 'NCR Approval', 'ITP Approval'],
      skillKPIs: { welding: 95, ndt: 90, dimensional: 85, materialTest: 95, coating: 80, documentation: 98, audit: 95, safety: 90 }
    },
    { 
      id: 'QE-02', name: 'John Doe', role: 'QC Inspector', designation: 'Grade B', 
      joiningDate: '2021-06-10', avatar: { initials: 'JD', color: 'var(--blue)' },
      certs: [
        { name: 'CSWIP 3.1', issuedBy: 'TWI', expiry: '2025-08-15', status: 'valid' },
        { name: 'ASNT Level II (RT/UT)', issuedBy: 'ASNT', expiry: '2024-12-30', status: 'expired' }
      ],
      eyeTestExpiry: '2025-08-15', assignedProjects: ['P-2401', 'P-2402'], 
      auth: ['Weld Inspection', 'Fit-up Verify', 'MTC Verification'],
      skillKPIs: { welding: 98, ndt: 85, dimensional: 75, materialTest: 82, coating: 60, documentation: 78, audit: 65, safety: 92 }
    },
    { 
      id: 'QE-03', name: 'Ali Hassan', role: 'QC Inspector', designation: 'Grade B', 
      joiningDate: '2022-02-20', avatar: { initials: 'AH', color: 'var(--green)' },
      certs: [
        { name: 'NACE Level II', issuedBy: 'AMPP', expiry: '2025-11-20', status: 'valid' },
        { name: 'BGAS-CSWIP Grade 2', issuedBy: 'TWI', expiry: '2026-01-10', status: 'valid' }
      ],
      eyeTestExpiry: '2025-05-15', assignedProjects: ['P-2401', 'P-2403'], 
      auth: ['Coating Insp.', 'Blasting Verify', 'Dimensional Survey'],
      skillKPIs: { welding: 65, ndt: 60, dimensional: 92, materialTest: 78, coating: 98, documentation: 75, audit: 70, safety: 95 }
    },
    { 
      id: 'QE-04', name: 'Priya Menon', role: 'QC Document Controller', designation: 'Grade C', 
      joiningDate: '2023-01-05', avatar: { initials: 'PM', color: 'var(--purple)' },
      certs: [
        { name: 'ISO 9001 Foundation', issuedBy: 'BSI', expiry: '2028-01-05', status: 'valid' }
      ],
      eyeTestExpiry: '2026-01-05', assignedProjects: ['P-2401', 'P-2402', 'P-2403'], 
      auth: ['MDR Compilation', 'ITP Setup', 'Doc Submission'],
      skillKPIs: { welding: 40, ndt: 45, dimensional: 50, materialTest: 70, coating: 40, documentation: 100, audit: 85, safety: 80 }
    },
    { 
      id: 'QE-05', name: 'Carlos Rivera', role: 'NDT Technician', designation: 'Grade B', 
      joiningDate: '2022-11-15', avatar: { initials: 'CR', color: 'var(--amber)' },
      certs: [
        { name: 'ASNT Level II (RT/UT/PT/MT)', issuedBy: 'ASNT', expiry: '2026-11-15', status: 'valid' }
      ],
      eyeTestExpiry: '2025-11-15', assignedProjects: ['P-2401', 'P-2402', 'P-2403'], 
      auth: ['RT Interpretation', 'UT Scanning', 'PT/MT Reports'],
      skillKPIs: { welding: 75, ndt: 100, dimensional: 65, materialTest: 80, coating: 55, documentation: 82, audit: 60, safety: 98 }
    }
  ],

  /* Incoming QC with MTC Data */
  incoming: [
    { 
      id: 'GRN-9921', supplier: 'Outokumpu', item: '316L SS Plate 10mm', status: 'quarantined', date: '2025-05-09', labReport: 'pending',
      mtcData: { heatNo: 'HN-44821', chem: { C: 0.04, Mn: 1.8, Cr: 17.2 }, mech: { yield: '310 MPa', tensile: '605 MPa' } }
    },
    { 
      id: 'GRN-9918', supplier: 'ESAB', item: 'Welding Wire ER316L', status: 'passed', date: '2025-05-05', labReport: 'verified',
      mtcData: { heatNo: 'W-0092', chem: { C: 0.02, Mn: 1.6, Cr: 19.1 }, mech: { yield: '420 MPa', tensile: '560 MPa' } }
    }
  ],

  /* Quality Audits — Detailed Records */
  audits: [
    { id: 'AUD-2025-01', type: 'Internal',      scope: 'Welding Process Control',      date: '2025-01-15', endDate: '2025-01-16', auditor: 'Sarah Ahmed',   status: 'completed', findings: 2, cars: 1, score: 88, dept: 'Production' },
    { id: 'AUD-2025-02', type: 'Internal',      scope: 'Calibration System Review',   date: '2025-03-08', endDate: '2025-03-09', auditor: 'Sarah Ahmed',   status: 'in-progress', findings: 0, cars: 0, score: null, dept: 'Quality' },
    { id: 'AUD-2025-03', type: 'Supplier',      scope: 'Outokumpu — MTC Traceability', date: '2025-05-20', endDate: '2025-05-21', auditor: 'John Doe',      status: 'scheduled', findings: 0, cars: 0, score: null, dept: 'Vendor' },
    { id: 'AUD-2025-04', type: 'Certification', scope: 'ISO 9001:2015 Surveillance',  date: '2025-06-10', endDate: '2025-06-12', auditor: 'Bureau Veritas', status: 'scheduled', findings: 0, cars: 0, score: null, dept: 'QMS' },
    { id: 'AUD-2025-05', type: 'Internal',      scope: 'Document Control Procedure',  date: '2025-07-14', endDate: '2025-07-15', auditor: 'Sarah Ahmed',   status: 'scheduled', findings: 0, cars: 0, score: null, dept: 'Admin' },
    { id: 'AUD-2025-06', type: 'Supplier',      scope: 'ESAB — Welding Consumables QC', date: '2025-08-18', endDate: '2025-08-19', auditor: 'John Doe',      status: 'scheduled', findings: 0, cars: 0, score: null, dept: 'Vendor' },
  ],

  /* ISO 9001:2015 Internal Audit Questionnaire Template — Full Clause Coverage */
  auditQuestions_Internal: [
    // Clause 4: Context of the Organization
    { clause: '4.1', text: 'Does the organization determine external and internal issues relevant to its purpose and strategic direction?', category: 'Context' },
    { clause: '4.2', text: 'Does the organization determine the requirements of interested parties relevant to the QMS?', category: 'Context' },
    { clause: '4.3', text: 'Is the scope of the QMS determined, documented, and available?', category: 'Context' },
    { clause: '4.4', text: 'Are QMS processes determined, including inputs, outputs, sequence, and interaction?', category: 'Context' },

    // Clause 5: Leadership
    { clause: '5.1', text: 'Does top management demonstrate leadership and commitment with respect to the QMS?', category: 'Leadership' },
    { clause: '5.2', text: 'Is the Quality Policy established, implemented, and maintained?', category: 'Leadership' },
    { clause: '5.3', text: 'Are organizational roles, responsibilities, and authorities assigned and communicated?', category: 'Leadership' },

    // Clause 6: Planning
    { clause: '6.1', text: 'Does the organization address risks and opportunities to ensure QMS can achieve its results?', category: 'Planning' },
    { clause: '6.2', text: 'Are Quality Objectives established at relevant functions, levels, and processes?', category: 'Planning' },
    { clause: '6.3', text: 'Are changes to the QMS carried out in a planned manner?', category: 'Planning' },

    // Clause 7: Support
    { clause: '7.1.2', text: 'Does the organization provide the people necessary for effective QMS implementation?', category: 'Support' },
    { clause: '7.1.3', text: 'Is the infrastructure necessary for process operation (buildings, equipment, IT) maintained?', category: 'Support' },
    { clause: '7.1.5', text: 'Is monitoring and measuring equipment calibrated and traceable to international standards?', category: 'Support' },
    { clause: '7.2', text: 'Are persons doing work under organization\'s control competent (Education, Training, Experience)?', category: 'Support' },
    { clause: '7.3', text: 'Are persons aware of the Quality Policy, Objectives, and their contribution to QMS effectiveness?', category: 'Support' },
    { clause: '7.4', text: 'Are internal and external communications relevant to the QMS determined?', category: 'Support' },
    { clause: '7.5.3', text: 'Is documented information controlled for availability, suitability, and protection?', category: 'Support' },

    // Clause 8: Operation
    { clause: '8.1', text: 'Does the organization plan, implement, and control operational processes to meet requirements?', category: 'Operations' },
    { clause: '8.2', text: 'Are requirements for products and services determined and reviewed before commitment to supply?', category: 'Operations' },
    { clause: '8.3', text: 'Is a design and development process established (where applicable)?', category: 'Operations' },
    { clause: '8.4.1', text: 'Does the organization ensure that externally provided processes/products conform to requirements?', category: 'Operations' },
    { clause: '8.4.2', text: 'Are controls applied to external providers, including evaluation and re-evaluation?', category: 'Operations' },
    { clause: '8.5.1', text: 'Is production/service provision under controlled conditions (WPS, work instructions, etc)?', category: 'Operations' },
    { clause: '8.5.2', text: 'Is the output identified and traceable throughout production and service provision?', category: 'Operations' },
    { clause: '8.5.4', text: 'Does the organization preserve outputs during processing and delivery?', category: 'Operations' },
    { clause: '8.6', text: 'Are products and services released only after planned arrangements are verified?', category: 'Operations' },
    { clause: '8.7', text: 'Are nonconforming outputs identified and controlled to prevent unintended use?', category: 'Operations' },

    // Clause 9: Performance Evaluation
    { clause: '9.1.1', text: 'Does the organization monitor, measure, analyze, and evaluate QMS performance?', category: 'Performance' },
    { clause: '9.1.2', text: 'Is customer satisfaction monitored as a primary performance indicator?', category: 'Performance' },
    { clause: '9.2', text: 'Are internal audits conducted at planned intervals to ensure QMS compliance?', category: 'Performance' },
    { clause: '9.3', text: 'Does top management review the QMS at planned intervals for suitability and effectiveness?', category: 'Performance' },

    // Clause 10: Improvement
    { clause: '10.1', text: 'Does the organization determine opportunities for improvement and implement actions?', category: 'Improvement' },
    { clause: '10.2', text: 'When nonconformities occur, are actions taken to control, correct, and address consequences?', category: 'Improvement' },
    { clause: '10.3', text: 'Does the organization continually improve the suitability and effectiveness of the QMS?', category: 'Improvement' }
  ],

  /* Vendor & Subcontractor Audit Questionnaire — Full ISO 9001:2015 Coverage (118 Questions) */
  auditQuestions_Vendor: [
    // Clause 4
    { section: 'Clause 4.1', text: 'Has the vendor identified external issues (regulatory, market, technological) that affect their ability to supply conforming products?' },
    { section: 'Clause 4.1', text: 'Has the vendor identified internal issues (workforce capability, infrastructure, financial stability) relevant to product quality?' },
    { section: 'Clause 4.2', text: 'Has the vendor identified interested parties relevant to their QMS (customers, regulatory bodies, employees)?' },
    { section: 'Clause 4.2', text: 'Are the requirements of these interested parties determined and monitored?' },
    { section: 'Clause 4.3', text: 'Is the scope of the QMS clearly defined and documented?' },
    { section: 'Clause 4.3', text: 'Does the scope address the products/services supplied and any exclusions justified?' },
    { section: 'Clause 4.4', text: 'Are the processes needed for the QMS determined, including inputs, outputs, sequence, and interaction?' },
    { section: 'Clause 4.4', text: 'Are criteria and methods needed to ensure effective operation of these processes determined?' },

    // Clause 5
    { section: 'Clause 5.1', text: 'Does top management demonstrate leadership by ensuring Quality Policy and Objectives are established?' },
    { section: 'Clause 5.1', text: 'Does top management ensure integration of QMS requirements into business processes?' },
    { section: 'Clause 5.1', text: 'Does top management promote use of the process approach and risk-based thinking?' },
    { section: 'Clause 5.1', text: 'Does top management ensure customer requirements are understood and consistently met?' },
    { section: 'Clause 5.2', text: 'Is a Quality Policy established appropriate to the purpose and context of the organization?' },
    { section: 'Clause 5.2', text: 'Does the Quality Policy include a commitment to continual improvement?' },
    { section: 'Clause 5.2', text: 'Is the Quality Policy communicated, understood, and applied within the organization?' },
    { section: 'Clause 5.2', text: 'Is the Quality Policy available to relevant interested parties?' },
    { section: 'Clause 5.3', text: 'Are roles, responsibilities, and authorities for relevant positions assigned and communicated?' },
    { section: 'Clause 5.3', text: 'Is a Management Representative appointed with authority for QMS performance reporting?' },

    // Clause 6
    { section: 'Clause 6.1', text: 'Has the vendor identified risks and opportunities to ensure QMS can achieve results?' },
    { section: 'Clause 6.1', text: 'Are actions planned to address risks and opportunities proportionate to potential impact?' },
    { section: 'Clause 6.1', text: 'Is the effectiveness of these risk-addressing actions evaluated?' },
    { section: 'Clause 6.2', text: 'Are Quality Objectives established at relevant functions, levels, and processes?' },
    { section: 'Clause 6.2', text: 'Are Quality Objectives measurable, monitored, communicated, and updated?' },
    { section: 'Clause 6.2', text: 'Is there a plan to achieve Quality Objectives (what, resources, responsibility, timeline)?' },
    { section: 'Clause 6.3', text: 'When changes to the QMS are needed, are they carried out in a planned manner?' },
    { section: 'Clause 6.3', text: 'Does the vendor consider purpose, consequences, and resource availability for changes?' },

    // Clause 7
    { section: 'Clause 7.1.1', text: 'Does the organization determine and provide the resources needed for the QMS?' },
    { section: 'Clause 7.1.2', text: 'Are sufficient personnel available to effectively implement the QMS and operate processes?' },
    { section: 'Clause 7.1.2', text: 'Is there a workforce plan to address critical skill gaps (welders, NDT, QC)?' },
    { section: 'Clause 7.1.3', text: 'Is the infrastructure (buildings, equipment, IT) adequate for conforming product delivery?' },
    { section: 'Clause 7.1.3', text: 'Is there a preventive maintenance programme for critical production equipment?' },
    { section: 'Clause 7.1.3', text: 'Is equipment condition monitored and failures documented?' },
    { section: 'Clause 7.1.4', text: 'Are environmental conditions (temp, humidity, lighting) suitable for product conformity?' },
    { section: 'Clause 7.1.4', text: 'Are environmental controls in place for special processes (welding, coating, NDT)?' },
    { section: 'Clause 7.1.5', text: 'Are monitoring and measuring instruments determined for evidence of product conformity?' },
    { section: 'Clause 7.1.5', text: 'Is all M&TE calibrated/verified at specified intervals, traceable to standards?' },
    { section: 'Clause 7.1.5', text: 'Are calibration records maintained (ID, date, results, next due)?' },
    { section: 'Clause 7.1.5', text: 'Is M&TE protected from adjustments or damage that would invalidate calibration?' },
    { section: 'Clause 7.1.5', text: 'Is action taken when M&TE is found out of calibration (impact assessment)?' },
    { section: 'Clause 7.1.6', text: 'Is organizational knowledge (lessons, standards) determined and maintained?' },
    { section: 'Clause 7.2', text: 'Are competence requirements determined for persons affecting QMS performance?' },
    { section: 'Clause 7.2', text: 'Are persons competent on the basis of appropriate education, training, or experience?' },
    { section: 'Clause 7.2', text: 'Are welder qualifications (ASME IX / ISO 9606) current and maintained?' },
    { section: 'Clause 7.2', text: 'Are NDT personnel certified to required levels (ASNT / ISO 9712)?' },
    { section: 'Clause 7.2', text: 'Are training records maintained and effectiveness of training evaluated?' },
    { section: 'Clause 7.3', text: 'Are persons aware of the Policy, Objectives, and their contribution to QMS?' },
    { section: 'Clause 7.3', text: 'Are persons aware of the implications of not conforming to QMS requirements?' },
    { section: 'Clause 7.4', text: 'Has the organization determined internal/external communications relevant to QMS?' },
    { section: 'Clause 7.5.1', text: 'Does the QMS include documented information required by ISO 9001 and necessary for effectiveness?' },
    { section: 'Clause 7.5.2', text: 'Is documented information appropriately identified (title, date, reference)?' },
    { section: 'Clause 7.5.2', text: 'Is it reviewed and approved for suitability and adequacy?' },
    { section: 'Clause 7.5.3', text: 'Is documented information available and suitable for use when/where needed?' },
    { section: 'Clause 7.5.3', text: 'Is documented information adequately protected (loss of integrity/confidentiality)?' },
    { section: 'Clause 7.5.3', text: 'Is there a system to ensure only the latest revision of documents is used at point of work?' },
    { section: 'Clause 7.5.3', text: 'Is obsolete documentation identified and prevented from unintended use?' },
    { section: 'Clause 7.5.3', text: 'Are records retained for required periods (contract/regulatory)?' },

    // Clause 8
    { section: 'Clause 8.1', text: 'Does the organization plan, implement, and control processes needed for product provision?' },
    { section: 'Clause 8.1', text: 'Are process criteria established (acceptance standards, workmanship requirements)?' },
    { section: 'Clause 8.1', text: 'Are planned changes controlled and unintended changes reviewed for corrective action?' },
    { section: 'Clause 8.2.1', text: 'Is there a process for communicating with customers regarding enquiries and complaints?' },
    { section: 'Clause 8.2.2', text: 'Are product requirements (regulatory/customer) determined before commitment?' },
    { section: 'Clause 8.2.3', text: 'Is a contract review performed before accepting orders to ensure all requirements are met?' },
    { section: 'Clause 8.2.3', text: 'Are differences between enquiry and contract requirements resolved before acceptance?' },
    { section: 'Clause 8.2.3', text: 'Are results of review and new requirements retained as documented information?' },
    { section: 'Clause 8.3', text: 'Is a design and development process established where requirements are not defined?' },
    { section: 'Clause 8.3', text: 'Are design inputs determined and design reviews/verifications conducted?' },
    { section: 'Clause 8.3', text: 'Are design outputs documented and meet input requirements?' },
    { section: 'Clause 8.3', text: 'Are design changes identified, reviewed, and controlled?' },
    { section: 'Clause 8.4.1', text: 'Does the vendor ensure that externally provided products/services conform to requirements?' },
    { section: 'Clause 8.4.1', text: 'Are criteria for selection and monitoring of sub-tier suppliers determined?' },
    { section: 'Clause 8.4.1', text: 'Is an Approved Vendor List (AVL) maintained with evaluation records?' },
    { section: 'Clause 8.4.2', text: 'Is the control applied to external providers proportional to impact on product quality?' },
    { section: 'Clause 8.4.2', text: 'Are verification activities for externally provided products defined (incoming inspection)?' },
    { section: 'Clause 8.4.3', text: 'Are purchase specs clearly communicated to sub-tier suppliers (grade, standards, certs)?' },
    { section: 'Clause 8.5.1', text: 'Is production carried out under controlled conditions (procedures, instructions)?' },
    { section: 'Clause 8.5.1', text: 'Are WPS qualified per applicable code (ASME IX / ISO 15614) and available at workstations?' },
    { section: 'Clause 8.5.1', text: 'Are Procedure Qualification Records (PQR) on file and traceable to WPS?' },
    { section: 'Clause 8.5.1', text: 'Are heat treatment procedures documented and controlled (temp, time, cooling)?' },
    { section: 'Clause 8.5.1', text: 'Are NDT procedures documented and performed per applicable standard (ASME V)?' },
    { section: 'Clause 8.5.1', text: 'Are surface preparation and coating procedures documented (Sa 2.5, DFT)?' },
    { section: 'Clause 8.5.1', text: 'Is suitable monitoring and measuring equipment used during production?' },
    { section: 'Clause 8.5.2', text: 'Are products identified by suitable means throughout production (marking, tagging)?' },
    { section: 'Clause 8.5.2', text: 'Is full material traceability maintained (Heat Number, MTC)?' },
    { section: 'Clause 8.5.2', text: 'Is traceability maintained through all processing stages (cutting, forming, welding)?' },
    { section: 'Clause 8.5.2', text: 'Is the status of product with respect to inspection requirements identified?' },
    { section: 'Clause 8.5.3', text: 'Is customer-supplied property identified, verified, protected, and safeguarded?' },
    { section: 'Clause 8.5.3', text: 'Is the customer notified if their property is lost or damaged?' },
    { section: 'Clause 8.5.4', text: 'Are outputs preserved during production (handling, storage, protection)?' },
    { section: 'Clause 8.5.4', text: 'Are corrosion-sensitive materials (SS) protected from contamination (chlorides)?' },
    { section: 'Clause 8.5.4', text: 'Is finished product storage adequate (indoor, raised off ground, labelled)?' },
    { section: 'Clause 8.5.5', text: 'Are post-delivery requirements (warranty, spares) determined and met?' },
    { section: 'Clause 8.5.6', text: 'Are changes to production reviewed and controlled to ensure conformity?' },
    { section: 'Clause 8.5.6', text: 'Are results of review of changes and authorizing persons retained?' },
    { section: 'Clause 8.6', text: 'Are verification arrangements implemented at appropriate stages for requirements?' },
    { section: 'Clause 8.6', text: 'Is release only performed after all planned arrangements are satisfactorily completed?' },
    { section: 'Clause 8.6', text: 'Is documented evidence of conformity retained (inspection records, certs)?' },
    { section: 'Clause 8.6', text: 'Is release traceable to the person authorizing it?' },
    { section: 'Clause 8.7', text: 'Are nonconforming products identified and controlled to prevent unintended use?' },
    { section: 'Clause 8.7', text: 'Is action taken based on nature of nonconformity (correction, segregation, concession)?' },
    { section: 'Clause 8.7', text: 'Is re-verification performed after correction to demonstrate conformity?' },
    { section: 'Clause 8.7', text: 'Is documented info retained describing NCR, actions, and authority for disposition?' },

    // Clause 9
    { section: 'Clause 9.1.1', text: 'Has the organization determined what needs to be monitored and measured?' },
    { section: 'Clause 9.1.1', text: 'Are methods for monitoring and analysis determined to ensure valid results?' },
    { section: 'Clause 9.1.1', text: 'Are results of analysis used to evaluate QMS performance and effectiveness?' },
    { section: 'Clause 9.1.2', text: 'Does the organization monitor customer perceptions of degree to which needs are fulfilled?' },
    { section: 'Clause 9.1.2', text: 'Are methods for obtaining customer feedback determined (surveys, complaint analysis)?' },
    { section: 'Clause 9.1.3', text: 'Are data analyzed to evaluate product conformity, customer satisfaction, and QMS?' },
    { section: 'Clause 9.2', text: 'Are internal audits conducted at planned intervals for compliance and effectiveness?' },
    { section: 'Clause 9.2', text: 'Is an audit programme planned, considering importance of processes and previous results?' },
    { section: 'Clause 9.2', text: 'Are auditors selected to ensure objectivity and impartiality?' },
    { section: 'Clause 9.2', text: 'Are audit results reported to management and corrective actions taken without delay?' },
    { section: 'Clause 9.2', text: 'Are documented records of the audit programme and results retained?' },
    { section: 'Clause 9.3', text: 'Does top management review the QMS at planned intervals for suitability and adequacy?' },
    { section: 'Clause 9.3', text: 'Does management review consider trends in NCRs, audits, and supplier performance?' },
    { section: 'Clause 9.3', text: 'Do outputs of review include decisions on improvement opportunities and resource needs?' },

    // Clause 10
    { section: 'Clause 10.1', text: 'Does the organization determine and select opportunities for improvement?' },
    { section: 'Clause 10.1', text: 'Does the organization implement necessary actions to meet customer requirements?' },
    { section: 'Clause 10.2', text: 'When nonconformity occurs, does the organization react to control and correct it?' },
    { section: 'Clause 10.2', text: 'Does the organization evaluate the need for action to eliminate causes (RCA)?' },
    { section: 'Clause 10.2', text: 'Does the organization implement any corrective action needed?' },
    { section: 'Clause 10.2', text: 'Does the organization review the effectiveness of corrective actions taken?' },
    { section: 'Clause 10.2', text: 'Does the organization update risks and opportunities determined during planning?' },
    { section: 'Clause 10.2', text: 'Does the organization make changes to the QMS if necessary?' },
    { section: 'Clause 10.2', text: 'Is documented evidence retained of nature of NCRs and results of corrective actions?' },
    { section: 'Clause 10.3', text: 'Does the organization continually improve the suitability and effectiveness of QMS?' },
    { section: 'Clause 10.3', text: 'Are results of analysis and management review considered to determine improvement needs?' },
    { section: 'Clause 10.3', text: 'Are improvement initiatives tracked to completion?' }
  ],

  /* Certifications Tracker */
  certifications: [
    { id: 'CERT-01', name: 'ISO 9001:2015', body: 'Bureau Veritas', lastAudit: '2024-06-10', due: '2025-06-10', status: 'valid' },
    { id: 'CERT-02', name: 'ASME U-Stamp', body: 'NBBI', lastAudit: '2024-09-01', due: '2027-09-01', status: 'valid' },
    { id: 'CERT-03', name: 'PED Module H', body: 'TÜV', lastAudit: '2024-03-15', due: '2025-03-15', status: 'warn' },
    { id: 'CERT-04', name: 'ISO 3834-2', body: 'Lloyd\'s', lastAudit: '2025-01-20', due: '2028-01-20', status: 'valid' }
  ],

  /* Corrective Actions (CAPA) */
  capa: [
    { id: 'CAR-001', auditId: 'AUD-2025-01', finding: 'Welding parameters not recorded', severity: 'minor', action: 'Retrain operators', due: '2025-02-28', status: 'closed' },
    { id: 'CAR-002', auditId: 'AUD-2025-01', finding: 'Missing calibration sticker on Yoke', severity: 'minor', action: 'Implement visual check list', due: '2025-03-15', status: 'open' }
  ],

  /* Analytics Engine */
  analytics: {
    copq_trends: [42, 38, 55, 31, 28, 45, 42], // Monthly COPQ in $k
    defects_pareto: [
      { type: 'Welding Defect', count: 42, cost: 18000 },
      { type: 'Dimensional', count: 18, cost: 9500 },
      { type: 'Material Mix-up', count: 5, cost: 12000 },
      { type: 'Documentation', count: 25, cost: 2000 }
    ],
    fpy_target: 95,
    fpy_actual: 93.8
  }
};


/* ── QC Workflow Handlers ───────────────────────────────────── */

/**
 * Deep-links to a specific QC sub-page from an alert or widget.
 * Updates the sidebar active state and renders the sub-page.
 */
function qcNavigate(subPage, params = {}) {
  // Use the global router from app.js if available, otherwise call renderer directly
  if (typeof renderQCSubPage === 'function') {
    renderQCSubPage(subPage, params);
  } else {
    const fnName = 'renderQC_' + subPage.replace(/-/g, '_');
    if (typeof window[fnName] === 'function') {
      window[fnName](params.id || null);
    }
  }
  
  // Optional: Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.qcNavigate = qcNavigate; // Explicit export

function renderQC_control_centre() {
  const el = document.getElementById('pageContent');
  const openNCRs = QCData.ncr.filter(n => n.status === 'open').length;
  const overdueCal = QCData.calibration.filter(c => c.status === 'expired').length;
  const pendingRFIs = QCData.projects.reduce((acc, p) => acc + p.pendingRFIs, 0);

  el.innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label: 'Quality Yield (FPY)', value: QCData.analytics.fpy_actual + '%', color: 'var(--green)' },
        { label: 'Active NCRs', value: openNCRs, color: openNCRs > 0 ? 'var(--red)' : 'var(--text-muted)' },
        { label: 'Pending RFIs', value: pendingRFIs, color: 'var(--brand)' },
        { label: 'Calibration Overdue', value: overdueCal, color: overdueCal > 0 ? 'var(--red)' : 'var(--text-muted)' },
        { label: 'COPQ Index', value: '4.2%', color: 'var(--amber)' },
      ].map(k => `
        <div class="metric-card metric-card--glass">
          <div class="metric-label">${k.label}</div>
          <div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div>
        </div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 400px;gap:20px">
      <div style="display:flex;flex-direction:column;gap:20px">
        <!-- Pareto Analysis -->
        <div class="card">
          <div class="card-header"><span class="card-title">Defect Pareto Analysis (Top 80%)</span></div>
          <div style="padding:20px;height:240px;display:flex;align-items:flex-end;gap:15px;justify-content:center">
            ${QCData.analytics.defects_pareto.map((d, i) => `
              <div style="flex:1;max-width:60px;background:var(--brand-light);height:${(d.count/42)*100}%;border-radius:4px;position:relative">
                <div style="position:absolute;top:-20px;width:100%;text-align:center;font-size:9px;font-weight:700">${d.count}</div>
                <div style="position:absolute;bottom:-30px;width:120px;left:50%;transform:translateX(-50%);text-align:center;font-size:9px;color:var(--text-muted);white-space:nowrap">${d.type}</div>
              </div>
            `).join('')}
          </div>
          <div style="padding:40px 20px 20px;border-top:1px solid var(--border);display:flex;justify-content:space-around;font-size:11px">
            <div style="display:flex;align-items:center;gap:6px"><div style="width:10px;height:10px;background:var(--brand);border-radius:2px"></div> Defect Count</div>
            <div style="display:flex;align-items:center;gap:6px"><div style="width:10px;height:2px;background:var(--red);border-radius:2px"></div> Cumulative %</div>
          </div>
        </div>

        <!-- Project Quality Health -->
        <div class="card">
          <div class="card-header"><span class="card-title">Project Quality Health</span></div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th>Project</th><th>Yield</th><th>ITP Progress</th><th>Status</th></tr>
              </thead>
              <tbody>
                ${QCData.projects.map(p => `
                  <tr onclick="qcNavigate('itp')" style="cursor:pointer">
                    <td><div style="font-weight:600">${p.id}</div><div style="font-size:11px;color:var(--text-muted)">${p.name}</div></td>
                    <td style="font-family:var(--font-mono)">${p.yield}%</td>
                    <td>
                      <div class="progress-bar" style="height:6px;width:100px">
                        <div class="progress-fill" style="width:${p.itpProgress}%"></div>
                      </div>
                    </td>
                    <td><span class="badge ${p.openNCRs > 0 ? 'badge-red' : 'badge-green'}">${p.openNCRs > 0 ? 'NCR ACTIVE' : 'OK'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:20px">
        <!-- Critical Alerts -->
        <div class="card">
          <div class="card-header"><span class="card-title">Critical Quality Alerts</span></div>
          <div style="padding:16px;display:flex;flex-direction:column;gap:12px">
            ${overdueCal > 0 ? `
              <div class="alert alert-red" onclick="qcNavigate('calibration')" style="display:flex;gap:12px;align-items:center;cursor:pointer">
                <div style="font-size:20px">⚠️</div>
                <div style="flex:1">
                  <div style="font-weight:600">CALIBRATION EXPIRED</div>
                  <div style="font-size:11px">${overdueCal} instrument(s) used in active projects require recalibration.</div>
                </div>
                <div style="font-size:18px">›</div>
              </div>` : ''}
            ${openNCRs > 0 ? `
              <div class="alert alert-amber" onclick="qcNavigate('ncr')" style="display:flex;gap:12px;align-items:center;cursor:pointer">
                <div style="font-size:20px">📝</div>
                <div style="flex:1">
                  <div style="font-weight:600">PENDING 8D REPORTS</div>
                  <div style="font-size:11px">${openNCRs} NCRs awaiting RCA completion.</div>
                </div>
                <div style="font-size:18px">›</div>
              </div>` : ''}
          </div>
        </div>

        <!-- COQP Gauge -->
        <div class="card" style="padding:20px;text-align:center">
          <div style="font-weight:700;font-size:12px;text-transform:uppercase;margin-bottom:16px;color:var(--text-muted)">Cost of Quality (COPQ)</div>
          <div style="position:relative;width:160px;height:80px;margin:0 auto;overflow:hidden">
            <div style="width:160px;height:160px;border:16px solid var(--border);border-bottom-color:var(--amber);border-radius:50%;transform:rotate(45deg)"></div>
            <div style="position:absolute;bottom:0;width:100%;font-size:24px;font-weight:800;color:var(--text-primary)">4.2%</div>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:8px">Target: < 3.0%</div>
        </div>
      </div>
    </div>
  `;
}

function renderQC_projects(projectId = null) {
  const el = document.getElementById('pageContent');
  
  // Default to first project if none selected
  const activeProjId = projectId || QCData.projects[0].id;
  const project = QCData.projects.find(p => p.id === activeProjId);
  const itpSteps = QCData.itp[activeProjId] || [];
  
  const completedInspections = itpSteps.filter(s => s.status === 'done');
  const pendingInspections = itpSteps.filter(s => s.status === 'active' || s.status === 'pending');

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:350px 1fr;gap:20px;height:calc(100vh - 160px)">
      <!-- Left: Project Selection -->
      <div class="card" style="display:flex;flex-direction:column;overflow:hidden">
        <div class="card-header"><span class="card-title">Project Portfolio</span></div>
        <div style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:12px">
          ${QCData.projects.map(p => `
            <div class="glass-hover ${p.id === activeProjId ? 'active-glow' : ''}" 
                 onclick="renderQC_projects('${p.id}')"
                 style="padding:16px;border-radius:var(--radius-md);cursor:pointer;border:1px solid ${p.id === activeProjId ? 'var(--brand)' : 'var(--border)'};background:${p.id === activeProjId ? 'var(--bg-elevated)' : 'transparent'}">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--brand)">${p.id}</span>
                <span class="badge ${p.openNCRs > 0 ? 'badge-red' : 'badge-green'}" style="font-size:9px">${p.openNCRs > 0 ? 'NCR' : 'OK'}</span>
              </div>
              <div style="font-weight:600;font-size:14px;margin-bottom:10px">${p.name}</div>
              <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted)">
                <span>ITP Progress</span>
                <span>${p.itpProgress}%</span>
              </div>
              <div class="progress-bar" style="height:4px;margin-top:4px">
                <div class="progress-fill" style="width:${p.itpProgress}%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Right: Project Quality Command -->
      <div style="display:flex;flex-direction:column;gap:20px;overflow-y:auto;padding-right:10px">
        <!-- Header Status -->
        <div class="card" style="padding:24px;background:var(--bg-surface);border-left:4px solid var(--brand)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px">${project.client}</div>
              <h2 style="margin:0;font-size:24px;font-weight:800">${project.name}</h2>
              <div style="margin-top:12px;display:flex;gap:16px">
                <div style="display:flex;align-items:center;gap:6px;font-size:12px">
                  <span style="color:var(--text-muted)">PQM Reference:</span>
                  <span style="font-family:var(--font-mono);font-weight:600">${project.pqmRef}</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;font-size:12px">
                  <span style="color:var(--text-muted)">Quality Yield:</span>
                  <span style="font-weight:700;color:var(--green)">${project.yield}%</span>
                </div>
              </div>
            </div>
            <div style="display:flex;gap:10px">
              <button class="btn btn-muted" onclick="qcNavigate('itp', {id: '${activeProjId}'})">View Full ITP</button>
              <button class="btn btn-primary">Quality Release</button>
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <!-- Inspection Status -->
          <div class="card">
            <div class="card-header"><span class="card-title">Inspection Status (ITP)</span></div>
            <div style="padding:16px">
              <div class="metric-grid" style="grid-template-columns:1fr 1fr;margin-bottom:20px">
                <div class="metric-card">
                  <div class="metric-label">Hold Points</div>
                  <div class="metric-value">${itpSteps.filter(s => s.witness === 'H').length}</div>
                </div>
                <div class="metric-card">
                  <div class="metric-label">Witness Points</div>
                  <div class="metric-value">${itpSteps.filter(s => s.witness === 'W').length}</div>
                </div>
              </div>
              
              <div style="font-size:12px;font-weight:700;margin-bottom:12px;text-transform:uppercase">Upcoming / Active</div>
              <div style="display:flex;flex-direction:column;gap:10px">
                ${pendingInspections.slice(0, 3).map(s => `
                  <div style="padding:10px;background:var(--bg-elevated);border-radius:var(--radius-sm);border-left:2px solid var(--brand)">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                      <span style="font-weight:600;font-size:12px">${s.activity}</span>
                      <span class="badge badge-blue" style="font-size:9px">${s.type}</span>
                    </div>
                    <div style="font-size:11px;color:var(--text-muted)">Ref: ${s.reference} • Resp: ${s.resp}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Quality Log (Inspections Carried Out) -->
          <div class="card">
            <div class="card-header"><span class="card-title">Quality Log (Recent Activity)</span></div>
            <div style="padding:16px">
              <div style="display:flex;flex-direction:column;gap:16px">
                ${completedInspections.length > 0 ? completedInspections.map(s => `
                  <div style="display:flex;gap:12px">
                    <div style="width:32px;height:32px;border-radius:50%;background:rgba(20,184,166,0.1);color:var(--brand);display:flex;align-items:center;justify-content:center;flex-shrink:0">✓</div>
                    <div style="flex:1">
                      <div style="display:flex;justify-content:space-between">
                        <span style="font-weight:600;font-size:13px">${s.activity}</span>
                        <span style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono)">${s.date}</span>
                      </div>
                      <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Passed by ${s.resp} • Report #${activeProjId}-QR-${s.step}</div>
                    </div>
                  </div>
                `).join('') : `
                  <div style="padding:40px;text-align:center;color:var(--text-muted);font-size:12px">No inspections logged for this project yet.</div>
                `}
              </div>
            </div>
          </div>
        </div>

        <!-- NCR History for Project -->
        <div class="card">
          <div class="card-header"><span class="card-title">Project NCR Register</span></div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th>NCR ID</th><th>Status</th><th>Type</th><th>Severity</th><th>Raised Date</th><th>Action</th></tr>
              </thead>
              <tbody>
                ${QCData.ncr.filter(n => n.project === activeProjId).map(n => `
                  <tr>
                    <td style="font-family:var(--font-mono)">${n.id}</td>
                    <td><span class="badge ${n.status==='open'?'badge-amber':'badge-green'}">${n.status.toUpperCase()}</span></td>
                    <td>${n.type}</td>
                    <td><span class="badge ${n.severity==='high'?'badge-red':'badge-amber'}">${n.severity.toUpperCase()}</span></td>
                    <td style="font-size:11px">${n.raisedDate}</td>
                    <td><button class="btn btn-muted btn-xs" onclick="qcNavigate('ncr', {id: '${n.id}'})">View RCA</button></td>
                  </tr>
                `).join('')}
                ${QCData.ncr.filter(n => n.project === activeProjId).length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">No non-conformances raised for this project.</td></tr>' : ''}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderQC_inspections() {
  const el = document.getElementById('pageContent');
  const view = QCData.rfiView || 'list';
  let rfis = QCData.inspectionRequests || [];

  // Apply filters if they exist
  const fProject = document.getElementById('rfi-filter-project')?.value || 'All Projects';
  const fStatus = document.getElementById('rfi-filter-status')?.value || 'All Statuses';
  const fSearch = document.getElementById('rfi-filter-search')?.value.toLowerCase() || '';

  if (fProject !== 'All Projects') {
    rfis = rfis.filter(r => r.project === fProject);
  }
  if (fStatus !== 'All Statuses') {
    rfis = rfis.filter(r => r.status.toLowerCase() === fStatus.toLowerCase());
  }
  if (fSearch) {
    rfis = rfis.filter(r => 
      r.id.toLowerCase().includes(fSearch) || 
      r.activity.toLowerCase().includes(fSearch) || 
      (r.assignedInspector && r.assignedInspector.toLowerCase().includes(fSearch))
    );
  }

  // KPI Calculations
  const totalRfis = rfis.length;
  const pendingReview = rfis.filter(r => r.status === 'submitted').length;
  const scheduledToday = rfis.filter(r => r.scheduledDate === new Date().toISOString().split('T')[0]).length;
  const inProgress = rfis.filter(r => r.status === 'in-progress').length;
  const overdue = rfis.filter(r => r.status !== 'completed' && r.status !== 'closed' && new Date(r.scheduledDate) < new Date().setHours(0,0,0,0)).length;
  const completionRate = totalRfis > 0 ? Math.round((rfis.filter(r => r.status === 'completed' || r.status === 'closed').length / totalRfis) * 100) : 0;

  el.innerHTML = `
    <!-- Page header -->
    <div class="page-header" style="margin-bottom:20px">
      <div>
        <div class="page-title">Inspection Requests (RFI)</div>
        <div class="page-subtitle">Manage workflow, scheduling, and approvals for all project inspections</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="renderQC_inspections()">
          <svg viewBox="0 0 15 15" fill="none" style="width:14px"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Refresh
        </button>
        <button class="btn btn-primary btn-sm" onclick="openNewRfiModal()">
          <svg viewBox="0 0 15 15" fill="none" style="width:14px"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Raise New RFI
        </button>
      </div>
    </div>

    <!-- KPI Dashboard Strip -->
    <div class="metric-grid" style="margin-bottom:20px">
      <div class="metric-card metric-card--glass">
        <div class="metric-label">Total RFIs</div>
        <div class="metric-value" style="color:var(--brand)">${totalRfis}</div>
      </div>
      <div class="metric-card metric-card--glass">
        <div class="metric-label">Pending Review</div>
        <div class="metric-value" style="color:var(--amber)">${pendingReview}</div>
      </div>
      <div class="metric-card metric-card--glass">
        <div class="metric-label">Scheduled Today</div>
        <div class="metric-value" style="color:var(--blue)">${scheduledToday}</div>
      </div>
      <div class="metric-card metric-card--glass">
        <div class="metric-label">In Progress</div>
        <div class="metric-value" style="color:var(--brand)">${inProgress}</div>
      </div>
      <div class="metric-card metric-card--glass">
        <div class="metric-label">Overdue</div>
        <div class="metric-value" style="color:var(--red)">${overdue}</div>
      </div>
      <div class="metric-card metric-card--glass">
        <div class="metric-label">Completion</div>
        <div class="metric-value" style="color:var(--green)">${completionRate}%</div>
      </div>
    </div>

    <!-- Filter Bar & View Toggle -->
    <div class="rfi-filter-bar">
      <div class="rfi-view-toggle">
        <button class="rfi-view-btn ${view==='list'?'active':''}" onclick="QCData.rfiView='list';renderQC_inspections()">List</button>
        <button class="rfi-view-btn ${view==='calendar'?'active':''}" onclick="QCData.rfiView='calendar';renderQC_inspections()">Calendar</button>
      </div>
      
      <div style="flex:1;display:flex;gap:10px">
        <select id="rfi-filter-project" class="form-control-xs" style="width:150px" onchange="renderQC_inspections()">
          <option value="All Projects">All Projects</option>
          ${QCData.projects.map(p => `<option value="${p.id}" ${fProject === p.id ? 'selected' : ''}>${p.id}</option>`).join('')}
        </select>
        <select id="rfi-filter-status" class="form-control-xs" style="width:150px" onchange="renderQC_inspections()">
          <option value="All Statuses">All Statuses</option>
          <option value="submitted" ${fStatus === 'submitted' ? 'selected' : ''}>Submitted</option>
          <option value="accepted" ${fStatus === 'accepted' ? 'selected' : ''}>Accepted</option>
          <option value="in-progress" ${fStatus === 'in-progress' ? 'selected' : ''}>In Progress</option>
          <option value="completed" ${fStatus === 'completed' ? 'selected' : ''}>Completed</option>
          <option value="closed" ${fStatus === 'closed' ? 'selected' : ''}>Closed</option>
        </select>
        <div style="position:relative;flex:1">
          <input id="rfi-filter-search" type="text" class="form-control-xs" placeholder="Search RFI by ID, activity, or inspector..." style="padding-left:30px" value="${fSearch}" oninput="renderQC_inspections()">
          <svg viewBox="0 0 15 15" fill="none" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);width:12px;color:var(--text-muted)"><path d="M14.5 14.5l-4-4m-4 2a6 6 0 110-12 6 6 0 010 12z" stroke="currentColor" stroke-width="1.5"/></svg>
        </div>
      </div>
    </div>

    ${view === 'list' ? _renderRfiList(rfis) : _renderRfiCalendar(rfis)}
  `;
}

function _renderRfiList(rfis) {
  return `
    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>RFI Details</th>
              <th>Activity / ITP Step</th>
              <th>Priority</th>
              <th>Scheduling</th>
              <th>Inspector</th>
              <th>Status</th>
              <th>Result</th>
              <th style="width:100px">Action</th>
            </tr>
          </thead>
          <tbody>
            ${rfis.map(r => {
              const statusMap = {
                draft: 'badge-muted',
                submitted: 'badge-amber',
                accepted: 'badge-blue',
                'in-progress': 'badge-accent',
                completed: 'badge-green',
                closed: 'badge-green',
                rejected: 'badge-red',
                cancelled: 'badge-muted'
              };
              const priorityMap = {
                Normal: 'priority-normal',
                Urgent: 'priority-urgent',
                Critical: 'priority-critical'
              };
              const isOverdue = r.status !== 'completed' && r.status !== 'closed' && new Date(r.scheduledDate) < new Date().setHours(0,0,0,0);
              
              return `
                <tr class="stagger-in" style="cursor:pointer" onclick="openRfiDetailPanel('${r.id}')">
                  <td>
                    <div style="font-family:var(--font-mono);font-weight:700;color:var(--brand);font-size:12px">${r.id}</div>
                    <div style="font-size:11px;font-weight:600;margin-top:2px">${r.project}</div>
                  </td>
                  <td>
                    <div style="font-weight:600;font-size:13px">${r.activity}</div>
                    <div style="font-size:10px;color:var(--text-muted);margin-top:2px">ITP Step: ${r.itpStep} · ${r.type}</div>
                  </td>
                  <td><span class="priority-pill ${priorityMap[r.priority]}">${r.priority}</span></td>
                  <td>
                    <div style="font-size:11px;color:${isOverdue?'var(--red)':'inherit'};font-weight:${isOverdue?'700':'400'}">${r.scheduledDate}</div>
                    <div style="font-size:10px;color:var(--text-muted)">${r.location}</div>
                  </td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div style="width:24px;height:24px;border-radius:50%;background:var(--brand-light);color:var(--brand);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800">${r.assignedInspector ? r.assignedInspector.charAt(0) : '?'}</div>
                      <span style="font-size:12px">${r.assignedInspector || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td><span class="badge ${statusMap[r.status]}">${r.status.toUpperCase()}</span></td>
                  <td>${r.result ? `<span class="badge ${r.result==='Pass'?'badge-green':r.result==='Fail'?'badge-red':'badge-amber'}">${r.result}</span>` : '—'}</td>
                  <td>
                    <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();openRfiDetailPanel('${r.id}')">View Details</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function _renderRfiCalendar(rfis) {
  // Simple week view for demonstration
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const today = new Date();
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1));
  
  return `
    <div class="rfi-calendar-grid">
      ${days.map(d => `<div class="rfi-calendar-header">${d}</div>`).join('')}
      ${days.map((d, i) => {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayRfis = rfis.filter(r => r.scheduledDate === dateStr);
        
        return `
          <div class="rfi-calendar-cell">
            <div class="rfi-calendar-day">
              <span>${date.getDate()}</span>
              ${dateStr === new Date().toISOString().split('T')[0] ? '<span class="badge badge-accent" style="font-size:8px">TODAY</span>' : ''}
            </div>
            ${dayRfis.map(r => `
              <div class="rfi-card-mini ${r.priority === 'Critical' ? 'priority-critical' : r.priority === 'Urgent' ? 'priority-urgent' : ''}" onclick="openRfiDetailPanel('${r.id}')">
                <div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.id}</div>
                <div style="color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.activity}</div>
              </div>
            `).join('')}
          </div>
        `;
      }).join('')}
    </div>
    <div style="margin-top:12px;font-size:11px;color:var(--text-muted);text-align:center">
      Note: This is a simplified week-view calendar implementation for demonstration.
    </div>
  `;
}

function renderQC_ncr(ncrId = null) {
  // If a specific NCR id is passed, show the 8D detail view
  if (ncrId) { _renderNCR8D(ncrId); return; }
  // Otherwise show the log book (NCR or Complaints depending on state)
  if ((QCData.ncrView || 'ncr') === 'complaints') { renderComplaintLogBook(); return; }
  renderNCRLogBook();
}

function renderNCRLogBook() {
  QCData.ncrView = 'ncr';
  const el  = document.getElementById('pageContent');
  const ncrs = QCData.ncr || [];
  const open = ncrs.filter(n => n.status === 'open').length;

  el.innerHTML = `
    <div class="page-header" style="margin-bottom:16px">
      <div>
        <div class="page-title">NCR & Complaint Log Books</div>
        <div class="page-subtitle">Non-conformance register · Customer complaint log · 8D corrective action</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="openAddManualNCRModal()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Log NCR manually
        </button>
        <button class="btn btn-primary btn-sm" onclick="openAddManualNCRModal()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Raise NCR
        </button>
      </div>
    </div>

    <!-- Sub-view toggle -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div class="itp-view-toggle">
        <button class="btn btn-primary btn-sm">NCR Log Book</button>
        <button class="btn btn-ghost btn-sm" onclick="renderComplaintLogBook()">Customer Complaint Log</button>
      </div>
      <span class="badge badge-red" style="font-size:10px">${open} open</span>
      <span class="badge badge-green" style="font-size:10px">${ncrs.filter(n=>n.status==='closed').length} closed</span>
      <span style="font-size:12px;color:var(--text-muted)">${ncrs.length} total NCRs</span>
    </div>

    <!-- NCR log table -->
    <div class="card" style="padding:0;overflow:hidden">
      <div style="overflow-x:auto">
        <table class="itp-table" style="min-width:860px">
          <thead>
            <tr>
              <th style="width:110px">NCR No.</th>
              <th style="width:90px">Date raised</th>
              <th style="width:75px">Project</th>
              <th style="width:80px">Type</th>
              <th>Title / Description</th>
              <th style="width:72px">Severity</th>
              <th style="width:90px">Status</th>
              <th style="width:100px">RCA status</th>
              <th style="width:40px"></th>
            </tr>
          </thead>
          <tbody>
            ${ncrs.length === 0 ? `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text-muted)">No NCRs raised yet.</td></tr>` : ''}
            ${ncrs.map(n => {
              const sevColor = n.severity === 'high' ? 'var(--red)' : n.severity === 'medium' ? 'var(--amber)' : 'var(--blue)';
              const rowCls   = n.status === 'open' && n.severity === 'high' ? 'itp-hold-row' : n.status === 'closed' ? 'itp-done-row' : 'itp-active-row';
              const rcaColor = { done:'var(--green)', 'in-progress':'var(--brand)', pending:'var(--text-muted)' }[n.rcaStatus] || 'var(--text-muted)';
              return `
              <tr class="${rowCls}" style="cursor:pointer" onclick="renderQC_ncr('${n.id}')">
                <td style="font-family:var(--font-mono);font-size:11px;color:var(--brand);font-weight:600">${n.id}</td>
                <td style="font-size:11px;color:var(--text-muted)">${n.raisedDate}</td>
                <td style="font-size:11px;font-family:var(--font-mono);color:var(--text-secondary)">${n.project}</td>
                <td><span style="display:inline-block;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:600;background:var(--bg-elevated);color:var(--text-secondary)">${n.type||'—'}</span></td>
                <td>
                  <div style="font-size:13px;color:var(--text-primary);font-weight:500">${n.title}</div>
                  ${n.d_steps?.D2 ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px">${n.d_steps.D2.text.slice(0,80)}…</div>` : ''}
                </td>
                <td><span style="display:inline-block;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:700;text-transform:uppercase;background:${sevColor}20;color:${sevColor}">${n.severity}</span></td>
                <td><span class="badge ${n.status==='closed'?'badge-green':n.status==='open'?'badge-red':'badge-amber'}" style="font-size:10px">${n.status}</span></td>
                <td style="font-size:11px;color:${rcaColor};font-weight:500">${(n.rcaStatus||'pending').replace('-',' ')}</td>
                <td>
                  <button class="btn-icon" title="Open 8D report" onclick="event.stopPropagation();renderQC_ncr('${n.id}')">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 3l5 3.5L5 10V3z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>
                  </button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderComplaintLogBook() {
  QCData.ncrView = 'complaints';
  const el  = document.getElementById('pageContent');
  const cc  = QCData.complaints || [];
  const open = cc.filter(c => c.status === 'open').length;
  const catColor = { Quality:'var(--red)', Documentation:'var(--blue)', Delivery:'var(--amber)', Communication:'var(--brand)', Safety:'var(--red)', Other:'var(--text-muted)' };

  el.innerHTML = `
    <div class="page-header" style="margin-bottom:16px">
      <div>
        <div class="page-title">NCR & Complaint Log Books</div>
        <div class="page-subtitle">Non-conformance register · Customer complaint log · 8D corrective action</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary btn-sm" onclick="openAddComplaintModal()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Log complaint
        </button>
      </div>
    </div>

    <!-- Sub-view toggle -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div class="itp-view-toggle">
        <button class="btn btn-ghost btn-sm" onclick="renderNCRLogBook()">NCR Log Book</button>
        <button class="btn btn-primary btn-sm">Customer Complaint Log</button>
      </div>
      <span class="badge badge-red" style="font-size:10px">${open} open</span>
      <span class="badge badge-green" style="font-size:10px">${cc.filter(c=>c.status==='closed').length} closed</span>
      <span style="font-size:12px;color:var(--text-muted)">${cc.length} total complaints</span>
    </div>

    <!-- Complaint log table -->
    <div class="card" style="padding:0;overflow:hidden">
      <div style="overflow-x:auto">
        <table class="itp-table" style="min-width:980px">
          <thead>
            <tr>
              <th style="width:78px">CC No.</th>
              <th style="width:88px">Date</th>
              <th style="width:120px">Customer</th>
              <th style="width:68px">Project</th>
              <th style="width:100px">Category</th>
              <th>Subject / Description</th>
              <th style="width:66px">Severity</th>
              <th style="width:72px">Status</th>
              <th style="width:120px">Action taken</th>
              <th style="width:88px">Target date</th>
              <th style="width:40px"></th>
            </tr>
          </thead>
          <tbody>
            ${cc.length === 0 ? `<tr><td colspan="11" style="text-align:center;padding:32px;color:var(--text-muted)">No customer complaints logged yet.</td></tr>` : ''}
            ${cc.map((c, i) => {
              const sevColor = c.severity === 'critical' ? 'var(--red)' : c.severity === 'major' ? 'var(--amber)' : 'var(--blue)';
              const catCol   = catColor[c.category] || 'var(--text-muted)';
              const overdue  = c.status === 'open' && c.targetDate && new Date(c.targetDate) < new Date();
              const rowCls   = c.status === 'closed' ? 'itp-done-row' : overdue ? 'itp-hold-row' : 'itp-active-row';
              return `
                <tr class="${rowCls}" style="cursor:pointer" onclick="_renderComplaintCAPA('${c.id}')">
                  <td style="font-family:var(--font-mono);font-size:11px;color:var(--brand);font-weight:600">${c.id}</td>
                  <td style="font-size:11px;color:var(--text-muted)">${c.date}</td>
                  <td style="font-size:12px;color:var(--text-primary);font-weight:500">${c.customer}</td>
                  <td style="font-size:11px;font-family:var(--font-mono);color:var(--text-secondary)">${c.project}</td>
                  <td><span style="display:inline-block;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:600;background:${catCol}20;color:${catCol}">${c.category}</span></td>
                  <td>
                    <div style="font-size:13px;color:var(--text-primary);font-weight:500">${c.subject}</div>
                    <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${c.description.slice(0,80)}…</div>
                  </td>
                  <td><span style="display:inline-block;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:700;text-transform:uppercase;background:${sevColor}20;color:${sevColor}">${c.severity}</span></td>
                  <td>
                    <span class="badge ${c.status==='closed'?'badge-green':'badge-red'}" style="font-size:10px">${c.status}</span>
                    ${overdue ? `<div style="font-size:10px;color:var(--red);margin-top:3px">Overdue</div>` : ''}
                  </td>
                  <td style="font-size:11px;color:var(--text-secondary)">${c.actionTaken ? c.actionTaken.slice(0,50)+'…' : '—'}</td>
                  <td style="font-size:11px;color:${overdue?'var(--red)':'var(--text-muted)'}">${c.targetDate||'—'}</td>
                  <td>
                    <button class="btn-icon" onclick="event.stopPropagation();_renderComplaintCAPA('${c.id}')">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" stroke-width="1.2"/><path d="M6.5 5v4M6.5 4V3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
                    </button>
                  </td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function _renderComplaintCAPA(ccId) {
  const el  = document.getElementById('pageContent');
  const cc  = QCData.complaints || [];
  const c   = cc.find(x => x.id === ccId) || cc[0];
  if (!c) return;

  const sevColor = { critical:'var(--red)', major:'var(--amber)', minor:'var(--blue)' }[c.severity] || 'var(--blue)';
  const catColor = { Quality:'var(--red)', Documentation:'var(--blue)', Delivery:'var(--amber)', Communication:'var(--brand)', Safety:'var(--red)', Other:'var(--text-muted)' };
  const catCol   = catColor[c.category] || 'var(--text-muted)';
  const cp       = c.capa || {};
  const steps    = ['C1','C2','C3','C4','C5','C6','C7','C8'];
  const stepLabels = { C1:'Problem Statement', C2:'Containment', C3:'Root Cause', C4:'Corrective Actions', C5:'Preventive Actions', C6:'Implementation', C7:'Customer Response', C8:'Closure' };

  const _sd = s => s==='done' ? 'var(--green)' : s==='in-progress' ? 'var(--brand)' : 'var(--border-md)';
  const _sb = s => s==='done'
    ? `<span class="badge badge-green" style="font-size:9px">Done</span>`
    : s==='in-progress'
      ? `<span class="badge badge-accent" style="font-size:9px">In Progress</span>`
      : `<span class="badge badge-muted" style="font-size:9px">Pending</span>`;
  const _ab = s => ({ done:`<span class="badge badge-green" style="font-size:9px">Done</span>`, 'in-progress':`<span class="badge badge-accent" style="font-size:9px">In Progress</span>`, pending:`<span class="badge badge-muted" style="font-size:9px">Pending</span>` }[s] || '');

  const stepper = steps.map(k => {
    const st = (cp[k]||{}).status || 'pending';
    return `
      <div style="display:flex;flex-direction:column;align-items:center;gap:5px;opacity:${st==='pending'?'0.4':'1'}">
        <div style="width:22px;height:22px;border-radius:50%;background:${st==='done'?'var(--green)':st==='in-progress'?'var(--brand)':'var(--border-md)'};color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700">${st==='done'?'✓':k}</div>
        <span style="font-size:8px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;text-align:center;max-width:54px;line-height:1.2">${stepLabels[k]}</span>
      </div>`;
  }).join('<div style="flex:1;height:2px;background:var(--border);margin-top:11px"></div>');

  const isIs = (cp.C1||{}).isIs || {};
  const isIsLabels = ['WHAT','WHEN','WHERE','HOW MUCH'];
  const isIsData = [
    [isIs.is, isIs.isNot],
    [isIs.whenIs, isIs.whenIsNot],
    [isIs.whereIs, isIs.whereIsNot],
    [isIs.howMuchIs, isIs.howMuchIsNot],
  ];

  const fb = (cp.C3||{}).fishbone || {};
  const _fbt = (items, x, y) => (items||[]).slice(0,2).map((t,i) =>
    `<text x="${x}" y="${y+i*13}" font-size="9" fill="var(--text-secondary)">${t.length>24?t.slice(0,24)+'…':t}</text>`).join('');

  const _actionRows = (actions, showScope) => (actions||[]).map(a => `
    <tr>
      <td style="font-size:11px;color:var(--text-primary);line-height:1.4;padding:6px 8px;border:1px solid var(--border)">${a.action}</td>
      ${showScope ? `<td style="font-size:10px;color:var(--text-secondary);padding:6px 8px;border:1px solid var(--border);white-space:nowrap">${a.scope||'—'}</td>` : ''}
      <td style="font-size:10px;color:var(--text-muted);padding:6px 8px;border:1px solid var(--border);white-space:nowrap">${a.owner}</td>
      <td style="font-size:10px;color:var(--text-muted);padding:6px 8px;border:1px solid var(--border);white-space:nowrap">${a.dueDate||a.date||'—'}</td>
      <td style="padding:6px 8px;border:1px solid var(--border)">${_ab(a.status||(a.verified?'done':'pending'))}</td>
      ${!showScope ? `<td style="font-size:10px;color:var(--text-muted);padding:6px 8px;border:1px solid var(--border)">${a.evidence||'—'}</td>` : ''}
    </tr>`).join('');

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:270px 1fr;gap:16px;height:calc(100vh - 140px)">

      <!-- Complaint List -->
      <div class="card" style="display:flex;flex-direction:column;overflow:hidden">
        <div class="card-header" style="justify-content:space-between">
          <span class="card-title" style="font-size:12px">Complaints</span>
          <button class="btn btn-ghost btn-xs" onclick="renderComplaintLogBook()">← Log</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:7px">
          ${cc.map(x => {
            const sc = {critical:'var(--red)',major:'var(--amber)',minor:'var(--blue)'}[x.severity]||'var(--blue)';
            const active = x.id === c.id;
            return `
            <div class="alert ${active?'alert-blue active-glow':'alert-muted'}" onclick="_renderComplaintCAPA('${x.id}')"
                 style="cursor:pointer;padding:10px;transition:all .2s">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--brand)">${x.id}</span>
                <span style="display:inline-block;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:700;background:${sc}20;color:${sc}">${x.severity}</span>
              </div>
              <div style="font-size:11px;font-weight:600;line-height:1.3;margin-bottom:2px">${x.subject.length>52?x.subject.slice(0,52)+'…':x.subject}</div>
              <div style="font-size:10px;color:var(--text-muted)">${x.customer} · ${x.date}</div>
              <div style="margin-top:5px;display:flex;gap:3px">
                ${steps.map(k => `<div style="flex:1;height:3px;border-radius:2px;background:${_sd((x.capa||{})[k]?(x.capa[k].status||'pending'):'pending')}"></div>`).join('')}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- CAPA Report -->
      <div class="card" style="display:flex;flex-direction:column;overflow:hidden">
        <div class="card-header" style="justify-content:space-between;gap:8px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span class="card-title">CAPA Report</span>
            <span class="badge badge-blue" style="font-family:var(--font-mono)">${c.id}</span>
            <span style="display:inline-block;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:600;background:${catCol}20;color:${catCol}">${c.category}</span>
            <span style="display:inline-block;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:700;text-transform:uppercase;background:${sevColor}20;color:${sevColor}">${c.severity}</span>
            <span class="badge ${c.status==='closed'?'badge-green':'badge-red'}" style="font-size:10px">${c.status}</span>
          </div>
          <button class="btn btn-muted btn-xs" onclick="showToast('Exporting CAPA report…','info')">Export PDF</button>
        </div>
        <div style="padding:10px 18px;background:var(--bg-elevated);border-bottom:1px solid var(--border)">
          <div style="font-size:14px;font-weight:700">${c.subject}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${c.customer} · ${c.project} · Received ${c.date} via ${c.receivedVia}</div>
        </div>
        <!-- CAPA Stepper -->
        <div style="padding:12px 18px;background:var(--bg-elevated);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start">${stepper}</div>
        <!-- Scrollable body -->
        <div style="flex:1;overflow-y:auto;padding:18px">
          <div style="display:grid;grid-template-columns:1fr 300px;gap:18px">

            <!-- LEFT: C1, C3, C4, C5 -->
            <div style="display:flex;flex-direction:column;gap:18px">

              <!-- C1: Problem Statement + IS/IS-NOT -->
              <div class="card" style="padding:16px">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
                  <div style="width:20px;height:20px;border-radius:50%;background:${_sd((cp.C1||{}).status||'pending')};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff">C1</div>
                  <span style="font-weight:700;font-size:13px;color:var(--brand)">Problem Statement</span>
                  ${_sb((cp.C1||{}).status||'pending')}
                </div>
                ${cp.C1&&cp.C1.statement ? `<p style="font-size:12px;line-height:1.6;color:var(--text-secondary);margin-bottom:14px">${cp.C1.statement}</p>` : ''}
                ${isIsData[0][0] ? `
                <table style="width:100%;border-collapse:collapse;font-size:11px">
                  <thead><tr>
                    <th style="width:68px;padding:5px 8px;background:var(--bg-elevated);border:1px solid var(--border);font-size:9px;text-transform:uppercase;color:var(--text-muted)"></th>
                    <th style="padding:5px 8px;background:var(--bg-elevated);border:1px solid var(--border);font-size:9px;text-transform:uppercase;color:var(--green)">IS — Problem Exists</th>
                    <th style="padding:5px 8px;background:var(--bg-elevated);border:1px solid var(--border);font-size:9px;text-transform:uppercase;color:var(--text-muted)">IS NOT — Does Not Apply</th>
                  </tr></thead>
                  <tbody>
                    ${isIsLabels.map((lbl,i) => `
                    <tr>
                      <td style="padding:6px 8px;border:1px solid var(--border);background:var(--bg-elevated);font-size:9px;font-weight:700;color:var(--text-muted);text-transform:uppercase">${lbl}</td>
                      <td style="padding:6px 8px;border:1px solid var(--border);color:var(--text-primary)">${isIsData[i][0]||'—'}</td>
                      <td style="padding:6px 8px;border:1px solid var(--border);color:var(--text-secondary)">${isIsData[i][1]||'—'}</td>
                    </tr>`).join('')}
                  </tbody>
                </table>` : ''}
              </div>

              <!-- C3: Root Cause Analysis -->
              <div class="card" style="padding:16px">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
                  <div style="width:20px;height:20px;border-radius:50%;background:${_sd((cp.C3||{}).status||'pending')};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff">C3</div>
                  <span style="font-weight:700;font-size:13px;color:var(--brand)">Root Cause Analysis</span>
                  ${_sb((cp.C3||{}).status||'pending')}
                </div>
                <div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">5-Why Analysis</div>
                <div style="display:flex;flex-direction:column;gap:5px;margin-bottom:16px">
                  ${((cp.C3||{}).whys||[]).map((why,i,arr) => `
                  <div style="display:flex;gap:8px;align-items:flex-start">
                    <div style="min-width:20px;height:20px;border-radius:50%;background:${i===0?'var(--brand)':'var(--bg-elevated)'};border:1px solid ${i===0?'var(--brand)':'var(--border)'};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:${i===0?'#fff':'var(--text-muted)'}">W${i+1}</div>
                    <div style="flex:1;padding:7px 10px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:6px;font-size:11px;line-height:1.4;color:var(--text-primary)${i===arr.length-1?';border-left:3px solid var(--red)':''}">${why}</div>
                  </div>`).join('')}
                </div>
                ${cp.C3&&cp.C3.rootCause ? `<div style="padding:10px 12px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:6px;margin-bottom:14px">
                  <div style="font-size:9px;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px">Root Cause Identified</div>
                  <div style="font-size:12px;color:var(--text-primary);line-height:1.5">${cp.C3.rootCause}</div>
                </div>` : ''}
                <div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Ishikawa Fishbone Diagram</div>
                <div style="background:var(--bg-elevated);border-radius:10px;padding:12px">
                  <svg viewBox="0 0 580 270" style="width:100%;height:auto">
                    <line x1="40" y1="135" x2="520" y2="135" stroke="var(--text-primary)" stroke-width="2.5"/>
                    <polygon points="520,135 506,128 506,142" fill="var(--text-primary)"/>
                    <rect x="522" y="118" width="52" height="34" rx="4" fill="var(--brand)" opacity=".15" stroke="var(--brand)" stroke-width="1"/>
                    <text x="548" y="133" font-size="8" fill="var(--brand)" text-anchor="middle" font-weight="700">EFFECT</text>
                    <text x="548" y="145" font-size="7" fill="var(--brand)" text-anchor="middle">${c.category}</text>
                    <line x1="120" y1="135" x2="80" y2="62" stroke="var(--border-md)" stroke-width="1.8"/>
                    <line x1="280" y1="135" x2="240" y2="62" stroke="var(--border-md)" stroke-width="1.8"/>
                    <line x1="420" y1="135" x2="380" y2="62" stroke="var(--border-md)" stroke-width="1.8"/>
                    <line x1="120" y1="135" x2="160" y2="208" stroke="var(--border-md)" stroke-width="1.8"/>
                    <line x1="280" y1="135" x2="320" y2="208" stroke="var(--border-md)" stroke-width="1.8"/>
                    <line x1="420" y1="135" x2="460" y2="208" stroke="var(--border-md)" stroke-width="1.8"/>
                    <text x="62" y="53" font-size="10" font-weight="700" fill="var(--brand)" text-anchor="middle">MAN</text>
                    <text x="222" y="53" font-size="10" font-weight="700" fill="var(--brand)" text-anchor="middle">MACHINE</text>
                    <text x="362" y="53" font-size="10" font-weight="700" fill="var(--brand)" text-anchor="middle">MATERIAL</text>
                    <text x="142" y="226" font-size="10" font-weight="700" fill="var(--brand)" text-anchor="middle">METHOD</text>
                    <text x="302" y="226" font-size="10" font-weight="700" fill="var(--brand)" text-anchor="middle">MEASUREMENT</text>
                    <text x="442" y="226" font-size="10" font-weight="700" fill="var(--brand)" text-anchor="middle">ENVIRONMENT</text>
                    ${_fbt(fb.man, 30, 78)}
                    ${_fbt(fb.machine, 190, 78)}
                    ${_fbt(fb.material, 328, 78)}
                    ${_fbt(fb.method, 88, 185)}
                    ${_fbt(fb.measurement, 248, 185)}
                    ${_fbt(fb.environment, 388, 185)}
                  </svg>
                </div>
              </div>

              <!-- C4: Corrective Actions -->
              <div class="card" style="padding:16px">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
                  <div style="width:20px;height:20px;border-radius:50%;background:${_sd((cp.C4||{}).status||'pending')};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff">C4</div>
                  <span style="font-weight:700;font-size:13px;color:var(--brand)">Corrective Actions</span>
                  ${_sb((cp.C4||{}).status||'pending')}
                </div>
                ${(cp.C4||{}).actions&&cp.C4.actions.length ? `
                <div style="overflow-x:auto">
                  <table style="width:100%;border-collapse:collapse">
                    <thead><tr style="background:var(--bg-elevated)">
                      <th style="padding:5px 8px;border:1px solid var(--border);text-align:left;font-size:9px;color:var(--text-muted);text-transform:uppercase">Action</th>
                      <th style="padding:5px 8px;border:1px solid var(--border);text-align:left;font-size:9px;color:var(--text-muted);text-transform:uppercase;white-space:nowrap">Owner</th>
                      <th style="padding:5px 8px;border:1px solid var(--border);text-align:left;font-size:9px;color:var(--text-muted);text-transform:uppercase;white-space:nowrap">Due</th>
                      <th style="padding:5px 8px;border:1px solid var(--border);text-align:left;font-size:9px;color:var(--text-muted);text-transform:uppercase">Status</th>
                      <th style="padding:5px 8px;border:1px solid var(--border);text-align:left;font-size:9px;color:var(--text-muted);text-transform:uppercase">Evidence</th>
                    </tr></thead>
                    <tbody>${_actionRows(cp.C4.actions, false)}</tbody>
                  </table>
                </div>` : `<div style="font-size:12px;color:var(--text-muted)">No corrective actions defined yet.</div>`}
              </div>

              <!-- C5: Preventive Actions -->
              <div class="card" style="padding:16px">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
                  <div style="width:20px;height:20px;border-radius:50%;background:${_sd((cp.C5||{}).status||'pending')};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff">C5</div>
                  <span style="font-weight:700;font-size:13px;color:var(--brand)">Preventive Actions</span>
                  ${_sb((cp.C5||{}).status||'pending')}
                </div>
                ${(cp.C5||{}).actions&&cp.C5.actions.length ? `
                <div style="overflow-x:auto">
                  <table style="width:100%;border-collapse:collapse">
                    <thead><tr style="background:var(--bg-elevated)">
                      <th style="padding:5px 8px;border:1px solid var(--border);text-align:left;font-size:9px;color:var(--text-muted);text-transform:uppercase">Preventive Action</th>
                      <th style="padding:5px 8px;border:1px solid var(--border);text-align:left;font-size:9px;color:var(--text-muted);text-transform:uppercase">Scope</th>
                      <th style="padding:5px 8px;border:1px solid var(--border);text-align:left;font-size:9px;color:var(--text-muted);text-transform:uppercase;white-space:nowrap">Owner</th>
                      <th style="padding:5px 8px;border:1px solid var(--border);text-align:left;font-size:9px;color:var(--text-muted);text-transform:uppercase;white-space:nowrap">Due</th>
                      <th style="padding:5px 8px;border:1px solid var(--border);text-align:left;font-size:9px;color:var(--text-muted);text-transform:uppercase">Status</th>
                    </tr></thead>
                    <tbody>${_actionRows(cp.C5.actions, true)}</tbody>
                  </table>
                </div>` : `<div style="font-size:12px;color:var(--text-muted)">No preventive actions defined yet.</div>`}
              </div>
            </div>

            <!-- RIGHT SIDEBAR: info + C2 + C6 + C7 + C8 -->
            <div style="display:flex;flex-direction:column;gap:14px">

              <!-- Complaint info -->
              <div class="card" style="padding:13px;background:var(--bg-elevated)">
                <div style="font-size:9px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:9px">Complaint Info</div>
                ${[['Customer',c.customer],['Project',c.project],['Received by',c.receivedBy],['Via',c.receivedVia],['Target date',c.targetDate||'—'],['Closed',c.closedDate||'Open']].map(([l,v])=>`
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border);font-size:11px">
                  <span style="color:var(--text-muted)">${l}</span>
                  <span style="color:var(--text-primary);font-weight:500">${v}</span>
                </div>`).join('')}
              </div>

              <!-- C2: Containment -->
              <div class="card" style="padding:13px">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
                  <div style="width:18px;height:18px;border-radius:50%;background:${_sd((cp.C2||{}).status||'pending')};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff">C2</div>
                  <span style="font-weight:700;font-size:11px">Containment</span>
                  ${_sb((cp.C2||{}).status||'pending')}
                </div>
                ${((cp.C2||{}).actions||[]).map(a=>`
                <div style="display:flex;gap:7px;align-items:flex-start;padding:5px 0;border-bottom:1px solid var(--border)">
                  <div style="width:12px;height:12px;border-radius:50%;background:${a.verified?'var(--green)':'var(--border-md)'};flex-shrink:0;margin-top:2px"></div>
                  <div>
                    <div style="font-size:11px;color:var(--text-primary);line-height:1.4">${a.action}</div>
                    <div style="font-size:10px;color:var(--text-muted);margin-top:1px">${a.owner} · ${a.date}</div>
                  </div>
                </div>`).join('')}
                ${!(cp.C2||{}).actions||(cp.C2.actions||[]).length===0?`<div style="font-size:11px;color:var(--text-muted)">No containment actions yet.</div>`:''}
              </div>

              <!-- C6: Implementation & Verification -->
              <div class="card" style="padding:13px">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
                  <div style="width:18px;height:18px;border-radius:50%;background:${_sd((cp.C6||{}).status||'pending')};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff">C6</div>
                  <span style="font-weight:700;font-size:11px">Implementation</span>
                  ${_sb((cp.C6||{}).status||'pending')}
                </div>
                ${cp.C6&&cp.C6.evidence ? `
                <div style="font-size:11px;color:var(--text-primary);line-height:1.5;margin-bottom:7px">${cp.C6.evidence}</div>
                <div style="font-size:10px;color:var(--text-muted)">Verified: <strong style="color:var(--text-secondary)">${cp.C6.verifiedBy||'—'}</strong> · ${cp.C6.verifiedDate||'—'}</div>
                ${cp.C6.effective!==null?`<div style="margin-top:6px;padding:4px 8px;border-radius:4px;font-size:10px;font-weight:700;background:${cp.C6.effective?'rgba(45,212,160,.12)':'rgba(239,68,68,.12)'};color:${cp.C6.effective?'var(--green)':'var(--red)'}">
                  ${cp.C6.effective?'✓ Verified effective':'✗ Effectiveness TBD'}</div>`:''}
                ` : `<div style="font-size:11px;color:var(--text-muted)">Awaiting implementation of corrective and preventive actions.</div>`}
              </div>

              <!-- C7: Customer Response -->
              <div class="card" style="padding:13px">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
                  <div style="width:18px;height:18px;border-radius:50%;background:${_sd((cp.C7||{}).status||'pending')};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff">C7</div>
                  <span style="font-weight:700;font-size:11px">Customer Response</span>
                  ${_sb((cp.C7||{}).status||'pending')}
                </div>
                ${cp.C7&&cp.C7.responseDate ? `
                <div style="font-size:11px;color:var(--text-secondary);line-height:1.5;margin-bottom:7px">${cp.C7.summary}</div>
                <div style="font-size:10px;color:var(--text-muted)">${cp.C7.respondedBy} · ${cp.C7.responseDate} · ${cp.C7.method}</div>
                ${cp.C7.customerAccepted!==null?`<div style="margin-top:6px;padding:4px 8px;border-radius:4px;font-size:10px;font-weight:700;background:${cp.C7.customerAccepted?'rgba(45,212,160,.12)':'rgba(239,68,68,.12)'};color:${cp.C7.customerAccepted?'var(--green)':'var(--red)'}">
                  ${cp.C7.customerAccepted?'✓ Customer accepted CAPA':'✗ Awaiting customer acceptance'}</div>`:''}
                ` : `<div style="font-size:11px;color:var(--text-muted)">Formal CAPA response not yet submitted to customer.</div>`}
              </div>

              <!-- C8: Closure & Lessons Learned -->
              <div class="card" style="padding:13px">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
                  <div style="width:18px;height:18px;border-radius:50%;background:${_sd((cp.C8||{}).status||'pending')};display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff">C8</div>
                  <span style="font-weight:700;font-size:11px">Closure & Lessons Learned</span>
                  ${_sb((cp.C8||{}).status||'pending')}
                </div>
                ${cp.C8&&cp.C8.lessons ? `
                <div style="font-size:11px;color:var(--text-primary);line-height:1.5;margin-bottom:7px">${cp.C8.lessons}</div>
                <div style="font-size:10px;color:var(--text-muted)">Reviewed: <strong>${cp.C8.reviewedBy}</strong> · ${cp.C8.reviewDate}</div>
                ${cp.C8.closedDate?`<div style="margin-top:6px;padding:4px 8px;border-radius:4px;font-size:10px;font-weight:700;background:rgba(45,212,160,.12);color:var(--green)">✓ Closed ${cp.C8.closedDate}</div>`:''}
                ` : `<div style="font-size:11px;color:var(--text-muted)">Awaiting completion of all CAPA steps before closure.</div>`}
                ${c.status!=='closed'?`<button class="btn btn-primary btn-xs" style="width:100%;margin-top:10px" onclick="showToast('All CAPA steps must be complete before closing ${c.id}','info')">Close Complaint</button>`:''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function openAddComplaintModal() {
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  openQCDetailPanel(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Log Customer Complaint</div>
        <button class="btn-icon" onclick="closeQCDetailPanel()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="qc-field"><label>Customer name</label><input id="cc-customer" type="text" placeholder="e.g. Saudi Aramco"/></div>
          <div class="qc-field"><label>Project</label>
            <select id="cc-project">${(QCData.projects||[]).map(p=>`<option value="${p.id}">${p.id}</option>`).join('')}</select>
          </div>
        </div>
        <div class="qc-field"><label>Complaint subject</label><input id="cc-subject" type="text" placeholder="Brief subject / title of the complaint"/></div>
        <div class="qc-field"><label>Description</label><textarea id="cc-desc" rows="3" placeholder="Full description, customer's exact concern…"></textarea></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="qc-field"><label>Category</label>
            <select id="cc-category"><option>Quality</option><option>Documentation</option><option>Delivery</option><option>Communication</option><option>Safety</option><option>Other</option></select>
          </div>
          <div class="qc-field"><label>Severity</label>
            <select id="cc-severity"><option value="critical">Critical</option><option value="major" selected>Major</option><option value="minor">Minor</option></select>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="qc-field"><label>Received by</label><input id="cc-by" type="text" placeholder="Your name"/></div>
          <div class="qc-field"><label>Received via</label>
            <select id="cc-via"><option>Email</option><option>Phone call</option><option>Site meeting</option><option>Formal letter</option><option>Video call</option></select>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="qc-field"><label>Date received</label><input id="cc-date" type="date" value="${new Date().toISOString().split('T')[0]}"/></div>
          <div class="qc-field"><label>Target close date</label><input id="cc-target" type="date"/></div>
        </div>
        <div class="qc-field"><label>Initial action taken / planned</label><textarea id="cc-action" rows="2" placeholder="Immediate steps taken or planned…"></textarea></div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="_submitComplaint()">Log complaint</button>
          <button class="btn btn-secondary" onclick="closeQCDetailPanel()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function _submitComplaint() {
  const subject  = document.getElementById('cc-subject')?.value?.trim();
  const customer = document.getElementById('cc-customer')?.value?.trim();
  if (!subject || !customer) { showToast('Customer name and subject are required', 'error'); return; }
  const nextId = 'CC-' + String((QCData.complaints||[]).length + 6).padStart(3,'0');
  (QCData.complaints = QCData.complaints||[]).unshift({
    id: nextId,
    date:        document.getElementById('cc-date')?.value || new Date().toISOString().split('T')[0],
    customer, project: document.getElementById('cc-project')?.value || '',
    category:    document.getElementById('cc-category')?.value || 'Quality',
    severity:    document.getElementById('cc-severity')?.value || 'major',
    status:      'open',
    subject,
    description: document.getElementById('cc-desc')?.value?.trim() || '',
    receivedBy:  document.getElementById('cc-by')?.value?.trim() || '',
    receivedVia: document.getElementById('cc-via')?.value || 'Email',
    actionTaken: document.getElementById('cc-action')?.value?.trim() || null,
    targetDate:  document.getElementById('cc-target')?.value || null,
    closedDate:  null, comments: [],
    capa: {
      C1: { title:'Problem Statement', status:'pending', statement:'', isIs:{ is:'', isNot:'', whenIs:'', whenIsNot:'', whereIs:'', whereIsNot:'', howMuchIs:'', howMuchIsNot:'' }},
      C2: { title:'Containment', status:'pending', actions:[] },
      C3: { title:'Root Cause Analysis', status:'pending', whys:[], rootCause:'', fishbone:{ man:[], machine:[], material:[], method:[], measurement:[], environment:[] }},
      C4: { title:'Corrective Actions', status:'pending', actions:[] },
      C5: { title:'Preventive Actions', status:'pending', actions:[] },
      C6: { title:'Implementation', status:'pending', evidence:'', verifiedBy:'', verifiedDate:'', effective:null },
      C7: { title:'Customer Response', status:'pending', responseDate:'', respondedBy:'', method:'', summary:'', customerAccepted:null },
      C8: { title:'Closure', status:'pending', reviewDate:'', reviewedBy:'', lessons:'', closedDate:null },
    },
  });
  closeQCDetailPanel();
  showToast(`Complaint ${nextId} logged`, 'success');
  renderComplaintLogBook();
}

function openAddManualNCRModal() {
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  openQCDetailPanel(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">Manual entry — not linked to an inspection step</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Log NCR Manually</div>
        </div>
        <button class="btn-icon" onclick="closeQCDetailPanel()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="qc-field"><label>Project</label>
            <select id="mncr-project">${(QCData.projects||[]).map(p=>`<option value="${p.id}">${p.id} — ${p.name||p.id}</option>`).join('')}</select>
          </div>
          <div class="qc-field"><label>Severity</label>
            <select id="mncr-severity"><option value="high">High</option><option value="medium" selected>Medium</option><option value="low">Low</option></select>
          </div>
        </div>
        <div class="qc-field"><label>NCR title</label><input id="mncr-title" type="text" placeholder="Brief description of non-conformance"/></div>
        <div class="qc-field"><label>Detailed description</label><textarea id="mncr-desc" rows="3" placeholder="Full description, measurements, deviations from spec…"></textarea></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="qc-field"><label>Area / process</label><input id="mncr-area" type="text" placeholder="e.g. Fabrication, Welding, Assembly"/></div>
          <div class="qc-field"><label>NC type</label>
            <select id="mncr-type"><option>Process NC</option><option>Product NC</option><option>Documentation NC</option><option>Supplier NC</option><option>Customer-identified</option><option>Audit finding</option></select>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="qc-field"><label>Drawing / reference</label><input id="mncr-drawing" type="text" placeholder="e.g. DWG-SH-001-A"/></div>
          <div class="qc-field"><label>Detected by</label><input id="mncr-by" type="text" placeholder="Your name"/></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="qc-field"><label>Date detected</label><input id="mncr-date" type="date" value="${new Date().toISOString().split('T')[0]}"/></div>
          <div class="qc-field"><label>Containment action</label><input id="mncr-contain" type="text" placeholder="e.g. Quarantine, hold tag applied"/></div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="_submitManualNCR()">Log NCR</button>
          <button class="btn btn-secondary" onclick="closeQCDetailPanel()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function _submitManualNCR() {
  const title = document.getElementById('mncr-title')?.value?.trim();
  if (!title) { showToast('NCR title is required', 'error'); return; }
  const nums   = QCData.ncr.map(n => parseInt(n.id.replace(/\D/g,''))||0);
  const nextId = 'NCR-' + new Date().getFullYear() + '-' + String(Math.max(...nums, 42) + 1).padStart(3,'0');
  QCData.ncr.unshift({
    id:         nextId,
    project:    document.getElementById('mncr-project')?.value || '',
    type:       document.getElementById('mncr-type')?.value || 'Process NC',
    severity:   document.getElementById('mncr-severity')?.value || 'medium',
    status:     'open',
    title,
    raisedDate: document.getElementById('mncr-date')?.value || new Date().toISOString().split('T')[0],
    age:        0,
    rcaStatus:  'pending',
    d_steps: {
      D1:{title:'Team',status:'pending'}, D2:{title:'Description',status:'pending',text:document.getElementById('mncr-desc')?.value||title},
      D3:{title:'Containment',status:'pending',text:document.getElementById('mncr-contain')?.value||''},
      D4:{title:'Root Cause',status:'pending'}, D5:{title:'Action Plan',status:'pending'},
      D6:{title:'Implementation',status:'pending'}, D7:{title:'Prevention',status:'pending'}, D8:{title:'Closure',status:'pending'},
    },
    source: 'manual',
  });
  closeQCDetailPanel();
  showToast(`${nextId} logged`, 'success');
  renderNCRLogBook();
}

function _renderNCR8D(ncrId) {
  const el = document.getElementById('pageContent');
  const activeNCR = QCData.ncr.find(n => n.id === ncrId) || QCData.ncr[0];

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:300px 1fr;gap:20px;height:calc(100vh - 160px)">
      <!-- NCR List -->
      <div class="card" style="display:flex;flex-direction:column;overflow:hidden">
        <div class="card-header"><span class="card-title">Open NCRs</span></div>
        <div style="flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:10px">
          ${QCData.ncr.map(n => `
            <div class="alert ${n.id === activeNCR.id ? 'alert-blue active-glow' : 'alert-muted'}" 
                 onclick="renderQC_ncr('${n.id}')"
                 style="cursor:pointer;padding:12px;transition:all 0.2s">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="font-family:var(--font-mono);font-size:11px">${n.id}</span>
                <span class="badge ${n.severity === 'high' ? 'badge-red' : 'badge-amber'}">${n.severity.toUpperCase()}</span>
              </div>
              <div style="font-weight:600;font-size:13px">${n.title}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${n.project} • Raised ${n.raisedDate}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 8D Report View -->
      <div class="card" style="display:flex;flex-direction:column;overflow:hidden">
        <div class="card-header" style="justify-content:space-between">
          <div style="display:flex;align-items:center;gap:12px">
            <span class="card-title">8D Corrective Action Report</span>
            <span class="badge badge-blue">${activeNCR.id}</span>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-muted btn-xs" onclick="alert('Exporting PDF for ${activeNCR.id}...')">Export PDF</button>
            <button class="btn btn-primary btn-xs">Submit Phase</button>
          </div>
        </div>

        <!-- 8D Progress Stepper -->
        <div style="padding:16px;background:var(--bg-elevated);border-bottom:1px solid var(--border);display:flex;justify-content:space-between">
          ${Object.keys(activeNCR.d_steps || {}).map((key, idx) => `
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px;opacity:${activeNCR.d_steps[key].status === 'pending' ? '0.4' : '1'}">
              <div style="width:24px;height:24px;border-radius:50%;background:${activeNCR.d_steps[key].status === 'done' ? 'var(--green)' : 'var(--brand)'};color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">
                ${activeNCR.d_steps[key].status === 'done' ? '✓' : key}
              </div>
              <span style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">${activeNCR.d_steps[key].title}</span>
            </div>
          `).join('<div style="flex:1;height:2px;background:var(--border);margin-top:12px"></div>')}
        </div>

        <div style="flex:1;overflow-y:auto;padding:24px">
          ${activeNCR.d_steps ? `
          <div style="display:grid;grid-template-columns:1fr 350px;gap:24px">
            <!-- Left Side: D-Step Details -->
            <div style="display:flex;flex-direction:column;gap:24px">
              <div class="card" style="padding:20px">
                <div style="font-weight:700;font-size:14px;margin-bottom:12px;color:var(--brand)">D2: Problem Description</div>
                <p style="font-size:13px;line-height:1.6;color:var(--text-secondary)">${activeNCR.d_steps.D2.text}</p>
                <div style="margin-top:16px;display:flex;gap:12px">
                  <div style="width:100px;height:100px;background:var(--bg-elevated);border:1px dashed var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px">🖼️</div>
                  <div style="width:100px;height:100px;background:var(--bg-elevated);border:1px dashed var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px">📄</div>
                </div>
              </div>

              <div class="card" style="padding:20px">
                <div style="font-weight:700;font-size:14px;margin-bottom:12px;color:var(--brand)">D4: Root Cause Analysis (Ishikawa)</div>
                <div style="background:var(--bg-elevated);border-radius:12px;padding:20px;position:relative;overflow:hidden">
                  <!-- Fishbone SVG -->
                  <svg viewBox="0 0 600 300" style="width:100%;height:auto">
                    <line x1="50" y1="150" x2="550" y2="150" stroke="var(--text-primary)" stroke-width="3" />
                    <polygon points="550,150 535,140 535,160" fill="var(--text-primary)" />
                    
                    <!-- Bones -->
                    <line x1="150" y1="150" x2="100" y2="50" stroke="var(--border-md)" stroke-width="2" />
                    <line x1="300" y1="150" x2="250" y2="50" stroke="var(--border-md)" stroke-width="2" />
                    <line x1="450" y1="150" x2="400" y2="50" stroke="var(--border-md)" stroke-width="2" />
                    
                    <line x1="150" y1="150" x2="200" y2="250" stroke="var(--border-md)" stroke-width="2" />
                    <line x1="300" y1="150" x2="350" y2="250" stroke="var(--border-md)" stroke-width="2" />
                    <line x1="450" y1="150" x2="500" y2="250" stroke="var(--border-md)" stroke-width="2" />
                    
                    <!-- Labels -->
                    <text x="80" y="40" font-size="12" font-weight="700" fill="var(--brand)">MAN</text>
                    <text x="230" y="40" font-size="12" font-weight="700" fill="var(--brand)">MACHINE</text>
                    <text x="380" y="40" font-size="12" font-weight="700" fill="var(--brand)">MATERIAL</text>
                    
                    <text x="180" y="270" font-size="12" font-weight="700" fill="var(--brand)">METHOD</text>
                    <text x="330" y="270" font-size="12" font-weight="700" fill="var(--brand)">MEASUREMENT</text>
                    <text x="480" y="270" font-size="12" font-weight="700" fill="var(--brand)">ENVIRONMENT</text>
                    
                    <!-- Findings -->
                    <text x="110" y="80" font-size="10" fill="var(--text-muted)">${activeNCR.fishbone ? (activeNCR.fishbone.man[0] || '') : ''}</text>
                    <text x="410" y="80" font-size="10" fill="var(--text-muted)">${activeNCR.fishbone ? (activeNCR.fishbone.material[0] || '') : ''}</text>
                    <text x="190" y="220" font-size="10" fill="var(--text-muted)">${activeNCR.fishbone ? (activeNCR.fishbone.method[0] || '') : ''}</text>
                    <text x="340" y="220" font-size="10" fill="var(--text-muted)">${activeNCR.fishbone ? (activeNCR.fishbone.measurement[0] || '') : ''}</text>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Right Side: Metadata & Team -->
            <div style="display:flex;flex-direction:column;gap:20px">
              <div class="card" style="padding:16px;background:var(--bg-elevated)">
                <div style="font-weight:700;font-size:12px;text-transform:uppercase;margin-bottom:12px;color:var(--text-muted)">D1: Team Members</div>
                <div style="display:flex;flex-direction:column;gap:8px">
                  ${activeNCR.d_steps.D1.members ? activeNCR.d_steps.D1.members.map(m => `
                    <div style="display:flex;align-items:center;gap:10px">
                      <div style="width:28px;height:28px;border-radius:50%;background:var(--brand-light);color:var(--brand);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:10px">${m.charAt(0)}</div>
                      <span style="font-size:13px">${m}</span>
                    </div>
                  `).join('') : '<div style="font-size:12px;color:var(--text-muted)">No team assigned</div>'}
                </div>
                <button class="btn btn-muted btn-xs" style="margin-top:16px;width:100%">+ Manage Team</button>
              </div>

              <div class="card" style="padding:16px;background:var(--bg-elevated)">
                <div style="font-weight:700;font-size:12px;text-transform:uppercase;margin-bottom:12px;color:var(--text-muted)">D3: Containment Actions</div>
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;padding:12px;font-size:12px;line-height:1.4">
                  ${activeNCR.d_steps.D3.text}
                </div>
                <div style="margin-top:12px;display:flex;align-items:center;gap:8px">
                  <div style="width:8px;height:8px;border-radius:50%;background:var(--green)"></div>
                  <span style="font-size:11px;font-weight:600">Verified by QC Manager</span>
                </div>
              </div>
            </div>
          </div>
          ` : `
          <div style="text-align:center;padding:100px;color:var(--text-muted)">
            <div style="font-size:48px;margin-bottom:20px">🔍</div>
            <div style="font-weight:600">Full 8D Data Not Available</div>
            <div style="font-size:13px;margin-top:10px">This legacy NCR is pending migration to the new 8D workflow engine.</div>
            <button class="btn btn-primary btn-sm" style="margin-top:20px" onclick="alert('Starting migration...')">Initialize 8D Workflow</button>
          </div>
          `}
        </div>
      </div>
    </div>
  `;
}

function renderQC_calibration() {
  const el = document.getElementById('pageContent');
  el.innerHTML = `
    <div class="page-header" style="margin-bottom:20px">
        <div>
            <div class="page-title">Calibration Master Instrument List</div>
            <div class="page-subtitle">Track, schedule, and verify all measuring and test equipment (M&TE)</div>
        </div>
        <div class="page-actions">
            <button class="btn btn-secondary btn-sm" onclick="showToast('Exporting Master List...','info')">Export Excel</button>
            <button class="btn btn-primary btn-sm" onclick="showToast('Registering new instrument...','info')">+ Register Instrument</button>
        </div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Instrument Details</th>
              <th>Serial Number</th>
              <th>Date of Induction</th>
              <th>Calibration Dates</th>
              <th>Cert Number</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${QCData.calibration.map(c => `
              <tr class="stagger-in">
                <td>
                    <div style="font-weight:700; font-size:13px; color:var(--brand)">${c.instrument}</div>
                    <div style="font-size:10px; color:var(--text-muted); font-family:var(--font-mono)">ID: ${c.id}</div>
                </td>
                <td style="font-family:var(--font-mono); font-size:12px">${c.sn}</td>
                <td style="font-size:12px; color:var(--text-muted)">${fmtDate(c.inductionDate)}</td>
                <td>
                    <div style="font-size:11px"><span style="color:var(--text-muted)">Last:</span> ${fmtDate(c.lastCal)}</div>
                    <div style="font-size:11px; font-weight:700; color:${c.status==='expired'?'var(--red)':'var(--green)'}">
                        <span style="color:var(--text-muted); font-weight:400">Due:</span> ${fmtDate(c.due)}
                    </div>
                </td>
                <td style="font-size:11px; font-weight:600">${c.certNo || '—'}</td>
                <td><span class="badge badge-muted" style="font-size:10px">${c.location}</span></td>
                <td>
                  <span class="badge ${c.status==='valid'?'badge-green':c.status==='warn'?'badge-amber':'badge-red'}" style="width:70px; text-align:center">
                    ${c.status.toUpperCase()}
                  </span>
                  <div class="progress-bar" style="height:3px; width:70px; margin-top:4px; background:rgba(255,255,255,0.1)">
                    <div class="progress-fill" style="width:${c.health}%; background:${c.health>80?'var(--green)':c.health>50?'var(--amber)':'var(--red)'}"></div>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div style="margin-top:20px; display:flex; gap:24px">
        <div class="card glass-card" style="flex:1; padding:16px; border-left:4px solid var(--green)">
            <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:700">Valid Instruments</div>
            <div style="font-size:24px; font-weight:800; margin:4px 0">${QCData.calibration.filter(x=>x.status==='valid').length}</div>
            <div style="font-size:10px; color:var(--green)">M&TE Ready for Production</div>
        </div>
        <div class="card glass-card" style="flex:1; padding:16px; border-left:4px solid var(--amber)">
            <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:700">Warning (Due Soon)</div>
            <div style="font-size:24px; font-weight:800; margin:4px 0">${QCData.calibration.filter(x=>x.status==='warn').length}</div>
            <div style="font-size:10px; color:var(--amber)">Requires calibration within 30 days</div>
        </div>
        <div class="card glass-card" style="flex:1; padding:16px; border-left:4px solid var(--red)">
            <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:700">Expired / Out of Service</div>
            <div style="font-size:24px; font-weight:800; margin:4px 0">${QCData.calibration.filter(x=>x.status==='expired').length}</div>
            <div style="font-size:10px; color:var(--red)">STOP: Do not use for inspection</div>
        </div>
    </div>
  `;
}

/* ── ITP & Control Plan shared helpers ─────────────────────── */
function _itpCodePill(c) {
  if (!c) return '<span style="color:var(--text-muted);font-size:12px">—</span>';
  const map = { H:'hold-H', W:'hold-W', R:'hold-R', P:'hold-P' };
  const titles = { P:'Perform', R:'Review', W:'Witness', H:'Hold' };
  return `<span class="hold-pill ${map[c]||''}" title="${titles[c]||c}">${c}</span>`;
}

function _itpStatusBadge(s) {
  return {
    done:        '<span class="badge badge-green"  style="font-size:10px">Done</span>',
    approved:    '<span class="badge badge-green"  style="font-size:10px">Done</span>',
    active:      '<span class="badge badge-accent" style="font-size:10px">Active</span>',
    in_progress: '<span class="badge badge-accent" style="font-size:10px">In progress</span>',
    blocked:     '<span class="badge badge-red"    style="font-size:10px">Blocked</span>',
    failed:      '<span class="badge badge-red"    style="font-size:10px">Failed</span>',
    passed:      '<span class="badge badge-green"  style="font-size:10px">Passed</span>',
    pending:     '<span class="badge badge-muted"  style="font-size:10px">Pending</span>',
    na:          '<span class="badge badge-muted"  style="font-size:10px">N/A</span>',
  }[s] || '<span class="badge badge-muted" style="font-size:10px">—</span>';
}

function _itpGroupedHeader() {
  return `
    <thead>
      <tr>
        <th style="width:46px">Step</th>
        <th>Activity</th>
        <th style="width:110px">Ref Doc</th>
        <th style="width:190px">Parameters / Acceptance Criteria</th>
        <th style="width:120px">Responsible</th>
        <th colspan="3" style="text-align:center;border-bottom:2px solid var(--brand);background:var(--bg-base)">
          Inspection
        </th>
        <th style="width:150px">Remarks</th>
      </tr>
      <tr style="background:var(--bg-elevated)">
        <th colspan="5" style="background:var(--bg-base);border-bottom:1px solid var(--border)"></th>
        <th style="width:54px;text-align:center;font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;padding:5px 8px;border-bottom:1px solid var(--border)">Internal</th>
        <th style="width:54px;text-align:center;font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;padding:5px 8px;border-bottom:1px solid var(--border)">Customer</th>
        <th style="width:54px;text-align:center;font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;padding:5px 8px;border-bottom:1px solid var(--border)">TPI/Client</th>
        <th style="background:var(--bg-base);border-bottom:1px solid var(--border)"></th>
      </tr>
    </thead>`;
}

function _itpProjStrip(activePid) {
  const colours = { 'P-2401':'var(--green)', 'P-2402':'var(--blue)', 'P-2403':'var(--amber)' };
  return (AppState.projects || [{ id:'P-2401', name:'316L Storage Tank' }, { id:'P-2402', name:'Pressure Vessel ASME VIII' }, { id:'P-2403', name:'304 SS Heat Exchanger' }])
    .map(p => `
      <div class="proj-chip ${p.id===activePid?'selected':''}"
           onclick="QCData.cpView='${QCData.cpView||'project'}';renderQC_itp_for('${p.id}')">
        <span class="proj-chip-dot" style="background:${colours[p.id]||'var(--brand)'}"></span>
        <span style="font-family:var(--font-mono);font-size:11px">${p.id}</span>
        <span style="color:var(--text-muted)">·</span>
        <span style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${(p.name||p.project_no||'').split('—')[0].trim()}</span>
      </div>`).join('');
}

function renderQC_itp_for(pid) {
  AppState.activeProject = pid;
  renderQC_itp();
}

function renderQC_itp() {
  const el  = document.getElementById('pageContent');
  const pid = AppState.activeProject || 'P-2401';
  const view = QCData.cpView || 'itp';

  el.innerHTML = `
    <!-- Page header -->
    <div class="page-header" style="margin-bottom:12px">
      <div>
        <div class="page-title">ITP &amp; Control Plan</div>
        <div class="page-subtitle">Inspection &amp; Test Plan · Project Control Plan · Standard Library</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="renderQC_itp()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Project selector strip -->
    <div class="proj-select-strip" style="margin-bottom:12px">${_itpProjStrip(pid)}</div>

    <!-- View toggle tabs -->
    <div class="qc-tabs" style="margin-bottom:0">
      <button class="qc-tab ${view==='itp'?'active':''}" onclick="QCData.cpView='itp';renderQC_itp()">
        ITP <span class="qc-tab-count">${(QCData.itp[pid]||[]).length}</span>
      </button>
      <button class="qc-tab ${view==='project'?'active':''}" onclick="QCData.cpView='project';renderQC_itp()">
        Control Plan
        ${(QCData.controlPlan[pid]||[]).filter(i=>i.status==='failed').length>0
          ? `<span class="qc-tab-count err">${(QCData.controlPlan[pid]).filter(i=>i.status==='failed').length} failed</span>`
          : `<span class="qc-tab-count">${(QCData.controlPlan[pid]||[]).length}</span>`}
      </button>
      <button class="qc-tab ${view==='standard'?'active':''}" onclick="QCData.cpView='standard';renderQC_itp()">
        Standard Library
      </button>
    </div>

    <div id="itpTabContent"></div>
  `;

  if (view === 'itp')      _renderITPTable(pid);
  else if (view === 'project') _renderProjectCP(pid);
  else                         _renderStandardCP();
}

/* ── ITP Table ─────────────────────────────────────────────── */
function _renderITPTable(pid) {
  const steps   = QCData.itp[pid] || [];
  const done    = steps.filter(s => s.status === 'done' || s.status === 'approved').length;
  const blocked = steps.filter(s => s.status === 'blocked').length;

  document.getElementById('itpTabContent').innerHTML = `
    <div class="card">
      <div class="card-header">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span class="card-title">Inspection &amp; Test Plan — ${pid}</span>
          <span class="badge badge-green"  style="font-size:10px">${done}/${steps.length} complete</span>
          ${blocked ? `<span class="badge badge-red" style="font-size:10px">${blocked} blocked</span>` : ''}
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="showToast('ITP exported to PDF','success')">Export PDF</button>
          <button class="btn btn-primary btn-sm" onclick="openAddITPStepModal()">
            <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Add step
          </button>
        </div>
      </div>

      <!-- Legend -->
      <div style="display:flex;gap:14px;flex-wrap:wrap;padding:0 0 10px;border-bottom:1px solid var(--border);margin-bottom:4px;font-size:11px;color:var(--text-muted)">
        <span style="display:flex;align-items:center;gap:5px">${_itpCodePill('H')} Hold — production stops until approved</span>
        <span style="display:flex;align-items:center;gap:5px">${_itpCodePill('W')} Witness — inspector must attend</span>
        <span style="display:flex;align-items:center;gap:5px">${_itpCodePill('R')} Review — document/record check</span>
        <span style="display:flex;align-items:center;gap:5px">${_itpCodePill('P')} Perform — party executes the inspection</span>
      </div>

      <div style="overflow-x:auto">
        <table class="itp-table" style="min-width:900px">
          ${_itpGroupedHeader()}
          <tbody>
            ${steps.map(s => {
              const isBlocked = s.status === 'blocked';
              const isActive  = s.status === 'active';
              const isDone    = s.status === 'done' || s.status === 'approved';
              const rowCls    = isBlocked ? 'itp-hold-row' : isActive ? 'itp-active-row' : '';
              return `
              <tr class="${rowCls}" onclick="openITPStepDetail(${JSON.stringify(s).replace(/"/g,'&quot;')})">
                <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">
                  ${s.step}
                  <div style="margin-top:3px">${_itpStatusBadge(s.status)}</div>
                </td>
                <td style="font-size:13px;font-weight:${isActive?'500':'400'};color:var(--text-primary)">${s.activity}</td>
                <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${s.ref||'—'}</td>
                <td style="font-size:11px;color:var(--text-secondary);line-height:1.5">${s.parameters||'—'}</td>
                <td style="font-size:12px;color:var(--text-secondary)">${s.responsible||'—'}</td>
                <td style="text-align:center">${_itpCodePill(s.internal)}</td>
                <td style="text-align:center">${_itpCodePill(s.customer)}</td>
                <td style="text-align:center">${_itpCodePill(s.tpi)}</td>
                <td style="font-size:11px;color:var(--text-muted)">
                  ${s.remarks||''}
                  ${isActive ? `<div style="margin-top:5px"><button class="btn btn-primary btn-xs" onclick="event.stopPropagation();openITPSignOffModal(${JSON.stringify(s).replace(/"/g,'&quot;')})">Sign off</button></div>` : ''}
                  ${s.result ? `<div style="margin-top:3px"><span class="badge ${s.result==='Pass'?'badge-green':'badge-red'}" style="font-size:10px">${s.result} · ${s.date}</span></div>` : ''}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function openITPStepDetail(s) {
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const pid = AppState.activeProject || 'P-2401';
  openQCDetailPanel(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">ITP step ${s.step} — ${pid}</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${s.activity}</div>
        </div>
        <button class="btn-icon" onclick="closeQCDetailPanel()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        ${s.parameters ? `
          <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;font-size:12px;color:var(--text-secondary);line-height:1.6">
            <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">Parameters / Acceptance Criteria</div>
            ${s.parameters}
          </div>` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${[['Responsible',s.responsible||'—'],['Reference doc',s.ref||'—'],['Status',s.status],['Inspector',s.result?s.responsible:'Pending sign-off']].map(([l,v])=>`
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:4px">${l}</div>
              <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${v}</div>
            </div>`).join('')}
        </div>
        <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px">
          <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">Inspection assignments</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;text-align:center">
            ${[['Internal',s.internal],['Customer',s.customer],['TPI / Client',s.tpi]].map(([party,code])=>`
              <div>
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">${party}</div>
                ${_itpCodePill(code)}
              </div>`).join('')}
          </div>
        </div>
        ${s.result ? `<div style="font-size:12px;color:var(--text-secondary);padding:8px 12px;background:var(--bg-elevated);border-radius:var(--radius-sm);border:1px solid var(--border)">Result: <strong style="color:${s.result==='Pass'?'var(--green)':'var(--red)'}">${s.result}</strong> · Date: ${s.date}</div>` : ''}
        ${s.remarks ? `<div style="font-size:12px;color:var(--text-muted);font-style:italic">"${s.remarks}"</div>` : ''}
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${s.status==='active'
            ? `<button class="btn btn-primary" onclick="closeQCDetailPanel();openITPSignOffModal(${JSON.stringify(s).replace(/"/g,'&quot;')})">Sign off this step</button>
               <button class="btn btn-secondary" style="color:var(--red)" onclick="closeQCDetailPanel()">Log NCR</button>`
            : ''}
          <button class="btn btn-secondary" onclick="closeQCDetailPanel()">Close</button>
        </div>
      </div>
    </div>`);
}

function openITPSignOffModal(s) {
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const partyOpts = [
    s.internal ? `<option value="internal">Internal (NexaForge QC) — ${s.internal}</option>` : '',
    s.customer ? `<option value="customer">Customer representative — ${s.customer}</option>` : '',
    s.tpi      ? `<option value="tpi">TPI / Client inspector — ${s.tpi}</option>` : '',
  ].join('');

  openQCDetailPanel(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">Sign off — step ${s.step}</div>
          <div style="font-family:var(--font-display);font-size:14px;font-weight:700">${s.activity}</div>
        </div>
        <button class="btn-icon" onclick="closeQCDetailPanel()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <div class="qc-field"><label>Signing party</label><select id="so-party">${partyOpts}</select></div>
        <div class="qc-field"><label>Result</label>
          <select id="so-result">
            <option value="approved">Pass — approved</option>
            <option value="conditional">Pass with observation / conditional</option>
            <option value="rejected">Fail — raise NCR</option>
          </select>
        </div>
        <div class="qc-field"><label>Inspection report ref</label><input id="so-ref" type="text" placeholder="e.g. IR-005"/></div>
        <div class="qc-field"><label>Date</label><input id="so-date" type="date" value="${new Date().toISOString().split('T')[0]}"/></div>
        <div class="qc-field"><label>Remarks</label><textarea id="so-remarks" rows="3" placeholder="Observations, conditions or NCR reference…"></textarea></div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitITPSignOff_qc(${JSON.stringify(s).replace(/"/g,'&quot;')})">Submit sign-off</button>
          <button class="btn btn-secondary" onclick="closeQCDetailPanel()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function submitITPSignOff_qc(s) {
  const result  = document.getElementById('so-result')?.value  || 'approved';
  const remarks = document.getElementById('so-remarks')?.value || '';
  const date    = document.getElementById('so-date')?.value    || new Date().toISOString().split('T')[0];

  const pid   = AppState.activeProject || 'P-2401';
  const steps = QCData.itp[pid] || [];
  const row   = steps.find(r => r.step === s.step);
  if (row) {
    row.status  = result === 'rejected' ? 'blocked' : 'done';
    row.result  = result === 'approved' ? 'Pass' : result === 'conditional' ? 'Conditional' : 'Fail';
    row.date    = date;
    if (remarks) row.remarks = remarks;
  }
  closeQCDetailPanel();
  showToast(`Step ${s.step} signed off — ${result}`, result === 'rejected' ? 'error' : 'success');
  _renderITPTable(pid);
}

function openAddITPStepModal() {
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const codeOpts = (sel='P', withNull=false) => (withNull ? '<option value="">—</option>' : '') + ['P','R','W','H'].map(c=>`<option value="${c}"${c===sel?' selected':''}>${c} — ${{P:'Perform',R:'Review',W:'Witness',H:'Hold'}[c]}</option>`).join('');
  openQCDetailPanel(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Add ITP step</div>
        <button class="btn-icon" onclick="closeQCDetailPanel()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <div style="display:grid;grid-template-columns:80px 1fr;gap:10px">
          <div class="qc-field"><label>Step no.</label><input id="nitp-step" type="text" placeholder="4.4"/></div>
          <div class="qc-field"><label>Activity</label><input id="nitp-activity" type="text" placeholder="Inspection activity description"/></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="qc-field"><label>Reference doc</label><input id="nitp-ref" type="text" placeholder="API 650 §7.3, ASME VIII UW-51…"/></div>
          <div class="qc-field"><label>Responsible</label><input id="nitp-resp" type="text" placeholder="QC Inspector, NDT Contractor…"/></div>
        </div>
        <div class="qc-field"><label>Parameters / Acceptance criteria</label>
          <textarea id="nitp-params" rows="2" placeholder="Dimensional tolerances, test conditions, acceptance limits…"></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          <div class="qc-field"><label>Internal</label><select id="nitp-int">${codeOpts('P')}</select></div>
          <div class="qc-field"><label>Customer</label><select id="nitp-cust">${codeOpts('R',true)}</select></div>
          <div class="qc-field"><label>TPI / Client</label><select id="nitp-tpi">${codeOpts('W',true)}</select></div>
        </div>
        <div class="qc-field"><label>Remarks</label><textarea id="nitp-remarks" rows="2" placeholder="Optional notes…"></textarea></div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitAddITPStep_qc()">Add step</button>
          <button class="btn btn-secondary" onclick="closeQCDetailPanel()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function submitAddITPStep_qc() {
  const pid      = AppState.activeProject || 'P-2401';
  const activity = document.getElementById('nitp-activity')?.value?.trim();
  if (!activity) { showToast('Activity is required', 'error'); return; }
  const newStep = {
    step:        document.getElementById('nitp-step')?.value?.trim() || String((QCData.itp[pid]||[]).length + 1),
    activity,
    ref:         document.getElementById('nitp-ref')?.value    || null,
    parameters:  document.getElementById('nitp-params')?.value || null,
    responsible: document.getElementById('nitp-resp')?.value   || null,
    internal:    document.getElementById('nitp-int')?.value    || 'P',
    customer:    document.getElementById('nitp-cust')?.value   || null,
    tpi:         document.getElementById('nitp-tpi')?.value    || null,
    remarks:     document.getElementById('nitp-remarks')?.value|| '',
    status: 'pending', date: null, result: null,
  };
  (QCData.itp[pid] = QCData.itp[pid] || []).push(newStep);
  closeQCDetailPanel();
  showToast('ITP step added', 'success');
  _renderITPTable(pid);
}

/* ── Project Control Plan ───────────────────────────────────── */
function _renderProjectCP(pid) {
  const items  = QCData.controlPlan[pid] || [];
  const passed = items.filter(i=>i.status==='passed').length;
  const failed = items.filter(i=>i.status==='failed').length;

  // Group by stage name
  const byStage = {};
  items.forEach(r => { (byStage[r.stage] = byStage[r.stage]||[]).push(r); });
  const stages = Object.keys(byStage);

  document.getElementById('itpTabContent').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">
      <span class="badge badge-green"  style="font-size:10px">${passed} passed</span>
      <span class="badge badge-red"    style="font-size:10px">${failed} failed</span>
      <span class="badge badge-muted"  style="font-size:10px">${items.filter(i=>i.status==='pending').length} pending</span>
      <div style="margin-left:auto;display:flex;gap:8px">
        <button class="btn btn-secondary btn-sm" onclick="showToast('Applying standard template…','info');setTimeout(()=>{showToast('Template applied — items added','success');},800)">
          Apply standard template
        </button>
        <button class="btn btn-secondary btn-sm" onclick="openAddCPItemModal_qc()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Add item
        </button>
        <button class="btn btn-primary btn-sm" onclick="openCreateFromReqModal_qc()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          From Customer Requirements
        </button>
      </div>
    </div>

    ${items.length === 0 ? `
      <div style="padding:48px;text-align:center;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-md)">
        <div style="font-size:32px;margin-bottom:12px">📋</div>
        <div style="font-weight:600;font-size:15px;margin-bottom:8px">No control plan items yet</div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:20px">Create from customer prerequisites, apply the standard template, or add custom items.</div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="openCreateFromReqModal_qc()">Create from Customer Requirements</button>
          <button class="btn btn-secondary" onclick="showToast('Applying standard template…','info')">Apply standard template</button>
          <button class="btn btn-secondary" onclick="openAddCPItemModal_qc()">Add custom item</button>
        </div>
      </div>` : `
    <div class="card">
      <div style="overflow-x:auto">
        <table class="itp-table" style="min-width:900px">
          <thead>
            <tr>
              <th style="width:100px">Stage</th>
              <th>Activity</th>
              <th style="width:110px">Ref Doc</th>
              <th style="width:190px">Parameters / Acceptance Criteria</th>
              <th style="width:120px">Responsible</th>
              <th colspan="3" style="text-align:center;border-bottom:2px solid var(--brand);background:var(--bg-base)">Inspection</th>
              <th style="width:120px">Status / Action</th>
              <th style="width:120px">Remarks</th>
            </tr>
            <tr style="background:var(--bg-elevated)">
              <th colspan="5" style="background:var(--bg-base);border-bottom:1px solid var(--border)"></th>
              <th style="width:54px;text-align:center;font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;padding:5px 8px;border-bottom:1px solid var(--border)">Internal</th>
              <th style="width:54px;text-align:center;font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;padding:5px 8px;border-bottom:1px solid var(--border)">Customer</th>
              <th style="width:54px;text-align:center;font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;padding:5px 8px;border-bottom:1px solid var(--border)">TPI/Client</th>
              <th colspan="2" style="background:var(--bg-base);border-bottom:1px solid var(--border)"></th>
            </tr>
          </thead>
          <tbody>
            ${stages.map(stage => {
              const rows = byStage[stage];
              return rows.map((r, si) => {
                const isFirst  = si === 0;
                const rowCls   = r.status==='failed' ? 'itp-hold-row' : r.status==='in_progress'||r.status==='active' ? 'itp-active-row' : r.status==='passed' ? '' : '';
                return `
                <tr class="${rowCls}">
                  ${isFirst ? `<td rowspan="${rows.length}" style="font-size:11px;font-weight:600;color:var(--brand);vertical-align:top;padding-top:12px;border-right:2px solid var(--border)">${stage}</td>` : ''}
                  <td style="font-size:13px;color:var(--text-primary)">${r.activity}</td>
                  <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${r.ref||'—'}</td>
                  <td style="font-size:11px;color:var(--text-secondary);line-height:1.5">${r.parameters||'—'}</td>
                  <td style="font-size:12px;color:var(--text-secondary)">${r.responsible||'—'}</td>
                  <td style="text-align:center">${_itpCodePill(r.internal)}</td>
                  <td style="text-align:center">${_itpCodePill(r.customer)}</td>
                  <td style="text-align:center">${_itpCodePill(r.tpi)}</td>
                  <td>
                    ${_itpStatusBadge(r.status)}
                    ${(r.status==='pending'||r.status==='in_progress') ? `
                    <div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">
                      <button class="btn btn-ghost btn-xs" style="color:var(--green)" onclick="updateCPStatus_qc('${pid}',${items.indexOf(r)},'passed')">✓ Pass</button>
                      <button class="btn btn-ghost btn-xs" style="color:var(--red)"   onclick="updateCPStatus_qc('${pid}',${items.indexOf(r)},'failed')">✕ Fail</button>
                    </div>` : ''}
                  </td>
                  <td style="font-size:11px;color:var(--text-muted)">${r.remarks||''}</td>
                </tr>`;
              }).join('');
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`}
  `;
}

function updateCPStatus_qc(pid, idx, status) {
  const item = (QCData.controlPlan[pid]||[])[idx];
  if (!item) return;
  item.status = status;
  showToast(`Control plan item marked as ${status}`, 'success');
  _renderProjectCP(pid);
}

function openAddCPItemModal_qc() {
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const codeOpts = (sel='P', withNull=false) => (withNull ? '<option value="">—</option>' : '') + ['P','R','W','H'].map(c=>`<option value="${c}"${c===sel?' selected':''}>${c} — ${{P:'Perform',R:'Review',W:'Witness',H:'Hold'}[c]}</option>`).join('');
  openQCDetailPanel(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Add control plan item</div>
        <button class="btn-icon" onclick="closeQCDetailPanel()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <div style="display:grid;grid-template-columns:1fr 80px;gap:10px">
          <div class="qc-field"><label>Stage name</label><input id="ncp-stage" type="text" placeholder="Fit-up, Welding, NDE, Hydrostatic Test…"/></div>
          <div class="qc-field"><label>Stage no.</label><input id="ncp-stageno" type="number" min="1" placeholder="5"/></div>
        </div>
        <div class="qc-field"><label>Activity</label><input id="ncp-activity" type="text" placeholder="Inspection / test activity"/></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="qc-field"><label>Reference doc</label><input id="ncp-ref" type="text" placeholder="API 650 §7.3…"/></div>
          <div class="qc-field"><label>Responsible</label><input id="ncp-resp" type="text" placeholder="QC Inspector…"/></div>
        </div>
        <div class="qc-field"><label>Parameters / Acceptance criteria</label>
          <textarea id="ncp-params" rows="2" placeholder="Tolerances, limits, test conditions…"></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          <div class="qc-field"><label>Internal</label><select id="ncp-int">${codeOpts('P')}</select></div>
          <div class="qc-field"><label>Customer</label><select id="ncp-cust">${codeOpts('R',true)}</select></div>
          <div class="qc-field"><label>TPI / Client</label><select id="ncp-tpi">${codeOpts('W',true)}</select></div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitAddCPItem_qc()">Add item</button>
          <button class="btn btn-secondary" onclick="closeQCDetailPanel()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function submitAddCPItem_qc() {
  const pid      = AppState.activeProject || 'P-2401';
  const activity = document.getElementById('ncp-activity')?.value?.trim();
  const stage    = document.getElementById('ncp-stage')?.value?.trim();
  if (!activity || !stage) { showToast('Stage and activity are required', 'error'); return; }
  const item = {
    stage_no:    parseInt(document.getElementById('ncp-stageno')?.value) || 99,
    stage,       activity,
    ref:         document.getElementById('ncp-ref')?.value    || null,
    responsible: document.getElementById('ncp-resp')?.value   || null,
    parameters:  document.getElementById('ncp-params')?.value || null,
    internal:    document.getElementById('ncp-int')?.value    || 'P',
    customer:    document.getElementById('ncp-cust')?.value   || null,
    tpi:         document.getElementById('ncp-tpi')?.value    || null,
    status: 'pending', remarks: '',
  };
  (QCData.controlPlan[pid] = QCData.controlPlan[pid]||[]).push(item);
  closeQCDetailPanel();
  showToast('Control plan item added', 'success');
  _renderProjectCP(pid);
}

/* ── Standard Control Plan Library ──────────────────────────── */
function _renderStandardCP() {
  const tpls = QCData.cpTemplates || [];
  const byType = {};
  tpls.forEach(t => { (byType[t.project_type] = byType[t.project_type]||[]).push(t); });
  const types = Object.keys(byType).sort();

  document.getElementById('itpTabContent').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <span style="font-size:12px;color:var(--text-muted)">${tpls.length} standard items across ${types.length} project types</span>
      <button class="btn btn-primary btn-sm" onclick="openAddCPTemplateModal_qc()">
        <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Add template item
      </button>
    </div>

    ${tpls.length === 0 ? `
      <div style="padding:48px;text-align:center;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-md)">
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Standard templates are loaded from the server. Connect the backend to see them, or add manually.</div>
        <button class="btn btn-primary" onclick="openAddCPTemplateModal_qc()">Add first template item</button>
      </div>` : types.map(type => {
        const rows = byType[type];
        return `
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <span class="card-title">${type}</span>
            <span class="badge badge-muted" style="font-size:10px">${rows.length} items</span>
          </div>
          <div style="overflow-x:auto">
            <table class="itp-table" style="min-width:900px">
              ${_itpGroupedHeader()}
              <tbody>
                ${rows.map(r => `
                <tr>
                  <td style="font-size:11px;color:var(--text-muted)">${r.stage_no||'—'}</td>
                  <td style="font-size:13px;color:var(--text-primary)">${r.activity}</td>
                  <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${r.reference_doc||'—'}</td>
                  <td style="font-size:11px;color:var(--text-secondary);line-height:1.5">${r.parameters||'—'}</td>
                  <td style="font-size:12px;color:var(--text-secondary)">${r.responsible||'—'}</td>
                  <td style="text-align:center">${_itpCodePill(r.internal_code)}</td>
                  <td style="text-align:center">${_itpCodePill(r.customer_code)}</td>
                  <td style="text-align:center">${_itpCodePill(r.tpi_code)}</td>
                  <td style="font-size:11px;color:var(--text-muted)">${r.remarks||''}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
      }).join('')}
  `;
}

function openAddCPTemplateModal_qc() {
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const codeOpts = (sel='P', withNull=false) => (withNull ? '<option value="">—</option>' : '') + ['P','R','W','H'].map(c=>`<option value="${c}"${c===sel?' selected':''}>${c} — ${{P:'Perform',R:'Review',W:'Witness',H:'Hold'}[c]}</option>`).join('');
  openQCDetailPanel(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Add standard template item</div>
        <button class="btn-icon" onclick="closeQCDetailPanel()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <div class="qc-field"><label>Project type</label>
          <select id="ntpl-type">
            <option>Storage Tank</option><option>Pressure Vessel</option>
            <option>Heat Exchanger</option><option>Structural Steel</option>
            <option>Piping / Spoolwork</option><option>General</option>
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 80px;gap:10px">
          <div class="qc-field"><label>Stage name</label><input id="ntpl-stage" type="text" placeholder="Material Incoming, Fit-up…"/></div>
          <div class="qc-field"><label>Stage no.</label><input id="ntpl-stageno" type="number" min="1" placeholder="1"/></div>
        </div>
        <div class="qc-field"><label>Activity</label><input id="ntpl-activity" type="text" placeholder="Inspection / test activity"/></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="qc-field"><label>Reference doc</label><input id="ntpl-ref" type="text" placeholder="API 650 §7.3…"/></div>
          <div class="qc-field"><label>Responsible</label><input id="ntpl-resp" type="text" placeholder="QC Inspector…"/></div>
        </div>
        <div class="qc-field"><label>Parameters / Acceptance criteria</label>
          <textarea id="ntpl-params" rows="2" placeholder="Tolerances, acceptance limits…"></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          <div class="qc-field"><label>Internal</label><select id="ntpl-int">${codeOpts('P')}</select></div>
          <div class="qc-field"><label>Customer</label><select id="ntpl-cust">${codeOpts('R',true)}</select></div>
          <div class="qc-field"><label>TPI / Client</label><select id="ntpl-tpi">${codeOpts('W',true)}</select></div>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitAddCPTemplate_qc()">Add to library</button>
          <button class="btn btn-secondary" onclick="closeQCDetailPanel()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function submitAddCPTemplate_qc() {
  const activity = document.getElementById('ntpl-activity')?.value?.trim();
  const stage    = document.getElementById('ntpl-stage')?.value?.trim();
  const type     = document.getElementById('ntpl-type')?.value;
  if (!activity || !stage) { showToast('Stage and activity are required', 'error'); return; }
  QCData.cpTemplates.push({
    project_type:  type,
    stage_no:      parseInt(document.getElementById('ntpl-stageno')?.value) || 1,
    stage_name:    stage, activity,
    reference_doc: document.getElementById('ntpl-ref')?.value    || null,
    responsible:   document.getElementById('ntpl-resp')?.value   || null,
    parameters:    document.getElementById('ntpl-params')?.value || null,
    internal_code: document.getElementById('ntpl-int')?.value    || 'P',
    customer_code: document.getElementById('ntpl-cust')?.value   || null,
    tpi_code:      document.getElementById('ntpl-tpi')?.value    || null,
    remarks: '',
  });
  closeQCDetailPanel();
  showToast('Template item added to library', 'success');
  _renderStandardCP();
}

/* ── Create ITP & Control Plan from Customer Requirements ────── */
const _cpReqWizard = { step:1, pid:null, prereqs:{}, items:[] };

function openCreateFromReqModal_qc() {
  _cpReqWizard.pid   = AppState.activeProject || 'P-2401';
  _cpReqWizard.items = [];
  _cpReqWizard.prereqs = {};
  _showCPWizardStep1();
}

function _cpWizProg(active) {
  return ['Customer prerequisites','Build inspection items','Review & create'].map((lbl,i)=>`
    <div style="display:flex;align-items:center;flex:1">
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
        <div style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;
          background:${i<=active?'var(--brand)':'var(--bg-elevated)'};color:${i<=active?'#fff':'var(--text-muted)'}">${i+1}</div>
        <span style="font-size:11px;color:${i<=active?'var(--text-primary)':'var(--text-muted)'};white-space:nowrap">${lbl}</span>
      </div>
      ${i<2?`<div style="flex:1;height:1px;background:${i<active?'var(--brand)':'var(--border)'};margin:0 8px"></div>`:''}
    </div>`).join('');
}

function _showCPWizardStep1() {
  const p = _cpReqWizard.prereqs;
  const X = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  openQCDetailPanel(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">Step 1 of 3 — Customer prerequisites</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Create ITP & Control Plan — ${_cpReqWizard.pid}</div>
        </div>
        <button class="btn-icon" onclick="closeQCDetailPanel()">${X}</button>
      </div>
      <div class="qc-modal-body">
        <div style="display:flex;align-items:center;margin-bottom:18px">${_cpWizProg(0)}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="qc-field"><label>Customer reference / PO</label><input id="cpr-ref" type="text" value="${p.ref||''}" placeholder="e.g. CUST-REQ-2401-R1"/></div>
          <div class="qc-field"><label>Customer name</label><input id="cpr-customer" type="text" value="${p.customer||''}" placeholder="e.g. Saudi Aramco"/></div>
        </div>
        <div class="qc-field"><label>Applicable standards & codes <span style="font-weight:400;color:var(--text-muted)">(comma-separated)</span></label>
          <input id="cpr-standards" type="text" value="${(p.standards||[]).join(', ')}" placeholder="e.g. ASME Section VIII Div.1, API 650, AWS D1.6"/>
        </div>
        <div class="qc-field"><label>Customer inspection level</label>
          <select id="cpr-level">
            ${['Review only','Witness & Hold','Full surveillance','Hold points only'].map(v=>`<option${(p.inspLevel||'Witness & Hold')===v?' selected':''}>${v}</option>`).join('')}
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="qc-field"><label>TPI required?</label>
            <select id="cpr-tpi"><option value="no"${!p.tpiRequired?' selected':''}>No</option><option value="yes"${p.tpiRequired?' selected':''}>Yes</option></select>
          </div>
          <div class="qc-field"><label>TPI body</label><input id="cpr-tpiname" type="text" value="${p.tpiName||''}" placeholder="e.g. Bureau Veritas"/></div>
        </div>
        <div class="qc-field"><label>Special customer requirements</label>
          <textarea id="cpr-special" rows="3" placeholder="e.g. Hydrostatic test — customer witness mandatory. 100% RT on all welds.">${p.special||''}</textarea>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="_cpWiz1Next()">Next — Build inspection items →</button>
          <button class="btn btn-secondary" onclick="closeQCDetailPanel()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function _cpWiz1Next() {
  _cpReqWizard.prereqs = {
    ref:         document.getElementById('cpr-ref').value.trim()       || ('CP-'+_cpReqWizard.pid+'-R1'),
    customer:    document.getElementById('cpr-customer').value.trim()  || 'Customer',
    standards:   document.getElementById('cpr-standards').value.split(',').map(s=>s.trim()).filter(Boolean),
    inspLevel:   document.getElementById('cpr-level').value,
    tpiRequired: document.getElementById('cpr-tpi').value === 'yes',
    tpiName:     document.getElementById('cpr-tpiname').value.trim(),
    special:     document.getElementById('cpr-special').value.trim(),
  };
  if (_cpReqWizard.items.length === 0)
    _cpReqWizard.items = [{stageNo:'',stageName:'',activity:'',ref:'',parameters:'',responsible:'QC Inspector',internal:'P',customer:'',tpi:''}];
  _showCPWizardStep2();
}

function _showCPWizardStep2() {
  const items = _cpReqWizard.items;
  const X = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const codeOpts = (sel, req) => (req?'':'<option value="">—</option>') + ['P','R','W','H'].map(v=>`<option value="${v}"${sel===v?' selected':''}>${v} — ${{P:'Perform',R:'Review',W:'Witness',H:'Hold'}[v]}</option>`).join('');

  const rows = items.map((it,i)=>`
    <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase">Item ${i+1}</span>
        ${items.length>1?`<button class="btn-icon" onclick="_cpWizRemove(${i})">${X}</button>`:''}
      </div>
      <div style="display:grid;grid-template-columns:80px 1fr 1fr;gap:8px;margin-bottom:8px">
        <div class="qc-field"><label>Stage no.</label><input type="text" value="${it.stageNo}" oninput="_cpReqWizard.items[${i}].stageNo=this.value" placeholder="e.g. 3"/></div>
        <div class="qc-field"><label>Stage name</label><input type="text" value="${it.stageName}" oninput="_cpReqWizard.items[${i}].stageName=this.value" placeholder="e.g. Welding"/></div>
        <div class="qc-field"><label>Responsible</label><input type="text" value="${it.responsible}" oninput="_cpReqWizard.items[${i}].responsible=this.value" placeholder="QC Inspector"/></div>
      </div>
      <div class="qc-field"><label>Inspection activity</label><input type="text" value="${it.activity}" oninput="_cpReqWizard.items[${i}].activity=this.value" placeholder="Describe the inspection activity"/></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
        <div class="qc-field"><label>Reference doc</label><input type="text" value="${it.ref}" oninput="_cpReqWizard.items[${i}].ref=this.value" placeholder="e.g. API 650 §7.3"/></div>
        <div class="qc-field"><label>Acceptance parameters</label><input type="text" value="${it.parameters}" oninput="_cpReqWizard.items[${i}].parameters=this.value" placeholder="e.g. ±1mm tolerance"/></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px">
        <div class="qc-field"><label>Internal</label><select onchange="_cpReqWizard.items[${i}].internal=this.value">${codeOpts(it.internal,true)}</select></div>
        <div class="qc-field"><label>Customer</label><select onchange="_cpReqWizard.items[${i}].customer=this.value">${codeOpts(it.customer,false)}</select></div>
        <div class="qc-field"><label>TPI</label><select onchange="_cpReqWizard.items[${i}].tpi=this.value">${codeOpts(it.tpi,false)}</select></div>
      </div>
    </div>`).join('');

  openQCDetailPanel(`
    <div class="qc-modal-inner" style="max-width:640px">
      <div class="qc-modal-header">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">Step 2 of 3 — Build inspection items</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Create ITP & Control Plan — ${_cpReqWizard.pid}</div>
        </div>
        <button class="btn-icon" onclick="closeQCDetailPanel()">${X}</button>
      </div>
      <div class="qc-modal-body">
        <div style="display:flex;align-items:center;margin-bottom:14px">${_cpWizProg(1)}</div>
        <div style="padding:8px 12px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:12px;display:flex;flex-wrap:wrap;gap:6px">
          ${_cpReqWizard.prereqs.standards.map(s=>`<span class="badge badge-muted" style="font-size:10px">${s}</span>`).join('')}
          <span class="badge badge-accent" style="font-size:10px">${_cpReqWizard.prereqs.inspLevel}</span>
          ${_cpReqWizard.prereqs.tpiRequired?`<span class="badge badge-accent" style="font-size:10px">TPI: ${_cpReqWizard.prereqs.tpiName||'TPI'}</span>`:''}
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;max-height:340px;overflow-y:auto;padding-right:4px">${rows}</div>
        <button class="btn btn-secondary btn-sm" style="margin-top:10px;width:100%" onclick="_cpWizAddItem()">+ Add inspection item</button>
        <div style="display:flex;gap:10px;margin-top:8px">
          <button class="btn btn-secondary" onclick="_showCPWizardStep1()">← Back</button>
          <button class="btn btn-primary" style="flex:1" onclick="_cpWiz2Next()">Next — Review & create →</button>
          <button class="btn btn-ghost" onclick="closeQCDetailPanel()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function _cpWizAddItem() {
  _cpReqWizard.items.push({stageNo:'',stageName:'',activity:'',ref:'',parameters:'',responsible:'QC Inspector',internal:'P',customer:'',tpi:''});
  _showCPWizardStep2();
}
function _cpWizRemove(i) { _cpReqWizard.items.splice(i,1); _showCPWizardStep2(); }

function _cpWiz2Next() {
  if (!_cpReqWizard.items.every(it=>it.activity.trim())) { showToast('Each item needs an inspection activity','error'); return; }
  _showCPWizardStep3();
}

function _showCPWizardStep3() {
  const pre   = _cpReqWizard.prereqs;
  const items = _cpReqWizard.items;
  const X = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  openQCDetailPanel(`
    <div class="qc-modal-inner" style="max-width:640px">
      <div class="qc-modal-header">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">Step 3 of 3 — Review & create</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Create ITP & Control Plan — ${_cpReqWizard.pid}</div>
        </div>
        <button class="btn-icon" onclick="closeQCDetailPanel()">${X}</button>
      </div>
      <div class="qc-modal-body">
        <div style="display:flex;align-items:center;margin-bottom:14px">${_cpWizProg(2)}</div>
        <div style="padding:12px;background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:12px;font-size:12px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div><span style="color:var(--text-muted)">Ref:</span> <strong>${pre.ref}</strong></div>
            <div><span style="color:var(--text-muted)">Customer:</span> <strong>${pre.customer}</strong></div>
            <div><span style="color:var(--text-muted)">Inspection level:</span> <strong>${pre.inspLevel}</strong></div>
            <div><span style="color:var(--text-muted)">TPI:</span> <strong>${pre.tpiRequired?(pre.tpiName||'Yes'):'No'}</strong></div>
          </div>
          ${pre.standards.length?`<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:5px">${pre.standards.map(s=>`<span class="badge badge-muted" style="font-size:10px">${s}</span>`).join('')}</div>`:''}
          ${pre.special?`<div style="margin-top:8px;padding:6px 9px;background:var(--amber-bg);border-radius:3px;font-size:11px;color:var(--amber)">${pre.special}</div>`:''}
        </div>
        <div style="overflow-x:auto;max-height:260px;overflow-y:auto;margin-bottom:12px">
          <table class="itp-table" style="min-width:500px;font-size:11px">
            <thead><tr>
              <th style="width:44px">Stage</th><th style="width:100px">Stage name</th><th>Activity</th>
              <th style="width:40px;text-align:center">Int.</th><th style="width:40px;text-align:center">Cust.</th><th style="width:40px;text-align:center">TPI</th>
            </tr></thead>
            <tbody>
              ${items.map(it=>`
                <tr>
                  <td style="font-family:var(--font-mono);color:var(--text-muted)">${it.stageNo||'—'}</td>
                  <td style="color:var(--text-secondary)">${it.stageName||'—'}</td>
                  <td>${it.activity}</td>
                  <td style="text-align:center">${_itpCodePill(it.internal||'P')}</td>
                  <td style="text-align:center">${_itpCodePill(it.customer)}</td>
                  <td style="text-align:center">${_itpCodePill(it.tpi)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-secondary" onclick="_showCPWizardStep2()">← Back</button>
          <button class="btn btn-primary" style="flex:1" onclick="_cpWizCreate()">
            <svg viewBox="0 0 15 15" fill="none"><path d="M2 8l4 4 7-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Create ITP & Control Plan (${items.length} items)
          </button>
          <button class="btn btn-ghost" onclick="closeQCDetailPanel()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function _cpWizCreate() {
  const pid   = _cpReqWizard.pid;
  const pre   = _cpReqWizard.prereqs;
  const newItems = _cpReqWizard.items.map((it,i) => ({
    stage_no:  parseInt(it.stageNo)||i+1,
    stage:     it.stageName || 'General',
    activity:  it.activity,
    ref:       it.ref || null,
    parameters:it.parameters || null,
    responsible:it.responsible || 'QC Inspector',
    internal:  it.internal || 'P',
    customer:  it.customer || null,
    tpi:       it.tpi || null,
    status:    'pending', remarks: pre.special||'',
  }));
  QCData.controlPlan[pid] = (QCData.controlPlan[pid]||[]).concat(newItems);
  closeQCDetailPanel();
  showToast(`ITP & Control Plan created — ${newItems.length} items added for ${pid}`, 'success');
  QCData.cpView = 'project';
  renderQC_itp();
}

/* ── Modal panel helper (slide-in panel or modal) ───────────── */
function openQCDetailPanel(html) {
  let panel = document.getElementById('qcDetailPanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'qcDetailPanel';
    panel.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.72);z-index:200;backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center';
    panel.onclick = e => { if (e.target === panel) closeQCDetailPanel(); };
    document.body.appendChild(panel);
  }
  panel.innerHTML = `<div style="width:min(600px,94vw);max-height:90vh;overflow-y:auto" onclick="event.stopPropagation()">${html}</div>`;
  panel.style.display = 'flex';
}

function closeQCDetailPanel() {
  const panel = document.getElementById('qcDetailPanel');
  if (panel) panel.style.display = 'none';
}

let _auditActiveTab = 'dashboard';

function renderQC_audits() {
    const el = document.getElementById('pageContent');
    el.innerHTML = `
        <div class="page-header" style="margin-bottom:20px">
            <div>
                <div class="page-title">Audit Management Command Centre</div>
                <div class="page-subtitle">QMS compliance, vendor audits, and certification tracking</div>
            </div>
            <div class="page-actions">
                <button class="btn btn-primary btn-sm" onclick="showToast('Scheduling new audit...','info')">+ Schedule New Audit</button>
            </div>
        </div>

        <div class="card" style="margin-bottom:24px; padding:0">
            <div style="display:flex; border-bottom:1px solid var(--border); padding:0 12px">
                ${['dashboard', 'schedule', 'internal', 'vendor', 'certification', 'capa'].map(tab => `
                    <div class="tab-item ${_auditActiveTab === tab ? 'active' : ''}" 
                         onclick="_switchAuditTab('${tab}')"
                         style="padding:14px 20px; font-size:13px; font-weight:600; cursor:pointer; color:${_auditActiveTab === tab ? 'var(--brand)' : 'var(--text-muted)'}; border-bottom:2px solid ${_auditActiveTab === tab ? 'var(--brand)' : 'transparent'}; transition:0.2s">
                        ${tab.toUpperCase()}
                    </div>
                `).join('')}
            </div>
            <div id="audit-tab-content" style="padding:24px">
                <!-- Dynamic Content -->
            </div>
        </div>
    `;
    _renderActiveAuditTab();
}
window.renderQC_audits = renderQC_audits;

function _switchAuditTab(tab) {
    _auditActiveTab = tab;
    renderQC_audits();
}
window._switchAuditTab = _switchAuditTab;

function _renderActiveAuditTab() {
    const container = document.getElementById('audit-tab-content');
    if (!container) return;

    if (_auditActiveTab === 'dashboard') renderAuditDashboard(container);
    if (_auditActiveTab === 'schedule') renderAuditSchedule(container);
    if (_auditActiveTab === 'internal') renderAuditInternal(container);
    if (_auditActiveTab === 'vendor') renderAuditVendor(container);
    if (_auditActiveTab === 'certification') renderAuditCertification(container);
    if (_auditActiveTab === 'capa') renderAuditCAPA(container);
}

// ── A. Audit Dashboard ───────────────────────────────────────
function renderAuditDashboard(container) {
    const completed = QCData.audits.filter(a => a.status === 'completed').length;
    const openCARs = QCData.capa.filter(c => c.status === 'open').length;

    container.innerHTML = `
        <div class="metric-grid" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:20px; margin-bottom:24px">
            ${kpiCard('Total Audits (YTD)', QCData.audits.length, 'Scheduled & Completed', 'var(--blue)', [10,12,15,14,18,20,22])}
            ${kpiCard('Audit Completion', Math.round((completed/QCData.audits.length)*100) + '%', 'On-time performance', 'var(--green)')}
            ${kpiCard('Open CARs', openCARs, 'Corrective Actions Pending', 'var(--red)', [5,8,4,6,7,5,openCARs])}
            ${kpiCard('Avg QMS Score', '88%', 'Internal compliance level', 'var(--brand)')}
        </div>

        <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:24px">
            <div class="card" style="border:1px solid var(--border)">
                <div class="card-header"><span class="card-title">Upcoming Audit Timeline</span></div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead><tr><th>Audit ID</th><th>Scope</th><th>Auditor</th><th>Date</th></tr></thead>
                        <tbody>
                            ${QCData.audits.filter(a => a.status === 'scheduled').map(a => `
                                <tr>
                                    <td style="font-weight:700">${a.id}</td>
                                    <td style="font-size:12px">${a.scope}</td>
                                    <td>${a.auditor}</td>
                                    <td style="font-size:12px; color:var(--brand)">${fmtDate(a.date)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card" style="border:1px solid var(--border)">
                <div class="card-header"><span class="card-title">Findings by Category</span></div>
                <div style="padding:20px; height:200px; display:flex; align-items:center; justify-content:center">
                    <!-- Placeholder for Chart -->
                    <div style="text-align:center; color:var(--text-muted)">
                        <div style="font-size:32px">📊</div>
                        <div style="font-size:11px; margin-top:8px">Visualisation of QMS findings distribution</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ── B. Audit Schedule (Simple Gantt) ────────────────────────
function renderAuditSchedule(container) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    container.innerHTML = `
        <div style="overflow-x:auto">
            <div style="min-width:1000px">
                <!-- Header: Months -->
                <div style="display:grid; grid-template-columns:250px repeat(12, 1fr); border-bottom:1px solid var(--border); background:var(--bg-elevated); padding:10px 0">
                    <div style="padding-left:15px; font-weight:700; font-size:11px">AUDIT ACTIVITY</div>
                    ${months.map(m => `<div style="text-align:center; font-weight:700; font-size:11px; color:var(--text-muted)">${m.toUpperCase()}</div>`).join('')}
                </div>

                <!-- Rows: Audits -->
                <div style="display:flex; flex-direction:column">
                    ${QCData.audits.map(a => {
                        const date = new Date(a.date);
                        const startMonth = date.getMonth();
                        const color = a.type === 'Internal' ? 'var(--blue)' : a.type === 'Supplier' ? 'var(--amber)' : 'var(--green)';
                        
                        return `
                        <div style="display:grid; grid-template-columns:250px repeat(12, 1fr); border-bottom:1px solid var(--border); height:50px; align-items:center">
                            <div style="padding-left:15px">
                                <div style="font-weight:700; font-size:12px">${a.id}</div>
                                <div style="font-size:10px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${a.scope}</div>
                            </div>
                            <!-- Gantt Bar -->
                            <div style="grid-column: ${startMonth + 2} / span 1; padding:0 4px">
                                <div class="glass-hover" 
                                     style="height:24px; background:${color}; border-radius:12px; opacity:0.8; display:flex; align-items:center; justify-content:center; cursor:pointer"
                                     onclick="showToast('Edit schedule for ${a.id}','info')">
                                     <div style="width:8px; height:8px; background:#fff; border-radius:50%; box-shadow:0 0 8px #fff"></div>
                                </div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        </div>
        <div style="margin-top:20px; display:flex; gap:16px; font-size:11px; color:var(--text-muted)">
            <div style="display:flex; align-items:center; gap:6px"><div style="width:12px; height:12px; background:var(--blue); border-radius:3px"></div> Internal</div>
            <div style="display:flex; align-items:center; gap:6px"><div style="width:12px; height:12px; background:var(--amber); border-radius:3px"></div> Supplier</div>
            <div style="display:flex; align-items:center; gap:6px"><div style="width:12px; height:12px; background:var(--green); border-radius:3px"></div> Certification</div>
        </div>
    `;
}

// ── C. Internal Audit (ISO 9001) ───────────────────────────
function renderAuditInternal(container) {
    container.innerHTML = `
        <div class="table-wrap">
            <table class="data-table">
                <thead><tr><th>Audit ID</th><th>Clause Scope</th><th>Date</th><th>Score</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                    ${QCData.audits.filter(a => a.type === 'Internal').map(a => `
                        <tr>
                            <td style="font-weight:700">${a.id}</td>
                            <td>${a.scope}</td>
                            <td>${fmtDate(a.date)}</td>
                            <td>${a.score ? `<span style="font-weight:700; color:var(--green)">${a.score}%</span>` : '—'}</td>
                            <td><span class="badge ${a.status==='completed'?'badge-muted':a.status==='in-progress'?'badge-amber':'badge-blue'}">${a.status.toUpperCase()}</span></td>
                            <td><button class="btn btn-ghost btn-xs" onclick="startInternalAuditQuestionnaire('${a.id}')">Start Questionnaire</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

window.startInternalAuditQuestionnaire = function(id) {
    const audit = QCData.audits.find(a => a.id === id);
    openQCDetailPanel(`
        <div class="card" style="padding:24px; width:800px; max-width:95vw">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
                <div>
                    <div style="font-weight:700; font-size:18px">ISO 9001:2015 Checklist — ${id}</div>
                    <div style="font-size:12px; color:var(--text-muted)">Conducting internal audit for ${audit.scope}</div>
                </div>
                <button class="btn btn-icon" onclick="closeQCDetailPanel()">&times;</button>
            </div>

            <div style="display:flex; flex-direction:column; gap:16px">
                ${QCData.auditQuestions_Internal.map((q, idx) => `
                    <div style="padding:16px; border:1px solid var(--border); border-radius:12px; background:var(--bg-elevated)">
                        <div style="display:flex; gap:12px">
                            <div style="font-weight:700; color:var(--brand)">${q.clause}</div>
                            <div style="font-size:13px; font-weight:600; line-height:1.4">${q.text}</div>
                        </div>
                        <div style="margin-top:12px; display:flex; gap:12px; align-items:center; flex-wrap:wrap">
                            <select class="form-control-sm" style="width:160px">
                                <option>Conforming</option>
                                <option>Minor NC</option>
                                <option>Major NC</option>
                                <option>N/A</option>
                            </select>
                            <input type="text" class="form-control-sm" style="flex:1; min-width:200px" placeholder="Evidence / Notes...">
                            <button class="btn btn-ghost btn-xs" onclick="_auditAttachProof(this)" style="display:flex; align-items:center; gap:6px">
                                📎 Attach Proof
                            </button>
                            <span class="proof-status" style="display:none; font-size:11px; color:var(--green)">✅ File Attached</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div style="margin-top:24px; display:flex; justify-content:flex-end; gap:12px">
                <button class="btn btn-secondary" onclick="closeQCDetailPanel()">Save Draft</button>
                <button class="btn btn-primary" onclick="showToast('Audit scoring updated','success'); closeQCDetailPanel()">Submit Audit</button>
            </div>
        </div>
    `);
}

// ── D. Vendor / Supplier Audit ────────────────────────────
function renderAuditVendor(container) {
    container.innerHTML = `
        <div class="table-wrap">
            <table class="data-table">
                <thead><tr><th>Audit ID</th><th>Vendor Name</th><th>Date</th><th>Auditor</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                    ${QCData.audits.filter(a => a.type === 'Supplier').map(a => `
                        <tr>
                            <td style="font-weight:700">${a.id}</td>
                            <td>${a.scope.split(' — ')[0]}</td>
                            <td>${fmtDate(a.date)}</td>
                            <td>${a.auditor}</td>
                            <td><span class="badge ${a.status==='scheduled'?'badge-blue':'badge-muted'}">${a.status.toUpperCase()}</span></td>
                            <td><button class="btn btn-ghost btn-xs" onclick="startVendorAuditQuestionnaire('${a.id}')">Audit Checklist</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

window.startVendorAuditQuestionnaire = function(id) {
    const audit = QCData.audits.find(a => a.id === id);
    openQCDetailPanel(`
        <div class="card" style="padding:24px; width:700px">
            <div style="font-weight:700; font-size:18px; margin-bottom:16px">Vendor/Subcontractor Evaluation — ${id}</div>
            <div style="display:flex; flex-direction:column; gap:12px">
                ${QCData.auditQuestions_Vendor.map(q => `
                    <div style="padding:12px; border-bottom:1px solid var(--border)">
                        <div style="font-size:11px; font-weight:700; color:var(--brand); text-transform:uppercase">${q.section}</div>
                        <div style="font-size:13px; margin:4px 0">${q.text}</div>
                        <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px">
                            <div style="display:flex; gap:12px">
                                <label style="font-size:12px; cursor:pointer"><input type="radio" name="q-${idx}"> Satisfactory</label>
                                <label style="font-size:12px; cursor:pointer"><input type="radio" name="q-${idx}"> Needs Improvement</label>
                                <label style="font-size:12px; cursor:pointer"><input type="radio" name="q-${idx}"> Failed</label>
                            </div>
                            <div style="display:flex; align-items:center; gap:10px">
                                <button class="btn btn-ghost btn-xs" onclick="_auditAttachProof(this)" style="display:flex; align-items:center; gap:4px">
                                    📎 Attach Doc
                                </button>
                                <span class="proof-status" style="display:none; font-size:10px; color:var(--green); font-weight:700">ATTACHED</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top:20px; display:flex; justify-content:flex-end; gap:12px">
                <button class="btn btn-secondary" onclick="closeQCDetailPanel()">Cancel</button>
                <button class="btn btn-primary" onclick="showToast('Vendor audit saved','success'); closeQCDetailPanel()">Complete Evaluation</button>
            </div>
        </div>
    `);
}

window._auditAttachProof = function(btn) {
    const status = btn.parentElement.querySelector('.proof-status');
    showToast('Uploading supporting document...', 'info');
    setTimeout(() => {
        if (status) status.style.display = 'inline';
        btn.innerHTML = '📎 Replace';
        showToast('Evidence document attached successfully', 'success');
    }, 800);
}

// ── E. Certification Tracker ──────────────────────────────
function renderAuditCertification(container) {
    container.innerHTML = `
        <div class="table-wrap">
            <table class="data-table">
                <thead><tr><th>Certification</th><th>Issuing Body</th><th>Last Audit</th><th>Next Due</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                    ${QCData.certifications.map(c => `
                        <tr>
                            <td style="font-weight:700">${c.name}</td>
                            <td>${c.body}</td>
                            <td style="font-size:12px">${fmtDate(c.lastAudit)}</td>
                            <td style="font-size:12px; color:${c.status==='warn'?'var(--red)':'var(--text-muted)'}">${fmtDate(c.due)}</td>
                            <td><span class="badge ${c.status==='valid'?'badge-green':'badge-amber'}">${c.status.toUpperCase()}</span></td>
                            <td><button class="btn btn-muted btn-xs">View Cert</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ── F. Corrective Actions (CAPA) ───────────────────────────
function renderAuditCAPA(container) {
    container.innerHTML = `
        <div class="table-wrap">
            <table class="data-table">
                <thead><tr><th>CAR ID</th><th>Finding</th><th>Severity</th><th>Action Required</th><th>Due Date</th><th>Status</th></tr></thead>
                <tbody>
                    ${QCData.capa.map(c => `
                        <tr>
                            <td style="font-weight:700">${c.id}</td>
                            <td style="font-size:12px; max-width:200px">${c.finding}</td>
                            <td><span class="badge ${c.severity==='major'?'badge-red':'badge-amber'}">${c.severity.toUpperCase()}</span></td>
                            <td style="font-size:12px">${c.action}</td>
                            <td style="font-size:12px">${fmtDate(c.due)}</td>
                            <td><span class="badge ${c.status==='closed'?'badge-muted':'badge-green'}">${c.status.toUpperCase()}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderQC_documents() {
  const el = document.getElementById('pageContent');
  el.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">Master List of Documents (MLD)</span>
        <div style="display:flex;gap:8px">
          <input type="text" class="form-control" placeholder="Search QMS..." style="width:200px">
          <button class="btn btn-primary btn-xs">Upload Revision</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Doc Number</th><th>Title</th><th>Rev</th><th>Category</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${[
              { id: 'NF-QMS-QM-01', title: 'Quality Manual', rev: 'D', cat: 'Level 1', status: 'approved' },
              { id: 'NF-QMS-PR-05', title: 'NCR Procedure', rev: 'C', cat: 'Level 2', status: 'approved' },
              { id: 'NF-QMS-WI-12', title: 'GTAW Welding Instruction', rev: 'A', cat: 'Level 3', status: 'draft' },
            ].map(d => `
              <tr>
                <td style="font-family:var(--font-mono);font-size:12px">${d.id}</td>
                <td style="font-weight:600;font-size:13px">${d.title}</td>
                <td>${d.rev}</td>
                <td style="font-size:11px">${d.cat}</td>
                <td><span class="badge ${d.status==='approved'?'badge-green':'badge-amber'}">${d.status.toUpperCase()}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderQC_incoming() {
  const el = document.getElementById('pageContent');
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:20px">
      <div class="card">
        <div class="card-header" style="justify-content:space-between">
          <span class="card-title">Incoming Material Registry & MTC Verification</span>
          <div style="display:flex;gap:10px">
            <button class="btn btn-muted btn-xs">Upload Lab Report</button>
            <button class="btn btn-primary btn-xs">+ New GRN Receipt</button>
          </div>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Supplier / Item</th>
                <th>Chemical Analysis (MTC)</th>
                <th>Mechanical Properties</th>
                <th>Lab Status</th>
                <th>Release</th>
              </tr>
            </thead>
            <tbody>
              ${QCData.incoming.map(i => `
                <tr style="background:${i.status === 'quarantined' ? 'rgba(245, 158, 11, 0.03)' : 'transparent'}">
                  <td style="font-family:var(--font-mono);font-weight:700">
                    <div>${i.id}</div>
                    <div style="font-size:10px;color:var(--text-muted)">${i.date}</div>
                  </td>
                  <td>
                    <div style="font-weight:600">${i.supplier}</div>
                    <div style="font-size:11px">${i.item}</div>
                    <div style="font-size:10px;color:var(--brand);font-family:var(--font-mono)">Heat: ${i.mtcData.heatNo}</div>
                  </td>
                  <td>
                    <div style="display:flex;gap:12px;font-family:var(--font-mono);font-size:11px">
                      <div><small>C:</small> ${i.mtcData.chem.C}%</div>
                      <div><small>Mn:</small> ${i.mtcData.chem.Mn}%</div>
                      <div><small>Cr:</small> ${i.mtcData.chem.Cr}%</div>
                    </div>
                  </td>
                  <td>
                    <div style="display:flex;gap:12px;font-size:11px">
                      <div><small>Yield:</small> ${i.mtcData.mech.yield}</div>
                      <div><small>Tensile:</small> ${i.mtcData.mech.tensile || '—'}</div>
                    </div>
                  </td>
                  <td>
                    <span class="badge ${i.labReport === 'verified' ? 'badge-green' : 'badge-amber'}">
                      ${i.labReport.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span class="badge ${i.status === 'passed' ? 'badge-green' : i.status === 'failed' ? 'badge-red' : 'badge-amber'}">
                      ${i.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div class="card">
          <div class="card-header"><span class="card-title">Vendor Quality Performance</span></div>
          <div style="padding:20px;display:flex;flex-direction:column;gap:12px">
            ${[
              { vendor: 'Outokumpu', yield: 99.1, color: 'var(--green)' },
              { vendor: 'ESAB', yield: 97.5, color: 'var(--green)' },
              { vendor: 'Sandvik', yield: 82.3, color: 'var(--amber)' },
            ].map(v => `
              <div style="display:flex;flex-direction:column;gap:6px">
                <div style="display:flex;justify-content:space-between;font-size:12px">
                  <span style="font-weight:600">${v.vendor}</span>
                  <span style="font-family:var(--font-mono)">${v.yield}% Acceptable</span>
                </div>
                <div class="progress-bar" style="height:6px">
                  <div class="progress-fill" style="width:${v.yield}%;background:${v.color}"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card" style="background:var(--bg-elevated);border-style:dashed">
          <div style="padding:40px;text-align:center">
            <div style="font-size:32px;margin-bottom:12px">📄</div>
            <div style="font-weight:600">MTC Scan & AI Verify</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:8px">Drop Mill Test Certificates here to auto-verify chem/mech results against ASTM specifications.</div>
            <button class="btn btn-muted btn-xs" style="margin-top:16px">Select Files</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

let _activeSkillTab = 'directory';

function renderQC_skills() {
    const el = document.getElementById('pageContent');
    const avgComp = (QCData.skills.reduce((acc, s) => acc + Object.values(s.skillKPIs).reduce((a,b)=>a+b,0)/8, 0) / QCData.skills.length).toFixed(1);
    const expiringCerts = QCData.skills.reduce((acc, s) => acc + s.certs.filter(c => c.status === 'expired' || (new Date(c.expiry) - new Date()) / (1000*60*60*24) < 30).length, 0);

    el.innerHTML = `
        <div class="page-header" style="margin-bottom:20px">
            <div>
                <div class="page-title">QC Personnel & Skill Matrix</div>
                <div class="page-subtitle">Competency tracking, roles & responsibilities, and project assignments</div>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary btn-sm" onclick="showToast('Exporting Personnel Data...','info')">Export Directory</button>
            </div>
        </div>

        <div style="display:flex; gap:20px; margin-bottom:24px">
            <div class="card glass-card" style="flex:1; padding:16px; border-left:4px solid var(--brand)">
                <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:700">Team Size</div>
                <div style="font-size:24px; font-weight:800; margin:4px 0">${QCData.skills.length}</div>
                <div style="font-size:10px; color:var(--text-muted)">Qualified QC Personnel</div>
            </div>
            <div class="card glass-card" style="flex:1; padding:16px; border-left:4px solid var(--green)">
                <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:700">Avg Competency</div>
                <div style="font-size:24px; font-weight:800; margin:4px 0">${avgComp}%</div>
                <div style="font-size:10px; color:var(--green)">Across all skill dimensions</div>
            </div>
            <div class="card glass-card" style="flex:1; padding:16px; border-left:4px solid var(--red)">
                <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:700">Certs Alert</div>
                <div style="font-size:24px; font-weight:800; margin:4px 0">${expiringCerts}</div>
                <div style="font-size:10px; color:var(--red)">Expiring or Expired</div>
            </div>
        </div>

        <div class="card" style="padding:0; overflow:hidden">
            <div style="display:flex; background:rgba(255,255,255,0.03); border-bottom:1px solid var(--border)">
                ${['directory', 'radar', 'raci', 'assignments'].map(tab => `
                    <div class="tab-item ${_activeSkillTab === tab ? 'active' : ''}" 
                         onclick="_switchSkillTab('${tab}')"
                         style="padding:16px 24px; font-size:13px; font-weight:700; cursor:pointer; color:${_activeSkillTab === tab ? 'var(--brand)' : 'var(--text-muted)'}; border-bottom:2px solid ${_activeSkillTab === tab ? 'var(--brand)' : 'transparent'}; transition:0.2s">
                        ${tab.toUpperCase()}
                    </div>
                `).join('')}
            </div>
            <div id="skill-tab-content" style="padding:24px">
                <!-- Dynamic Content -->
            </div>
        </div>
    `;
    _renderActiveSkillTab();
}

function _switchSkillTab(tab) {
    _activeSkillTab = tab;
    renderQC_skills();
}

function _renderActiveSkillTab() {
    const container = document.getElementById('skill-tab-content');
    if (!container) return;

    if (_activeSkillTab === 'directory') _renderSkillDirectory(container);
    if (_activeSkillTab === 'radar') _renderSkillRadar(container);
    if (_activeSkillTab === 'raci') _renderSkillRACI(container);
    if (_activeSkillTab === 'assignments') _renderSkillAssignments(container);
}

function _renderSkillDirectory(container) {
    container.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(350px, 1fr)); gap:20px">
            ${QCData.skills.map(s => `
                <div class="card stagger-in" style="padding:20px; border:1px solid var(--border); background:rgba(255,255,255,0.02)">
                    <div style="display:flex; gap:16px; margin-bottom:16px">
                        <div style="width:50px; height:50px; border-radius:50%; background:${s.avatar.color}; display:flex; align-items:center; justify-content:center; font-weight:800; color:#fff; font-size:18px">
                            ${s.avatar.initials}
                        </div>
                        <div>
                            <div style="font-weight:700; font-size:16px">${s.name}</div>
                            <div style="font-size:12px; color:var(--brand)">${s.role} · ${s.designation}</div>
                        </div>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px">
                        <div style="font-size:11px">
                            <span style="color:var(--text-muted)">Certifications:</span>
                            <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:4px">
                                ${s.certs.map(c => `<span class="badge ${c.status==='valid'?'badge-muted':'badge-red'}" style="font-size:9px">${c.name}</span>`).join('')}
                            </div>
                        </div>
                        <div style="font-size:11px">
                            <span style="color:var(--text-muted)">Active Projects:</span>
                            <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:4px">
                                ${s.assignedProjects.map(p => `<span class="badge badge-blue" style="font-size:9px">${p}</span>`).join('')}
                            </div>
                        </div>
                        <div style="font-size:11px">
                            <span style="color:var(--text-muted)">Authorities:</span>
                            <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:4px">
                                ${s.auth.map(a => `<span class="badge badge-accent" style="font-size:9px; opacity:0.8">${a}</span>`).join('')}
                            </div>
                        </div>
                        <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:10px">
                            <div style="font-size:10px; color:var(--text-muted)">Eye Test: <span style="color:${(new Date(s.eyeTestExpiry)-new Date())/(1000*60*60*24)<60?'var(--amber)':'var(--green)'}">${s.eyeTestExpiry}</span></div>
                            <button class="btn btn-ghost btn-xs" onclick="showToast('Loading profile for ${s.name}...','info')">View Profile</button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function _renderSkillRadar(container) {
    container.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:30px">
            ${QCData.skills.map(s => `
                <div class="card stagger-in" style="padding:20px; text-align:center">
                    <div style="font-weight:700; margin-bottom:4px">${s.name}</div>
                    <div style="font-size:11px; color:var(--text-muted); margin-bottom:15px">${s.role}</div>
                    <div style="display:flex; justify-content:center">
                        ${_drawRadarChart(s.skillKPIs)}
                    </div>
                    <div style="margin-top:15px; display:grid; grid-template-columns:1fr 1fr; gap:8px">
                        ${Object.entries(s.skillKPIs).map(([key, val]) => `
                            <div style="font-size:10px; text-align:left; display:flex; justify-content:space-between; background:rgba(255,255,255,0.03); padding:4px 8px; border-radius:4px">
                                <span style="color:var(--text-muted); text-transform:capitalize">${key}</span>
                                <span style="font-weight:700; color:${val>80?'var(--green)':val>60?'var(--amber)':'var(--red)'}">${val}%</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function _drawRadarChart(kpis) {
    const size = 180;
    const center = size / 2;
    const radius = size * 0.4;
    const labels = Object.keys(kpis);
    const angleStep = (Math.PI * 2) / labels.length;

    // Background circles
    const levels = [0.2, 0.4, 0.6, 0.8, 1].map(lvl => {
        const r = radius * lvl;
        let pts = [];
        for (let i = 0; i < labels.length; i++) {
            pts.push(`${center + r * Math.sin(i * angleStep)},${center - r * Math.cos(i * angleStep)}`);
        }
        return `<polygon points="${pts.join(' ')}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" />`;
    }).join('');

    // Axis lines
    const axes = labels.map((_, i) => {
        const x = center + radius * Math.sin(i * angleStep);
        const y = center - radius * Math.cos(i * angleStep);
        return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,0.1)" stroke-width="1" />`;
    }).join('');

    // Skill Polygon
    const points = labels.map((key, i) => {
        const val = kpis[key] / 100;
        const x = center + radius * val * Math.sin(i * angleStep);
        const y = center - radius * val * Math.cos(i * angleStep);
        return `${x},${y}`;
    }).join(' ');

    return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            ${levels}
            ${axes}
            <polygon points="${points}" fill="rgba(0, 212, 255, 0.3)" stroke="var(--brand)" stroke-width="2" />
        </svg>
    `;
}

function _renderSkillRACI(container) {
    const activities = [
        'Incoming Material Inspection', 'Weld Visual Examination', 'NDT Execution (RT/UT/PT)',
        'Dimensional Inspection', 'Coating / DFT Inspection', 'ITP & MDR Compilation',
        'NCR Raising & Disposition', 'Hydro-test Sign-off', 'Final Release / Dispatch', 'Internal Audit'
    ];
    
    // R=Blue, A=Accent, C=Amber, I=Grey
    const matrix = {
        'Incoming Material Inspection': { 'QE-01':'A', 'QE-02':'R', 'QE-03':'R', 'QE-04':'I' },
        'Weld Visual Examination':      { 'QE-01':'A', 'QE-02':'R', 'QE-04':'I', 'QE-05':'C' },
        'NDT Execution (RT/UT/PT)':     { 'QE-01':'A', 'QE-02':'C', 'QE-04':'I', 'QE-05':'R' },
        'Dimensional Inspection':       { 'QE-01':'A', 'QE-02':'R', 'QE-03':'R', 'QE-04':'I' },
        'Coating / DFT Inspection':      { 'QE-01':'A', 'QE-03':'R', 'QE-04':'I' },
        'ITP & MDR Compilation':        { 'QE-01':'A', 'QE-02':'C', 'QE-03':'C', 'QE-04':'R', 'QE-05':'C' },
        'NCR Raising & Disposition':    { 'QE-01':'R', 'QE-02':'C', 'QE-03':'C', 'QE-04':'I', 'QE-05':'C' },
        'Hydro-test Sign-off':          { 'QE-01':'R', 'QE-04':'I' },
        'Final Release / Dispatch':     { 'QE-01':'R', 'QE-02':'C', 'QE-03':'C', 'QE-04':'A' },
        'Internal Audit':               { 'QE-01':'R', 'QE-02':'C', 'QE-03':'C', 'QE-04':'I', 'QE-05':'C' }
    };

    const getPill = (val) => {
        if (!val) return '—';
        const colors = { 'R':'var(--blue)', 'A':'var(--brand)', 'C':'var(--amber)', 'I':'var(--text-muted)' };
        return `<span style="background:${colors[val]}; color:#fff; width:22px; height:22px; display:inline-flex; align-items:center; justify-content:center; border-radius:4px; font-size:11px; font-weight:800">${val}</span>`;
    };

    container.innerHTML = `
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width:250px">QC Activity</th>
                        ${QCData.skills.map(s => `<th style="text-align:center">${s.avatar.initials}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${activities.map(act => `
                        <tr>
                            <td style="font-weight:600; font-size:13px">${act}</td>
                            ${QCData.skills.map(s => `<td style="text-align:center">${getPill(matrix[act][s.id])}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div style="margin-top:20px; display:flex; gap:16px; font-size:11px">
            <div style="display:flex; align-items:center; gap:6px"><span style="background:var(--blue); width:12px; height:12px; border-radius:2px"></span> Responsible</div>
            <div style="display:flex; align-items:center; gap:6px"><span style="background:var(--brand); width:12px; height:12px; border-radius:2px"></span> Accountable</div>
            <div style="display:flex; align-items:center; gap:6px"><span style="background:var(--amber); width:12px; height:12px; border-radius:2px"></span> Consulted</div>
            <div style="display:flex; align-items:center; gap:6px"><span style="background:var(--text-muted); width:12px; height:12px; border-radius:2px"></span> Informed</div>
        </div>
    `;
}

function _renderSkillAssignments(container) {
    const projs = [
        { id: 'P-2401', name: '316L Storage Tank', lead: 'Sarah Ahmed', team: ['John Doe', 'Ali Hassan'], ndt: 'Carlos Rivera', doc: 'Priya Menon' },
        { id: 'P-2402', name: 'PV ASME VIII', lead: 'Sarah Ahmed', team: ['John Doe'], ndt: 'Carlos Rivera', doc: 'Priya Menon' },
        { id: 'P-2403', name: 'Heat Exchanger', lead: 'Sarah Ahmed', team: ['Ali Hassan'], ndt: 'Carlos Rivera', doc: 'Priya Menon' }
    ];

    container.innerHTML = `
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr><th>Project</th><th>Lead QC</th><th>Inspector(s)</th><th>NDT Technician</th><th>Document Control</th></tr>
                </thead>
                <tbody>
                    ${projs.map(p => `
                        <tr>
                            <td><div style="font-weight:700">${p.id}</div><div style="font-size:10px; color:var(--text-muted)">${p.name}</div></td>
                            <td style="font-size:12px; font-weight:600">${p.lead}</td>
                            <td>
                                <div style="display:flex; gap:4px; flex-wrap:wrap">
                                    ${p.team.map(t => `<span class="badge badge-muted" style="font-size:10px">${t}</span>`).join('')}
                                </div>
                            </td>
                            <td style="font-size:12px">${p.ndt}</td>
                            <td style="font-size:12px">${p.doc}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}


function renderQC_training() {
  const el = document.getElementById('pageContent');
  el.innerHTML = `
    <div class="card">
      <div class="card-header"><span class="card-title">Qualification & Training Records</span></div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr><th>Engineer</th><th>Training Program</th><th>Provider</th><th>Date</th><th>Expiry</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${[
              { name: 'Sarah Ahmed', program: 'ASME Section IX Lead', provider: 'ASME Int', date: '2024-12-10', expiry: '2027-12-10', status: 'valid' },
              { name: 'John Doe', program: 'NDT Level II (RT)', provider: 'TCR Engineering', date: '2023-01-15', expiry: '2025-01-15', status: 'expired' },
            ].map(t => `
              <tr>
                <td style="font-weight:600;font-size:12px">${t.name}</td>
                <td style="font-size:13px">${t.program}</td>
                <td style="font-size:11px;color:var(--text-muted)">${t.provider}</td>
                <td style="font-size:11px">${t.date}</td>
                <td style="font-size:11px;color:${t.status==='expired'?'var(--red)':'inherit'}">${t.expiry}</td>
                <td><span class="badge ${t.status==='valid'?'badge-green':'badge-red'}">${t.status.toUpperCase()}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ── RFI Workflow Helpers ───────────────────────────────────── */

function openNewRfiModal() {
  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const projects = AppState.projects || [];
  const reportTypes = ['Fit-up', 'Welding VT', 'Material', 'Dimensional', 'RT', 'UT', 'MT', 'PT', 'Hydro', 'Coating', 'Final', 'FAT'];

  openQCDetailPanel(`
    <div class="qc-modal-inner">
      <div class="qc-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Raise New RFI Call</div>
        <button class="btn-icon" onclick="closeQCDetailPanel()">${closeSVG}</button>
      </div>
      <div class="qc-modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="qc-field">
            <label>Project</label>
            <select id="nrfi-project" onchange="updateItpStepList_rfi(this.value)">
              <option value="">Select Project</option>
              ${projects.map(p => `<option value="${p.id}">${p.id} — ${p.name.split('—')[0]}</option>`).join('')}
            </select>
          </div>
          <div class="qc-field">
            <label>ITP Step Link</label>
            <select id="nrfi-itp">
              <option value="">Select Project First</option>
            </select>
          </div>
        </div>

        <div class="qc-field">
          <label>Inspection Activity</label>
          <input id="nrfi-activity" type="text" placeholder="e.g. Shell Fit-up WJ-01">
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="qc-field">
            <label>Inspection Type</label>
            <select id="nrfi-type">
              ${reportTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
          </div>
          <div class="qc-field">
            <label>Priority</label>
            <select id="nrfi-priority">
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="qc-field"><label>Scheduled Date</label><input id="nrfi-date" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
          <div class="qc-field"><label>Location / Bay</label><input id="nrfi-location" type="text" placeholder="Bay 3, Material Yard..."></div>
        </div>

        <div class="qc-field">
          <label>Description / Scope</label>
          <textarea id="nrfi-desc" rows="3" placeholder="Provide details for the inspector..."></textarea>
        </div>

        <div style="display:flex;gap:10px;margin-top:10px">
          <button class="btn btn-primary" style="flex:1" onclick="submitNewRfi_qc()">Submit RFI</button>
          <button class="btn btn-secondary" onclick="closeQCDetailPanel()">Cancel</button>
        </div>
      </div>
    </div>
  `);
}

function updateItpStepList_rfi(pid) {
  const select = document.getElementById('nrfi-itp');
  if (!pid) { select.innerHTML = '<option value="">Select Project First</option>'; return; }
  
  const steps = QCData.itp[pid] || [];
  const pendingSteps = steps.filter(s => s.status !== 'done' && s.status !== 'approved');
  
  select.innerHTML = `
    <option value="">No ITP Link</option>
    ${pendingSteps.map(s => `<option value="${s.step}">${s.step} — ${s.activity}</option>`).join('')}
  `;
  
  select.onchange = (e) => {
    const step = pendingSteps.find(s => s.step === e.target.value);
    if (step) {
      document.getElementById('nrfi-activity').value = step.activity;
    }
  };
}

function submitNewRfi_qc() {
  const pid = document.getElementById('nrfi-project').value;
  const activity = document.getElementById('nrfi-activity').value;
  if (!pid || !activity) { showToast('Project and Activity are required', 'error'); return; }

  const newRfi = {
    id: `RFI-2025-${String(QCData.inspectionRequests.length + 1).padStart(3, '0')}`,
    project: pid,
    itpStep: document.getElementById('nrfi-itp').value || 'N/A',
    activity: activity,
    type: document.getElementById('nrfi-type').value,
    priority: document.getElementById('nrfi-priority').value,
    requestedBy: 'System User', // Mocked user
    requestedDate: new Date().toISOString().split('T')[0],
    scheduledDate: document.getElementById('nrfi-date').value,
    location: document.getElementById('nrfi-location').value,
    drawingRef: 'TBD',
    description: document.getElementById('nrfi-desc').value,
    assignedInspector: null,
    status: 'submitted',
    result: null,
    reportRef: null,
    ncrRef: null,
    holdPoint: false,
    witnessParties: ['Internal'],
    comments: [{ by: 'System User', time: 'Just now', text: 'RFI raised via portal.' }],
    attachments: 0
  };

  QCData.inspectionRequests.unshift(newRfi);
  closeQCDetailPanel();
  showToast(`RFI ${newRfi.id} submitted successfully`, 'success');
  renderQC_inspections();
}

function openRfiDetailPanel(rfiId) {
  const rfi = QCData.inspectionRequests.find(r => r.id === rfiId);
  if (!rfi) return;

  const closeSVG = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  
  const statusSteps = ['draft', 'submitted', 'accepted', 'in-progress', 'completed', 'closed'];
  const currentStepIdx = statusSteps.indexOf(rfi.status);

  openQCDetailPanel(`
    <div class="qc-modal-inner" style="max-width:800px">
      <div class="qc-modal-header">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">${rfi.project} · RFI Details</div>
          <div style="font-family:var(--font-display);font-size:16px;font-weight:700">${rfi.id}: ${rfi.activity}</div>
        </div>
        <button class="btn-icon" onclick="closeQCDetailPanel()">${closeSVG}</button>
      </div>

      <!-- Status Stepper -->
      <div class="rfi-status-stepper">
        ${statusSteps.map((step, idx) => `
          <div class="rfi-step ${idx <= currentStepIdx ? 'completed' : ''} ${idx === currentStepIdx ? 'active' : ''}">
            <div class="rfi-step-circle">${idx < currentStepIdx ? '✓' : idx + 1}</div>
            <div class="rfi-step-label">${step}</div>
          </div>
        `).join('')}
      </div>

      <div class="qc-modal-body">
        <div style="display:grid;grid-template-columns:1fr 300px;gap:24px">
          <!-- Left: Information Grid -->
          <div style="display:flex;flex-direction:column;gap:16px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="card" style="padding:12px;background:var(--bg-elevated)">
                <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">Requested By</div>
                <div style="font-weight:600">${rfi.requestedBy} (${rfi.requestedDate})</div>
              </div>
              <div class="card" style="padding:12px;background:var(--bg-elevated)">
                <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">Scheduled For</div>
                <div style="font-weight:600;color:var(--brand)">${rfi.scheduledDate} @ ${rfi.location}</div>
              </div>
            </div>

            <div class="card" style="padding:16px">
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px">Scope / Description</div>
              <p style="font-size:13px;line-height:1.6">${rfi.description || 'No detailed description provided.'}</p>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="card" style="padding:12px">
                <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">ITP Step</div>
                <div style="font-weight:600">${rfi.itpStep}</div>
              </div>
              <div class="card" style="padding:12px">
                <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px">Drawing / Ref</div>
                <div style="font-weight:600">${rfi.drawingRef}</div>
              </div>
            </div>

            <!-- Timeline -->
            <div style="margin-top:12px">
              <div style="font-size:12px;font-weight:700;margin-bottom:12px">Activity & Comments</div>
              <div class="rfi-timeline">
                ${rfi.comments.map(c => `
                  <div class="rfi-timeline-entry">
                    <div class="rfi-timeline-dot"></div>
                    <div class="rfi-timeline-content">
                      <div class="rfi-timeline-header">
                        <span class="rfi-timeline-by">${c.by}</span>
                        <span class="rfi-timeline-time">${c.time}</span>
                      </div>
                      <div class="rfi-timeline-text">${c.text}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
              <div style="display:flex;gap:8px;margin-top:8px">
                <input id="rfi-comment-input" type="text" class="form-control-xs" placeholder="Add a comment..." style="flex:1" 
                  onkeydown="if(event.key === 'Enter') addRfiComment_qc('${rfi.id}')">
                <button class="btn btn-primary btn-xs" onclick="addRfiComment_qc('${rfi.id}')">Post</button>
              </div>
            </div>
          </div>

          <!-- Right: Actions & Metadata -->
          <div style="display:flex;flex-direction:column;gap:16px">
            <div class="card" style="padding:16px;background:var(--bg-elevated)">
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:12px">Assigned Inspector</div>
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
                <div style="width:40px;height:40px;border-radius:50%;background:var(--brand);color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px">${rfi.assignedInspector ? rfi.assignedInspector.charAt(0) : '?'}</div>
                <div>
                  <div style="font-weight:700">${rfi.assignedInspector || 'Pending Assignment'}</div>
                  <div style="font-size:11px;color:var(--text-muted)">QC Department</div>
                </div>
              </div>
              ${!rfi.assignedInspector ? `<button class="btn btn-secondary btn-sm" style="width:100%" onclick="showToast('Assignment module coming soon','info')">Assign Inspector</button>` : ''}
            </div>

            <div class="card" style="padding:16px">
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;margin-bottom:12px">Witness Status</div>
              <div style="display:flex;flex-direction:column;gap:8px">
                ${['Internal', 'Customer', 'TPI'].map(party => `
                  <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px">
                    <span style="color:${rfi.witnessParties.includes(party) ? 'var(--text-primary)' : 'var(--text-muted)'}">${party}</span>
                    <span class="badge ${rfi.witnessParties.includes(party) ? 'badge-green' : 'badge-muted'}" style="font-size:9px">${rfi.witnessParties.includes(party) ? 'REQUIRED' : 'N/A'}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:8px">
              ${rfi.status === 'submitted' ? `<button class="btn btn-primary" style="width:100%" onclick="updateRfiStatus_qc('${rfi.id}', 'accepted')">Accept RFI</button>` : ''}
              ${rfi.status === 'accepted' ? `<button class="btn btn-primary" style="width:100%" onclick="updateRfiStatus_qc('${rfi.id}', 'in-progress')">Start Inspection</button>` : ''}
              ${rfi.status === 'in-progress' ? `<button class="btn btn-green" style="width:100%" onclick="completeRfi_qc('${rfi.id}')">Complete Inspection</button>` : ''}
              
              ${rfi.status === 'submitted' || rfi.status === 'accepted' ? `<button class="btn btn-secondary" style="width:100%;color:var(--red)" onclick="updateRfiStatus_qc('${rfi.id}', 'rejected')">Reject RFI</button>` : ''}
              
              ${rfi.reportRef ? `<button class="btn btn-muted btn-sm" style="width:100%" onclick="alert('Viewing report ${rfi.reportRef}...')">View Report: ${rfi.reportRef}</button>` : ''}
              ${rfi.ncrRef ? `<button class="btn btn-red btn-sm" style="width:100%" onclick="qcNavigate('ncr', {id: '${rfi.ncrRef}'})">View Linked NCR: ${rfi.ncrRef}</button>` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `);
}

function updateRfiStatus_qc(rfiId, newStatus) {
  const rfi = QCData.inspectionRequests.find(r => r.id === rfiId);
  if (!rfi) return;

  rfi.status = newStatus;
  rfi.comments.push({
    by: 'QC Manager',
    time: 'Just now',
    text: `Status updated to ${newStatus.toUpperCase()}.`
  });

  showToast(`RFI ${rfiId} marked as ${newStatus}`, 'success');
  renderQC_inspections();
  openRfiDetailPanel(rfiId); // Refresh panel
}

function addRfiComment_qc(rfiId) {
  const input = document.getElementById('rfi-comment-input');
  const text = input.value.trim();
  if (!text) return;

  const rfi = QCData.inspectionRequests.find(r => r.id === rfiId);
  if (rfi) {
    rfi.comments.push({
      by: 'System User',
      time: 'Just now',
      text: text
    });
    input.value = '';
    openRfiDetailPanel(rfiId);
  }
}

function completeRfi_qc(rfiId) {
  // Mock result selection for now
  const result = confirm('Did the inspection PASS?') ? 'Pass' : 'Fail';
  const rfi = QCData.inspectionRequests.find(r => r.id === rfiId);
  if (rfi) {
    rfi.status = 'completed';
    rfi.result = result;
    rfi.comments.push({
      by: 'Sarah Ahmed',
      time: 'Just now',
      text: `Inspection completed. Result: ${result.toUpperCase()}.`
    });

    if (result === 'Fail') {
      showToast('Inspection Failed. Please raise an NCR.', 'error');
    } else {
      showToast('Inspection Completed successfully.', 'success');
    }

    renderQC_inspections();
    openRfiDetailPanel(rfiId);
  }
}

/* ── Quality Analytics ──────────────────────────────────────── */
function renderQC_analytics() {
  const el = document.getElementById('pageContent');
  const a = QCData.analytics;

  const openNCRs   = QCData.ncr.filter(n => n.status === 'open').length;
  const closedNCRs = QCData.ncr.filter(n => n.status === 'closed').length;
  const totalNCRs  = QCData.ncr.length;
  const totalCopq  = a.copq_trends.reduce((s, v) => s + v, 0);
  const maxPareto  = Math.max(...a.defects_pareto.map(d => d.count));
  const totalDefects = a.defects_pareto.reduce((s, d) => s + d.count, 0);

  // Cumulative % for pareto line
  let cumulative = 0;
  const paretoWithCum = a.defects_pareto.map(d => {
    cumulative += d.count;
    return { ...d, cumPct: Math.round((cumulative / totalDefects) * 100) };
  });

  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
  const maxCopq = Math.max(...a.copq_trends);

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Quality Analytics</div>
        <div class="page-subtitle">COPQ trends, defect pareto, FPY, and project quality health</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="showToast('Report exported','success')">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Export
        </button>
      </div>
    </div>

    <!-- KPI strip -->
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label: 'First Pass Yield', value: a.fpy_actual + '%', sub: 'Target: ' + a.fpy_target + '%', color: a.fpy_actual >= a.fpy_target ? 'var(--green)' : 'var(--amber)' },
        { label: 'COPQ (7-month)', value: '$' + totalCopq + 'k', sub: 'Cost of poor quality', color: 'var(--amber)' },
        { label: 'Open NCRs', value: openNCRs, sub: closedNCRs + ' closed this cycle', color: openNCRs > 0 ? 'var(--red)' : 'var(--green)' },
        { label: 'Total Defects', value: totalDefects, sub: a.defects_pareto.length + ' defect categories', color: 'var(--brand)' },
      ].map(k => `
        <div class="metric-card metric-card--glass">
          <div class="metric-label">${k.label}</div>
          <div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${k.sub}</div>
        </div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
      <!-- COPQ Trend -->
      <div class="card">
        <div class="card-header"><span class="card-title">COPQ Monthly Trend ($k)</span></div>
        <div style="padding:20px">
          <div style="display:flex;align-items:flex-end;gap:8px;height:140px">
            ${a.copq_trends.map((v, i) => `
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%">
                <div style="flex:1;display:flex;align-items:flex-end;width:100%">
                  <div style="width:100%;height:${Math.round((v/maxCopq)*100)}%;background:${i === a.copq_trends.length-1 ? 'var(--brand)' : 'var(--brand-light)'};border-radius:4px 4px 0 0;min-height:4px;transition:height 0.3s"></div>
                </div>
                <div style="font-size:10px;font-weight:700;color:var(--text-secondary)">${v}</div>
                <div style="font-size:9px;color:var(--text-muted)">${months[i]}</div>
              </div>`).join('')}
          </div>
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--glass-border-subtle);display:flex;gap:16px;font-size:11px;color:var(--text-muted)">
            <span>Avg: <b style="color:var(--text-primary)">$${Math.round(totalCopq/a.copq_trends.length)}k/mo</b></span>
            <span>Peak: <b style="color:var(--amber)">$${maxCopq}k</b></span>
          </div>
        </div>
      </div>

      <!-- FPY Gauge -->
      <div class="card">
        <div class="card-header"><span class="card-title">First Pass Yield</span></div>
        <div style="padding:20px;display:flex;flex-direction:column;gap:16px">
          ${QCData.projects.map(p => {
            const pct = p.yield;
            const color = pct >= 96 ? 'var(--green)' : pct >= 90 ? 'var(--amber)' : 'var(--red)';
            return `
              <div>
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px">
                  <span style="font-weight:500">${p.name}</span>
                  <span style="font-weight:700;color:${color}">${pct}%</span>
                </div>
                <div class="progress-bar" style="height:8px">
                  <div class="progress-fill" style="width:${pct}%;background:${color}"></div>
                </div>
                <div style="font-size:10px;color:var(--text-muted);margin-top:3px">Target: ${a.fpy_target}% · Client: ${p.client}</div>
              </div>`;
          }).join('')}
          <div style="padding:10px 12px;background:var(--brand-light);border-radius:var(--radius-sm);font-size:12px;color:var(--brand);font-weight:600;display:flex;justify-content:space-between">
            <span>Overall FPY</span>
            <span>${a.fpy_actual}%</span>
          </div>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px">
      <!-- Defect Pareto -->
      <div class="card">
        <div class="card-header"><span class="card-title">Defect Pareto Analysis</span><span class="badge badge-muted">80/20 Rule</span></div>
        <div style="padding:20px">
          ${paretoWithCum.map((d, i) => `
            <div style="margin-bottom:14px">
              <div style="display:flex;justify-content:space-between;margin-bottom:5px;font-size:12px">
                <span style="font-weight:500">${d.type}</span>
                <div style="display:flex;gap:12px">
                  <span style="color:var(--text-muted)">${d.count} defects</span>
                  <span style="font-family:var(--font-mono);font-weight:600;color:${d.cumPct <= 80 ? 'var(--brand)' : 'var(--text-muted)'}">${d.cumPct}% cumulative</span>
                  <span style="color:var(--amber)">$${(d.cost/1000).toFixed(1)}k cost</span>
                </div>
              </div>
              <div class="progress-bar" style="height:10px">
                <div class="progress-fill" style="width:${Math.round((d.count/maxPareto)*100)}%;background:${i === 0 ? 'var(--red)' : i === 1 ? 'var(--amber)' : 'var(--brand)'}"></div>
              </div>
            </div>`).join('')}
          <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--glass-border-subtle);font-size:11px;color:var(--text-muted)">
            Total defect cost: <b style="color:var(--text-primary)">$${(a.defects_pareto.reduce((s,d)=>s+d.cost,0)/1000).toFixed(1)}k</b>
          </div>
        </div>
      </div>

      <!-- NCR Summary -->
      <div class="card">
        <div class="card-header"><span class="card-title">NCR Summary</span></div>
        <div style="padding:20px;display:flex;flex-direction:column;gap:12px">
          ${[
            { label: 'Open', count: openNCRs, color: 'var(--red)', bg: 'var(--red-bg)' },
            { label: 'Closed', count: closedNCRs, color: 'var(--green)', bg: 'var(--green-bg)' },
            { label: 'Total', count: totalNCRs, color: 'var(--brand)', bg: 'var(--brand-light)' },
          ].map(r => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:${r.bg};border-radius:var(--radius-sm)">
              <span style="font-size:13px;font-weight:500;color:${r.color}">${r.label} NCRs</span>
              <span style="font-family:var(--font-display);font-size:22px;font-weight:700;color:${r.color}">${r.count}</span>
            </div>`).join('')}
          <div style="margin-top:8px">
            ${QCData.ncr.slice(0,3).map(n => `
              <div style="padding:8px 0;border-bottom:1px solid var(--glass-border-subtle);font-size:12px;display:flex;justify-content:space-between">
                <span style="font-weight:500">${n.id}</span>
                <span class="badge ${n.status==='open' ? 'badge-red' : 'badge-green'}">${n.status}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  mountAnaCockpit('qc', { append: true, heading: 'Cross-functional analytics' });
}
window.renderQC_analytics = renderQC_analytics;
