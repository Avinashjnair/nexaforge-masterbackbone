/* ============================================================
   NexaForge ERP — Marketing & CRM Module
   Covers: CRM pipeline (Kanban) · Opportunity management
           Dynamic quoting engine · BOQ ingestion
           Tender tracker · Client database
           Revenue analytics · Activity timeline
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   CRM DATA STORE
───────────────────────────────────────────────────────────── */
const CRMData = {
  activeTab: 'overview',

  /* ── Pipeline stages ── */
  stages: [
    { id: 'prospect',    label: 'Prospect',       color: '#4d5968',  dotColor: '#888780' },
    { id: 'qualified',   label: 'Qualified',      color: '#185FA5',  dotColor: '#4a9eff' },
    { id: 'tender',      label: 'Tender / RFQ',   color: '#854F0B',  dotColor: '#f59e0b' },
    { id: 'quoted',      label: 'Quoted',          color: '#534AB7',  dotColor: '#7F77DD' },
    { id: 'negotiation', label: 'Negotiation',     color: '#0F6E56',  dotColor: '#2dd4a0' },
    { id: 'won',         label: 'Won / Active',    color: '#3B6D11',  dotColor: '#2dd4a0' },
    { id: 'lost',        label: 'Lost',            color: '#791F1F',  dotColor: '#f56565' },
  ],

  /* ── Opportunities ── */
  opportunities: [
    {
      id: 'OPP-001', name: '316L Cone Roof Tank — 20,000L', client: 'ADNOC Gas',
      stage: 'won', value: 284000, prob: 100, currency: 'USD',
      closeDate: '2025-08-15', owner: 'M. Hassan', contact: 'Eng. Khalid Al-Mansoori',
      tags: ['Tank','API 650','ADNOC approved'], linkedProject: 'P-2401',
      lastActivity: '2025-04-28', notes: 'Order confirmed. Project entity created as P-2401.',
      color: '#2dd4a0'
    },
    {
      id: 'OPP-002', name: 'ASME VIII Pressure Vessel — 3 units', client: 'Petrofac UAE',
      stage: 'won', value: 97500, prob: 100, currency: 'USD',
      closeDate: '2025-10-30', owner: 'S. Mathews', contact: 'Mr. James Okafor',
      tags: ['Pressure vessel','ASME VIII','Petrofac approved'], linkedProject: 'P-2402',
      lastActivity: '2025-04-15', notes: 'LOI received. P-2402 initiated.',
      color: '#2dd4a0'
    },
    {
      id: 'OPP-003', name: 'Shell & Tube Heat Exchanger — 304 SS', client: 'ENOC',
      stage: 'won', value: 142000, prob: 100, currency: 'USD',
      closeDate: '2025-07-01', owner: 'M. Hassan', contact: 'Ms. Priya Nair',
      tags: ['Heat exchanger','304 SS','TEMA C'], linkedProject: 'P-2403',
      lastActivity: '2025-03-20', notes: 'Signed. P-2403 active with QC hold on batch.',
      color: '#2dd4a0'
    },
    {
      id: 'OPP-004', name: 'Fixed Roof Storage Tank — 100,000L', client: 'EMARAT',
      stage: 'negotiation', value: 510000, prob: 70, currency: 'USD',
      closeDate: '2025-09-30', owner: 'M. Hassan', contact: 'Eng. Tariq Al-Yasi',
      tags: ['Tank','API 650','Large bore'], linkedProject: null,
      lastActivity: '2025-04-25', notes: 'Commercial terms under discussion. 15% discount requested.',
      color: '#2dd4a0'
    },
    {
      id: 'OPP-005', name: 'Duplex SS Pressure Vessel — 2205', client: 'Dragon Oil',
      stage: 'quoted', value: 188000, prob: 55, currency: 'USD',
      closeDate: '2025-08-20', owner: 'S. Mathews', contact: 'Mr. Alistair Mackenzie',
      tags: ['Pressure vessel','Duplex 2205','Sour service'], linkedProject: null,
      lastActivity: '2025-04-22', notes: 'Quote submitted REV-C. Awaiting client technical review.',
      color: '#7F77DD'
    },
    {
      id: 'OPP-006', name: 'Floating Roof Tank — 316L', client: 'Dubai Petroleum',
      stage: 'tender', value: 820000, prob: 35, currency: 'USD',
      closeDate: '2025-11-15', owner: 'M. Hassan', contact: 'Eng. Saeed Al-Qasim',
      tags: ['Tank','Floating roof','API 650'], linkedProject: null,
      lastActivity: '2025-04-26', notes: 'ITT received. Bid due 30 May 2025. Complex floating roof.',
      color: '#f59e0b'
    },
    {
      id: 'OPP-007', name: 'Scrubber Column — 316L 4m dia', client: 'GAL — Gulf Al-Aseel',
      stage: 'tender', value: 145000, prob: 40, currency: 'USD',
      closeDate: '2025-07-30', owner: 'S. Mathews', contact: 'Eng. Ali Tamimi',
      tags: ['Column','316L','ASME VIII'], linkedProject: null,
      lastActivity: '2025-04-20', notes: 'Technical clarification meeting 05 May.',
      color: '#f59e0b'
    },
    {
      id: 'OPP-008', name: 'Jacketed Mixing Vessel — 20L', client: 'Gulf Pharmaceutical',
      stage: 'qualified', value: 38000, prob: 60, currency: 'USD',
      closeDate: '2025-06-30', owner: 'M. Hassan', contact: 'Dr. Fatima Al-Rashidi',
      tags: ['Vessel','GMP','Pharma'], linkedProject: null,
      lastActivity: '2025-04-24', notes: 'Site visit done. Scope defined. Quoting this week.',
      color: '#4a9eff'
    },
    {
      id: 'OPP-009', name: 'Condensate Separator — CS/SS', client: 'Crescent Petroleum',
      stage: 'prospect', value: 95000, prob: 20, currency: 'USD',
      closeDate: '2025-12-31', owner: 'S. Mathews', contact: 'Mr. Tom Walsh',
      tags: ['Separator','CS/SS','ASME VIII'], linkedProject: null,
      lastActivity: '2025-04-18', notes: 'Initial enquiry received. Qualifying scope.',
      color: '#888780'
    },
    {
      id: 'OPP-010', name: 'Water Cooled Condenser', client: 'Taqa Power',
      stage: 'prospect', value: 62000, prob: 15, currency: 'USD',
      closeDate: '2025-12-31', owner: 'M. Hassan', contact: 'Eng. Maryam Al-Kabi',
      tags: ['Condenser','Heat exchanger'], linkedProject: null,
      lastActivity: '2025-04-10', notes: 'Budget enquiry stage.',
      color: '#888780'
    },
    {
      id: 'OPP-011', name: 'GRP Separator Skid', client: 'NAPESCO',
      stage: 'lost', value: 74000, prob: 0, currency: 'USD',
      closeDate: '2025-03-15', owner: 'S. Mathews', contact: 'Eng. Bader Hamid',
      tags: ['Skid','GRP'], linkedProject: null,
      lastActivity: '2025-03-15', notes: 'Lost to competitor — 22% lower price. Lesson: review sub-material costs.',
      color: '#f56565'
    },
  ],

  /* ── Clients ── */
  clients: [
    {
      id: 'C-001', name: 'ADNOC',         sector: 'National Oil Company', region: 'Abu Dhabi, UAE',
      contact: 'Eng. Khalid Al-Mansoori', email: 'k.mansoori@adnoc.ae', phone: '+971 2 602 0000',
      projects: 3, openOpps: 1, totalRevenue: 680000, sinceYear: 2019,
      rating: 5, tags: ['API 650','ASME VIII','Framework agreement'],
      avatarBg: '#0F6E56', avatarColor: '#9FE1CB', initials: 'AD',
    },
    {
      id: 'C-002', name: 'Petrofac',      sector: 'EPC Contractor', region: 'Dubai, UAE',
      contact: 'Mr. James Okafor',      email: 'j.okafor@petrofac.com', phone: '+971 4 800 4000',
      projects: 2, openOpps: 1, totalRevenue: 312000, sinceYear: 2021,
      rating: 4, tags: ['ASME VIII','Long-term'],
      avatarBg: '#185FA5', avatarColor: '#85B7EB', initials: 'PF',
    },
    {
      id: 'C-003', name: 'ENOC',          sector: 'State Oil Company', region: 'Dubai, UAE',
      contact: 'Ms. Priya Nair',        email: 'p.nair@enoc.ae', phone: '+971 4 337 9900',
      projects: 1, openOpps: 0, totalRevenue: 142000, sinceYear: 2022,
      rating: 4, tags: ['Heat exchanger','TEMA'],
      avatarBg: '#854F0B', avatarColor: '#FAC775', initials: 'EN',
    },
    {
      id: 'C-004', name: 'EMARAT',        sector: 'Oil & Gas Distribution', region: 'Dubai, UAE',
      contact: 'Eng. Tariq Al-Yasi',   email: 't.alyasi@emarat.ae', phone: '+971 4 406 1111',
      projects: 0, openOpps: 1, totalRevenue: 0, sinceYear: 2024,
      rating: 3, tags: ['API 650','New client'],
      avatarBg: '#534AB7', avatarColor: '#AFA9EC', initials: 'EM',
    },
    {
      id: 'C-005', name: 'Dragon Oil',    sector: 'E&P Company', region: 'Dubai, UAE',
      contact: 'Mr. Alistair Mackenzie', email: 'a.mackenzie@dragonoil.com', phone: '+971 4 305 3000',
      projects: 0, openOpps: 1, totalRevenue: 0, sinceYear: 2024,
      rating: 3, tags: ['Duplex SS','Sour service'],
      avatarBg: '#791F1F', avatarColor: '#F09595', initials: 'DO',
    },
    {
      id: 'C-006', name: 'Dubai Petroleum', sector: 'Oil & Gas', region: 'Dubai, UAE',
      contact: 'Eng. Saeed Al-Qasim',  email: 's.alqasim@dubpet.ae', phone: '+971 4 213 6000',
      projects: 0, openOpps: 1, totalRevenue: 0, sinceYear: 2023,
      rating: 4, tags: ['API 650','Floating roof','Strategic'],
      avatarBg: '#3B6D11', avatarColor: '#C0DD97', initials: 'DP',
    },
  ],

  /* ── Active tenders ── */
  tenders: [
    {
      id: 'ITT-2025-018', name: 'Floating Roof Tank — 100,000L API 650', client: 'Dubai Petroleum',
      issued: '2025-04-20', due: '2025-05-30', value: 820000, stage: 'drafting',
      owner: 'M. Hassan', completion: 35,
      items: ['Technical drawings review','Material take-off','Sub-vendor quotes','Pricing submission'],
      completedItems: [true, false, false, false],
    },
    {
      id: 'ITT-2025-014', name: 'Scrubber Column 316L — 4m dia × 12m H', client: 'GAL',
      issued: '2025-04-05', due: '2025-05-10', value: 145000, stage: 'review',
      owner: 'S. Mathews', completion: 80,
      items: ['Technical drawings review','Material take-off','Sub-vendor quotes','Pricing submission'],
      completedItems: [true, true, true, false],
    },
    {
      id: 'ITT-2025-011', name: 'Duplex 2205 Pressure Vessel (x2)', client: 'Dragon Oil',
      issued: '2025-03-28', due: '2025-04-22', value: 188000, stage: 'submitted',
      owner: 'S. Mathews', completion: 100,
      items: ['Technical drawings review','Material take-off','Sub-vendor quotes','Pricing submission'],
      completedItems: [true, true, true, true],
    },
  ],

  /* ── Quote lines (for OPP-006 demo) ── */
  quoteLines: [
    { desc: 'Shell plate 316L 10mm — API 650', qty: 22, unit: 'SHT', unitCost: 2400, markup: 28 },
    { desc: 'Floating roof structure — Aluminium', qty: 1, unit: 'SET', unitCost: 48000, markup: 22 },
    { desc: 'Nozzle package — flanged', qty: 1, unit: 'LOT', unitCost: 12500, markup: 35 },
    { desc: 'Welding labour — GTAW/SMAW', qty: 1200, unit: 'HR', unitCost: 28, markup: 40 },
    { desc: 'NDT & inspection (RT/UT/VT)', qty: 1, unit: 'LOT', unitCost: 18000, markup: 25 },
    { desc: 'Surface treatment SA 2.5 + epoxy', qty: 1, unit: 'LOT', unitCost: 9500, markup: 30 },
    { desc: 'Engineering & project management', qty: 1, unit: 'LOT', unitCost: 22000, markup: 20 },
    { desc: 'Third party inspection (TPI)', qty: 1, unit: 'LOT', unitCost: 6800, markup: 15 },
  ],

  /* ── BOQ lines (auto-extracted from CAD) ── */
  boqLines: [
    { ref: 'SH-01', desc: 'Shell plate 316L 10mm × 2500W × 6000L', qty: 22, unit: 'SHT', weight: '3,234 kg', material: '316L' },
    { ref: 'RF-01', desc: 'Roof aluminium pontoon — per segment',   qty: 18, unit: 'EA',  weight: '92 kg ea', material: 'Al 5052' },
    { ref: 'NZ-01', desc: 'Nozzle DN200 ANSI 150LB WNRF 316L',     qty: 4,  unit: 'EA',  weight: '38 kg ea', material: '316L' },
    { ref: 'NZ-02', desc: 'Nozzle DN100 ANSI 150LB WNRF 316L',     qty: 6,  unit: 'EA',  weight: '14 kg ea', material: '316L' },
    { ref: 'MH-01', desc: 'Manhole 24" 316L c/w davit & gasket',   qty: 2,  unit: 'EA',  weight: '145 kg ea', material: '316L' },
    { ref: 'FT-01', desc: 'Leg support structure — CS A36',         qty: 4,  unit: 'EA',  weight: '220 kg ea', material: 'CS A36' },
    { ref: 'WT-01', desc: 'Weld filler ER316L (2.4mm)',            qty: 180, unit: 'KG', weight: '180 kg',   material: 'Consumable' },
  ],

  /* ── CRM activity log ── */
  activities: [
    { type: 'won',   icon: '🏆', text: '<strong>OPP-004 moved to Negotiation</strong> — EMARAT 100k tank. Discount discussion ongoing.',      time: '2h ago',    color: '#2dd4a0' },
    { type: 'call',  icon: '📞', text: '<strong>Call logged</strong> — Dragon Oil / Mr. Mackenzie. Technical Q&A on duplex material spec.',    time: '4h ago',    color: '#4a9eff' },
    { type: 'quote', icon: '📄', text: '<strong>Quote REV-C submitted</strong> — OPP-005 Duplex PV to Dragon Oil. Total: $188,000.',         time: 'Yesterday', color: '#7F77DD' },
    { type: 'note',  icon: '📝', text: '<strong>Site visit completed</strong> — Gulf Pharmaceutical jacketed vessel. Scope finalised.',       time: 'Yesterday', color: '#f59e0b' },
    { type: 'new',   icon: '✨', text: '<strong>New opportunity</strong> — Taqa Power condenser enquiry received. Assigned to M. Hassan.',   time: '2 days ago', color: '#4a9eff' },
    { type: 'tender',icon: '📋', text: '<strong>ITT-2025-018 received</strong> — Dubai Petroleum floating roof tank. Bid due 30 May.',       time: '2 days ago', color: '#f59e0b' },
    { type: 'lost',  icon: '❌', text: '<strong>OPP-011 marked Lost</strong> — NAPESCO GRP Skid. Competitor 22% below our price.',           time: '3 weeks ago', color: '#f56565' },
  ],

  /* ── Minimum gross margin before a quote needs GM sign-off ── */
  marginThreshold: 20,

  /* ── Quote approvals (margin-gated sign-off queue) ── */
  quoteApprovals: [
    { id:'QA-001', oppId:'OPP-005', quote:'Duplex SS Pressure Vessel — 2205', client:'Dragon Oil',   rev:'Rev C', sell:188000, cost:151000, margin:19.7, requestedBy:'S. Mathews', requestedOn:'2025-04-22', status:'pending', reason:'Margin 19.7% below 20% floor — sour-service material premium absorbed to stay competitive.' },
    { id:'QA-002', oppId:'OPP-006', quote:'Floating Roof Tank — 316L',        client:'Dubai Petroleum', rev:'Rev A', sell:820000, cost:602000, margin:26.6, requestedBy:'M. Hassan',  requestedOn:'2025-04-26', status:'pending', reason:'Large-bore tender — discount authority requested for competitive positioning.' },
    { id:'QA-003', oppId:'OPP-004', quote:'Fixed Roof Storage Tank — 100,000L', client:'EMARAT',      rev:'Rev B', sell:510000, cost:357000, margin:30.0, requestedBy:'M. Hassan',  requestedOn:'2025-04-25', status:'approved', reason:'Standard margin — approved by GM.', decidedBy:'GM', decidedOn:'2025-04-25' },
    { id:'QA-004', oppId:'OPP-011', quote:'GRP Separator Skid',               client:'NAPESCO',      rev:'Rev A', sell:74000,  cost:66000,  margin:10.8, requestedBy:'S. Mathews', requestedOn:'2025-03-10', status:'rejected', reason:'Margin 10.8% too thin on sub-contracted GRP scope.', decidedBy:'GM', decidedOn:'2025-03-11' },
  ],

  /* ── Quote log — each entry is a quotation against an RFQ/opportunity, with full
        revision history. Current rev = last item in `revisions`. ── */
  quoteLog: [
    {
      id:'Q-2025-031', rfq:'OPP-005', client:'Dragon Oil', project:'Duplex SS Pressure Vessel — 2205',
      owner:'S. Mathews', status:'pending', validUntil:'2025-06-22', currency:'USD',
      revisions:[
        { rev:'Rev A', date:'2025-04-05', value:205000, margin:25.0, note:'Initial submission against RFQ.' },
        { rev:'Rev B', date:'2025-04-15', value:196000, margin:22.0, note:'Re-quoted after duplex plate price update.' },
        { rev:'Rev C', date:'2025-04-22', value:188000, margin:19.7, note:'Client pushback — sour-service premium partially absorbed.' },
      ],
      lines:[
        { desc:'Duplex 2205 plate & forgings',      amount:92000 },
        { desc:'Fabrication & GTAW/SMAW welding',   amount:46000 },
        { desc:'NDT & inspection (RT/UT/PT)',       amount:18000 },
        { desc:'PWHT & surface treatment',          amount:14000 },
        { desc:'Engineering, PM & TPI',             amount:18000 },
      ],
    },
    {
      id:'Q-2025-030', rfq:'ITT-2025-018', client:'Dubai Petroleum', project:'Floating Roof Tank — 100,000L API 650',
      owner:'M. Hassan', status:'submitted', validUntil:'2025-06-26', currency:'USD',
      revisions:[ { rev:'Rev A', date:'2025-04-26', value:820000, margin:26.6, note:'Initial tender submission.' } ],
    },
    {
      id:'Q-2025-029', rfq:'OPP-004', client:'EMARAT', project:'Fixed Roof Storage Tank — 100,000L',
      owner:'M. Hassan', status:'negotiation', validUntil:'2025-06-25', currency:'USD',
      revisions:[
        { rev:'Rev A', date:'2025-04-12', value:560000, margin:34.0, note:'Initial quotation.' },
        { rev:'Rev B', date:'2025-04-25', value:510000, margin:30.0, note:'15% discount discussion — revised commercial terms.' },
      ],
    },
    {
      id:'Q-2025-028', rfq:'ITT-2025-014', client:'GAL', project:'Scrubber Column 316L — 4m dia',
      owner:'S. Mathews', status:'submitted', validUntil:'2025-06-20', currency:'USD',
      revisions:[ { rev:'Rev A', date:'2025-04-20', value:145000, margin:24.0, note:'Submitted after technical clarification.' } ],
    },
    {
      id:'Q-2025-027', rfq:'OPP-008', client:'Gulf Pharmaceutical', project:'Jacketed Mixing Vessel — 20L',
      owner:'M. Hassan', status:'submitted', validUntil:'2025-05-18', currency:'USD',
      revisions:[ { rev:'Rev A', date:'2025-04-18', value:38000, margin:32.0, note:'GMP-spec vessel quotation.' } ],
    },
    {
      id:'Q-2025-022', rfq:'OPP-003', client:'ENOC', project:'Shell & Tube Heat Exchanger — 304 SS',
      owner:'M. Hassan', status:'won', validUntil:'2025-05-12', currency:'USD',
      revisions:[
        { rev:'Rev A', date:'2025-03-01', value:150000, margin:30.0, note:'Initial submission.' },
        { rev:'Rev B', date:'2025-03-12', value:142000, margin:28.0, note:'Final negotiated price — order won.' },
      ],
    },
    {
      id:'Q-2025-019', rfq:'OPP-001', client:'ADNOC Gas', project:'316L Cone Roof Tank — 20,000L',
      owner:'M. Hassan', status:'won', validUntil:'2025-04-28', currency:'USD',
      revisions:[ { rev:'Rev A', date:'2025-02-28', value:284000, margin:27.5, note:'Submitted & accepted — ADNOC framework.' } ],
    },
    {
      id:'Q-2025-018', rfq:'OPP-002', client:'Petrofac UAE', project:'ASME VIII Pressure Vessel — 3 units',
      owner:'S. Mathews', status:'won', validUntil:'2025-04-20', currency:'USD',
      revisions:[
        { rev:'Rev A', date:'2025-02-10', value:102000, margin:26.0, note:'Initial 3-unit quotation.' },
        { rev:'Rev B', date:'2025-02-20', value:97500,  margin:23.0, note:'Schedule-based discount — LOI received.' },
      ],
    },
    {
      id:'Q-2025-011', rfq:'OPP-011', client:'NAPESCO', project:'GRP Separator Skid',
      owner:'S. Mathews', status:'lost', validUntil:'2025-05-08', currency:'USD',
      revisions:[ { rev:'Rev A', date:'2025-03-08', value:74000, margin:10.8, note:'Single submission — lost to competitor 22% lower.' } ],
    },
  ],

  /* ── Scheduled appointments & trackers (calendar) — dates relative to today ── */
  appointments: (() => {
    const at = (dayOffset, h, m = 0) => {
      const x = new Date(); x.setDate(x.getDate() + dayOffset); x.setHours(h, m, 0, 0);
      return x.toISOString();
    };
    return [
      { id:'AP-001', type:'meeting',   title:'ADNOC framework review',       client:'ADNOC',             start:at(0, 10, 0),  durationMin:60,  location:'ADNOC HQ, Abu Dhabi', owner:'M. Hassan',  notes:'Quarterly framework agreement review.' },
      { id:'AP-002', type:'call',      title:'Dragon Oil duplex Q&A',        client:'Dragon Oil',        start:at(0, 14, 30), durationMin:30,  location:'Teams',               owner:'S. Mathews', notes:'Technical clarification on 2205 material.' },
      { id:'AP-003', type:'sitevisit', title:'EMARAT tank site survey',      client:'EMARAT',            start:at(2, 9, 0),   durationMin:180, location:'Jebel Ali',           owner:'M. Hassan',  notes:'Pre-bid site survey for 100kL tank.' },
      { id:'AP-004', type:'meeting',   title:'Dubai Petroleum bid kickoff',  client:'Dubai Petroleum',   start:at(3, 11, 0),  durationMin:90,  location:'Conf Room A',         owner:'M. Hassan',  notes:'ITT-2025-018 internal bid kickoff.' },
      { id:'AP-005', type:'call',      title:'Petrofac delivery sync',       client:'Petrofac UAE',      start:at(5, 15, 0),  durationMin:30,  location:'Phone',               owner:'S. Mathews', notes:'PV delivery schedule confirmation.' },
      { id:'AP-006', type:'followup',  title:'Gulf Pharma scope sign-off',   client:'Gulf Pharmaceutical', start:at(7, 13, 0), durationMin:45, location:'Teams',              owner:'M. Hassan',  notes:'Finalise jacketed vessel scope.' },
      { id:'AP-007', type:'meeting',   title:'GAL clarification meeting',    client:'GAL',               start:at(-1, 10, 0), durationMin:60,  location:'GAL Office',          owner:'S. Mathews', notes:'Scrubber column technical clarification.' },
    ];
  })(),
};

/* ─────────────────────────────────────────────────────────────
   SERVER ↔ UI MAPPERS
   Backend rows are snake_case; the UI renders camelCase. These map
   API rows → the shapes the render functions already expect. The
   server uuid is preserved as `serverId` for write-back calls while
   the human ref (Q-2025-031, QA-001, …) stays as the display `id`.
───────────────────────────────────────────────────────────── */
const _date = (v) => (v ? String(v).split('T')[0] : '');
const _num  = (v) => (v == null ? null : Number(v));

const CrmMap = {
  quote(r) {
    return {
      id: r.ref || r.id, serverId: r.id, rfq: r.rfq_no || '', client: r.client_name || '',
      project: r.project || '', owner: r.owner || '', status: r.status,
      validUntil: _date(r.valid_until), currency: r.currency || 'USD',
      revisions: (r.revisions || []).map(CrmMap.revision),
    };
  },
  revision(rv) {
    return { rev: rv.rev, date: _date(rv.rev_date), value: _num(rv.value), margin: _num(rv.margin), note: rv.note || '' };
  },
  approval(r) {
    return {
      id: r.ref || r.id, serverId: r.id, oppId: r.opp_ref || '', quote: r.quote || '',
      client: r.client_name || '', rev: r.rev || '', sell: _num(r.sell), cost: _num(r.cost),
      margin: _num(r.margin), requestedBy: r.requested_by || '', requestedOn: _date(r.requested_on),
      status: r.status, reason: r.reason || '', decidedBy: r.decided_by || '', decidedOn: _date(r.decided_on),
    };
  },
  appointment(r) {
    return {
      id: r.ref || r.id, serverId: r.id, type: r.type, title: r.title, client: r.client_name || '',
      start: r.start_at, durationMin: r.duration_min || 60, location: r.location || '',
      owner: r.owner || '', notes: r.notes || '',
    };
  },
  contact(r) {
    return {
      id: r.ref || r.id, serverId: r.id, name: r.name, title: r.title || '', company: r.company || '',
      email: r.email || '', phone: r.phone || '', lastContact: _date(r.last_contact),
      followUpDue: _date(r.follow_up_due), followUpNote: r.follow_up_note || '',
      avatarBg: r.avatar_bg || '#6366f1', initials: r.initials || '',
    };
  },
  prequal(r) {
    const daysLeft = r.expiry ? Math.ceil((new Date(r.expiry) - new Date()) / 86400000) : null;
    return {
      id: r.ref || r.id, serverId: r.id, authority: r.authority, category: r.category || '',
      status: r.status, submitted: _date(r.submitted), expiry: r.expiry ? _date(r.expiry) : '—',
      daysLeft, contact: r.contact || '',
    };
  },
  competitor(r) {
    return {
      id: r.ref || r.id, serverId: r.id, name: r.name, region: r.region || '', size: r.size || '',
      strengths: r.strengths || [], weaknesses: r.weaknesses || [],
      winRate: _num(r.win_rate) || 0, avgGap: _num(r.avg_gap) || 0,
    };
  },
  bidOutcome(r) {
    return {
      serverId: r.id, tender: r.tender, result: r.result, ourPrice: _num(r.our_price),
      competitor: r.competitor || '', theirPrice: _num(r.their_price), gap: _num(r.gap), notes: r.notes || '',
    };
  },
};

// Normalise an allSettled result into an array regardless of envelope shape.
function _crmArr(res, key) {
  if (res.status !== 'fulfilled') return null;
  const v = res.value;
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v[key])) return v[key];
  if (v && Array.isArray(v.data)) return v.data;
  return [];
}

/* ─────────────────────────────────────────────────────────────
   ENTRY POINT — delegates to sidebar-based module (app.js)
───────────────────────────────────────────────────────────── */
async function renderMarketing() {
  // Hydrate every CRM cache from the API in parallel; any rejection (e.g. demo
  // mode) leaves that cache on its seed data so the module still renders.
  const [
    oppsRes, clientsRes, tendersRes,
    quoteLogRes, apprRes, apptRes, contactRes, prequalRes, compRes, bidRes,
  ] = await Promise.allSettled([
    CrmAPI.opps({ limit: 50 }),
    CrmAPI.clients({ limit: 50 }),
    CrmAPI.tenders(),
    CrmAPI.quoteLog(),
    CrmAPI.approvals(),
    CrmAPI.appointments(),
    CrmAPI.contacts(),
    CrmAPI.prequals(),
    CrmAPI.competitors(),
    CrmAPI.bidOutcomes(),
  ]);

  CRMData.opportunities = oppsRes.status === 'fulfilled' ? (oppsRes.value.opportunities || oppsRes.value || []) : CRMData.opportunities;
  CRMData.clients       = clientsRes.status === 'fulfilled' ? (clientsRes.value.clients || clientsRes.value || []) : CRMData.clients;
  CRMData.tenders       = tendersRes.status === 'fulfilled' ? (tendersRes.value.tenders || tendersRes.value || []) : CRMData.tenders;

  const quoteLog = _crmArr(quoteLogRes, 'quotes');
  if (quoteLog) CRMData.quoteLog = quoteLog.map(CrmMap.quote);
  const approvals = _crmArr(apprRes, 'approvals');
  if (approvals) CRMData.quoteApprovals = approvals.map(CrmMap.approval);
  const appts = _crmArr(apptRes, 'appointments');
  if (appts) CRMData.appointments = appts.map(CrmMap.appointment);

  const contacts = _crmArr(contactRes, 'contacts');
  if (contacts && typeof MktContactsData !== 'undefined') MktContactsData.contacts = contacts.map(CrmMap.contact);
  const prequals = _crmArr(prequalRes, 'registrations');
  if (prequals && typeof MktPrequalData !== 'undefined') MktPrequalData.registrations = prequals.map(CrmMap.prequal);
  const competitors = _crmArr(compRes, 'competitors');
  if (competitors && typeof MktIntelData !== 'undefined') MktIntelData.competitors = competitors.map(CrmMap.competitor);
  const bids = _crmArr(bidRes, 'bidOutcomes');
  if (bids && typeof MktIntelData !== 'undefined') MktIntelData.winLoss = bids.map(CrmMap.bidOutcome);

  if (typeof enterMarketingModule === 'function') enterMarketingModule();
}

function closeCRMModal() { document.getElementById('crmModal').style.display = 'none'; }
function openCRMModal(html) {
  document.getElementById('crmModalContent').innerHTML = html;
  document.getElementById('crmModal').style.display = 'block';
}
