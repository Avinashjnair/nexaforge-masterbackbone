/* ============================================================
   NexaForge ERP — Analytics Tab Renderers (part 2)
   ============================================================ */

/* ═══════════════════════════════════════════════════════════
   TAB 1 — EXECUTIVE SCORECARD
═══════════════════════════════════════════════════════════ */
function renderAnaExecutive() {
  const ph = AnaData.projectHealth;
  const t  = AnaData.trends;
  const m  = AnaData.months;

  const portfolioRevenue = 523500;
  const avgMargin = 17.5;
  const activeProjCount = 3;

  document.getElementById('anaTabContent').innerHTML = `
    <!-- Top headline KPIs -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:20px">
      ${[
        { label:'Portfolio revenue YTD', value:'$523K',   color:'var(--blue)',    sub:'3 active projects' },
        { label:'Avg gross margin',      value:'17.5%',   color:'var(--green)',   sub:'Target: 18%' },
        { label:'OEE',                   value:'73%',     color:'var(--amber)',   sub:'Target: ≥80%' },
        { label:'First pass yield',      value:'91.4%',   color:'var(--amber)',   sub:'Target: ≥95%' },
        { label:'LTIFR',                 value:'0.0',     color:'var(--green)',   sub:'Zero harm YTD' },
        { label:'Open NCRs',             value:'3',       color:'var(--red)',     sub:'1 critical' },
      ].map(k=>`
        <div class="metric-card" style="padding:16px">
          <div class="metric-label">${k.label}</div>
          <div class="metric-value" style="font-size:22px;color:${k.color}">${k.value}</div>
          <div class="metric-delta">${k.sub}</div>
        </div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <!-- RAG project status -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Project RAG status</span>
          <button class="btn btn-ghost btn-sm" onclick="switchAnaTab('health')">Health matrix →</button>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr>
            ${['Project','Schedule','Cost','Quality','Safety','Overall'].map(h=>`<th style="text-align:left;padding:6px 8px;font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid var(--border)">${h}</th>`).join('')}
          </tr></thead>
          <tbody>
            ${ph.map(p => {
              const overall = [p.schedule,p.cost,p.quality,p.safety,p.scope].includes('red') ? 'red'
                : [p.schedule,p.cost,p.quality,p.safety,p.scope].includes('amber') ? 'amber' : 'green';
              return `
              <tr onclick="navigate('projects')" style="cursor:pointer">
                <td style="padding:8px;font-family:var(--font-mono);color:var(--brand);border-bottom:1px solid var(--border)">${p.id}</td>
                ${[p.schedule,p.cost,p.quality,p.safety,overall].map(r=>`<td style="padding:8px;border-bottom:1px solid var(--border)">${ragDot(r)}</td>`).join('')}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- 8-month revenue vs cost chart -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Revenue vs direct cost — monthly</span>
          <div style="display:flex;gap:10px;font-size:11px;color:var(--text-muted)">
            <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:3px;background:var(--green);display:inline-block;border-radius:2px"></span>Revenue</span>
            <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:3px;background:var(--red);display:inline-block;border-radius:2px"></span>Cost</span>
          </div>
        </div>
        ${renderBarChart(t.revenue, t.directCost, m, 'var(--green)', 'var(--red)', 320, 140)}
      </div>
    </div>

    <!-- KPI trend sparklines strip -->
    <div class="card">
      <div class="card-header"><span class="card-title">8-month KPI trend overview</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px">
        ${[
          { label:'OEE',            vals:t.oee,         unit:'%',     color:'var(--brand)', target:80  },
          { label:'Throughput',     vals:t.throughput,  unit:'u/wk',  color:'var(--green)',  target:16  },
          { label:'First pass yield',vals:t.fpy,        unit:'%',     color:'var(--blue)',   target:95  },
          { label:'Work-ctr util.', vals:t.wcUtil,      unit:'%',     color:'var(--brand)', target:85  },
          { label:'NCR count',      vals:t.ncrCount,    unit:'#/mo',  color:'var(--red)',    target:null},
          { label:'COPQ',           vals:t.copq.map(v=>v/1000),unit:'$K',color:'var(--red)',target:5   },
          { label:'DSO',            vals:t.dso,         unit:'days',  color:'var(--green)',  target:30  },
          { label:'Safety events',  vals:t.safetyEvents,unit:'events',color:'var(--amber)',  target:0   },
        ].map(k => {
          const last = k.vals.at(-1);
          const prev = k.vals.at(-2);
          const delta = last - prev;
          const col = k.color;
          return `
          <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
              <span style="font-size:11px;color:var(--text-muted)">${k.label}</span>
              ${k.target!==null?`<span style="font-size:10px;color:var(--text-muted)">T: ${k.target}${k.unit}</span>`:''}
            </div>
            ${miniSparkSVG(k.vals, col, 120, 32)}
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
              <span style="font-family:var(--font-display);font-size:18px;font-weight:700;color:${col}">${typeof last==='number'?last.toFixed(last<10&&last%1!==0?1:0):last}${k.unit==='%'?'%':''}</span>
              <span style="font-size:11px;color:${delta>0?'var(--green)':delta<0?'var(--red)':'var(--text-muted)'}">${delta>=0?'+':''}${delta.toFixed(1)}</span>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

/* bar chart helper */
function renderBarChart(series1, series2, labels, col1, col2, w=400, h=120) {
  const maxV = Math.max(...series1, ...series2);
  const pad = { t:8, r:8, b:24, l:48 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const bw = Math.floor(cw / labels.length);
  const bPair = Math.floor(bw * 0.36);
  const gap = 2;

  return `<div style="overflow-x:auto">
    <svg width="100%" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" style="min-width:260px">
      ${[0,0.25,0.5,0.75,1].map(f => {
        const y = pad.t + ch * f;
        const val = Math.round(maxV * (1-f) / 1000);
        return `<line x1="${pad.l}" y1="${y}" x2="${w-pad.r}" y2="${y}" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/>
                <text x="${pad.l-4}" y="${y+3}" font-size="8" fill="#4d5968" text-anchor="end" font-family="DM Mono">$${val}K</text>`;
      }).join('')}
      ${labels.map((lbl, i) => {
        const x = pad.l + i * bw;
        const h1 = maxV>0 ? (series1[i]/maxV)*ch : 0;
        const h2 = maxV>0 ? (series2[i]/maxV)*ch : 0;
        return `
        <rect x="${x+(bw-bPair*2-gap)/2}" y="${pad.t+ch-h1}" width="${bPair}" height="${h1}" fill="${col1}" rx="2" opacity="0.85"/>
        <rect x="${x+(bw-bPair*2-gap)/2+bPair+gap}" y="${pad.t+ch-h2}" width="${bPair}" height="${h2}" fill="${col2}" rx="2" opacity="0.85"/>
        <text x="${x+bw/2}" y="${h-6}" font-size="8" fill="#4d5968" text-anchor="middle" font-family="DM Mono">${lbl}</text>`;
      }).join('')}
    </svg>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 2 — ROLE DASHBOARDS
═══════════════════════════════════════════════════════════ */
function renderAnaRole() {
  const roles = [
    { id:'plant',      label:'Plant manager',      icon:'🏭' },
    { id:'production', label:'Production manager', icon:'⚙️' },
    { id:'quality',    label:'QC / QA manager',    icon:'✅' },
    { id:'finance',    label:'Finance',            icon:'💰' },
  ];

  document.getElementById('anaTabContent').innerHTML = `
    <!-- Role selector -->
    <div class="role-strip">
      ${roles.map(r=>`
        <button class="role-btn ${AnaData.activeRole===r.id?'active':''}" onclick="selectRole('${r.id}')">
          <div class="role-icon">${r.icon}</div>
          ${r.label}
        </button>`).join('')}
    </div>
    <div id="roleContent"></div>`;

  renderRoleDashboard(AnaData.activeRole);
}

function selectRole(roleId) {
  AnaData.activeRole = roleId;
  document.querySelectorAll('.role-btn').forEach(btn => btn.classList.toggle('active', btn.getAttribute('onclick').includes(`'${roleId}'`)));
  renderRoleDashboard(roleId);
}

function renderRoleDashboard(roleId) {
  const kpis = AnaData.kpis[roleId] || [];
  const roleLabel = { plant:'Plant manager', production:'Production manager', quality:'QC / QA manager', finance:'Finance' }[roleId];
  const trendKeys = { plant:'oee', production:'throughput', quality:'fpy', finance:'revenue' };
  const trendVals = AnaData.trends[trendKeys[roleId]] || AnaData.trends.oee;

  document.getElementById('roleContent').innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <span class="card-title">${roleLabel} — KPI dashboard (${kpis.length} KPIs)</span>
        <button class="btn btn-ghost btn-sm" onclick="showToast('Dashboard exported as PDF','success')">Export</button>
      </div>
      <table class="kpi-scorecard">
        <thead>
          <tr>
            <th>KPI</th>
            <th>Category</th>
            <th style="text-align:right">Target</th>
            <th style="text-align:right">Actual</th>
            <th style="text-align:right">Variance</th>
            <th style="text-align:center">Trend</th>
            <th style="text-align:center">Status</th>
            <th style="min-width:90px">Sparkline</th>
          </tr>
        </thead>
        <tbody>
          ${kpis.map(k => {
            const trendKey = { oee:'oee', util:'utilisation', util2:'wcUtil', fpy:'fpy', fpy2:'fpy',
              throughput:'throughput', rework:'rework', ncr:'ncrCount', copq:'copq', copq2:'copq',
              copqfin:'copq', revenue:'revenue', dso:'dso', safety:'safetyEvents' }[k.id];
            const sparkVals = trendKey ? AnaData.trends[trendKey] : null;
            const ragCls = `rag-${k.rag}`;
            const varVal = kpiVariance(k.actual, k.target);
            const varColor = k.rag==='green'?'var(--green)':k.rag==='red'?'var(--red)':'var(--amber)';
            return `
            <tr onclick="openKPIDetail('${k.id}','${roleId}')">
              <td>
                <div style="display:flex;align-items:center;gap:6px">
                  ${k.motivational?`<span title="Motivational metric" style="font-size:10px">⭐</span>`:''}
                  <span style="font-weight:500">${k.name}</span>
                </div>
              </td>
              <td><span class="badge badge-muted" style="font-size:10px">${k.category}</span></td>
              <td style="text-align:right;font-family:var(--font-mono);color:var(--text-muted)">${k.target!==null?k.target+''+k.unit:'—'}</td>
              <td style="text-align:right;font-family:var(--font-display);font-size:15px;font-weight:700;color:${varColor}">${k.actual}${k.unit==='%'?'%':k.unit==='$K'?' K':' '+k.unit}</td>
              <td style="text-align:right;font-family:var(--font-mono);font-size:12px;color:${varColor}">${varVal!=='—'?varVal+(k.unit==='%'?'%':''):varVal}</td>
              <td style="text-align:center">${trendArrow(k.trend, k.id)}</td>
              <td style="text-align:center">${ragDot(k.rag)}</td>
              <td>${sparkVals?miniSparkSVG(sparkVals,varColor,90,22):''}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <div style="margin-top:10px;font-size:11px;color:var(--text-muted)">
        ⭐ Motivational metrics measure positive behaviour/culture, not performance failure
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 3 — OEE ENGINE
═══════════════════════════════════════════════════════════ */
function renderAnaOEE() {
  const oee = 73, avail = 88, perf = 87, qual = 95;
  const C = 2 * Math.PI * 54;

  const oeeHistory = AnaData.trends.oee;
  const months = AnaData.months;

  document.getElementById('anaTabContent').innerHTML = `
    <div style="display:grid;grid-template-columns:280px 1fr;gap:16px;margin-bottom:16px">
      <!-- OEE gauge -->
      <div class="card" style="display:flex;flex-direction:column;align-items:center">
        <div class="card-header" style="width:100%"><span class="card-title">Current OEE</span></div>
        <div class="oee-gauge-wrap">
          <svg class="oee-gauge-svg" width="180" height="150" viewBox="0 0 180 150">
            <!-- Background arc (180°) -->
            <path d="M 20 110 A 70 70 0 0 1 160 110" fill="none" class="gauge-track" stroke-width="14"/>
            <!-- OEE fill arc -->
            <path d="M 20 110 A 70 70 0 0 1 160 110" fill="none"
              class="gauge-fill"
              stroke="${oee>=80?'var(--green)':oee>=65?'var(--brand)':'var(--red)'}"
              stroke-width="14"
              stroke-dasharray="${(oee/100)*219.9} 219.9"
              stroke-linecap="round"/>
            <!-- Label -->
            <text x="90" y="92" text-anchor="middle" class="gauge-label">${oee}%</text>
            <text x="90" y="114" text-anchor="middle" class="gauge-sub">OEE</text>
            <!-- Min/Max labels -->
            <text x="20" y="130" text-anchor="middle" class="gauge-sub">0%</text>
            <text x="160" y="130" text-anchor="middle" class="gauge-sub">100%</text>
            <!-- Target marker -->
            <line x1="${90 + 70*Math.cos(Math.PI - 0.8*Math.PI*(80/100))}"
                  y1="${110 - 70*Math.sin(0.8*Math.PI*(80/100))}"
                  x2="${90 + 84*Math.cos(Math.PI - 0.8*Math.PI*(80/100))}"
                  y2="${110 - 84*Math.sin(0.8*Math.PI*(80/100))}"
                  stroke="var(--brand)" stroke-width="2" stroke-dasharray="3 2"/>
          </svg>
          <div class="oee-components">
            ${[['Availability','A',avail,'var(--blue)'],['Performance','P',perf,'var(--brand)'],['Quality','Q',qual,'var(--green)']].map(([name,code,val,col])=>`
              <div class="oee-comp">
                <div class="oee-comp-val" style="color:${col}">${val}%</div>
                <div class="oee-comp-lbl">${code} — ${name}</div>
              </div>`).join('')}
          </div>
          <div style="margin-top:12px;font-size:11px;color:var(--text-muted);text-align:center">
            Formula: A × P × Q = ${avail}% × ${perf}% × ${qual}% = <strong style="color:${oee>=80?'var(--green)':'var(--amber)'}">${oee}%</strong>
          </div>
        </div>
      </div>

      <!-- OEE trend chart -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">OEE trend — 8 months</span>
          <span class="badge badge-amber" style="font-size:10px">Target ≥ 80%</span>
        </div>
        ${renderLineChart(oeeHistory, months, 'var(--brand)', 80)}
        <div style="margin-top:12px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px">OEE gap analysis — current month</div>
          ${[
            ['Planned downtime',      12, 'var(--blue-bg)',  'var(--blue)'],
            ['Unplanned downtime',     5, 'var(--red-bg)',   'var(--red)'],
            ['Speed losses',           8, 'var(--amber-bg)', 'var(--amber)'],
            ['Quality losses (scrap)', 3, 'var(--red-bg)',   'var(--red)'],
          ].map(([label, pct, bg, col])=>`
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;font-size:12px">
              <span style="min-width:200px;color:var(--text-secondary)">${label}</span>
              <div class="progress-bar" style="flex:1;height:8px">
                <div class="progress-fill" style="width:${pct*5}%;background:${col}"></div>
              </div>
              <span style="min-width:32px;text-align:right;color:${col};font-weight:600">-${pct}%</span>
            </div>`).join('')}
          <div style="font-size:11px;color:var(--text-muted);margin-top:6px">Recoverable OEE opportunity: <strong style="color:var(--green)">+7pp</strong> to reach 80% target</div>
        </div>
      </div>
    </div>

    <!-- Work-centre OEE breakdown -->
    <div class="card">
      <div class="card-header"><span class="card-title">Work-centre OEE breakdown</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px">
        ${[
          { name:'Rolling bay', oee:82, avail:92, perf:91, qual:98, color:'var(--green)' },
          { name:'Weld bay 1',  oee:78, avail:88, perf:90, qual:99, color:'var(--amber)' },
          { name:'Weld bay 2',  oee:68, avail:75, perf:91, qual:100,color:'var(--amber)' },
          { name:'Fitting bay', oee:75, avail:86, perf:89, qual:98, color:'var(--amber)' },
          { name:'Assembly',    oee:62, avail:78, perf:81, qual:99, color:'var(--red)'   },
          { name:'CNC/Plasma',  oee:0,  avail:0,  perf:0,  qual:0,  color:'var(--red)',  down:true },
        ].map(wc=>`
          <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px;border-top:3px solid ${wc.color}">
            <div style="font-size:12px;font-weight:500;color:var(--text-primary);margin-bottom:8px">${wc.name}</div>
            ${wc.down?`<div style="font-size:20px;font-weight:700;color:var(--red)">DOWN</div><div style="font-size:10px;color:var(--red)">Maintenance</div>`:`
            <div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:${wc.color}">${wc.oee}%</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:5px">A:${wc.avail}% P:${wc.perf}% Q:${wc.qual}%</div>
            <div class="progress-bar" style="margin-top:6px;height:4px">
              <div class="progress-fill" style="width:${wc.oee}%;background:${wc.color}"></div>
            </div>`}
          </div>`).join('')}
      </div>
    </div>`;
}

function renderLineChart(values, labels, color, targetLine) {
  const W=520, H=110, pad={t:10,r:10,b:22,l:40};
  const cw=W-pad.l-pad.r, ch=H-pad.t-pad.b;
  const min=Math.min(...values,targetLine||99)-5, max=Math.max(...values,(targetLine||0))+5;
  const range=max-min||1;
  const pts = values.map((v,i)=>{
    const x=pad.l+(i/(values.length-1))*cw;
    const y=pad.t+ch-((v-min)/range)*ch;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = pts.join(' ') + ` ${pad.l+cw},${pad.t+ch} ${pad.l},${pad.t+ch}`;
  const targetY = targetLine!==undefined ? pad.t+ch-((targetLine-min)/range)*ch : null;
  return `<div style="overflow-x:auto"><svg width="100%" viewBox="0 0 ${W} ${H}" style="min-width:280px">
    ${[0,.25,.5,.75,1].map(f=>{
      const y=pad.t+ch*f; const val=Math.round(max-(f*(max-min)));
      return `<line x1="${pad.l}" y1="${y}" x2="${W-pad.r}" y2="${y}" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/>
              <text x="${pad.l-4}" y="${y+3}" font-size="8" fill="#4d5968" text-anchor="end">${val}</text>`;
    }).join('')}
    ${targetLine!==undefined&&targetY?`<line x1="${pad.l}" y1="${targetY}" x2="${W-pad.r}" y2="${targetY}" stroke="var(--brand)" stroke-width="1" stroke-dasharray="5 3" opacity="0.7"/>
    <text x="${W-pad.r+2}" y="${targetY+3}" font-size="8" fill="var(--brand)">T</text>`:''}
    <polyline points="${area}" fill="${color}" opacity="0.08"/>
    <polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${pts.map((pt,i)=>{
      const [x,y]=pt.split(',');
      return `<circle cx="${x}" cy="${y}" r="3" fill="${color}"/>
              <text x="${x}" y="${H-6}" font-size="8" fill="#4d5968" text-anchor="middle">${labels[i]}</text>`;
    }).join('')}
  </svg></div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 4 — COPQ ANALYSIS
═══════════════════════════════════════════════════════════ */
function renderAnaCOPQ() {
  const data = AnaData.copq;
  const total = data.reduce((s,d)=>s+d.value,0);
  const byType = {
    failure:   { label:'Internal failure', color:'var(--red)',   val:data.filter(d=>d.type==='failure').reduce((s,d)=>s+d.value,0) },
    appraisal: { label:'Appraisal',        color:'var(--amber)', val:data.filter(d=>d.type==='appraisal').reduce((s,d)=>s+d.value,0) },
    prevention:{ label:'Prevention',       color:'var(--green)', val:data.filter(d=>d.type==='prevention').reduce((s,d)=>s+d.value,0) },
  };

  document.getElementById('anaTabContent').innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'Total COPQ (month)',     value:'$'+total.toLocaleString(), color:'var(--red)'   },
        { label:'Internal failure',       value:'$'+byType.failure.val.toLocaleString(),   color:'var(--red)'   },
        { label:'Appraisal costs',        value:'$'+byType.appraisal.val.toLocaleString(), color:'var(--amber)' },
        { label:'Prevention costs',       value:'$'+byType.prevention.val.toLocaleString(),color:'var(--green)' },
        { label:'COPQ as % of revenue',  value:'3.8%',  color:'var(--amber)' },
        { label:'Target COPQ',           value:'≤ $5K', color:'var(--text-muted)' },
      ].map(k=>`<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:20px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 200px;gap:16px;margin-bottom:16px">
      <!-- Waterfall -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">COPQ waterfall — by category</span>
          <div style="display:flex;gap:8px;font-size:11px">
            ${Object.values(byType).map(t=>`<span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:50%;background:${t.color};display:inline-block"></span>${t.label}</span>`).join('')}
          </div>
        </div>
        ${data.map(d => {
          const pct = Math.round((d.value/total)*100);
          const col = { failure:'var(--red)', appraisal:'var(--amber)', prevention:'var(--green)' }[d.type];
          const bg  = { failure:'var(--red-bg)', appraisal:'var(--amber-bg)', prevention:'var(--green-bg)' }[d.type];
          return `
          <div class="waterfall-bar-row">
            <span class="waterfall-label">${d.category}</span>
            <div class="waterfall-bar-track">
              <div class="waterfall-bar-fill" style="width:${pct*3}%;background:${bg};color:${col};min-width:${d.value>2000?'60px':'0'}">
                ${d.value>2000?'$'+d.value.toLocaleString():''}
              </div>
            </div>
            <span class="waterfall-value" style="color:${col}">$${d.value.toLocaleString()}</span>
            <span class="waterfall-pct">${pct}%</span>
          </div>`;
        }).join('')}
      </div>

      <!-- Type breakdown donut (SVG) -->
      <div class="card" style="display:flex;flex-direction:column;align-items:center;justify-content:center">
        <div class="card-header" style="width:100%"><span class="card-title">By type</span></div>
        ${renderDonut(Object.values(byType).map(t=>({...t})), total)}
        <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px;font-size:11px;width:100%">
          ${Object.values(byType).map(t=>`
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="display:flex;align-items:center;gap:5px"><span style="width:8px;height:8px;border-radius:50%;background:${t.color};display:inline-block"></span>${t.label}</span>
              <span style="font-family:var(--font-mono);color:${t.color};font-weight:600">${Math.round(t.val/total*100)}%</span>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- COPQ trend -->
    <div class="card">
      <div class="card-header"><span class="card-title">COPQ trend — monthly ($)</span><span class="badge badge-red" style="font-size:10px">Target ≤ $5,000/mo</span></div>
      ${renderLineChart(AnaData.trends.copq.map(v=>v/1000), AnaData.months, 'var(--red)', 5)}
    </div>`;
}

function renderDonut(types, total) {
  const W=120, cx=60, cy=55, r=40, sw=18;
  const C=2*Math.PI*r;
  let offset=0;
  const slices = types.map(t => {
    const pct=t.val/total; const dash=pct*C; const slice={...t,dash,offset};
    offset+=dash; return slice;
  });
  return `<svg width="${W}" height="${W}" viewBox="0 0 ${W} ${W}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--bg-elevated)" stroke-width="${sw}"/>
    ${slices.map(s=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${sw}"
      stroke-dasharray="${s.dash} ${C-s.dash}" stroke-dashoffset="${C/4-s.offset}" stroke-linecap="butt" opacity="0.85"/>`).join('')}
    <text x="${cx}" y="${cy+4}" text-anchor="middle" font-size="11" font-weight="700" fill="#f0f2f5">$${Math.round(total/1000)}K</text>
  </svg>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 5 — TRENDS
═══════════════════════════════════════════════════════════ */
function renderAnaTrends() {
  const t = AnaData.trends;
  const m = AnaData.months;

  const charts = [
    { title:'OEE trend',              vals:t.oee,         color:'var(--brand)',target:80, unit:'%'     },
    { title:'First pass yield (FPY)', vals:t.fpy,         color:'var(--blue)', target:95, unit:'%'     },
    { title:'Labour utilisation',     vals:t.utilisation, color:'var(--green)',target:85, unit:'%'     },
    { title:'Throughput (u/wk)',      vals:t.throughput,  color:'var(--green)',target:16, unit:'u/wk'  },
    { title:'COPQ ($K)',              vals:t.copq.map(v=>v/1000), color:'var(--red)', target:5, unit:'$K' },
    { title:'NCR count',              vals:t.ncrCount,    color:'var(--red)', target:null, unit:'#'    },
  ];

  document.getElementById('anaTabContent').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      ${charts.map(ch=>`
        <div class="card">
          <div class="card-header">
            <span class="card-title">${ch.title}</span>
            <div style="display:flex;align-items:center;gap:8px">
              ${ch.target!==null?`<span style="font-size:11px;color:var(--text-muted)">Target: ${ch.target}${ch.unit==='%'?'%':' '+ch.unit}</span>`:''}
              <span style="font-family:var(--font-display);font-size:16px;font-weight:700;color:${ch.color}">${ch.vals.at(-1).toFixed(1)}${ch.unit==='%'?'%':''}</span>
            </div>
          </div>
          ${renderLineChart(ch.vals, m, ch.color, ch.target)}
        </div>`).join('')}
    </div>

    <!-- Month-on-month table -->
    <div class="card" style="margin-top:16px">
      <div class="card-header"><span class="card-title">Month-on-month performance table</span></div>
      <div style="overflow-x:auto">
        <table class="kpi-scorecard" style="min-width:600px">
          <thead><tr>
            <th>KPI</th>
            ${m.map(mo=>`<th style="text-align:right">${mo}</th>`).join('')}
            <th style="text-align:center">Trend</th>
          </tr></thead>
          <tbody>
            ${[
              { label:'OEE %',         vals:t.oee,                     color:'var(--brand)', good:'up' },
              { label:'FPY %',         vals:t.fpy,                     color:'var(--blue)',   good:'up' },
              { label:'Throughput',    vals:t.throughput,              color:'var(--green)',  good:'up' },
              { label:'Utilisation %', vals:t.utilisation,             color:'var(--green)',  good:'up' },
              { label:'COPQ $K',       vals:t.copq.map(v=>v/1000),    color:'var(--red)',    good:'down'},
              { label:'NCR count',     vals:t.ncrCount,                color:'var(--red)',    good:'down'},
              { label:'DSO days',      vals:t.dso,                     color:'var(--blue)',   good:'down'},
            ].map(row => {
              const delta = row.vals.at(-1) - row.vals.at(-2);
              const isGood = (row.good==='up' && delta>=0) || (row.good==='down' && delta<=0);
              return `<tr>
                <td style="font-weight:500">${row.label}</td>
                ${row.vals.map((v,i) => {
                  const d = i>0?v-row.vals[i-1]:0;
                  const isG = (row.good==='up'&&d>=0)||(row.good==='down'&&d<=0);
                  const col = i===0?'var(--text-secondary)':isG?'var(--green)':'var(--red)';
                  return `<td style="text-align:right;font-family:var(--font-mono);font-size:12px;color:${col}">${v.toFixed(1)}</td>`;
                }).join('')}
                <td style="text-align:center">${miniSparkSVG(row.vals, row.color, 70, 18)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 6 — PROJECT HEALTH MATRIX
═══════════════════════════════════════════════════════════ */
function renderAnaHealth() {
  const ph = AnaData.projectHealth;
  const dims = [
    { key:'schedule', label:'Schedule' },
    { key:'cost',     label:'Cost' },
    { key:'quality',  label:'Quality' },
    { key:'safety',   label:'Safety' },
    { key:'scope',    label:'Scope' },
  ];

  document.getElementById('anaTabContent').innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <span class="card-title">Project health matrix — RAG assessment</span>
        <div style="display:flex;gap:8px;font-size:11px">
          ${[['green','On target'],['amber','Monitor'],['red','At risk']].map(([c,l])=>`<span class="rag rag-${c}"><span class="rag-dot"></span>${l}</span>`).join('')}
        </div>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;min-width:480px">
          <thead>
            <tr>
              <th style="text-align:left;padding:10px 14px;font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;border-bottom:1px solid var(--border)">Project</th>
              ${dims.map(d=>`<th style="text-align:center;padding:10px 8px;font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;border-bottom:1px solid var(--border)">${d.label}</th>`).join('')}
              <th style="text-align:center;padding:10px 8px;font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;border-bottom:1px solid var(--border)">Overall</th>
              <th style="text-align:right;padding:10px 14px;font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;border-bottom:1px solid var(--border)">Progress</th>
              <th style="text-align:right;padding:10px 14px;font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;border-bottom:1px solid var(--border)">Margin</th>
              <th style="text-align:right;padding:10px 14px;font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;border-bottom:1px solid var(--border)">Days left</th>
              <th style="text-align:center;padding:10px 14px;font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;border-bottom:1px solid var(--border)">NCRs</th>
            </tr>
          </thead>
          <tbody>
            ${ph.map(p => {
              const overall = dims.map(d=>p[d.key]).includes('red')?'red':dims.map(d=>p[d.key]).includes('amber')?'amber':'green';
              return `
              <tr onclick="navigate('projects');showToast('Opening ${p.id}','info')" style="cursor:pointer">
                <td style="padding:12px 14px;border-bottom:1px solid var(--border)">
                  <div style="font-family:var(--font-mono);font-size:12px;color:var(--brand)">${p.id}</div>
                  <div style="font-size:12px;color:var(--text-secondary)">${p.name}</div>
                </td>
                ${dims.map(d=>`<td style="text-align:center;padding:12px 8px;border-bottom:1px solid var(--border)">${ragDot(p[d.key])}</td>`).join('')}
                <td style="text-align:center;padding:12px 8px;border-bottom:1px solid var(--border)">${ragDot(overall)}</td>
                <td style="padding:12px 14px;border-bottom:1px solid var(--border);text-align:right">
                  <div style="font-weight:600;font-size:13px">${p.progress}%</div>
                  <div class="progress-bar" style="height:4px;margin-top:4px"><div class="progress-fill" style="width:${p.progress}%;background:${{green:'var(--green)',amber:'var(--amber)',red:'var(--red)'}[overall]}"></div></div>
                </td>
                <td style="padding:12px 14px;border-bottom:1px solid var(--border);text-align:right;font-weight:600;color:${p.margin>=15?'var(--green)':p.margin>=10?'var(--amber)':'var(--red)'}">${p.margin}%</td>
                <td style="padding:12px 14px;border-bottom:1px solid var(--border);text-align:right;font-weight:600;color:${p.daysLeft<60?'var(--red)':p.daysLeft<90?'var(--amber)':'var(--green)'}">${p.daysLeft}d</td>
                <td style="padding:12px 14px;border-bottom:1px solid var(--border);text-align:center"><span class="badge ${p.ncrs>0?'badge-red':'badge-green'}" style="font-size:11px">${p.ncrs}</span></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Health commentary cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">
      ${ph.map(p => {
        const overall = dims.map(d=>p[d.key]).includes('red')?'red':dims.map(d=>p[d.key]).includes('amber')?'amber':'green';
        const borderColor = {red:'var(--red)',amber:'var(--amber)',green:'var(--green)'}[overall];
        const alerts = dims.filter(d=>p[d.key]==='red').map(d=>d.label);
        const warnings = dims.filter(d=>p[d.key]==='amber').map(d=>d.label);
        return `
        <div style="background:var(--bg-surface);border:1px solid var(--border);border-left:3px solid ${borderColor};border-radius:var(--radius-lg);padding:14px 16px;cursor:pointer" onclick="navigate('projects');showToast('Opening ${p.id}','info')">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
            <div>
              <div style="font-family:var(--font-mono);font-size:11px;color:var(--brand)">${p.id}</div>
              <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${p.name}</div>
            </div>
            ${ragDot(overall)}
          </div>
          ${alerts.length?`<div style="font-size:11px;color:var(--red);margin-bottom:4px">⚠ At risk: ${alerts.join(', ')}</div>`:''}
          ${warnings.length?`<div style="font-size:11px;color:var(--amber)">⏰ Monitor: ${warnings.join(', ')}</div>`:''}
          ${!alerts.length&&!warnings.length?`<div style="font-size:11px;color:var(--green)">✓ All dimensions on track</div>`:''}
          <div style="margin-top:8px;font-size:11px;color:var(--text-muted)">
            ${p.progress}% complete · ${p.margin}% margin · ${p.daysLeft}d remaining · ${p.ncrs} NCR${p.ncrs!==1?'s':''}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 7 — KPI HEATMAP
═══════════════════════════════════════════════════════════ */
function renderAnaHeatmap() {
  const hm = AnaData.heatmap;
  const cellW = 36, cellH = 32, labelW = 110, headerH = 32;
  const totalW = labelW + hm.weeks.length * (cellW + 2);
  const totalH = headerH + hm.rows.length * (cellH + 2);

  document.getElementById('anaTabContent').innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <span class="card-title">KPI performance heatmap — 12 weeks</span>
        <div style="display:flex;gap:8px;font-size:11px;color:var(--text-muted)">
          ${[['#2dd4a0','On target'],['#a3e8d0','Good'],['#f59e0b','Monitor'],['#f56565','At risk']].map(([c,l])=>`<span style="display:flex;align-items:center;gap:4px"><span style="width:12px;height:12px;border-radius:2px;background:${c};display:inline-block"></span>${l}</span>`).join('')}
        </div>
      </div>
      <div style="overflow-x:auto">
        <div style="display:grid;gap:3px;width:fit-content">
          <!-- Header row: week labels -->
          <div style="display:grid;grid-template-columns:${labelW}px repeat(${hm.weeks.length},${cellW}px);gap:3px">
            <div></div>
            ${hm.weeks.map(w=>`<div style="text-align:center;font-size:10px;color:var(--text-muted);font-family:var(--font-mono);padding:4px 0">${w}</div>`).join('')}
          </div>
          <!-- Data rows -->
          ${hm.rows.map((row, ri) => `
            <div style="display:grid;grid-template-columns:${labelW}px repeat(${hm.weeks.length},${cellW}px);gap:3px;align-items:center">
              <div style="font-size:11px;color:var(--text-primary);font-weight:500;padding-right:8px;white-space:nowrap">${row.name}</div>
              ${row.values.map((v, wi) => {
                const col = hm.colourFn[ri](v);
                const textCol = col==='#2dd4a0'||col==='#a3e8d0' ? '#0d1a12' : '#fff';
                return `<div class="heatmap-cell" style="width:${cellW}px;height:${cellH}px;background:${col};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:${textCol}" title="${row.name} W${wi+1}: ${v}">${v}</div>`;
              }).join('')}
            </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- Weekly summary -->
    <div class="card">
      <div class="card-header"><span class="card-title">Latest week summary (W12)</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px">
        ${hm.rows.map((row,ri) => {
          const latest = row.values.at(-1);
          const prev   = row.values.at(-2);
          const delta  = latest - prev;
          const col    = hm.colourFn[ri](latest);
          return `
          <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 12px">
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px">${row.name}</div>
            <div style="font-family:var(--font-display);font-size:20px;font-weight:700;color:${col}">${latest}</div>
            <div style="font-size:11px;color:${delta>=0?'var(--green)':'var(--red)'};margin-top:2px">${delta>=0?'↑':'↓'} ${Math.abs(delta)} vs prev week</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 8 — REPORT BUILDER
═══════════════════════════════════════════════════════════ */
function renderAnaReports() {
  const sections = AnaData.reportSections;
  const selected = sections.filter(s=>s.checked);
  const totalPages = selected.reduce((s,r)=>s+r.pages, 0);

  document.getElementById('anaTabContent').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 300px;gap:16px;align-items:start">
      <!-- Section selector -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Report sections</span>
          <span style="font-size:12px;color:var(--text-muted)">${selected.length}/${sections.length} selected</span>
        </div>
        <div id="reportSectionList">
          ${sections.map((sec, i) => `
            <div class="report-section-row" onclick="toggleReportSection(${i})">
              <div class="report-checkbox ${sec.checked?'checked':''}" id="cb-${i}">
                ${sec.checked?`<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`:''}
              </div>
              <div class="report-section-icon">${sec.icon}</div>
              <div style="flex:1">
                <div class="report-section-name">${sec.name}</div>
                <div class="report-section-desc">${sec.desc}</div>
              </div>
              <div class="report-section-pages">${sec.pages}pp</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Export panel -->
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="card">
          <div class="card-header"><span class="card-title">Report summary</span></div>
          ${[
            ['Sections included', selected.length],
            ['Estimated pages',   totalPages],
            ['Period covered',    'Apr 2025'],
            ['Generated by',      'NexaForge ERP'],
          ].map(([l,v])=>`
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:12px">
              <span style="color:var(--text-muted)">${l}</span>
              <span style="font-weight:500;color:var(--text-primary)">${v}</span>
            </div>`).join('')}
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">
            <button class="btn btn-primary" onclick="showToast('Generating ${totalPages}-page PDF report…','success')">
              <svg viewBox="0 0 15 15" fill="none"><path d="M3 12h9M7.5 2v7M4.5 6l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Export PDF (${totalPages} pages)
            </button>
            <button class="btn btn-secondary" onclick="showToast('Report exported to Excel','success')">Export Excel</button>
            <button class="btn btn-ghost btn-sm" onclick="showToast('Report saved as template','info')">Save as template</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Schedule reports</span></div>
          ${[['Weekly KPI digest','Every Monday 08:00'],['Monthly board report','1st of month'],['Project flash report','Ad hoc']].map(([n,t])=>`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border)">
              <div>
                <div style="font-size:12px;font-weight:500;color:var(--text-primary)">${n}</div>
                <div style="font-size:10px;color:var(--text-muted)">${t}</div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="showToast('${n} scheduled','success')">Schedule</button>
            </div>`).join('')}
        </div>

        <!-- Quick presets -->
        <div class="card">
          <div class="card-header"><span class="card-title">Quick presets</span></div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${[
              ['Executive summary only', [0,6]],
              ['Full operations report', [0,1,2,3,4,5,6,7]],
              ['Quality & welding focus', [0,3,4,6,7]],
              ['Finance & project P&L',   [0,1,6]],
            ].map(([name, indices])=>`
              <button class="btn btn-secondary btn-sm" style="justify-content:flex-start;font-size:11px" onclick="applyReportPreset([${indices}]);showToast('Preset applied: ${name}','info')">
                ${name}
              </button>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
}

function toggleReportSection(i) {
  AnaData.reportSections[i].checked = !AnaData.reportSections[i].checked;
  renderAnaReports();
}

function applyReportPreset(indices) {
  AnaData.reportSections.forEach((s,i) => { s.checked = indices.includes(i); });
  renderAnaReports();
}

/* KPI detail modal */
function openKPIDetail(kpiId, roleId) {
  const kpi = AnaData.kpis[roleId]?.find(k=>k.id===kpiId);
  if (!kpi) return;
  const trendKey = { oee:'oee',util:'utilisation',util2:'wcUtil',fpy:'fpy',fpy2:'fpy',
    throughput:'throughput',rework:'rework',ncr:'ncrCount',copq:'copq',copq2:'copq',
    revenue:'revenue',dso:'dso',safety:'safetyEvents' }[kpiId];
  const sparkVals = trendKey ? AnaData.trends[trendKey] : null;
  const vc = {green:'var(--green)',amber:'var(--amber)',red:'var(--red)',blue:'var(--blue)'}[kpi.rag];

  openAnaModal(`
    <div class="ana-modal-inner">
      <div class="ana-modal-header">
        <div>
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px">${kpi.category}</div>
          <div style="font-family:var(--font-display);font-size:16px;font-weight:700">${kpi.name}</div>
        </div>
        <div style="display:flex;gap:8px">
          ${ragDot(kpi.rag)}
          <button class="btn-icon" onclick="closeAnaModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
      </div>
      <div class="ana-modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          ${[
            ['Actual', kpi.actual+(kpi.unit==='%'?'%':' '+kpi.unit), vc],
            ['Target', kpi.target!==null?kpi.target+(kpi.unit==='%'?'%':' '+kpi.unit):'Not set','var(--text-secondary)'],
            ['Variance', kpiVariance(kpi.actual,kpi.target)+(kpi.unit==='%'?'pp':''), kpi.rag==='green'?'var(--green)':'var(--red)'],
          ].map(([l,v,c])=>`
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;text-align:center">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:4px">${l}</div>
              <div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:${c}">${v}</div>
            </div>`).join('')}
        </div>
        ${sparkVals ? `
          <div>
            <div class="section-label" style="margin-bottom:6px">8-month trend</div>
            ${renderLineChart(sparkVals, AnaData.months, vc, kpi.target)}
          </div>` : ''}
        ${kpi.motivational ? `<div style="padding:10px 12px;background:var(--green-bg);border:1px solid rgba(45,212,160,.2);border-radius:var(--radius-sm);font-size:12px;color:var(--green)">⭐ Motivational metric — measures positive culture and behaviour, not failure. Higher is better.</div>` : ''}
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary btn-sm" onclick="closeAnaModal();switchAnaTab('trends')">View trends</button>
          <button class="btn btn-ghost btn-sm" onclick="closeAnaModal()">Close</button>
        </div>
      </div>
    </div>`);
}
