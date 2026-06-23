/* ============================================================
   NexaForge ERP — Analytics & KPIs Module
   Covers: Executive scorecard · Role dashboards (Plant Mgr,
           Production, QC, Finance) · OEE engine · COPQ analysis
           Trend charts · Project health matrix · KPI heatmap
           Monthly performance reports · Export builder
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   ANALYTICS DATA STORE — pulls from all other modules
───────────────────────────────────────────────────────────── */
const AnaData = {
  activeTab: 'executive',
  activeRole: 'plant',

  /* ── Monthly trend data (8 months: Sep 24 – Apr 25) ── */
  months: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],

  trends: {
    oee:         [68, 71, 69, 72, 74, 76, 73, 73],
    throughput:  [9.2, 10.1, 9.8, 10.4, 11.2, 12.6, 13.8, 14.2],
    fpy:         [88.4, 89.1, 87.6, 90.2, 91.0, 92.4, 91.2, 91.4],
    rework:      [11.6, 10.9, 12.4, 9.8, 9.0, 7.6, 8.8, 8.6],
    ncrCount:    [3, 2, 4, 2, 2, 1, 3, 2],
    revenue:     [42000, 38000, 55000, 71000, 85400, 71000, 170600, 0],
    directCost:  [31000, 29000, 42000, 51000, 64000, 53000, 126000, 0],
    utilisation: [72, 74, 71, 75, 78, 80, 82, 78],
    safetyEvents:[2, 1, 0, 1, 0, 0, 1, 0],
    dso:         [12, 9, 14, 8, 7, 10, 8, 7.6],
    wcUtil:      [71, 74, 73, 76, 80, 84, 88, 83],
    copq:        [8400, 6200, 11200, 7800, 6400, 4800, 9600, 8200],
  },

  /* ── KPI definitions per role ── */
  kpis: {
    plant: [
      { id:'oee',       name:'Overall Equipment Effectiveness (OEE)', unit:'%',   target:80,  actual:73,   trend:'up',   rag:'amber', category:'Production', motivational:false },
      { id:'util',      name:'Capacity utilisation',                  unit:'%',   target:85,  actual:78,   trend:'up',   rag:'amber', category:'Production', motivational:false },
      { id:'fpy',       name:'First pass yield (FPY)',                unit:'%',   target:95,  actual:91.4, trend:'up',   rag:'amber', category:'Quality',    motivational:false },
      { id:'safety',    name:'LTI frequency rate (LTIFR)',            unit:'/M hrs', target:0, actual:0,   trend:'stable',rag:'green', category:'HSE',       motivational:false },
      { id:'hazard',    name:'Hazard reports filed (YTD)',            unit:'#',   target:null,actual:14,   trend:'up',   rag:'green', category:'HSE',        motivational:true  },
      { id:'scrap',     name:'Scrap / spoilage rate',                 unit:'%',   target:2,   actual:3.2,  trend:'down', rag:'amber', category:'Quality',    motivational:false },
      { id:'copq',      name:'Cost of poor quality (COPQ)',           unit:'$K',  target:5,   actual:8.2,  trend:'down', rag:'red',   category:'Finance',    motivational:false },
      { id:'ontime',    name:'On-time delivery rate',                 unit:'%',   target:95,  actual:88,   trend:'up',   rag:'amber', category:'Operations', motivational:false },
    ],
    production: [
      { id:'throughput',name:'Throughput (units/week)',               unit:'u/wk',target:16,  actual:14.2, trend:'up',   rag:'amber', category:'Production', motivational:false },
      { id:'cycletime', name:'Avg cycle time per routing step',       unit:'days',target:3.5, actual:3.8,  trend:'stable',rag:'amber',category:'Production', motivational:false },
      { id:'downtime',  name:'Machine downtime rate',                 unit:'%',   target:5,   actual:7.2,  trend:'up',   rag:'amber', category:'Equipment',  motivational:false },
      { id:'ppm',       name:'Planned preventive maintenance (%)',    unit:'%',   target:90,  actual:82,   trend:'up',   rag:'amber', category:'Equipment',  motivational:false },
      { id:'labour',    name:'Labour productivity vs baseline',       unit:'%',   target:100, actual:94,   trend:'up',   rag:'amber', category:'Workforce',  motivational:false },
      { id:'routing',   name:'On-time routing completion',            unit:'%',   target:95,  actual:87,   trend:'up',   rag:'amber', category:'Production', motivational:false },
      { id:'util2',     name:'Work-centre utilisation',               unit:'%',   target:85,  actual:83,   trend:'up',   rag:'green', category:'Equipment',  motivational:false },
      { id:'wip',       name:'WIP value — active projects',           unit:'$K',  target:null,actual:283,  trend:'up',   rag:'blue',  category:'Finance',    motivational:false },
    ],
    quality: [
      { id:'fpy2',      name:'First pass yield (FPY / FTR)',          unit:'%',   target:95,  actual:91.4, trend:'up',   rag:'amber', category:'Quality',    motivational:false },
      { id:'rework',    name:'Rework rate',                           unit:'%',   target:5,   actual:8.6,  trend:'down', rag:'red',   category:'Quality',    motivational:false },
      { id:'ncr',       name:'NCR count (YTD)',                       unit:'#',   target:null,actual:4,    trend:'up',   rag:'amber', category:'Quality',    motivational:false },
      { id:'supq',      name:'Supplier incoming quality score',       unit:'%',   target:90,  actual:84.7, trend:'up',   rag:'amber', category:'Supply chain',motivational:false },
      { id:'itp',       name:'ITP hold-point compliance',             unit:'%',   target:100, actual:100,  trend:'stable',rag:'green',category:'Quality',    motivational:false },
      { id:'nde',       name:'NDE accept rate',                       unit:'%',   target:95,  actual:80,   trend:'down', rag:'red',   category:'Quality',    motivational:false },
      { id:'copq2',     name:'COPQ (cost of poor quality)',           unit:'$K',  target:5,   actual:8.2,  trend:'down', rag:'red',   category:'Finance',    motivational:false },
      { id:'welder',    name:'Welder qualification compliance',       unit:'%',   target:100, actual:66.7, trend:'down', rag:'red',   category:'Workforce',  motivational:false },
    ],
    finance: [
      { id:'margin',    name:'Gross margin — portfolio',              unit:'%',   target:18,  actual:16.2, trend:'up',   rag:'amber', category:'Finance',    motivational:false },
      { id:'revenue',   name:'Revenue recognition vs plan',           unit:'%',   target:100, actual:92,   trend:'up',   rag:'amber', category:'Finance',    motivational:false },
      { id:'dso',       name:'Days sales outstanding (DSO)',          unit:'days',target:30,  actual:7.6,  trend:'stable',rag:'green',category:'Finance',    motivational:false },
      { id:'matcost',   name:'Material cost vs quote variance',       unit:'%',   target:0,   actual:4.2,  trend:'down', rag:'amber', category:'Finance',    motivational:false },
      { id:'overhead',  name:'Overhead absorption rate',              unit:'%',   target:95,  actual:88,   trend:'up',   rag:'amber', category:'Finance',    motivational:false },
      { id:'wip2',      name:'WIP valuation accuracy',                unit:'%',   target:98,  actual:96,   trend:'stable',rag:'green',category:'Finance',    motivational:false },
      { id:'ar',        name:'AR overdue (> 30 days)',                unit:'$K',  target:0,   actual:19.5, trend:'down', rag:'red',   category:'Finance',    motivational:false },
      { id:'copqfin',   name:'COPQ as % of revenue',                 unit:'%',   target:2,   actual:3.8,  trend:'down', rag:'amber', category:'Finance',    motivational:false },
    ],
  },

  /* ── COPQ breakdown ── */
  copq: [
    { category:'Scrap & material replacement',  value:9200, type:'failure' },
    { category:'Rework & repair labour',         value:4800, type:'failure' },
    { category:'NCR investigation & admin',      value:2400, type:'failure' },
    { category:'Warranty / client re-work',      value:1200, type:'failure' },
    { category:'Incoming inspection (QC)',        value:3800, type:'appraisal' },
    { category:'In-process inspection (ITP)',     value:2200, type:'appraisal' },
    { category:'Final inspection & NDT',          value:4400, type:'appraisal' },
    { category:'Third-party lab testing (PMI)',   value:1800, type:'appraisal' },
    { category:'WPS / procedure development',     value:2800, type:'prevention' },
    { category:'Welder training & qualification', value:4200, type:'prevention' },
    { category:'Supplier quality audits',         value:1400, type:'prevention' },
    { category:'Calibration & equipment maint.',  value:2000, type:'prevention' },
  ],

  /* ── Project health matrix ── */
  projectHealth: [
    {
      id:'P-2401', name:'316L Storage Tank',
      schedule: 'amber', cost: 'amber', quality: 'red', safety: 'green', scope: 'green',
      progress: 58, margin: 18.4, daysLeft: 102, ncrs: 2,
    },
    {
      id:'P-2402', name:'ASME VIII Pressure Vessel',
      schedule: 'amber', cost: 'green', quality: 'amber', safety: 'green', scope: 'green',
      progress: 22, margin: 21.2, daysLeft: 179, ncrs: 1,
    },
    {
      id:'P-2403', name:'304 SS Heat Exchanger',
      schedule: 'red', cost: 'red', quality: 'red', safety: 'green', scope: 'amber',
      progress: 71, margin: 12.8, daysLeft: 59, ncrs: 1,
    },
  ],

  /* ── KPI heatmap data (weekly, last 12 weeks) ── */
  heatmap: {
    weeks: Array.from({length:12},(_,i)=>`W${i+1}`),
    rows: [
      { name:'OEE',       values:[70,72,71,74,75,74,76,73,72,74,73,73] },
      { name:'FPY',       values:[88,90,89,91,92,91,93,90,89,92,91,91] },
      { name:'Util',      values:[74,76,78,80,82,81,84,83,80,82,78,78] },
      { name:'Throughput',values:[10,11,10,12,13,13,14,14,13,14,14,14] },
      { name:'LTIFR',     values:[0,0,0,0,0,0,0,0,0,0,0,0] },
      { name:'NCRs',      values:[1,0,2,1,0,0,1,2,0,1,1,0] },
    ],
    // per-row: colour scale from best (green) to worst (red)
    colourFn: [
      (v) => v>=80?'#2dd4a0':v>=75?'#a3e8d0':v>=70?'#f59e0b':'#f56565', // OEE
      (v) => v>=95?'#2dd4a0':v>=90?'#a3e8d0':v>=88?'#f59e0b':'#f56565', // FPY
      (v) => v>=85?'#2dd4a0':v>=75?'#a3e8d0':v>=65?'#f59e0b':'#f56565', // Util
      (v) => v>=14?'#2dd4a0':v>=12?'#a3e8d0':v>=10?'#f59e0b':'#f56565', // Throughput
      (v) => v===0?'#2dd4a0':'#f56565',                                   // LTIFR
      (v) => v===0?'#2dd4a0':v<=1?'#f59e0b':'#f56565',                   // NCRs
    ],
  },

  /* ── Report sections for export builder ── */
  reportSections: [
    { id:'exec',      icon:'📊', name:'Executive summary',         desc:'Portfolio overview, RAG status, headline KPIs', pages:2,  checked:true  },
    { id:'pnl',       icon:'💰', name:'P&L and financial summary', desc:'Job costing, margins, AR/AP, cash flow snapshot', pages:4, checked:true  },
    { id:'production',icon:'⚙️', name:'Production performance',    desc:'OEE, throughput, work-centre utilisation, WIP', pages:3,  checked:true  },
    { id:'quality',   icon:'✅', name:'Quality KPIs & NCR register',desc:'FPY, COPQ, NCR log, NDE results, supplier scores', pages:4, checked:true },
    { id:'welding',   icon:'🔥', name:'Welding dossier summary',   desc:'WPS index, WPQ status, joint register, NDE summary', pages:3, checked:false},
    { id:'hr',        icon:'👥', name:'Workforce & HR summary',    desc:'Utilisation, cert status, training completed', pages:2,   checked:false },
    { id:'heatmap',   icon:'🗓', name:'KPI heatmap (12-week)',      desc:'Weekly performance heatmap per KPI category', pages:1,   checked:true  },
    { id:'copq',      icon:'🔍', name:'COPQ waterfall analysis',   desc:'Cost of poor quality by category and project', pages:2,  checked:false },
  ],
};

/* ─────────────────────────────────────────────────────────────
   MAIN RENDERER
───────────────────────────────────────────────────────────── */
// ── Department-scoped analytics ────────────────────────────────────────────
// Which cockpit tabs each department sees. GM gets the full executive cockpit;
// every other department gets a relevant subset. Tunable — adjust per priority.
const ANA_DEPT_TABS = {
  gm:          ['executive', 'role', 'oee', 'copq', 'trends', 'health', 'heatmap', 'reports'],
  production:  ['oee', 'trends', 'health', 'reports'],
  qc:          ['copq', 'heatmap', 'trends', 'reports'],
  finance:     ['executive', 'copq', 'trends', 'reports'],
  hr:          ['role', 'trends', 'reports'],
  marketing:   ['health', 'trends', 'reports'],
  procurement: ['heatmap', 'trends', 'reports'],
  store:       ['heatmap', 'trends', 'reports'],
  welding:     ['oee', 'copq', 'trends'],
};
const ANA_TAB_LABELS = {
  executive: 'Executive scorecard',
  role:      'Role dashboards',
  oee:       'OEE',
  copq:      'COPQ',
  trends:    'Trends',
  health:    'Project health',
  heatmap:   'KPI heatmap',
  reports:   'Report builder',
};
const ANA_DEPT_TITLES = {
  gm: 'Analytics & KPIs', production: 'Production Analytics', qc: 'Quality Analytics',
  finance: 'Finance Analytics', hr: 'HR Analytics', marketing: 'Marketing Analytics',
  procurement: 'Procurement Analytics', store: 'Store Analytics', welding: 'Welding Analytics',
};
function anaTabsFor(dept)  { return ANA_DEPT_TABS[(dept || '').toLowerCase()]   || ANA_DEPT_TABS.gm; }
function anaTitleFor(dept) { return ANA_DEPT_TITLES[(dept || '').toLowerCase()] || ANA_DEPT_TITLES.gm; }

// Builds the scoped cockpit markup (tab bar + content host + modal) for a dept.
// `heading` renders a light section title — used when embedding the cockpit under
// a module's own analytics summary; omit for the standalone full-page view.
function anaCockpitHTML(dept, { heading } = {}) {
  const tabs   = anaTabsFor(dept);
  const active = tabs.includes(AnaData.activeTab) ? AnaData.activeTab : tabs[0];
  AnaData.activeTab = active;
  const tabBtns = tabs.map(t =>
    `<button class="ana-tab ${t === active ? 'active' : ''}" data-atab="${t}" onclick="switchAnaTab('${t}')">${ANA_TAB_LABELS[t]}</button>`
  ).join('');
  return `
    ${heading ? `<div style="margin:28px 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted)">${heading}</div>` : ''}
    <div class="ana-tabs">${tabBtns}</div>
    <div id="anaTabContent"></div>
    <div id="anaModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:200;backdrop-filter:blur(5px)" onclick="closeAnaModal()">
      <div id="anaModalContent" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(580px,94vw)" onclick="event.stopPropagation()"></div>
    </div>`;
}

// Mounts the scoped cockpit into a container (default #pageContent) and renders
// the active tab. `append:true` adds it after existing content (module merge).
function mountAnaCockpit(dept, { container, append = false, heading } = {}) {
  const el = container || document.getElementById('pageContent');
  if (!el) return;
  const html = anaCockpitHTML(dept, { heading });
  if (append) el.insertAdjacentHTML('beforeend', html);
  else el.innerHTML = html;
  switchAnaTab(AnaData.activeTab);
}

// Pulls live project / NCR data into the plant KPI overlay (best-effort).
async function _anaPatchLiveKpis() {
  const [projRes, ncrRes] = await Promise.allSettled([
    ProjectsAPI.list(),
    QCAPI.ncrList({ limit: 200 })
  ]);
  if (projRes.status === 'fulfilled') {
    const projects = projRes.value.projects || projRes.value || [];
    AppState.projects = projects;
    const openNcrs = ncrRes.status === 'fulfilled'
      ? (ncrRes.value.ncrs || ncrRes.value || []).filter(n => n.status !== 'closed').length
      : AnaData.kpis.plant.find(k => k.id === 'openncrs')?.actual ?? 0;
    AnaData.kpis.plant = AnaData.kpis.plant.map(k => {
      if (k.id === 'openncrs' || k.name?.toLowerCase().includes('ncr')) return { ...k, actual: openNcrs };
      return k;
    });
  }
}

// Full-page analytics view (navigate target). Scopes to AppState.department:
// GM sees the executive cockpit; each department sees its relevant tabs.
async function renderAnalytics() {
  const el   = document.getElementById('pageContent');
  const dept = (AppState.department || 'gm').toLowerCase();

  await _anaPatchLiveKpis();

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">${anaTitleFor(dept)}</div>
        <div class="page-subtitle">${anaTabsFor(dept).map(t => ANA_TAB_LABELS[t]).join(' · ')}</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="renderAnalytics()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Refresh
        </button>
        <button class="btn btn-primary btn-sm" onclick="showToast('Generating report PDF…','info')">
          <svg viewBox="0 0 15 15" fill="none"><path d="M3 12h9M7.5 2v7M4.5 6l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Export report
        </button>
      </div>
    </div>`;

  mountAnaCockpit(dept, { container: el, append: true });
}

// Department-module analytics sub-page renderers. These render the scoped cockpit
// into the module's own content container so each module exposes one analytics view.
function renderFinAnalytics()  { mountAnaCockpit('finance',   { container: document.getElementById('finTabContent') }); }
function renderMktAnalytics()  { mountAnaCockpit('marketing', { container: document.getElementById('crmTabContent') || document.getElementById('mktTabContent') }); }
function renderWldAnalytics()  { mountAnaCockpit('welding',   { container: document.getElementById('wldTabContent') }); }

if (typeof window !== 'undefined') {
  window.anaTabsFor       = anaTabsFor;
  window.mountAnaCockpit  = mountAnaCockpit;
  window.renderFinAnalytics = renderFinAnalytics;
  window.renderMktAnalytics = renderMktAnalytics;
  window.renderWldAnalytics = renderWldAnalytics;
}

function switchAnaTab(tab) {
  AnaData.activeTab = tab;
  document.querySelectorAll('.ana-tab').forEach(btn => btn.classList.toggle('active', btn.dataset.atab === tab));
  const map = {
    executive: renderAnaExecutive,
    role:      renderAnaRole,
    oee:       renderAnaOEE,
    copq:      renderAnaCOPQ,
    trends:    renderAnaTrends,
    health:    renderAnaHealth,
    heatmap:   renderAnaHeatmap,
    reports:   renderAnaReports,
  };
  if (map[tab]) map[tab]();
}

function closeAnaModal() { document.getElementById('anaModal').style.display = 'none'; }
function openAnaModal(html) {
  document.getElementById('anaModalContent').innerHTML = html;
  document.getElementById('anaModal').style.display = 'block';
}

/* ── Chart helpers ── */
function miniSparkSVG(values, color, width=80, height=28) {
  if (!values || values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const areaBot = `${width},${height} 0,${height}`;
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="display:block">
    <polyline points="${pts} ${areaBot}" class="spark-area" style="fill:${color}" />
    <polyline points="${pts}" class="spark-line" style="stroke:${color}" />
    <circle cx="${values.map((v,i)=>((i/(values.length-1))*width).toFixed(1)).at(-1)}"
            cy="${(height - ((values.at(-1)-min)/range)*(height-4) - 2).toFixed(1)}"
            r="2.5" fill="${color}" class="spark-dot"/>
  </svg>`;
}

function ragDot(rag) {
  return `<span class="rag rag-${rag}"><span class="rag-dot"></span>${rag.toUpperCase()}</span>`;
}

function trendArrow(t, unit) {
  /* For most KPIs, up = good. Exceptions: rework, NCR, COPQ, DSO, downtime, cost */
  const inverted = ['rework','ncr','copq','copq2','copqfin','ar','matcost','downtime','cycletime','safety','scrap','dso'].some(k => unit?.toLowerCase().includes(k));
  if (t === 'up')   return `<span class="${inverted?'trend-down':'trend-up'}">↑</span>`;
  if (t === 'down') return `<span class="${inverted?'trend-up':'trend-down'}">↓</span>`;
  return `<span class="trend-stable">→</span>`;
}

function kpiVariance(actual, target) {
  if (target === null || target === undefined) return '—';
  const diff = actual - target;
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}`;
}
