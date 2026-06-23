/* ============================================================
   NexaForge ERP — CRM Tab Renderers (part 2)
   ============================================================ */

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
function crmFmt(n) {
  if (n >= 1000000) return '$' + (n/1000000).toFixed(2) + 'M';
  if (n >= 1000)    return '$' + (n/1000).toFixed(0) + 'K';
  return '$' + n;
}
function crmDaysLeft(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}
function crmDaysClass(days) {
  return days < 14 ? 'urgent' : days < 45 ? 'soon' : 'ok';
}
function stageInfo(stageId) {
  return CRMData.stages.find(s => s.id === stageId) || { label: stageId, dotColor: '#888' };
}
function stageBadge(stageId) {
  const s = stageInfo(stageId);
  const cls = {
    won:'badge-green', lost:'badge-red', negotiation:'badge-green',
    quoted:'badge-accent', tender:'badge-amber',
    qualified:'badge-blue', prospect:'badge-muted',
  }[stageId] || 'badge-muted';
  return `<span class="badge ${cls}" style="font-size:10px">${s.label}</span>`;
}

/* Account health 0–100 from rating, lifetime revenue and open engagement.
   Returns {score, label, color}. */
function crmAccountHealth(client) {
  const ratingScore = (client.rating || 0) / 5 * 40;                 // 0–40
  const revScore    = Math.min((client.totalRevenue || 0) / 680000, 1) * 35; // 0–35
  const engageScore = Math.min(((client.projects || 0) + (client.openOpps || 0)) / 4, 1) * 25; // 0–25
  const score = Math.round(ratingScore + revScore + engageScore);
  const label = score >= 70 ? 'Strong' : score >= 45 ? 'Stable' : 'At risk';
  const color = score >= 70 ? 'var(--green)' : score >= 45 ? 'var(--amber)' : 'var(--red)';
  return { score, label, color };
}

/* Unified next-action items pulled from contacts, tenders, opps, approvals.
   Returns array sorted by urgency (most overdue first). */
function crmCollectActions() {
  const items = [];
  const today = new Date();

  (typeof MktContactsData !== 'undefined' ? MktContactsData.contacts : []).forEach(c => {
    const days = Math.ceil((new Date(c.followUpDue) - today) / 86400000);
    items.push({ kind:'Follow-up', icon:'📞', days, ref:c.company,
      text:`${c.followUpNote} — ${c.name}`, action:() => `showToast('Logging follow-up with ${c.name}','info')` });
  });

  CRMData.tenders.filter(t => t.stage !== 'submitted').forEach(t => {
    const days = crmDaysLeft(t.due);
    items.push({ kind:'Bid due', icon:'📋', days, ref:t.id,
      text:`${t.name} — ${t.completion}% ready`, action:() => `openTenderDetail('${t.id}')` });
  });

  CRMData.opportunities.filter(o => !['won','lost'].includes(o.stage)).forEach(o => {
    const stale = Math.ceil((today - new Date(o.lastActivity)) / 86400000);
    if (stale > 14) items.push({ kind:'Stale opp', icon:'⏳', days: -stale, ref:o.id,
      text:`${o.name} — no activity ${stale}d`, action:() => `openOppDetail('${o.id}')` });
  });

  (CRMData.quoteApprovals || []).filter(q => q.status === 'pending').forEach(q => {
    items.push({ kind:'Approval', icon:'✅', days: 0, ref:q.id,
      text:`${q.quote} (${q.rev}) — ${q.margin}% margin`, action:() => `renderMktSubPage('approvals')` });
  });

  return items.sort((a, b) => a.days - b.days);
}

/* ═══════════════════════════════════════════════════════════
   TAB 1 — OVERVIEW
═══════════════════════════════════════════════════════════ */
function renderCRMOverview() {
  const opps       = CRMData.opportunities;
  const active     = opps.filter(o => !['won','lost'].includes(o.stage));
  const won        = opps.filter(o => o.stage === 'won');
  const pipeline   = active.reduce((s,o) => s + o.value * o.prob / 100, 0);
  const totalWon   = won.reduce((s,o) => s + o.value, 0);
  const winRate    = opps.filter(o => ['won','lost'].includes(o.stage)).length
    ? Math.round(won.length / opps.filter(o => ['won','lost'].includes(o.stage)).length * 100) : 0;

  /* ── Alert sources ── */
  const tendersDue   = CRMData.tenders.filter(t => t.stage !== 'submitted' && crmDaysLeft(t.due) < 30);
  const prequalExp   = (typeof MktPrequalData !== 'undefined' ? MktPrequalData.registrations : [])
    .filter(r => r.status === 'expiring' || r.status === 'expired');
  const actions      = crmCollectActions();
  const overdueFU    = actions.filter(a => a.kind === 'Follow-up' && a.days < 0);
  const pendingAppr  = (CRMData.quoteApprovals || []).filter(q => q.status === 'pending');

  /* ── Action ticker ── */
  const ticker = [];
  tendersDue.forEach(t => ticker.push({ cls: crmDaysLeft(t.due) < 14 ? 'error' : 'warn', text:`${t.id} bid due in ${crmDaysLeft(t.due)}d` }));
  prequalExp.forEach(r => ticker.push({ cls: r.status === 'expired' ? 'error' : 'warn', text:`${r.authority} pre-qual ${r.status === 'expired' ? 'expired' : 'expiring'}` }));
  if (overdueFU.length)   ticker.push({ cls:'error', text:`${overdueFU.length} follow-up${overdueFU.length>1?'s':''} overdue` });
  if (pendingAppr.length) ticker.push({ cls:'warn',  text:`${pendingAppr.length} quote${pendingAppr.length>1?'s':''} awaiting approval` });

  document.getElementById('crmTabContent').innerHTML = `
    <!-- Action ticker -->
    <div class="cc-ticker" style="margin-bottom:20px">
      ${ticker.length
        ? ticker.map(t => `<div class="cc-ticker-item ${t.cls}"><span class="cc-ticker-dot"></span>${t.text}</div>`).join('')
        : `<div class="cc-ticker-item"><span class="cc-ticker-dot" style="background:var(--green)"></span>No urgent CRM actions — pipeline healthy</div>`}
    </div>

    <!-- KPI bar -->
    <div class="prod-kpi-grid stagger-in" style="grid-template-columns:repeat(6,1fr);margin-bottom:24px">
      ${[
        { label:'Weighted pipeline', value:crmFmt(pipeline),    sub:`${active.length} active opps`,        color:'var(--blue)' },
        { label:'Won YTD',           value:crmFmt(totalWon),    sub:`${won.length} orders booked`,          color:'var(--green)' },
        { label:'Win rate',          value:winRate+'%',         sub:'won vs decided',                       color:winRate>50?'var(--green)':'var(--amber)' },
        { label:'Bids due <30d',     value:tendersDue.length,   sub: tendersDue.length?'needs attention':'all clear', color:tendersDue.length?'var(--amber)':'var(--text-muted)' },
        { label:'Pending approvals', value:pendingAppr.length,  sub: pendingAppr.length?'awaiting sign-off':'clear',  color:pendingAppr.length?'var(--amber)':'var(--text-muted)' },
        { label:'Pre-qual alerts',   value:prequalExp.length,   sub: prequalExp.length?'renew soon':'compliant',      color:prequalExp.length?'var(--red)':'var(--text-muted)' },
      ].map(k=>`
        <div class="prod-kpi-card">
          <div class="prod-kpi-label">${k.label}</div>
          <div class="prod-kpi-value" style="color:${k.color}">${k.value}</div>
          <div class="prod-kpi-sub">${k.sub}</div>
        </div>`).join('')}
    </div>

    <!-- Command grid -->
    <div class="cc-grid stagger-in">

      <!-- Col 1: hot opps + activity feed -->
      <div class="cc-col-main">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Hot opportunities</span>
            <button class="btn btn-ghost btn-sm" onclick="renderMktSubPage('pipeline')">Pipeline →</button>
          </div>
          ${active.sort((a,b)=>b.value*b.prob/100 - a.value*a.prob/100).slice(0,5).map(opp => {
            const days = crmDaysLeft(opp.closeDate);
            return `
            <div style="display:flex;align-items:center;gap:12px;padding:11px 16px;border-bottom:1px solid var(--border);cursor:pointer" onclick="openOppDetail('${opp.id}')" onmouseenter="this.style.background='var(--bg-hover)'" onmouseleave="this.style.background=''">
              <div style="width:36px;height:36px;border-radius:var(--radius-sm);background:${opp.color}22;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span style="font-size:13px;font-weight:700;color:${opp.color};font-family:var(--font-display)">${opp.prob}%</span>
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-size:12px;font-weight:500;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${opp.name}</div>
                <div style="font-size:11px;color:var(--text-muted)">${opp.client}</div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:13px;font-weight:500;font-family:var(--font-mono)">${crmFmt(opp.value)}</div>
                <span class="opp-days ${crmDaysClass(days)}" style="font-size:10px">${days}d</span>
              </div>
              ${stageBadge(opp.stage)}
            </div>`;
          }).join('')}
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">CRM activity feed</span>
            <button class="btn btn-ghost btn-sm" onclick="renderMktSubPage('activity')">All →</button>
          </div>
          <div style="max-height:260px;overflow-y:auto">
            ${CRMData.activities.slice(0,6).map(a=>`
              <div class="cc-feed-entry">
                <span style="font-size:13px">${a.icon}</span>
                <div class="cc-feed-text">${a.text}</div>
                <span class="cc-feed-time">${a.time}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Col 2: bid deadlines + next actions -->
      <div class="cc-col-mid">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Bid deadlines</span>
            <button class="btn btn-ghost btn-sm" onclick="renderMktSubPage('calendar')">Calendar →</button>
          </div>
          ${CRMData.tenders.filter(t=>t.stage!=='submitted').sort((a,b)=>crmDaysLeft(a.due)-crmDaysLeft(b.due)).map(t => {
            const days = crmDaysLeft(t.due);
            const col  = days < 14 ? 'var(--red)' : days < 30 ? 'var(--amber)' : 'var(--text-muted)';
            return `
            <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border);cursor:pointer" onclick="openTenderDetail('${t.id}')">
              <div style="text-align:center;min-width:42px">
                <div style="font-family:var(--font-display);font-size:16px;font-weight:700;color:${col}">${days}</div>
                <div style="font-size:9px;color:var(--text-muted)">days</div>
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-size:12px;font-weight:500;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name}</div>
                <div style="font-size:10px;color:var(--text-muted)">${t.id} · ${t.client} · ${t.completion}% ready</div>
              </div>
              <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary)">${crmFmt(t.value)}</span>
            </div>`;
          }).join('') || `<div style="padding:18px 16px;font-size:12px;color:var(--text-muted)">No open bids</div>`}
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">Next actions</span>
            <button class="btn btn-ghost btn-sm" onclick="renderMktSubPage('actions')">Queue →</button>
          </div>
          ${actions.slice(0,6).map(a => {
            const overdue = a.days < 0;
            const col = overdue ? 'var(--red)' : a.days < 7 ? 'var(--amber)' : 'var(--text-muted)';
            const lbl = a.kind === 'Stale opp' ? `${Math.abs(a.days)}d idle` : a.kind === 'Approval' ? 'now' : overdue ? `${Math.abs(a.days)}d late` : `${a.days}d`;
            return `
            <div style="display:flex;align-items:center;gap:10px;padding:9px 16px;border-bottom:1px solid var(--border);cursor:pointer" onclick="${a.action()}">
              <span style="font-size:13px">${a.icon}</span>
              <div style="flex:1;min-width:0">
                <div style="font-size:11px;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.text}</div>
                <div style="font-size:9px;color:var(--text-muted)">${a.kind} · ${a.ref}</div>
              </div>
              <span style="font-size:10px;font-weight:600;color:${col};white-space:nowrap">${lbl}</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Col 3: won revenue + top accounts -->
      <div class="cc-col-side">
        <div class="card">
          <div class="card-header"><span class="card-title">Won revenue — YTD</span></div>
          ${[
            { month:'Jan', v:0 }, { month:'Feb', v:0 }, { month:'Mar', v:142000 },
            { month:'Apr', v:381500 }, { month:'May', v:0, proj:true }, { month:'Jun', v:0, proj:true },
          ].map(m => {
            const pct = Math.round((m.v / 600000) * 100);
            return `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;font-size:11px">
              <span style="min-width:26px;color:var(--text-muted)">${m.month}</span>
              <div class="progress-bar" style="flex:1;height:16px;border-radius:4px">
                <div style="height:100%;width:${pct}%;background:${m.proj?'var(--border-md)':'var(--brand)'};border-radius:4px;transition:width .5s;opacity:${m.proj?0.4:1}"></div>
              </div>
              <span style="min-width:42px;text-align:right;font-family:var(--font-mono);color:${m.v?'var(--text-primary)':'var(--text-muted)'}">${m.v?crmFmt(m.v):'—'}</span>
            </div>`;
          }).join('')}
          <div style="margin-top:6px;padding-top:8px;border-top:1px solid var(--border);display:flex;justify-content:space-between;font-size:12px">
            <span style="color:var(--text-muted)">YTD total</span>
            <span style="font-family:var(--font-display);font-size:15px;font-weight:700;color:var(--green)">${crmFmt(523500)}</span>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Top accounts</span></div>
          ${CRMData.clients.slice().sort((a,b)=>b.totalRevenue-a.totalRevenue).slice(0,5).map(c => {
            const h = crmAccountHealth(c);
            return `
            <div style="display:flex;align-items:center;gap:10px;padding:9px 16px;border-bottom:1px solid var(--border);cursor:pointer" onclick="openClientDetail('${c.id}')">
              <div style="width:30px;height:30px;border-radius:var(--radius-sm);background:${c.avatarBg}22;color:${c.avatarColor};border:1px solid ${c.avatarBg}44;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;font-family:var(--font-display);flex-shrink:0">${c.initials}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:12px;font-weight:500;color:var(--text-primary)">${c.name}</div>
                <div style="font-size:10px;color:var(--text-muted)">${c.totalRevenue?crmFmt(c.totalRevenue):'No revenue yet'}</div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:12px;font-weight:700;color:${h.color}">${h.score}</div>
                <div style="font-size:9px;color:${h.color}">${h.label}</div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- Win / Loss Analysis ── quick-win view ── -->
    <div style="margin-top:20px">
      <div class="card-header" style="margin-bottom:12px">
        <span class="card-title">Win / loss analysis</span>
        <span style="font-size:12px;color:var(--text-muted)">Closed deals · hit rate by client type · lost-reason breakdown</span>
      </div>
      ${(() => {
        const decided = opps.filter(o => ['won','lost'].includes(o.stage));
        const wonList  = decided.filter(o => o.stage === 'won');
        const lostList = decided.filter(o => o.stage === 'lost');
        const byClient = {};
        decided.forEach(o => {
          const k = o.client || 'Unknown';
          if (!byClient[k]) byClient[k] = { won: 0, lost: 0, value: 0 };
          if (o.stage === 'won') { byClient[k].won++; byClient[k].value += o.value || 0; }
          else byClient[k].lost++;
        });
        const lostReasons = {};
        lostList.forEach(o => {
          const r = o.lostReason || 'Not stated';
          lostReasons[r] = (lostReasons[r] || 0) + 1;
        });
        const maxLost = Math.max(...Object.values(lostReasons), 1);
        if (!decided.length) return `<div style="padding:24px;text-align:center;color:var(--text-muted)">No closed deals yet — win/loss data will appear as deals reach Won or Lost status.</div>`;
        return `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="card" style="padding:16px">
            <div style="font-size:12px;font-weight:600;margin-bottom:12px">Hit rate by account</div>
            ${Object.entries(byClient).sort((a,b) => (b[1].won+b[1].lost)-(a[1].won+a[1].lost)).slice(0,6).map(([name, d]) => {
              const total = d.won + d.lost;
              const rate  = total ? Math.round(d.won / total * 100) : 0;
              return `
              <div style="margin-bottom:10px">
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
                  <span style="font-weight:500">${name}</span>
                  <span style="color:${rate>=50?'var(--green)':'var(--amber)'};font-weight:600">${rate}% (${d.won}/${total})</span>
                </div>
                <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">
                  <div style="height:100%;width:${rate}%;background:${rate>=50?'var(--green)':'var(--amber)'};border-radius:3px;transition:width .5s"></div>
                </div>
              </div>`;
            }).join('')}
          </div>
          <div class="card" style="padding:16px">
            <div style="font-size:12px;font-weight:600;margin-bottom:12px">Lost-reason Pareto (${lostList.length} deals lost)</div>
            ${Object.entries(lostReasons).sort((a,b)=>b[1]-a[1]).map(([reason, count]) => `
              <div style="margin-bottom:8px">
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
                  <span>${reason}</span><span style="font-weight:600">${count}</span>
                </div>
                <div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden">
                  <div style="height:100%;width:${Math.round(count/maxLost*100)}%;background:var(--red);border-radius:3px"></div>
                </div>
              </div>`).join('') || `<div style="font-size:12px;color:var(--text-muted)">No lost-reason data recorded.</div>`}
            <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);font-size:12px;color:var(--text-muted)">
              Overall win rate: <strong style="color:${winRate>=50?'var(--green)':'var(--amber)'}">${winRate}%</strong> ·
              Avg won value: <strong>${wonList.length ? crmFmt(Math.round(wonList.reduce((s,o)=>s+o.value,0)/wonList.length)) : '—'}</strong>
            </div>
          </div>
        </div>`;
      })()}
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 2 — PIPELINE KANBAN
═══════════════════════════════════════════════════════════ */
function renderCRMPipeline() {
  const stages = CRMData.stages;

  document.getElementById('crmTabContent').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px">
      <div style="font-size:12px;color:var(--text-muted)">
        ${CRMData.opportunities.filter(o=>!['won','lost'].includes(o.stage)).length} active opportunities ·
        Weighted pipeline: <strong style="color:var(--text-primary)">${crmFmt(CRMData.opportunities.filter(o=>!['won','lost'].includes(o.stage)).reduce((s,o)=>s+o.value*o.prob/100,0))}</strong>
      </div>
      <button class="btn btn-primary btn-sm" onclick="openNewOppModal()">
        <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Add opportunity
      </button>
    </div>
    <div class="pipeline-board">
      ${stages.map(stage => {
        const opps = CRMData.opportunities.filter(o => o.stage === stage.id);
        const total = opps.reduce((s,o) => s+o.value, 0);
        return `
        <div class="pipeline-col">
          <div class="pipeline-col-header">
            <div>
              <div class="pipeline-col-label">
                <span class="pipeline-col-dot" style="background:${stage.dotColor}"></span>
                ${stage.label}
              </div>
              <div class="pipeline-col-value">${total ? crmFmt(total) : 'No value'}</div>
            </div>
            <span class="pipeline-col-count">${opps.length}</span>
          </div>
          <div class="pipeline-col-body">
            ${opps.map(opp => {
              const days = crmDaysLeft(opp.closeDate);
              const dc   = crmDaysClass(days);
              return `
              <div class="opp-card" style="--opp-color:${opp.color}" onclick="openOppDetail('${opp.id}')">
                <div class="opp-name">${opp.name}</div>
                <div class="opp-client">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="3.5" r="2" stroke="currentColor" stroke-width="1"/><path d="M1 9c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
                  ${opp.client}
                </div>
                <div class="opp-value">${crmFmt(opp.value)}</div>
                <div class="opp-prob-bar"><div class="opp-prob-fill" style="width:${opp.prob}%;background:${stage.dotColor}"></div></div>
                <div class="opp-meta">
                  <span class="opp-prob">${opp.prob}% probability</span>
                  <span class="opp-days ${dc}">${stage.id==='won'||stage.id==='lost' ? stage.label : days+'d'}</span>
                </div>
                ${opp.tags.slice(0,2).map(t=>`<span class="badge badge-muted" style="font-size:9px;margin-top:4px;margin-right:3px">${t}</span>`).join('')}
              </div>`;
            }).join('')}
            ${opps.length === 0 ? `<div style="padding:20px;text-align:center;font-size:11px;color:var(--text-muted)">No opportunities</div>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 3 — TENDER TRACKER
═══════════════════════════════════════════════════════════ */
function renderCRMTenders() {
  const stageInfo = { drafting:'In progress', review:'Under review', submitted:'Submitted' };
  const stageCls  = { drafting:'badge-amber', review:'badge-blue', submitted:'badge-green' };

  const role = AppState.currentUser?.role || 'manager';
  const isCoordinator = role === 'user';

  document.getElementById('crmTabContent').innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'Active tenders',  value:CRMData.tenders.length, color:'var(--text-primary)' },
        { label:'Due this month',  value:CRMData.tenders.filter(t=>crmDaysLeft(t.due)<30&&t.stage!=='submitted').length, color:'var(--amber)' },
        { label:'Total value',     value:crmFmt(CRMData.tenders.reduce((s,t)=>s+t.value,0)), color:'var(--blue)' },
        { label:'Submitted',       value:CRMData.tenders.filter(t=>t.stage==='submitted').length, color:'var(--green)' },
      ].map(k=>`<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:24px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Active tenders & RFQs</span>
        ${!isCoordinator ? `
        <button class="btn btn-primary btn-sm" onclick="openNewTenderModal()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Log tender
        </button>
        ` : ''}
      </div>
      ${CRMData.tenders.map(t => {
        const days = crmDaysLeft(t.due);
        const urgColor = days < 14 ? 'var(--red)' : days < 30 ? 'var(--amber)' : 'var(--text-muted)';
        return `
        <div class="tender-row" onclick="openTenderDetail('${t.id}')">
          <div class="tender-stage" style="background:${t.stage==='submitted'?'var(--green-bg)':t.stage==='review'?'var(--blue-bg)':'var(--amber-bg)'};color:${t.stage==='submitted'?'var(--green)':t.stage==='review'?'var(--blue)':'var(--amber)'}">
            ${t.completion}%
          </div>
          <div class="tender-body">
            <div class="tender-name">${t.name}</div>
            <div class="tender-ref">${t.id} · ${t.client}</div>
            <div class="tender-meta">
              <span>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" stroke-width="1"/><path d="M5.5 3v3l1.5 1" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
                Issued: ${t.issued}
              </span>
              <span style="color:${urgColor};font-weight:500">Due: ${t.due} (${days}d)</span>
              <span>Owner: ${t.owner}</span>
            </div>
            <!-- Checklist progress -->
            <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
              ${t.items.map((item,i)=>`
                <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:${t.completedItems[i]?'var(--green)':'var(--text-muted)'}">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    ${t.completedItems[i]
                      ? `<circle cx="6" cy="6" r="5" fill="var(--green-bg)" stroke="var(--green)" stroke-width="1"/><path d="M3.5 6l2 2 3-3" stroke="var(--green)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`
                      : `<circle cx="6" cy="6" r="5" stroke="var(--border-md)" stroke-width="1"/>`}
                  </svg>
                  ${item}
                </div>`).join('')}
            </div>
            <!-- Progress bar -->
            <div class="progress-bar" style="margin-top:8px;height:4px">
              <div class="progress-fill" style="width:${t.completion}%;background:${t.stage==='submitted'?'var(--green)':t.completion>70?'var(--brand)':'var(--amber)'}"></div>
            </div>
          </div>
          <div class="tender-right">
            <div style="font-family:var(--font-mono);font-size:13px;font-weight:500">${crmFmt(t.value)}</div>
            <span class="badge ${stageCls[t.stage]||'badge-muted'}" style="font-size:10px">${stageInfo[t.stage]||t.stage}</span>
            ${t.stage !== 'submitted' && !isCoordinator ? `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();showToast('Opening quote builder for ${t.id}','info');switchCRMTab('quote')">Build quote</button>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 4 — QUOTE BUILDER
═══════════════════════════════════════════════════════════ */
function renderCRMQuote() {
  const lines = CRMData.quoteLines;

  const role = AppState.currentUser?.role || 'manager';
  const isCoordinator = role === 'user';

  function calcLine(l) {
    const cost  = l.qty * l.unitCost;
    const sell  = cost * (1 + l.markup/100);
    return { cost, sell, margin: sell - cost };
  }
  const totals = lines.reduce((acc,l) => {
    const c = calcLine(l);
    return { cost: acc.cost+c.cost, sell: acc.sell+c.sell, margin: acc.margin+c.margin };
  }, { cost:0, sell:0, margin:0 });
  const marginPct = Math.round((totals.margin/totals.sell)*100);

  document.getElementById('crmTabContent').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 280px;gap:16px;align-items:start">
      <!-- Quote lines -->
      <div class="card">
        <div class="card-header">
          <div style="display:flex;align-items:center;gap:12px">
            <span class="card-title">Quote builder</span>
            <div style="display:flex;gap:8px">
              <select ${isCoordinator ? 'disabled' : ''} style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-sm);padding:4px 10px;font-size:12px;color:var(--text-primary);outline:none;font-family:var(--font-body)">
                ${CRMData.opportunities.filter(o=>!['won','lost'].includes(o.stage)).map(o=>`<option value="${o.id}">${o.id} — ${o.name.slice(0,30)}</option>`).join('')}
              </select>
              <select ${isCoordinator ? 'disabled' : ''} style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--radius-sm);padding:4px 10px;font-size:12px;color:var(--text-primary);outline:none;font-family:var(--font-body)">
                <option>Rev A</option><option>Rev B</option><option>Rev C</option>
              </select>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            ${!isCoordinator ? `<button class="btn btn-secondary btn-sm" onclick="showToast('Line added','success');renderCRMQuote()">+ Add line</button>` : ''}
            <button class="btn btn-primary btn-sm" onclick="showToast('Quote PDF generated','success')">Generate PDF</button>
          </div>
        </div>

        <!-- Line item header -->
        <div class="quote-line quote-line-header">
          <span>Description</span>
          <span>Qty</span>
          <span>Unit cost (USD)</span>
          <span>Markup %</span>
          <span></span>
        </div>

        <!-- Line items -->
        <div id="quoteLines">
          ${lines.map((l,i) => {
            const c = calcLine(l);
            return `
            <div class="quote-line" id="qline-${i}">
              <input class="quote-input" value="${l.desc}" ${isCoordinator ? 'disabled' : ''} onchange="CRMData.quoteLines[${i}].desc=this.value"/>
              <input class="quote-input mono" type="number" value="${l.qty}" ${isCoordinator ? 'disabled' : ''} onchange="CRMData.quoteLines[${i}].qty=+this.value;renderCRMQuote()"/>
              <input class="quote-input mono" type="number" value="${l.unitCost}" ${isCoordinator ? 'disabled' : ''} onchange="CRMData.quoteLines[${i}].unitCost=+this.value;renderCRMQuote()"/>
              <div style="display:flex;align-items:center;gap:5px">
                <input class="quote-input mono" type="number" value="${l.markup}" ${isCoordinator ? 'disabled' : ''} onchange="CRMData.quoteLines[${i}].markup=+this.value;renderCRMQuote()" style="width:52px"/>
                <span style="font-size:11px;color:${l.markup>30?'var(--green)':'var(--amber)'};font-weight:600">%</span>
              </div>
              ${!isCoordinator ? `
              <button class="btn-icon" title="Remove" onclick="CRMData.quoteLines.splice(${i},1);renderCRMQuote()">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
              </button>` : '<span></span>'}
            </div>`;
          }).join('')}
        </div>

        <!-- Totals -->
        <div class="quote-total-row">
          <span class="quote-total-label">Total cost:</span>
          <span style="font-family:var(--font-mono);font-size:14px;color:var(--text-secondary)">${crmFmt(totals.cost)}</span>
          <span class="quote-total-label">Sell price:</span>
          <span class="quote-total-value">${crmFmt(totals.sell)}</span>
          <span class="quote-margin-badge" style="background:${marginPct>20?'var(--green-bg)':'var(--amber-bg)'};color:${marginPct>20?'var(--green)':'var(--amber)'}">
            ${marginPct}% margin
          </span>
        </div>
      </div>

      <!-- Right panel: quote summary + actions -->
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="card">
          <div class="card-header"><span class="card-title">Summary</span></div>
          ${[
            ['Total cost',   crmFmt(totals.cost),   'var(--text-secondary)'],
            ['Total sell',   crmFmt(totals.sell),   'var(--brand)'],
            ['Gross margin', crmFmt(totals.margin), 'var(--green)'],
            ['Margin %',     marginPct+'%',          marginPct>20?'var(--green)':'var(--amber)'],
            ['Lines',        lines.length,           'var(--text-secondary)'],
          ].map(([l,v,c])=>`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
              <span style="font-size:12px;color:var(--text-secondary)">${l}</span>
              <span style="font-size:13px;font-weight:500;color:${c};font-family:var(--font-mono)">${v}</span>
            </div>`).join('')}
          ${marginPct < (CRMData.marginThreshold || 20)
            ? `<div style="margin-top:10px;padding:9px 12px;background:var(--amber-bg);border-radius:var(--radius-sm);font-size:11px;color:var(--amber)">⚠ Margin ${marginPct}% is below the ${CRMData.marginThreshold||20}% floor — GM approval required before sending.</div>`
            : ''}
          <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
            ${isCoordinator ? `
              <span style="font-size:12px;color:var(--text-muted);text-align:center;padding:6px 0">View only mode</span>
            ` : `
              ${marginPct < (CRMData.marginThreshold || 20)
                ? `<button class="btn btn-primary" onclick="switchCRMTab('approvals');showToast('Quote routed to GM for approval','info')">Submit for approval</button>`
                : `<button class="btn btn-primary" onclick="showToast('Quote submitted to client','success')">Submit to client</button>`}
              <button class="btn btn-secondary" onclick="switchCRMTab('pipeline');showToast('Quote saved as Rev A','info')">Save draft</button>
            `}
            <button class="btn btn-ghost btn-sm" onclick="showToast('Price index updated from live market data','info')">
              <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Refresh material index
            </button>
          </div>
        </div>
        <!-- Raw material price index -->
        <div class="card">
          <div class="card-header"><span class="card-title">Material index</span></div>
          ${[
            { mat:'316L SS plate', price:'$3.82/kg',  trend:'↑', tc:'var(--red)' },
            { mat:'304 SS plate',  price:'$2.94/kg',  trend:'→', tc:'var(--text-muted)' },
            { mat:'CS A36',        price:'$0.82/kg',  trend:'↓', tc:'var(--green)' },
            { mat:'ER316L wire',   price:'$18.40/kg', trend:'↑', tc:'var(--red)' },
          ].map(r=>`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px">
              <span style="color:var(--text-secondary)">${r.mat}</span>
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-family:var(--font-mono);color:var(--text-primary)">${r.price}</span>
                <span style="color:${r.tc};font-weight:700">${r.trend}</span>
              </div>
            </div>`).join('')}
          <div style="font-size:10px;color:var(--text-muted);margin-top:8px">Last updated: today 08:00 UTC</div>
        </div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 5 — BOQ INGESTION
═══════════════════════════════════════════════════════════ */
function renderCRMBOQ() {
  const role = AppState.currentUser?.role || 'manager';
  const isCoordinator = role === 'user';

  document.getElementById('crmTabContent').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <!-- Upload zone -->
      <div>
        <div class="boq-zone" ${!isCoordinator ? 'onclick="showToast(\'CAD/BOQ file parsed — 7 line items extracted\',\'success\')"' : 'style="cursor:not-allowed"'}>
          <div class="boq-zone-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v10M8 9l4-4 4 4" stroke="var(--brand)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M5 16v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="var(--brand)" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <div style="font-size:14px;font-weight:500;color:var(--text-primary);margin-bottom:6px">Drop CAD files or BOQ documents</div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px">Supports: .DWG, .STEP, .IGES, .PDF, .XLSX, .CSV</div>
          ${!isCoordinator ? `
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();showToast('BOQ parsing engine started…','info')">
            Browse files
          </button>
          ` : ''}
        </div>

        <div class="card" style="margin-top:14px">
          <div class="card-header"><span class="card-title">CAD extraction settings</span></div>
          ${[
            ['Project', 'select', ['P-2401 — 316L Storage Tank','OPP-006 — Floating Roof Tank']],
            ['Material grade default', 'select', ['316L SS','304 SS','Duplex 2205','CS A36']],
            ['BOQ standard', 'select', ['API 650','API 620','ASME VIII Div.1','EN 13445']],
            ['Auto-assign to quote', 'checkbox', null],
          ].map(([label, type, opts]) => `
            <div style="margin-bottom:12px">
              <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;display:block;margin-bottom:5px">${label}</label>
              ${type==='select'
                ? `<select ${isCoordinator ? 'disabled' : ''} style="width:100%;background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:7px 10px;font-size:12px;color:var(--text-primary);outline:none;font-family:var(--font-body)">${opts.map(o=>`<option>${o}</option>`).join('')}</select>`
                : `<div style="display:flex;align-items:center;gap:8px"><input type="checkbox" checked ${isCoordinator ? 'disabled' : ''} style="accent-color:var(--brand)"/><span style="font-size:12px;color:var(--text-secondary)">Automatically push extracted items to quote builder</span></div>`
              }
            </div>`).join('')}
        </div>
      </div>

      <!-- Extracted BOQ lines -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Extracted BOQ — OPP-006</span>
          <div style="display:flex;gap:8px">
            <span class="badge badge-green" style="font-size:10px">7 items</span>
            ${!isCoordinator ? `<button class="btn btn-secondary btn-sm" onclick="showToast('BOQ pushed to quote builder','success');switchCRMTab('quote')">Push to quote</button>` : ''}
          </div>
        </div>
        <table class="boq-line-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Material</th>
            </tr>
          </thead>
          <tbody>
            ${CRMData.boqLines.map(l=>`
              <tr onclick="showToast('Editing ${l.ref}','info')">
                <td style="font-family:var(--font-mono);color:var(--brand)">${l.ref}</td>
                <td>${l.desc}</td>
                <td style="font-family:var(--font-mono)">${l.qty}</td>
                <td style="color:var(--text-muted)">${l.unit}</td>
                <td><span class="badge badge-muted" style="font-size:10px">${l.material}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div style="padding:12px 0 0;display:flex;gap:8px">
          ${!isCoordinator ? `<button class="btn btn-secondary btn-sm" onclick="showToast('Creating project entity from BOQ…','info');navigate('projects')">Create project entity</button>` : ''}
          <button class="btn btn-ghost btn-sm" onclick="showToast('BOQ exported','success')">Export BOQ</button>
        </div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 6 — CLIENT DATABASE
═══════════════════════════════════════════════════════════ */
function renderCRMClients() {
  const role = AppState.currentUser?.role || 'manager';
  const isCoordinator = role === 'user';

  document.getElementById('crmTabContent').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div style="font-size:12px;color:var(--text-muted)">${CRMData.clients.length} clients · ${CRMData.clients.reduce((s,c)=>s+c.totalRevenue,0)>0?crmFmt(CRMData.clients.reduce((s,c)=>s+c.totalRevenue,0)):''} total lifetime revenue</div>
      ${!isCoordinator ? `
      <button class="btn btn-primary btn-sm" onclick="openNewClientModal()">
        <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Add client
      </button>
      ` : ''}
    </div>
    <div class="client-grid">
      ${CRMData.clients.map(c => {
        const stars = c.rating;
        return `
        <div class="client-card" onclick="openClientDetail('${c.id}')">
          <div class="client-header">
            <div class="client-avatar" style="background:${c.avatarBg}22;color:${c.avatarColor};border:1px solid ${c.avatarBg}44">${c.initials}</div>
            <div>
              <div class="client-name">${c.name}</div>
              <div class="client-sector">${c.sector} · ${c.region}</div>
            </div>
          </div>
          <div class="client-stats">
            <div class="client-stat">
              <div class="client-stat-val">${c.projects}</div>
              <div class="client-stat-lbl">Projects</div>
            </div>
            <div class="client-stat">
              <div class="client-stat-val">${c.openOpps}</div>
              <div class="client-stat-lbl">Open opps</div>
            </div>
            <div class="client-stat">
              <div class="client-stat-val" style="font-size:12px">${c.totalRevenue?crmFmt(c.totalRevenue):'—'}</div>
              <div class="client-stat-lbl">Revenue</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="display:flex;gap:1px">
              ${Array.from({length:5},(_,i)=>`<span style="font-size:13px;color:${i<stars?'var(--amber)':'var(--border-strong)'}">★</span>`).join('')}
            </div>
            <span style="font-size:10px;color:var(--text-muted)">Client since ${c.sinceYear}</span>
          </div>
          <div class="client-tags">
            ${c.tags.map(t=>`<span class="client-tag">${t}</span>`).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 7 — ACTIVITY TIMELINE
═══════════════════════════════════════════════════════════ */
function renderCRMActivity() {
  const iconMap = { won:'🏆', call:'📞', quote:'📄', note:'📝', new:'✨', tender:'📋', lost:'❌', email:'📧', meeting:'🤝' };

  const role = AppState.currentUser?.role || 'manager';
  const isCoordinator = role === 'user';

  document.getElementById('crmTabContent').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start">
      <div class="card">
        <div class="card-header">
          <span class="card-title">CRM activity log</span>
          ${!isCoordinator ? `
          <button class="btn btn-primary btn-sm" onclick="openLogActivityModal()">
            <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Log activity
          </button>
          ` : ''}
        </div>
        <div class="crm-activity">
          ${CRMData.activities.map(a=>`
            <div class="crm-act-item">
              <div class="crm-act-icon" style="border-color:${a.color}44;background:${a.color}11">
                <span style="font-size:13px">${iconMap[a.type]||'📌'}</span>
              </div>
              <div class="crm-act-body">
                <div class="crm-act-text">${a.text}</div>
                <div class="crm-act-time">${a.time}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Log activity form -->
      ${!isCoordinator ? `
      <div class="card">
        <div class="card-header"><span class="card-title">Quick log</span></div>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${[
            ['Activity type','select',['Call','Meeting','Email','Site visit','Quote sent','Technical Q&A','Tender received','Proposal submitted','Follow-up']],
            ['Opportunity', 'select', CRMData.opportunities.map(o=>`${o.id} — ${o.client}`)],
            ['Notes', 'textarea', 'Describe the activity and any outcome…'],
            ['Date', 'date', ''],
          ].map(([label, type, opts]) => `
            <div>
              <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;display:block;margin-bottom:4px">${label}</label>
              ${type==='select'
                ? `<select style="width:100%;background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:7px 10px;font-size:12px;color:var(--text-primary);outline:none;font-family:var(--font-body)">${(typeof opts==='string'?[]:opts).map(o=>`<option>${o}</option>`).join('')}</select>`
                : type==='textarea'
                  ? `<textarea rows="3" placeholder="${opts}" style="width:100%;background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:7px 10px;font-size:12px;color:var(--text-primary);outline:none;font-family:var(--font-body);resize:vertical"></textarea>`
                  : `<input type="${type}" value="${new Date().toISOString().split('T')[0]}" style="width:100%;background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:7px 10px;font-size:12px;color:var(--text-primary);outline:none;font-family:var(--font-body)"/>`
              }
            </div>`).join('')}
          <button class="btn btn-primary" onclick="showToast('Activity logged — pipeline updated','success')">Log activity</button>
        </div>
      </div>
      ` : `
      <div class="card" style="display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;color:var(--text-muted);font-size:12px;border:1px dashed var(--border)">
        <div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:8px;opacity:.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          <div>Quick log restricted to Sales Managers & Execs</div>
        </div>
      </div>
      `}
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   MODALS
═══════════════════════════════════════════════════════════ */
function openOppDetail(id) {
  const opp = CRMData.opportunities.find(o => o.id === id);
  if (!opp) return;
  const days = crmDaysLeft(opp.closeDate);

  const role = AppState.currentUser?.role || 'manager';
  const isCoordinator = role === 'user';
  const isManager = role === 'manager' || role === 'gm';

  openCRMModal(`
    <div style="background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg)">
      <div style="padding:18px 22px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--brand);margin-bottom:4px">${opp.id}</div>
          <div style="font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--text-primary)">${opp.name}</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${opp.client} · ${opp.contact}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:flex-start">
          ${stageBadge(opp.stage)}
          <button class="btn-icon" onclick="closeCRMModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
      </div>
      <div style="padding:20px 22px;display:flex;flex-direction:column;gap:14px">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          ${[
            ['Value', crmFmt(opp.value), 'var(--brand)'],
            ['Probability', opp.prob+'%', 'var(--blue)'],
            ['Close in', days+'d', days<30?'var(--red)':days<60?'var(--amber)':'var(--green)'],
          ].map(([l,v,c])=>`
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px;text-align:center">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:4px">${l}</div>
              <div style="font-family:var(--font-display);font-size:20px;font-weight:700;color:${c}">${v}</div>
            </div>`).join('')}
        </div>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.6">${opp.notes}</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${opp.tags.map(t=>`<span class="badge badge-muted" style="font-size:11px">${t}</span>`).join('')}
        </div>
        ${opp.linkedProject ? `
          <div style="padding:10px 12px;background:var(--green-bg);border:1px solid rgba(45,212,160,.2);border-radius:var(--radius-sm);font-size:12px;color:var(--green);cursor:pointer" onclick="closeCRMModal();navigate('projects');showToast('Opening ${opp.linkedProject}','info')">
            Linked project: <strong>${opp.linkedProject}</strong> — Click to open →
          </div>` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:var(--text-muted)">
          <div>Owner: <strong style="color:var(--text-primary)">${opp.owner}</strong></div>
          <div>Last activity: <strong style="color:var(--text-primary)">${opp.lastActivity}</strong></div>
          <div>Close date: <strong style="color:var(--text-primary)">${opp.closeDate}</strong></div>
          <div>Currency: <strong style="color:var(--text-primary)">${opp.currency}</strong></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${!isCoordinator && opp.stage !== 'won' && opp.stage !== 'lost' ? `
            <button class="btn btn-primary btn-sm" onclick="closeCRMModal();switchCRMTab('quote');showToast('Opening quote for ${opp.id}','info')">Build quote</button>
            <button class="btn btn-secondary btn-sm" onclick="closeCRMModal();showToast('${opp.id} moved to next stage','success')">Advance stage</button>
            <button class="btn btn-secondary btn-sm" style="color:var(--red)" onclick="closeCRMModal();showToast('${opp.id} marked lost','warn')">Mark lost</button>` : ''}
          ${!isCoordinator && opp.stage === 'won' && !opp.linkedProject ? `
            <button class="btn btn-primary btn-sm" onclick="closeCRMModal();navigate('projects');showToast('Creating project entity from ${opp.id}','success')">Create project entity</button>` : ''}
          ${isManager ? `
            <button class="btn btn-secondary btn-sm" style="color:var(--red)" onclick="closeCRMModal();showToast('${opp.id} deleted','error')">Delete</button>` : ''}
          <button class="btn btn-ghost btn-sm" onclick="closeCRMModal()">Close</button>
        </div>
      </div>
    </div>`);
}

function openClientDetail(id) {
  const c = CRMData.clients.find(x => x.id === id);
  if (!c) return;
  const role = AppState.currentUser?.role || 'manager';
  const isCoordinator = role === 'user';
  openCRMModal(`
    <div style="background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg)">
      <div style="padding:18px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:14px">
        <div class="client-avatar" style="background:${c.avatarBg}22;color:${c.avatarColor};border:1px solid ${c.avatarBg}44;width:48px;height:48px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;font-family:var(--font-display)">${c.initials}</div>
        <div style="flex:1">
          <div style="font-family:var(--font-display);font-size:17px;font-weight:700">${c.name}</div>
          <div style="font-size:12px;color:var(--text-muted)">${c.sector} · ${c.region}</div>
        </div>
        <button class="btn-icon" onclick="closeCRMModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div style="padding:18px 22px;display:flex;flex-direction:column;gap:12px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${[['Contact',c.contact],['Email',c.email],['Phone',c.phone],['Client since',c.sinceYear]].map(([l,v])=>`
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:9px 11px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px">${l}</div>
              <div style="font-size:12px;color:var(--text-primary)">${v}</div>
            </div>`).join('')}
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${c.tags.map(t=>`<span class="client-tag">${t}</span>`).join('')}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${!isCoordinator ? `
          <button class="btn btn-primary btn-sm" onclick="closeCRMModal();openNewOppModal()">New opportunity</button>
          <button class="btn btn-secondary btn-sm" onclick="closeCRMModal();openLogActivityModal()">Log activity</button>
          ` : ''}
          <button class="btn btn-ghost btn-sm" onclick="closeCRMModal()">Close</button>
        </div>
      </div>
    </div>`);
}

function openNewOppModal() {
  openCRMModal(`
    <div style="background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg)">
      <div style="padding:18px 22px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">New opportunity</div>
        <button class="btn-icon" onclick="closeCRMModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div style="padding:20px 22px;display:flex;flex-direction:column;gap:13px">
        ${[
          ['Opportunity name','text','e.g. 316L Cone Roof Tank — 20,000L'],
          ['Client / company','text','e.g. ADNOC Gas'],
          ['Primary contact','text','e.g. Eng. Khalid Al-Mansoori'],
        ].map(([l,t,p])=>`
          <div>
            <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;display:block;margin-bottom:4px">${l}</label>
            <input type="${t}" placeholder="${p}" style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;font-family:var(--font-body)" onfocus="this.style.borderColor='var(--brand)'" onblur="this.style.borderColor='var(--border-md)'"/>
          </div>`).join('')}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;display:block;margin-bottom:4px">Value (USD)</label>
            <input type="number" placeholder="e.g. 250000" style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;font-family:var(--font-mono)" onfocus="this.style.borderColor='var(--brand)'" onblur="this.style.borderColor='var(--border-md)'"/>
          </div>
          <div>
            <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;display:block;margin-bottom:4px">Stage</label>
            <select style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 10px;font-size:13px;color:var(--text-primary);outline:none;font-family:var(--font-body)">
              ${CRMData.stages.filter(s=>!['won','lost'].includes(s.id)).map(s=>`<option value="${s.id}">${s.label}</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;display:block;margin-bottom:4px">Probability %</label>
            <input type="number" placeholder="e.g. 40" min="0" max="100" style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;font-family:var(--font-mono)" onfocus="this.style.borderColor='var(--brand)'" onblur="this.style.borderColor='var(--border-md)'"/>
          </div>
          <div>
            <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;display:block;margin-bottom:4px">Expected close</label>
            <input type="date" style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;font-family:var(--font-body)" onfocus="this.style.borderColor='var(--brand)'" onblur="this.style.borderColor='var(--border-md)'"/>
          </div>
        </div>
        <div>
          <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;display:block;margin-bottom:4px">Notes</label>
          <textarea rows="2" placeholder="Scope, technical requirements, key risks…" style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;font-family:var(--font-body);resize:vertical" onfocus="this.style.borderColor='var(--brand)'" onblur="this.style.borderColor='var(--border-md)'"></textarea>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="closeCRMModal();showToast('Opportunity created — pipeline updated','success')">Create opportunity</button>
          <button class="btn btn-secondary" onclick="closeCRMModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function openNewTenderModal() {
  openCRMModal(`
    <div style="background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg)">
      <div style="padding:18px 22px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Log tender / RFQ</div>
        <button class="btn-icon" onclick="closeCRMModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div style="padding:20px 22px;display:flex;flex-direction:column;gap:13px">
        ${[
          ['Tender reference','text','e.g. ITT-2025-020'],
          ['Tender description','text','e.g. Floating Roof Tank API 650'],
          ['Client / issuer','text','e.g. Dubai Petroleum'],
        ].map(([l,t,p])=>`
          <div>
            <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;display:block;margin-bottom:4px">${l}</label>
            <input type="${t}" placeholder="${p}" style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;font-family:var(--font-body)" onfocus="this.style.borderColor='var(--brand)'" onblur="this.style.borderColor='var(--border-md)'"/>
          </div>`).join('')}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          ${[['Estimated value (USD)','number','e.g. 500000'],['Bid due date','date','']].map(([l,t,p])=>`
            <div>
              <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;display:block;margin-bottom:4px">${l}</label>
              <input type="${t}" placeholder="${p}" style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;font-family:var(--font-body)" onfocus="this.style.borderColor='var(--brand)'" onblur="this.style.borderColor='var(--border-md)'"/>
            </div>`).join('')}
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="closeCRMModal();showToast('Tender logged — team notified','success')">Log tender</button>
          <button class="btn btn-secondary" onclick="closeCRMModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function openNewClientModal() {
  openCRMModal(`
    <div style="background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg)">
      <div style="padding:18px 22px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Add client</div>
        <button class="btn-icon" onclick="closeCRMModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div style="padding:20px 22px;display:flex;flex-direction:column;gap:13px">
        ${[['Company name','text','e.g. ADNOC'],['Sector','text','e.g. National Oil Company'],['Region','text','e.g. Abu Dhabi, UAE'],['Primary contact','text','e.g. Eng. Khalid Al-Mansoori'],['Email','email','contact@company.ae'],['Phone','text','+971 2 000 0000']].map(([l,t,p])=>`
          <div>
            <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;display:block;margin-bottom:4px">${l}</label>
            <input type="${t}" placeholder="${p}" style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;font-family:var(--font-body)" onfocus="this.style.borderColor='var(--brand)'" onblur="this.style.borderColor='var(--border-md)'"/>
          </div>`).join('')}
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="closeCRMModal();showToast('Client added to database','success')">Add client</button>
          <button class="btn btn-secondary" onclick="closeCRMModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function openLogActivityModal() { renderMktSubPage('activity'); closeCRMModal && closeCRMModal(); }
function openTenderDetail(id) { showToast(`Opening tender ${id}`, 'info'); }
function switchCRMTab(page) { if (typeof renderMktSubPage === 'function') renderMktSubPage(page); }

/* ═══════════════════════════════════════════════════════════
   NEW SUB-PAGE 1 — REVENUE FORECAST
═══════════════════════════════════════════════════════════ */
function renderMktForecast() {
  const el = document.getElementById('mktTabContent');
  if (!el) return;

  const opps = CRMData.opportunities.filter(o => !['won','lost'].includes(o.stage));

  // Build quarterly forecast from weighted pipeline
  const quarters = [
    { label: 'Q2 2025', months: ['2025-04','2025-05','2025-06'] },
    { label: 'Q3 2025', months: ['2025-07','2025-08','2025-09'] },
    { label: 'Q4 2025', months: ['2025-10','2025-11','2025-12'] },
    { label: 'Q1 2026', months: ['2026-01','2026-02','2026-03'] },
  ];

  function getQValue(qMonths, scenario) {
    return opps.reduce((sum, opp) => {
      const close = opp.closeDate.substring(0, 7);
      if (!qMonths.includes(close)) return sum;
      if (scenario === 'best')   return sum + opp.value * Math.max(opp.prob, 50) / 100;
      if (scenario === 'likely') return sum + opp.value * opp.prob / 100;
      if (scenario === 'worst')  return sum + (opp.prob >= 60 ? opp.value * opp.prob / 100 : 0);
      return sum;
    }, 0);
  }

  const maxVal = Math.max(...quarters.map(q => getQValue(q.months, 'best')), 1);

  el.innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'Active pipeline',    value: crmFmt(opps.reduce((s,o) => s + o.value * o.prob / 100, 0)), color:'var(--blue)' },
        { label:'Best case (total)',  value: crmFmt(opps.reduce((s,o) => s + o.value * Math.max(o.prob,50)/100, 0)), color:'#6366f1' },
        { label:'Likely case (total)',value: crmFmt(opps.reduce((s,o) => s + o.value * o.prob / 100, 0)), color:'var(--green)' },
        { label:'Worst case (total)', value: crmFmt(opps.filter(o => o.prob >= 60).reduce((s,o) => s + o.value * o.prob / 100, 0)), color:'var(--amber)' },
      ].map(k => `<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:22px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 280px;gap:16px;align-items:start">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Quarterly revenue forecast</span>
          <div style="display:flex;gap:12px;font-size:11px">
            <span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:2px;background:#6366f1;display:inline-block"></span>Best case</span>
            <span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:2px;background:var(--green);display:inline-block"></span>Likely</span>
            <span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:2px;background:var(--amber);display:inline-block"></span>Worst</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:18px;padding:8px 0">
          ${quarters.map(q => {
            const best   = getQValue(q.months, 'best');
            const likely = getQValue(q.months, 'likely');
            const worst  = getQValue(q.months, 'worst');
            const bestPct   = Math.round((best   / maxVal) * 100);
            const likelyPct = Math.round((likely / maxVal) * 100);
            const worstPct  = Math.round((worst  / maxVal) * 100);
            return `
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                <span style="font-size:12px;font-weight:600;color:var(--text-primary)">${q.label}</span>
                <span style="font-size:11px;color:var(--text-muted)">${crmFmt(likely)} likely</span>
              </div>
              <div style="display:flex;flex-direction:column;gap:4px">
                <div style="height:16px;background:var(--bg-active);border-radius:4px;overflow:hidden">
                  <div style="height:100%;width:${bestPct}%;background:#6366f1;border-radius:4px;opacity:0.5;transition:width .5s"></div>
                </div>
                <div style="height:16px;background:var(--bg-active);border-radius:4px;overflow:hidden">
                  <div style="height:100%;width:${likelyPct}%;background:var(--green);border-radius:4px;transition:width .5s"></div>
                </div>
                <div style="height:16px;background:var(--bg-active);border-radius:4px;overflow:hidden">
                  <div style="height:100%;width:${worstPct}%;background:var(--amber);border-radius:4px;opacity:0.7;transition:width .5s"></div>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:10px;color:var(--text-muted)">
                <span>Best: ${crmFmt(best)}</span>
                <span>Likely: ${crmFmt(likely)}</span>
                <span>Worst: ${crmFmt(worst)}</span>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Per-opp breakdown -->
      <div class="card">
        <div class="card-header"><span class="card-title">Opportunities in forecast</span></div>
        <div style="display:flex;flex-direction:column;gap:2px">
          ${opps.sort((a,b) => b.value*b.prob/100 - a.value*a.prob/100).map(opp => `
            <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);cursor:pointer" onclick="openOppDetail('${opp.id}')">
              <div style="width:32px;height:32px;border-radius:var(--radius-sm);background:#6366f122;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span style="font-size:11px;font-weight:700;color:#6366f1">${opp.prob}%</span>
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-size:11px;font-weight:500;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${opp.name}</div>
                <div style="font-size:10px;color:var(--text-muted)">${opp.client} · ${opp.closeDate}</div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:11px;font-weight:500;font-family:var(--font-mono);color:#6366f1">${crmFmt(opp.value * opp.prob / 100)}</div>
                <div style="font-size:9px;color:var(--text-muted)">${crmFmt(opp.value)} gross</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   NEW SUB-PAGE 2 — PRE-QUALIFICATION TRACKER
═══════════════════════════════════════════════════════════ */
const MktPrequalData = {
  registrations: [
    { id:'PQ-001', authority:'ADNOC',          category:'Pressure Vessel Fabricator (ASME VIII)',  status:'active',   submitted:'2023-11-01', expiry:'2025-11-01', daysLeft:156, contact:'Vendor.Dev@adnoc.ae' },
    { id:'PQ-002', authority:'ADMA-OPCO',       category:'Storage Tank Fabricator (API 650)',       status:'active',   submitted:'2024-02-15', expiry:'2026-02-15', daysLeft:261, contact:'procurement@admaopco.ae' },
    { id:'PQ-003', authority:'ENOC',            category:'Heat Exchanger Fabricator (TEMA)',        status:'expiring', submitted:'2023-05-20', expiry:'2025-06-20', daysLeft:22,  contact:'vendors@enoc.ae' },
    { id:'PQ-004', authority:'Dubai Petroleum', category:'Structural Steel Fabricator',             status:'active',   submitted:'2024-01-10', expiry:'2026-01-10', daysLeft:226, contact:'procurement@dubpet.ae' },
    { id:'PQ-005', authority:'DEWA',            category:'Pressure Vessel & Piping (ASME B31.3)',   status:'pending',  submitted:'2025-03-01', expiry:'—',          daysLeft:null, contact:'suppliers@dewa.gov.ae' },
    { id:'PQ-006', authority:'ADNOC Gas',       category:'API 650 Tank Fabricator',                 status:'expired',  submitted:'2022-08-01', expiry:'2024-08-01', daysLeft:-274, contact:'vendor@adnocgas.ae' },
    { id:'PQ-007', authority:'Petrofac',        category:'Qualified Sub-Contractor (Fabrication)',  status:'active',   submitted:'2024-06-10', expiry:'2026-06-10', daysLeft:377, contact:'subcontractors@petrofac.com' },
  ],
};

function renderMktPreQual() {
  const el = document.getElementById('mktTabContent');
  if (!el) return;

  const role = AppState.currentUser?.role || 'manager';
  const isCoordinator = role === 'user';

  const regs = MktPrequalData.registrations;
  const active   = regs.filter(r => r.status === 'active').length;
  const expiring = regs.filter(r => r.status === 'expiring').length;
  const expired  = regs.filter(r => r.status === 'expired').length;
  const pending  = regs.filter(r => r.status === 'pending').length;

  const statusCls = { active:'badge-green', expiring:'badge-amber', expired:'badge-red', pending:'badge-blue' };
  const statusLabel = { active:'Active', expiring:'Expiring soon', expired:'Expired', pending:'Pending' };

  el.innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'Active registrations', value:active,   color:'var(--green)' },
        { label:'Expiring < 60 days',   value:expiring, color:'var(--amber)' },
        { label:'Expired — renewal due',value:expired,  color:'var(--red)' },
        { label:'Pending approval',      value:pending,  color:'var(--blue)' },
      ].map(k => `<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Pre-qualification registrations</span>
        ${!isCoordinator ? `
        <button class="btn btn-primary btn-sm" onclick="mktNewPrequal()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          New registration
        </button>
        ` : ''}
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:1px solid var(--border-md)">
            ${['Ref','Authority','Category','Status','Expiry','Days Left','Contact',''].map(h => `<th style="text-align:left;padding:8px 12px;font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${regs.map(r => {
            const urgStyle = r.status === 'expiring' ? 'background:var(--amber-bg)' : r.status === 'expired' ? 'background:var(--red-bg)' : '';
            return `
            <tr style="border-bottom:1px solid var(--border);${urgStyle}cursor:pointer" onmouseenter="this.style.filter='brightness(0.97)'" onmouseleave="this.style.filter=''">
              <td style="padding:10px 12px;font-family:var(--font-mono);font-size:11px;color:var(--brand)">${r.id}</td>
              <td style="padding:10px 12px;font-size:12px;font-weight:500;color:var(--text-primary)">${r.authority}</td>
              <td style="padding:10px 12px;font-size:12px;color:var(--text-secondary);max-width:220px">${r.category}</td>
              <td style="padding:10px 12px"><span class="badge ${statusCls[r.status]}">${statusLabel[r.status]}</span></td>
              <td style="padding:10px 12px;font-size:12px;font-family:var(--font-mono);color:var(--text-secondary)">${r.expiry}</td>
              <td style="padding:10px 12px;font-size:12px;font-weight:600;color:${r.daysLeft === null ? 'var(--text-muted)' : r.daysLeft < 0 ? 'var(--red)' : r.daysLeft < 60 ? 'var(--amber)' : 'var(--green)'}">
                ${r.daysLeft === null ? '—' : r.daysLeft < 0 ? Math.abs(r.daysLeft) + 'd overdue' : r.daysLeft + 'd'}
              </td>
              <td style="padding:10px 12px;font-size:11px;color:var(--text-muted)">${r.contact}</td>
              <td style="padding:10px 12px">
                ${!isCoordinator && r.status !== 'active' && r.status !== 'pending'
                  ? `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();showToast('Renewal process started for ${r.authority}','info')">Renew</button>`
                  : `<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();showToast('Opening ${r.id} documents','info')">View</button>`}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   NEW SUB-PAGE 3 — COMPETITOR INTELLIGENCE
═══════════════════════════════════════════════════════════ */
const MktIntelData = {
  competitors: [
    { id:'C01', name:'Alpha Fabricators LLC', region:'Dubai, UAE', size:'Medium', strengths:['API 650 tanks','Low pricing'], weaknesses:['Limited ASME cert','Long lead times'], winRate:40, avgGap:-8 },
    { id:'C02', name:'Gulf Steel Works',      region:'Sharjah, UAE',size:'Large', strengths:['Large capacity','CS fabrication'], weaknesses:['SS limited','No ADNOC pre-qual'], winRate:55, avgGap:+3 },
    { id:'C03', name:'ProFab Engineering',    region:'Abu Dhabi, UAE',size:'Small',strengths:['ADNOC approved','SS expertise'], weaknesses:['Capacity constrained','High overhead'], winRate:60, avgGap:+5 },
    { id:'C04', name:'Emirates Steel Fab',    region:'Dubai, UAE', size:'Large', strengths:['Price aggressive','Fast delivery'], weaknesses:['Quality issues','NDT subcontracted'], winRate:45, avgGap:-12 },
  ],
  winLoss: [
    { tender:'ITT-2025-011 (Dragon Oil, Duplex PV)', result:'quoted', ourPrice:188000, competitor:'ProFab Engineering', theirPrice:null, gap:null, notes:'Awaiting result' },
    { tender:'NAPESCO GRP Skid',       result:'lost', ourPrice:74000, competitor:'Gulf Steel Works', theirPrice:60000, gap:-22, notes:'Competitor 22% below — review sub-material costs' },
    { tender:'ENOC Heat Exchanger',    result:'won',  ourPrice:142000, competitor:'Alpha Fabricators', theirPrice:158000, gap:+11, notes:'Won on technical compliance & lead time' },
    { tender:'ADNOC 316L Storage Tank',result:'won',  ourPrice:284000, competitor:'Emirates Steel Fab', theirPrice:271000, gap:-5, notes:'Won on ADNOC pre-qual & ASME cert advantage' },
    { tender:'Petrofac Pressure Vessel',result:'won', ourPrice:97500, competitor:'Gulf Steel Works', theirPrice:105000, gap:+8, notes:'Won on delivery schedule + welding certs' },
  ],
};

function renderMktIntelligence() {
  const el = document.getElementById('mktTabContent');
  if (!el) return;

  const role = AppState.currentUser?.role || 'manager';
  const isCoordinator = role === 'user';

  const wins = MktIntelData.winLoss.filter(w => w.result === 'won').length;
  const losses = MktIntelData.winLoss.filter(w => w.result === 'lost').length;
  const winRate = Math.round(wins / (wins + losses) * 100);

  el.innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'Competitors tracked', value:MktIntelData.competitors.length, color:'#6366f1' },
        { label:'Win rate (YTD)',       value:winRate+'%', color:'var(--green)' },
        { label:'Bids won',             value:wins,        color:'var(--green)' },
        { label:'Bids lost',            value:losses,      color:'var(--red)' },
      ].map(k => `<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <!-- Competitor registry -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Competitor registry</span>
          ${!isCoordinator ? `<button class="btn btn-ghost btn-sm" onclick="mktAddCompetitor()">+ Add</button>` : ''}
        </div>
        ${MktIntelData.competitors.map(c => `
          <div style="padding:12px 0;border-bottom:1px solid var(--border)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <div>
                <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${c.name}</div>
                <div style="font-size:11px;color:var(--text-muted)">${c.region} · ${c.size}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:13px;font-weight:700;color:${c.winRate >= 50 ? 'var(--amber)' : 'var(--green)'}">vs us: ${c.winRate}%</div>
                <div style="font-size:10px;color:var(--text-muted)">their win rate vs us</div>
              </div>
            </div>
            <div style="display:flex;gap:16px;font-size:11px">
              <div>
                <div style="color:var(--text-muted);margin-bottom:3px;text-transform:uppercase;font-size:9px;letter-spacing:.09em">Strengths</div>
                ${c.strengths.map(s => `<span class="badge badge-green" style="font-size:9px;margin:1px">${s}</span>`).join('')}
              </div>
              <div>
                <div style="color:var(--text-muted);margin-bottom:3px;text-transform:uppercase;font-size:9px;letter-spacing:.09em">Weaknesses</div>
                ${c.weaknesses.map(w => `<span class="badge badge-muted" style="font-size:9px;margin:1px">${w}</span>`).join('')}
              </div>
            </div>
            <div style="margin-top:8px;display:flex;align-items:center;gap:8px">
              <span style="font-size:11px;color:var(--text-muted)">Avg price gap:</span>
              <span style="font-size:12px;font-weight:600;font-family:var(--font-mono);color:${c.avgGap >= 0 ? 'var(--green)' : 'var(--red)'}">
                ${c.avgGap >= 0 ? '+' : ''}${c.avgGap}%
              </span>
              <span style="font-size:10px;color:var(--text-muted)">(our price vs theirs)</span>
            </div>
          </div>`).join('')}
      </div>

      <!-- Win/loss table -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Recent bid outcomes</span>
          <button class="btn btn-ghost btn-sm" onclick="showToast('Export win/loss report','info')">Export</button>
        </div>
        ${MktIntelData.winLoss.map(w => `
          <div style="padding:12px 0;border-bottom:1px solid var(--border)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:5px">
              <div style="font-size:12px;font-weight:500;color:var(--text-primary);flex:1;min-width:0;padding-right:8px">${w.tender}</div>
              <span class="badge ${w.result === 'won' ? 'badge-green' : w.result === 'lost' ? 'badge-red' : 'badge-blue'}" style="font-size:10px;flex-shrink:0">${w.result.charAt(0).toUpperCase()+w.result.slice(1)}</span>
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">vs ${w.competitor}</div>
            <div style="display:flex;gap:16px;font-size:11px">
              <span>Our price: <strong style="font-family:var(--font-mono);color:var(--text-primary)">${crmFmt(w.ourPrice)}</strong></span>
              ${w.theirPrice ? `<span>Theirs: <strong style="font-family:var(--font-mono);color:var(--text-secondary)">${crmFmt(w.theirPrice)}</strong></span>` : ''}
              ${w.gap !== null ? `<span style="color:${w.gap >= 0 ? 'var(--green)' : 'var(--red)'};font-weight:600">${w.gap >= 0 ? '+' : ''}${w.gap}%</span>` : ''}
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:3px;font-style:italic">${w.notes}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   NEW SUB-PAGE 4 — CONTACT MANAGER
═══════════════════════════════════════════════════════════ */
const MktContactsData = {
  contacts: [
    { id:'CT-001', name:'Eng. Khalid Al-Mansoori', title:'Senior Procurement Engineer', company:'ADNOC',          email:'k.mansoori@adnoc.ae',       phone:'+971 2 602 0000', lastContact:'2025-04-28', followUpDue:'2025-06-01', followUpNote:'Follow up on OPP-001 expansion', avatarBg:'#0F6E56', initials:'KM' },
    { id:'CT-002', name:'Mr. James Okafor',         title:'Contracts Manager',           company:'Petrofac UAE',   email:'j.okafor@petrofac.com',     phone:'+971 4 800 4000', lastContact:'2025-04-15', followUpDue:'2025-05-20', followUpNote:'PV delivery schedule confirmation', avatarBg:'#185FA5', initials:'JO' },
    { id:'CT-003', name:'Ms. Priya Nair',            title:'Project Engineer',            company:'ENOC',           email:'p.nair@enoc.ae',            phone:'+971 4 337 9900', lastContact:'2025-03-20', followUpDue:'2025-06-15', followUpNote:'QC clearance follow-up', avatarBg:'#854F0B', initials:'PN' },
    { id:'CT-004', name:'Eng. Tariq Al-Yasi',       title:'Head of Projects',            company:'EMARAT',         email:'t.alyasi@emarat.ae',        phone:'+971 4 406 1111', lastContact:'2025-04-25', followUpDue:'2025-05-28', followUpNote:'Discount negotiation — 100k tank', avatarBg:'#534AB7', initials:'TA' },
    { id:'CT-005', name:'Mr. Alistair Mackenzie',   title:'Technical Director',          company:'Dragon Oil',     email:'a.mackenzie@dragonoil.com', phone:'+971 4 305 3000', lastContact:'2025-04-22', followUpDue:'2025-05-15', followUpNote:'Technical Q&A on duplex spec', avatarBg:'#791F1F', initials:'AM' },
    { id:'CT-006', name:'Eng. Saeed Al-Qasim',     title:'VP Engineering',             company:'Dubai Petroleum', email:'s.alqasim@dubpet.ae',       phone:'+971 4 213 6000', lastContact:'2025-04-26', followUpDue:'2025-05-30', followUpNote:'Bid submission for ITT-2025-018', avatarBg:'#3B6D11', initials:'SQ' },
    { id:'CT-007', name:'Eng. Ali Tamimi',           title:'Project Procurement Lead',    company:'GAL',            email:'a.tamimi@gal.ae',           phone:'+971 6 000 1234', lastContact:'2025-04-20', followUpDue:'2025-05-10', followUpNote:'Technical clarification meeting', avatarBg:'#0F6E56', initials:'AT' },
    { id:'CT-008', name:'Dr. Fatima Al-Rashidi',    title:'Head of Operations',          company:'Gulf Pharma',    email:'f.alrashidi@gulfpharma.ae', phone:'+971 4 000 5678', lastContact:'2025-04-24', followUpDue:'2025-05-16', followUpNote:'Scope sign-off for jacketed vessel', avatarBg:'#6366f1', initials:'FR' },
  ],
};

function renderMktContacts() {
  const el = document.getElementById('mktTabContent');
  if (!el) return;

  const role = AppState.currentUser?.role || 'manager';
  const isCoordinator = role === 'user';

  const contacts = MktContactsData.contacts;
  const today = new Date();
  const overdue = contacts.filter(c => new Date(c.followUpDue) < today).length;
  const dueSoon = contacts.filter(c => { const d = new Date(c.followUpDue); return d >= today && (d - today) / 86400000 < 7; }).length;

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div style="display:flex;gap:12px">
        <div class="metric-card" style="padding:10px 16px;min-width:0">
          <div class="metric-label">Total contacts</div>
          <div class="metric-value" style="font-size:22px;color:#6366f1">${contacts.length}</div>
        </div>
        <div class="metric-card" style="padding:10px 16px;min-width:0">
          <div class="metric-label">Follow-up overdue</div>
          <div class="metric-value" style="font-size:22px;color:var(--red)">${overdue}</div>
        </div>
        <div class="metric-card" style="padding:10px 16px;min-width:0">
          <div class="metric-label">Due this week</div>
          <div class="metric-value" style="font-size:22px;color:var(--amber)">${dueSoon}</div>
        </div>
      </div>
      ${!isCoordinator ? `
      <button class="btn btn-primary btn-sm" onclick="mktAddContact()">
        <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Add contact
      </button>
      ` : ''}
    </div>

    <div class="contact-grid">
      ${contacts.map(c => {
        const daysToFollowUp = Math.ceil((new Date(c.followUpDue) - today) / 86400000);
        const fuColor = daysToFollowUp < 0 ? 'var(--red)' : daysToFollowUp < 7 ? 'var(--amber)' : 'var(--green)';
        const fuLabel = daysToFollowUp < 0 ? `${Math.abs(daysToFollowUp)}d overdue` : daysToFollowUp === 0 ? 'Today' : `${daysToFollowUp}d`;
        return `
        <div class="contact-card">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
            <div style="width:42px;height:42px;border-radius:var(--radius-md);background:${c.avatarBg}22;border:1px solid ${c.avatarBg}44;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;font-family:var(--font-display);color:${c.avatarBg};flex-shrink:0">${c.initials}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${c.name}</div>
              <div style="font-size:11px;color:var(--text-muted)">${c.title}</div>
              <div style="font-size:11px;color:#6366f1;font-weight:500">${c.company}</div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:5px;font-size:11px;color:var(--text-secondary);border-top:1px solid var(--border);padding-top:10px;margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:6px">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 2.5c0-.8.7-1.5 1.5-1.5h6c.8 0 1.5.7 1.5 1.5v6c0 .8-.7 1.5-1.5 1.5h-6C1.7 10 1 9.3 1 8.5v-6z" stroke="currentColor" stroke-width="1"/><path d="M1 4l4.5 2.5L10 4" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.email}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 1.5h2l1 2.5-1.5 1c.5 1.5 1.5 2.5 3 3l1-1.5 2.5 1v2c0 .3-.2.5-.5.5C4 10 1 7 1 2c0-.3.2-.5.5-.5H2z" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
              <span>${c.phone}</span>
            </div>
          </div>
          <div style="background:var(--bg-elevated);border-radius:var(--radius-sm);padding:8px 10px;margin-bottom:10px">
            <div style="font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px">Follow-up note</div>
            <div style="font-size:11px;color:var(--text-secondary)">${c.followUpNote}</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:10px;color:var(--text-muted)">Last: ${c.lastContact}</div>
            <div style="display:flex;align-items:center;gap:5px">
              <div style="width:6px;height:6px;border-radius:50%;background:${fuColor}"></div>
              <span style="font-size:11px;font-weight:600;color:${fuColor}">${fuLabel}</span>
            </div>
          </div>
          ${!isCoordinator ? `
          <div style="display:flex;gap:6px;margin-top:10px">
            <button class="btn btn-secondary btn-sm" style="flex:1" onclick="showToast('Logging call with ${c.name}','info')">Log call</button>
            <button class="btn btn-ghost btn-sm" style="flex:1" onclick="showToast('Opening email to ${c.name}','info')">Email</button>
          </div>
          ` : ''}
        </div>`;
      }).join('')}
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   NEW SUB-PAGE 5 — NEXT-ACTION QUEUE + ACTIVITY CALENDAR
═══════════════════════════════════════════════════════════ */

/* Calendar state: which month is shown + which day is selected (local YYYY-MM-DD). */
let _mktCal = null;

function crmDateKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
}

const CRM_APPT_META = {
  meeting:   { icon:'🤝', label:'Meeting',    color:'#6366f1' },
  call:      { icon:'📞', label:'Call',       color:'var(--blue)' },
  sitevisit: { icon:'📍', label:'Site visit', color:'var(--amber)' },
  followup:  { icon:'📝', label:'Follow-up',  color:'var(--green)' },
  bid:       { icon:'📋', label:'Bid due',    color:'var(--red)' },
};

/* Aggregate appointments + contact follow-ups + tender bid dates into a
   { 'YYYY-MM-DD': [event, …] } map. */
function crmCalendarEvents() {
  const map = {};
  const push = (key, ev) => { (map[key] = map[key] || []).push(ev); };

  (CRMData.appointments || []).forEach(a => {
    const t = new Date(a.start);
    push(crmDateKey(t), {
      type:a.type, title:a.title, ref:a.client, appt:a,
      time:t.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }),
      sort:t.getTime(),
    });
  });

  (typeof MktContactsData !== 'undefined' ? MktContactsData.contacts : []).forEach(c => {
    push(crmDateKey(c.followUpDue), {
      type:'followup', title:`Follow-up: ${c.name}`, ref:c.company, time:null, sort:0,
      action:`showToast('Logging follow-up with ${c.name}','info')`,
    });
  });

  CRMData.tenders.filter(t => t.stage !== 'submitted').forEach(t => {
    push(crmDateKey(t.due), {
      type:'bid', title:`Bid due: ${t.name}`, ref:t.id, time:null, sort:9e15,
      action:`openTenderDetail('${t.id}')`,
    });
  });

  Object.values(map).forEach(list => list.sort((a,b) => a.sort - b.sort));
  return map;
}

function mktCalNav(delta) {
  if (!_mktCal) return;
  _mktCal.month += delta;
  if (_mktCal.month < 0)  { _mktCal.month = 11; _mktCal.year--; }
  if (_mktCal.month > 11) { _mktCal.month = 0;  _mktCal.year++; }
  renderMktActionQueue();
}
function mktCalToday() {
  const now = new Date();
  _mktCal = { year:now.getFullYear(), month:now.getMonth(), sel:crmDateKey(now) };
  renderMktActionQueue();
}
function mktCalSelect(key) { if (_mktCal) { _mktCal.sel = key; renderMktActionQueue(); } }

function mktScheduleAppt(dateKey) {
  const role = AppState.currentUser?.role || 'manager';
  if (role === 'user') { showToast('Access denied: Coordinator is view-only', 'error'); return; }
  const def = dateKey || (_mktCal && _mktCal.sel) || crmDateKey(new Date());
  openCRMModal(`
    <div style="background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg)">
      <div style="padding:18px 22px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Schedule appointment</div>
        <button class="btn-icon" onclick="closeCRMModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div style="padding:20px 22px;display:flex;flex-direction:column;gap:13px">
        <div>
          <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;display:block;margin-bottom:4px">Title</label>
          <input id="apTitle" type="text" placeholder="e.g. Site survey — ADNOC tank" style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;font-family:var(--font-body)"/>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;display:block;margin-bottom:4px">Type</label>
            <select id="apType" style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 10px;font-size:13px;color:var(--text-primary);outline:none;font-family:var(--font-body)">
              ${Object.entries(CRM_APPT_META).filter(([k])=>k!=='bid').map(([k,m])=>`<option value="${k}">${m.label}</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;display:block;margin-bottom:4px">Client</label>
            <input id="apClient" type="text" placeholder="e.g. ADNOC" style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;font-family:var(--font-body)"/>
          </div>
          <div>
            <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;display:block;margin-bottom:4px">Date</label>
            <input id="apDate" type="date" value="${def}" style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;font-family:var(--font-body)"/>
          </div>
          <div>
            <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;display:block;margin-bottom:4px">Time</label>
            <input id="apTime" type="time" value="10:00" style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;font-family:var(--font-body)"/>
          </div>
        </div>
        <div>
          <label style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;display:block;margin-bottom:4px">Notes</label>
          <textarea id="apNotes" rows="2" placeholder="Purpose, attendees, location…" style="width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;font-family:var(--font-body);resize:vertical"></textarea>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="crmSaveAppt()">Schedule</button>
          <button class="btn btn-secondary" onclick="closeCRMModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

async function crmSaveAppt() {
  const get = id => (document.getElementById(id) || {}).value || '';
  const title = get('apTitle').trim();
  const date  = get('apDate');
  if (!title || !date) { showToast('Title and date are required', 'warn'); return; }
  const time = get('apTime') || '10:00';
  const start = new Date(`${date}T${time}`);
  const owner = (AppState && AppState.currentUser && AppState.currentUser.name) || '—';

  // Persist via the API, mapping the saved row back into the cache. If the call
  // fails (e.g. demo mode rejects), fall back to a local-only record so the
  // calendar still updates for the session.
  let appt;
  try {
    const row = await CrmAPI.appointmentCreate({
      type: get('apType') || 'meeting',
      title,
      client_name: get('apClient').trim() || null,
      start_at: start.toISOString(),
      location: null,
      owner,
      notes: get('apNotes').trim() || null,
    });
    appt = CrmMap.appointment(row);
  } catch {
    appt = {
      id: 'AP-' + String((CRMData.appointments || []).length + 1).padStart(3, '0'),
      type: get('apType') || 'meeting',
      title, client: get('apClient').trim() || '—',
      start: start.toISOString(), durationMin: 60,
      location: '', owner, notes: get('apNotes').trim(),
    };
  }

  CRMData.appointments = CRMData.appointments || [];
  CRMData.appointments.push(appt);
  closeCRMModal();
  if (_mktCal) _mktCal.sel = crmDateKey(start);
  showToast('Appointment scheduled', 'success');
  renderMktActionQueue();
}

/* ── Shared modal helpers for the CRM create forms ── */
const CRM_FORM_INP = 'width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;font-family:var(--font-body)';
const CRM_FORM_LBL = 'font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;display:block;margin-bottom:4px';
function crmFormShell(title, bodyHtml, saveFn, saveLabel) {
  return `
    <div style="background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg)">
      <div style="padding:18px 22px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${title}</div>
        <button class="btn-icon" onclick="closeCRMModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div style="padding:20px 22px;display:flex;flex-direction:column;gap:13px">
        ${bodyHtml}
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="${saveFn}">${saveLabel}</button>
          <button class="btn btn-secondary" onclick="closeCRMModal()">Cancel</button>
        </div>
      </div>
    </div>`;
}
const _cv = (id) => (document.getElementById(id) || {}).value || '';

/* ═══ Add competitor ═══ */
function mktAddCompetitor() {
  const role = AppState.currentUser?.role || 'manager';
  if (role === 'user') { showToast('Access denied: Coordinator is view-only', 'error'); return; }
  openCRMModal(crmFormShell('Add competitor', `
    <div><label style="${CRM_FORM_LBL}">Name</label><input id="cmpName" type="text" placeholder="e.g. Gulf Steel Works" style="${CRM_FORM_INP}"/></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div><label style="${CRM_FORM_LBL}">Region</label><input id="cmpRegion" type="text" placeholder="e.g. Dubai, UAE" style="${CRM_FORM_INP}"/></div>
      <div><label style="${CRM_FORM_LBL}">Size</label>
        <select id="cmpSize" style="${CRM_FORM_INP}"><option>Small</option><option selected>Medium</option><option>Large</option></select>
      </div>
    </div>
    <div><label style="${CRM_FORM_LBL}">Strengths (comma-separated)</label><input id="cmpStrengths" type="text" placeholder="e.g. Low pricing, Fast delivery" style="${CRM_FORM_INP}"/></div>
    <div><label style="${CRM_FORM_LBL}">Weaknesses (comma-separated)</label><input id="cmpWeak" type="text" placeholder="e.g. Limited ASME cert" style="${CRM_FORM_INP}"/></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div><label style="${CRM_FORM_LBL}">Their win rate vs us (%)</label><input id="cmpWin" type="number" min="0" max="100" placeholder="40" style="${CRM_FORM_INP}"/></div>
      <div><label style="${CRM_FORM_LBL}">Avg price gap (%)</label><input id="cmpGap" type="number" placeholder="-8" style="${CRM_FORM_INP}"/></div>
    </div>`, 'mktSaveCompetitor()', 'Add competitor'));
}
async function mktSaveCompetitor() {
  const name = _cv('cmpName').trim();
  if (!name) { showToast('Name is required', 'warn'); return; }
  const splitList = (s) => s.split(',').map(x => x.trim()).filter(Boolean);
  const winRate = _cv('cmpWin').trim(), avgGap = _cv('cmpGap').trim();
  const payload = {
    name, region: _cv('cmpRegion').trim() || null, size: _cv('cmpSize') || null,
    strengths: splitList(_cv('cmpStrengths')), weaknesses: splitList(_cv('cmpWeak')),
    win_rate: winRate === '' ? null : Number(winRate), avg_gap: avgGap === '' ? null : Number(avgGap),
  };
  let row;
  try { row = CrmMap.competitor(await CrmAPI.competitorCreate(payload)); }
  catch {
    row = { id: 'C' + String((MktIntelData.competitors.length + 1)).padStart(2, '0'), name, region: payload.region || '', size: payload.size || '', strengths: payload.strengths, weaknesses: payload.weaknesses, winRate: payload.win_rate || 0, avgGap: payload.avg_gap || 0 };
  }
  MktIntelData.competitors.push(row);
  closeCRMModal();
  showToast('Competitor added', 'success');
  renderMktIntelligence();
}

/* ═══ Add contact ═══ */
function mktAddContact() {
  const role = AppState.currentUser?.role || 'manager';
  if (role === 'user') { showToast('Access denied: Coordinator is view-only', 'error'); return; }
  openCRMModal(crmFormShell('Add contact', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div><label style="${CRM_FORM_LBL}">Name</label><input id="ctName" type="text" placeholder="e.g. Ms. Priya Nair" style="${CRM_FORM_INP}"/></div>
      <div><label style="${CRM_FORM_LBL}">Title</label><input id="ctTitle" type="text" placeholder="e.g. Project Engineer" style="${CRM_FORM_INP}"/></div>
    </div>
    <div><label style="${CRM_FORM_LBL}">Company</label><input id="ctCompany" type="text" placeholder="e.g. ENOC" style="${CRM_FORM_INP}"/></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div><label style="${CRM_FORM_LBL}">Email</label><input id="ctEmail" type="email" placeholder="name@company.com" style="${CRM_FORM_INP}"/></div>
      <div><label style="${CRM_FORM_LBL}">Phone</label><input id="ctPhone" type="text" placeholder="+971 …" style="${CRM_FORM_INP}"/></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div><label style="${CRM_FORM_LBL}">Follow-up due</label><input id="ctFollowDue" type="date" style="${CRM_FORM_INP}"/></div>
      <div><label style="${CRM_FORM_LBL}">Follow-up note</label><input id="ctFollowNote" type="text" placeholder="e.g. QC clearance follow-up" style="${CRM_FORM_INP}"/></div>
    </div>`, 'mktSaveContact()', 'Add contact'));
}
async function mktSaveContact() {
  const name = _cv('ctName').trim();
  if (!name) { showToast('Name is required', 'warn'); return; }
  const payload = {
    name, title: _cv('ctTitle').trim() || null, company: _cv('ctCompany').trim() || null,
    email: _cv('ctEmail').trim() || null, phone: _cv('ctPhone').trim() || null,
    follow_up_due: _cv('ctFollowDue') || null, follow_up_note: _cv('ctFollowNote').trim() || null,
  };
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  let row;
  try { row = CrmMap.contact(await CrmAPI.contactCreate(payload)); }
  catch {
    row = { id: 'CT-' + String(MktContactsData.contacts.length + 1).padStart(3, '0'), name, title: payload.title || '', company: payload.company || '', email: payload.email || '', phone: payload.phone || '', lastContact: '', followUpDue: payload.follow_up_due || '', followUpNote: payload.follow_up_note || '', avatarBg: '#6366f1', initials };
  }
  MktContactsData.contacts.push(row);
  closeCRMModal();
  showToast('Contact added', 'success');
  renderMktContacts();
}

/* ═══ New pre-qualification ═══ */
function mktNewPrequal() {
  const role = AppState.currentUser?.role || 'manager';
  if (role === 'user') { showToast('Access denied: Coordinator is view-only', 'error'); return; }
  openCRMModal(crmFormShell('New pre-qualification', `
    <div><label style="${CRM_FORM_LBL}">Authority</label><input id="pqAuthority" type="text" placeholder="e.g. ADNOC" style="${CRM_FORM_INP}"/></div>
    <div><label style="${CRM_FORM_LBL}">Category</label><input id="pqCategory" type="text" placeholder="e.g. Pressure Vessel Fabricator (ASME VIII)" style="${CRM_FORM_INP}"/></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div><label style="${CRM_FORM_LBL}">Status</label>
        <select id="pqStatus" style="${CRM_FORM_INP}"><option value="pending" selected>Pending</option><option value="active">Active</option><option value="expiring">Expiring soon</option><option value="expired">Expired</option></select>
      </div>
      <div><label style="${CRM_FORM_LBL}">Contact</label><input id="pqContact" type="text" placeholder="vendors@authority.ae" style="${CRM_FORM_INP}"/></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div><label style="${CRM_FORM_LBL}">Submitted</label><input id="pqSubmitted" type="date" style="${CRM_FORM_INP}"/></div>
      <div><label style="${CRM_FORM_LBL}">Expiry</label><input id="pqExpiry" type="date" style="${CRM_FORM_INP}"/></div>
    </div>`, 'mktSavePrequal()', 'Add registration'));
}
async function mktSavePrequal() {
  const authority = _cv('pqAuthority').trim();
  if (!authority) { showToast('Authority is required', 'warn'); return; }
  const payload = {
    authority, category: _cv('pqCategory').trim() || null, status: _cv('pqStatus') || 'pending',
    submitted: _cv('pqSubmitted') || null, expiry: _cv('pqExpiry') || null, contact: _cv('pqContact').trim() || null,
  };
  let row;
  try { row = CrmMap.prequal(await CrmAPI.prequalCreate(payload)); }
  catch {
    const daysLeft = payload.expiry ? Math.ceil((new Date(payload.expiry) - new Date()) / 86400000) : null;
    row = { id: 'PQ-' + String(MktPrequalData.registrations.length + 1).padStart(3, '0'), authority, category: payload.category || '', status: payload.status, submitted: payload.submitted || '', expiry: payload.expiry || '—', daysLeft, contact: payload.contact || '' };
  }
  MktPrequalData.registrations.push(row);
  closeCRMModal();
  showToast('Pre-qualification registered', 'success');
  renderMktPreQual();
}

function renderMktActionQueue() {
  const el = document.getElementById('mktTabContent');
  if (!el) return;

  if (!_mktCal) { const n = new Date(); _mktCal = { year:n.getFullYear(), month:n.getMonth(), sel:crmDateKey(n) }; }

  const role = AppState.currentUser?.role || 'manager';
  const isCoordinator = role === 'user';

  const actions  = crmCollectActions();
  const overdue  = actions.filter(a => a.days < 0 && a.kind !== 'Stale opp').length;
  const today    = actions.filter(a => a.days === 0).length;
  const week     = actions.filter(a => a.days > 0 && a.days < 7).length;
  const events   = crmCalendarEvents();
  const apptCount = (CRMData.appointments || []).length;

  const kindCls = { 'Follow-up':'badge-blue', 'Bid due':'badge-amber', 'Stale opp':'badge-muted', 'Approval':'badge-green' };

  /* ── Build month grid (Sunday-first) ── */
  const { year, month } = _mktCal;
  const todayKey = crmDateKey(new Date());
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = first.toLocaleDateString('en-GB', { month:'long', year:'numeric' });

  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const calCells = cells.map(d => {
    if (d === null) return `<div style="min-height:64px;background:transparent"></div>`;
    const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const evs = events[key] || [];
    const isToday = key === todayKey;
    const isSel   = key === _mktCal.sel;
    const dots = evs.slice(0, 3).map(e => {
      const m = CRM_APPT_META[e.type] || CRM_APPT_META.meeting;
      return `<span style="width:6px;height:6px;border-radius:50%;background:${m.color};display:inline-block"></span>`;
    }).join('');
    return `
      <div onclick="mktCalSelect('${key}')" style="min-height:64px;padding:5px 6px;border-radius:var(--radius-sm);cursor:pointer;border:1px solid ${isSel?'var(--brand)':'var(--border)'};background:${isSel?'var(--brand-light)':isToday?'var(--bg-elevated)':'var(--bg-surface)'};transition:background .12s" onmouseenter="if(!${isSel})this.style.background='var(--bg-hover)'" onmouseleave="if(!${isSel})this.style.background='${isToday?'var(--bg-elevated)':'var(--bg-surface)'}'">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:11px;font-weight:${isToday?'800':'500'};color:${isToday?'var(--brand)':'var(--text-primary)'}">${d}</span>
          ${evs.length>3?`<span style="font-size:8px;color:var(--text-muted)">+${evs.length-3}</span>`:''}
        </div>
        <div style="display:flex;gap:2px;flex-wrap:wrap;margin-top:6px">${dots}</div>
      </div>`;
  }).join('');

  /* ── Selected-day agenda ── */
  const selEvents = events[_mktCal.sel] || [];
  const selLabel = new Date(_mktCal.sel + 'T00:00').toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });
  const agenda = selEvents.length
    ? selEvents.map(e => {
        const m = CRM_APPT_META[e.type] || CRM_APPT_META.meeting;
        const click = e.action ? e.action : (e.appt ? `showToast('${e.title}','info')` : `void 0`);
        return `
        <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border);cursor:pointer" onclick="${click}" onmouseenter="this.style.background='var(--bg-hover)'" onmouseleave="this.style.background=''">
          <div style="width:42px;font-family:var(--font-mono);font-size:11px;color:var(--text-muted);padding-top:2px">${e.time || '—'}</div>
          <div style="width:3px;align-self:stretch;border-radius:2px;background:${m.color};flex-shrink:0"></div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:500;color:var(--text-primary)">${m.icon} ${e.title}</div>
            <div style="font-size:10px;color:var(--text-muted)">${m.label} · ${e.ref}${e.appt&&e.appt.location?' · '+e.appt.location:''}</div>
          </div>
        </div>`;
      }).join('')
    : `<div style="padding:28px 16px;text-align:center;color:var(--text-muted);font-size:12px">No appointments or trackers on this day.</div>`;

  el.innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'Total open actions', value:actions.length, color:'#6366f1' },
        { label:'Overdue',            value:overdue,        color:'var(--red)' },
        { label:'Due today',          value:today,          color:'var(--amber)' },
        { label:'Scheduled appts',    value:apptCount,      color:'var(--green)' },
      ].map(k=>`<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <!-- Calendar + day agenda -->
    <div style="display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start;margin-bottom:16px">
      <div class="card">
        <div class="card-header">
          <div style="display:flex;align-items:center;gap:10px">
            <span class="card-title">${monthLabel}</span>
            <div style="display:flex;gap:4px">
              <button class="btn-icon" title="Previous month" onclick="mktCalNav(-1)"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8 2L4 6.5L8 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
              <button class="btn-icon" title="Next month" onclick="mktCalNav(1)"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 2l4 4.5L5 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost btn-sm" onclick="mktCalToday()">Today</button>
            ${!isCoordinator ? `
            <button class="btn btn-primary btn-sm" onclick="mktScheduleAppt()">
              <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              Schedule
            </button>
            ` : ''}
          </div>
        </div>
        <div style="padding:4px 16px 12px">
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px">
            ${dow.map(d=>`<div style="text-align:center;font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em">${d}</div>`).join('')}
          </div>
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">${calCells}</div>
          <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:12px;font-size:10px;color:var(--text-secondary)">
            ${Object.values(CRM_APPT_META).map(m=>`<span style="display:flex;align-items:center;gap:5px"><span style="width:8px;height:8px;border-radius:50%;background:${m.color};display:inline-block"></span>${m.label}</span>`).join('')}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title" style="font-size:13px">${selLabel}</span>
          ${!isCoordinator ? `<button class="btn btn-ghost btn-sm" onclick="mktScheduleAppt('${_mktCal.sel}')">+ Add</button>` : ''}
        </div>
        <div>${agenda}</div>
      </div>
    </div>

    <!-- Prioritised action queue -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Action queue — prioritised by urgency</span>
        <button class="btn btn-ghost btn-sm" onclick="showToast('Queue refreshed','info');renderMktActionQueue()">Refresh</button>
      </div>
      <div>
        ${actions.map(a => {
          const ov = a.days < 0;
          const stale = a.kind === 'Stale opp';
          const col = stale ? 'var(--text-muted)' : ov ? 'var(--red)' : a.days < 7 ? 'var(--amber)' : 'var(--green)';
          const lbl = stale ? `${Math.abs(a.days)}d idle` : a.kind === 'Approval' ? 'Action now' : ov ? `${Math.abs(a.days)}d overdue` : a.days === 0 ? 'Today' : `${a.days}d`;
          return `
          <div style="display:flex;align-items:center;gap:14px;padding:13px 16px;border-bottom:1px solid var(--border);cursor:pointer" onclick="${a.action()}" onmouseenter="this.style.background='var(--bg-hover)'" onmouseleave="this.style.background=''">
            <div style="width:34px;height:34px;border-radius:var(--radius-sm);background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0">${a.icon}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;color:var(--text-primary);font-weight:500">${a.text}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px"><span class="badge ${kindCls[a.kind]||'badge-muted'}" style="font-size:9px">${a.kind}</span> · ${a.ref}</div>
            </div>
            <span style="font-size:12px;font-weight:700;color:${col};white-space:nowrap">${lbl}</span>
          </div>`;
        }).join('') || `<div style="padding:40px;text-align:center;color:var(--text-muted);font-size:13px">Queue is clear — nothing needs attention.</div>`}
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   NEW SUB-PAGE 6 — BID / TENDER CALENDAR
═══════════════════════════════════════════════════════════ */
function renderMktBidCalendar() {
  const el = document.getElementById('mktTabContent');
  if (!el) return;

  /* Build milestones: bid due + derived site-visit / clarification dates per tender. */
  const milestones = [];
  CRMData.tenders.forEach(t => {
    milestones.push({ date:t.due, type:'Bid submission', tender:t.id, name:t.name, client:t.client, value:t.value, stage:t.stage });
    const issued = new Date(t.issued);
    const clar = new Date(issued.getTime() + 7 * 86400000);
    const visit = new Date(issued.getTime() + 12 * 86400000);
    milestones.push({ date:clar.toISOString().split('T')[0],  type:'Clarification deadline', tender:t.id, name:t.name, client:t.client });
    milestones.push({ date:visit.toISOString().split('T')[0], type:'Site visit', tender:t.id, name:t.name, client:t.client });
  });
  milestones.sort((a,b) => new Date(a.date) - new Date(b.date));

  const typeColor = { 'Bid submission':'var(--red)', 'Site visit':'var(--blue)', 'Clarification deadline':'var(--amber)' };
  const upcoming = milestones.filter(m => crmDaysLeft(m.date) >= 0);

  /* Group by month */
  const byMonth = {};
  upcoming.forEach(m => {
    const key = new Date(m.date).toLocaleDateString('en-GB', { month:'long', year:'numeric' });
    (byMonth[key] = byMonth[key] || []).push(m);
  });

  el.innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'Upcoming milestones', value:upcoming.length, color:'#6366f1' },
        { label:'Bid submissions due', value:upcoming.filter(m=>m.type==='Bid submission').length, color:'var(--red)' },
        { label:'Site visits',         value:upcoming.filter(m=>m.type==='Site visit').length, color:'var(--blue)' },
        { label:'Total bid value',     value:crmFmt(CRMData.tenders.filter(t=>t.stage!=='submitted').reduce((s,t)=>s+t.value,0)), color:'var(--green)' },
      ].map(k=>`<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:22px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Bid & tender calendar</span>
        <div style="display:flex;gap:12px;font-size:11px">
          ${Object.entries(typeColor).map(([t,c])=>`<span style="display:flex;align-items:center;gap:5px"><span style="width:9px;height:9px;border-radius:2px;background:${c};display:inline-block"></span>${t}</span>`).join('')}
        </div>
      </div>
      ${Object.entries(byMonth).map(([month, items]) => `
        <div style="padding:8px 0">
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;padding:6px 16px">${month}</div>
          ${items.map(m => {
            const days = crmDaysLeft(m.date);
            const c = typeColor[m.type] || 'var(--text-muted)';
            return `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--border);cursor:pointer" onclick="openTenderDetail('${m.tender}')" onmouseenter="this.style.background='var(--bg-hover)'" onmouseleave="this.style.background=''">
              <div style="width:46px;text-align:center;flex-shrink:0">
                <div style="font-family:var(--font-display);font-size:15px;font-weight:700;color:var(--text-primary)">${new Date(m.date).getDate()}</div>
                <div style="font-size:9px;color:var(--text-muted)">${new Date(m.date).toLocaleDateString('en-GB',{month:'short'})}</div>
              </div>
              <div style="width:3px;height:34px;border-radius:2px;background:${c};flex-shrink:0"></div>
              <div style="flex:1;min-width:0">
                <div style="font-size:12px;font-weight:500;color:var(--text-primary)"><span style="color:${c}">${m.type}</span> — ${m.name}</div>
                <div style="font-size:10px;color:var(--text-muted)">${m.tender} · ${m.client}${m.value?' · '+crmFmt(m.value):''}</div>
              </div>
              <span style="font-size:11px;font-weight:600;color:${days<14?'var(--red)':days<30?'var(--amber)':'var(--text-muted)'};white-space:nowrap">in ${days}d</span>
            </div>`;
          }).join('')}
        </div>`).join('') || `<div style="padding:40px;text-align:center;color:var(--text-muted);font-size:13px">No upcoming bid milestones.</div>`}
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   NEW SUB-PAGE 7 — QUOTE APPROVALS (margin-gated sign-off)
═══════════════════════════════════════════════════════════ */
async function crmDecideApproval(id, decision) {
  const q = (CRMData.quoteApprovals || []).find(x => x.id === id);
  if (!q) return;

  // Persist the decision; map the updated row back into the cache. On failure
  // (demo mode), apply the decision locally so the queue still reflects it.
  try {
    const row = await CrmAPI.approvalDecide(q.serverId || q.id, decision);
    Object.assign(q, CrmMap.approval(row));
  } catch {
    q.status    = decision;
    q.decidedBy = (AppState && AppState.currentUser && AppState.currentUser.name) || 'GM';
    q.decidedOn = new Date().toISOString().split('T')[0];
  }
  showToast(`${q.id} ${decision === 'approved' ? 'approved' : 'rejected'}`, decision === 'approved' ? 'success' : 'warn');
  renderMktApprovals();
}

function renderMktApprovals() {
  const el = document.getElementById('mktTabContent');
  if (!el) return;

  const all      = CRMData.quoteApprovals || [];
  const pending  = all.filter(q => q.status === 'pending');
  const approved = all.filter(q => q.status === 'approved');
  const rejected = all.filter(q => q.status === 'rejected');
  const threshold = CRMData.marginThreshold || 20;
  const role = AppState.currentUser?.role || 'manager';
  const isManager = role === 'manager' || role === 'gm';
  const isGM = isManager;

  const statusCls = { pending:'badge-amber', approved:'badge-green', rejected:'badge-red' };

  el.innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:`Margin floor`,       value:threshold+'%',     color:'var(--text-primary)' },
        { label:'Pending sign-off',   value:pending.length,    color:'var(--amber)' },
        { label:'Approved',           value:approved.length,   color:'var(--green)' },
        { label:'Rejected',           value:rejected.length,   color:'var(--red)' },
      ].map(k=>`<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    ${!isGM ? `<div style="padding:11px 14px;background:var(--amber-bg);border-radius:var(--radius-md);font-size:12px;color:var(--amber);margin-bottom:16px">You can submit quotes for approval. Final sign-off is reserved for the Sales Manager / General Manager.</div>` : ''}

    <div class="card">
      <div class="card-header">
        <span class="card-title">Quote approval queue</span>
        <span style="font-size:11px;color:var(--text-muted)">Quotes below ${threshold}% gross margin require GM sign-off</span>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:1px solid var(--border-md)">
            ${['Ref','Quote','Client','Rev','Sell','Margin','Requested by','Status',''].map(h=>`<th style="text-align:left;padding:8px 12px;font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${all.map(q => {
            const low = q.margin < threshold;
            return `
            <tr style="border-bottom:1px solid var(--border)${q.status==='pending'?';background:var(--amber-bg)':''}">
              <td style="padding:10px 12px;font-family:var(--font-mono);font-size:11px;color:var(--brand)">${q.id}</td>
              <td style="padding:10px 12px;font-size:12px;font-weight:500;color:var(--text-primary);max-width:200px">${q.quote}</td>
              <td style="padding:10px 12px;font-size:12px;color:var(--text-secondary)">${q.client}</td>
              <td style="padding:10px 12px;font-size:11px;color:var(--text-muted)">${q.rev}</td>
              <td style="padding:10px 12px;font-size:12px;font-family:var(--font-mono);color:var(--text-primary)">${crmFmt(q.sell)}</td>
              <td style="padding:10px 12px;font-size:12px;font-weight:700;font-family:var(--font-mono);color:${low?'var(--red)':'var(--green)'}">${q.margin}%</td>
              <td style="padding:10px 12px;font-size:11px;color:var(--text-secondary)">${q.requestedBy}<div style="font-size:10px;color:var(--text-muted)">${q.requestedOn}</div></td>
              <td style="padding:10px 12px"><span class="badge ${statusCls[q.status]}">${q.status.charAt(0).toUpperCase()+q.status.slice(1)}</span></td>
              <td style="padding:10px 12px;white-space:nowrap">
                ${q.status === 'pending' && isGM
                  ? `<button class="btn btn-primary btn-sm" onclick="crmDecideApproval('${q.id}','approved')">Approve</button>
                     <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="crmDecideApproval('${q.id}','rejected')">Reject</button>`
                  : q.status === 'pending'
                    ? `<span style="font-size:11px;color:var(--text-muted)">Awaiting Sign-off</span>`
                    : `<span style="font-size:11px;color:var(--text-muted)">${q.decidedBy} · ${q.decidedOn}</span>`}
              </td>
            </tr>
            ${q.reason ? `<tr><td colspan="9" style="padding:0 12px 10px 12px;font-size:11px;color:var(--text-muted);font-style:italic">${low?'⚠ ':''}${q.reason}</td></tr>` : ''}`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   NEW SUB-PAGE 8 — QUOTE LOG (submitted quotes by RFQ / customer)
═══════════════════════════════════════════════════════════ */
let _mktQuoteFilter = { status:'all', client:'all', q:'' };

const QUOTE_STATUS_CLS = { submitted:'badge-blue', pending:'badge-amber', negotiation:'badge-accent', won:'badge-green', lost:'badge-red', revised:'badge-muted' };
const QUOTE_STATUS_LBL = { submitted:'Submitted', pending:'Pending', negotiation:'Negotiation', won:'Won', lost:'Lost', revised:'Revised' };

function mktQuoteFilter(field, value) { _mktQuoteFilter[field] = value; renderMktQuoteLog(); }

/* Latest revision = current state of the quote. */
function crmQuoteCurrent(q) { return q.revisions[q.revisions.length - 1]; }
/* First revision = original submission. */
function crmQuoteOrigin(q) { return q.revisions[0]; }
/* Representative line breakdown summing to the current revision value. */
function crmQuoteLines(q) {
  if (q.lines) return q.lines;
  const v = crmQuoteCurrent(q).value;
  return [
    { desc:'Materials & plate',                 amount:Math.round(v*0.45) },
    { desc:'Fabrication & welding labour',      amount:Math.round(v*0.30) },
    { desc:'NDT & inspection',                  amount:Math.round(v*0.10) },
    { desc:'Surface treatment & coating',       amount:Math.round(v*0.08) },
    { desc:'Engineering, PM & TPI',             amount:Math.round(v*0.07) },
  ];
}
function crmQuoteById(id) { return (CRMData.quoteLog || []).find(q => q.id === id); }

function renderMktQuoteLog() {
  const el = document.getElementById('mktTabContent');
  if (!el) return;

  const all = CRMData.quoteLog || [];
  const clients = [...new Set(all.map(q => q.client))].sort();
  const f = _mktQuoteFilter;
  const term = f.q.trim().toLowerCase();
  const rows = all.filter(q =>
    (f.status === 'all' || q.status === f.status) &&
    (f.client === 'all' || q.client === f.client) &&
    (!term || `${q.id} ${q.rfq} ${q.client} ${q.project}`.toLowerCase().includes(term))
  ).sort((a,b) => new Date(crmQuoteCurrent(b).date) - new Date(crmQuoteCurrent(a).date));

  const totalVal = all.reduce((s,q) => s + crmQuoteCurrent(q).value, 0);
  const wonVal   = all.filter(q => q.status === 'won').reduce((s,q) => s + crmQuoteCurrent(q).value, 0);
  const openVal  = all.filter(q => ['submitted','pending','negotiation'].includes(q.status)).reduce((s,q) => s + crmQuoteCurrent(q).value, 0);
  const decided  = all.filter(q => ['won','lost'].includes(q.status)).length;
  const winRate  = decided ? Math.round(all.filter(q => q.status === 'won').length / decided * 100) : 0;

  const selStyle = 'background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:6px 10px;font-size:12px;color:var(--text-primary);outline:none;font-family:var(--font-body)';

  el.innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'Quotes logged',    value:all.length,        color:'#6366f1' },
        { label:'Open value',       value:crmFmt(openVal),   color:'var(--blue)' },
        { label:'Won value',        value:crmFmt(wonVal),    color:'var(--green)' },
        { label:'Win rate',         value:winRate+'%',       color:winRate>50?'var(--green)':'var(--amber)' },
      ].map(k=>`<div class="metric-card"><div class="metric-label">${k.label}</div><div class="metric-value" style="font-size:24px;color:${k.color}">${k.value}</div></div>`).join('')}
    </div>

    <div class="card">
      <div class="card-header" style="flex-wrap:wrap;gap:10px">
        <span class="card-title">Quote log</span>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input type="text" placeholder="Search RFQ, client, project…" value="${f.q}"
            oninput="_mktQuoteFilter.q=this.value;clearTimeout(window._qlT);window._qlT=setTimeout(renderMktQuoteLog,250)"
            style="${selStyle};min-width:200px"/>
          <select style="${selStyle}" onchange="mktQuoteFilter('client',this.value)">
            <option value="all"${f.client==='all'?' selected':''}>All clients</option>
            ${clients.map(c=>`<option value="${c}"${f.client===c?' selected':''}>${c}</option>`).join('')}
          </select>
          <select style="${selStyle}" onchange="mktQuoteFilter('status',this.value)">
            <option value="all"${f.status==='all'?' selected':''}>All statuses</option>
            ${Object.keys(QUOTE_STATUS_LBL).map(s=>`<option value="${s}"${f.status===s?' selected':''}>${QUOTE_STATUS_LBL[s]}</option>`).join('')}
          </select>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:1px solid var(--border-md)">
            ${['Quote #','Rev','RFQ / Opp','Client','Project','Value','Margin','Last revised','Valid until','Status',''].map(h=>`<th style="text-align:left;padding:8px 12px;font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;white-space:nowrap">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(q => {
            const cur = crmQuoteCurrent(q);
            const expSoon = q.status !== 'won' && q.status !== 'lost' && crmDaysLeft(q.validUntil) < 14;
            return `
            <tr style="border-bottom:1px solid var(--border);cursor:pointer" onclick="openQuoteDetail('${q.id}')" onmouseenter="this.style.background='var(--bg-hover)'" onmouseleave="this.style.background=''">
              <td style="padding:10px 12px;font-family:var(--font-mono);font-size:11px;color:var(--brand)">${q.id}</td>
              <td style="padding:10px 12px;font-size:11px;color:var(--text-muted)">${cur.rev}${q.revisions.length>1?` <span style="color:var(--text-hint)">(${q.revisions.length})</span>`:''}</td>
              <td style="padding:10px 12px;font-family:var(--font-mono);font-size:11px;color:var(--text-secondary)">${q.rfq}</td>
              <td style="padding:10px 12px;font-size:12px;font-weight:500;color:var(--text-primary)">${q.client}</td>
              <td style="padding:10px 12px;font-size:12px;color:var(--text-secondary);max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${q.project}</td>
              <td style="padding:10px 12px;font-size:12px;font-family:var(--font-mono);color:var(--text-primary)">${crmFmt(cur.value)}</td>
              <td style="padding:10px 12px;font-size:12px;font-weight:600;font-family:var(--font-mono);color:${cur.margin<(CRMData.marginThreshold||20)?'var(--red)':'var(--green)'}">${cur.margin}%</td>
              <td style="padding:10px 12px;font-size:11px;color:var(--text-secondary);white-space:nowrap">${cur.date}</td>
              <td style="padding:10px 12px;font-size:11px;white-space:nowrap;color:${expSoon?'var(--amber)':'var(--text-muted)'}">${q.validUntil}${expSoon?' ⚠':''}</td>
              <td style="padding:10px 12px"><span class="badge ${QUOTE_STATUS_CLS[q.status]||'badge-muted'}">${QUOTE_STATUS_LBL[q.status]||q.status}</span></td>
              <td style="padding:10px 12px"><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openQuoteDetail('${q.id}')">View</button></td>
            </tr>`;
          }).join('') || `<tr><td colspan="11" style="padding:40px;text-align:center;color:var(--text-muted);font-size:13px">No quotes match the current filters.</td></tr>`}
        </tbody>
      </table>
      <div style="padding:12px 16px;font-size:11px;color:var(--text-muted);border-top:1px solid var(--border)">
        Showing ${rows.length} of ${all.length} quotes · Total quoted value: <strong style="color:var(--text-primary)">${crmFmt(totalVal)}</strong>
      </div>
    </div>`;
}

/* ── Quotation document view + revision history ── */
function openQuoteDetail(id) {
  const q = crmQuoteById(id);
  if (!q) return;
  const cur = crmQuoteCurrent(q);
  const lines = crmQuoteLines(q);
  const lineTotal = lines.reduce((s,l) => s + l.amount, 0);
  const closed = q.status === 'won' || q.status === 'lost';

  openCRMModal(`
    <div style="background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg)">
      <div style="padding:18px 22px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--brand);margin-bottom:4px">${q.id} · ${cur.rev}</div>
          <div style="font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--text-primary)">${q.project}</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${q.client} · RFQ ${q.rfq} · Owner ${q.owner}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:flex-start">
          <span class="badge ${QUOTE_STATUS_CLS[q.status]||'badge-muted'}">${QUOTE_STATUS_LBL[q.status]||q.status}</span>
          <button class="btn-icon" onclick="closeCRMModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
      </div>

      <div style="padding:20px 22px;display:flex;flex-direction:column;gap:16px">
        <!-- Current commercials -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          ${[
            ['Current value', crmFmt(cur.value), 'var(--brand)'],
            ['Margin', cur.margin+'%', cur.margin<(CRMData.marginThreshold||20)?'var(--red)':'var(--green)'],
            ['Valid until', q.validUntil, 'var(--text-primary)'],
          ].map(([l,v,c])=>`
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px;text-align:center">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:4px">${l}</div>
              <div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:${c}">${v}</div>
            </div>`).join('')}
        </div>

        <!-- Quotation line breakdown -->
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:8px">Quotation breakdown</div>
          <table style="width:100%;border-collapse:collapse">
            <tbody>
              ${lines.map(l=>`
                <tr style="border-bottom:1px solid var(--border)">
                  <td style="padding:8px 4px;font-size:12px;color:var(--text-secondary)">${l.desc}</td>
                  <td style="padding:8px 4px;font-size:12px;font-family:var(--font-mono);color:var(--text-primary);text-align:right">${crmFmt(l.amount)}</td>
                </tr>`).join('')}
              <tr>
                <td style="padding:10px 4px;font-size:12px;font-weight:700;color:var(--text-primary)">Total (${q.currency||'USD'})</td>
                <td style="padding:10px 4px;font-size:14px;font-weight:700;font-family:var(--font-mono);color:var(--brand);text-align:right">${crmFmt(lineTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Revision history -->
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em">Revision history (${q.revisions.length})</div>
            ${!closed ? `<button class="btn btn-primary btn-sm" onclick="openNewRevisionModal('${q.id}')">
              <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              New revision</button>` : ''}
          </div>
          <div style="display:flex;flex-direction:column">
            ${q.revisions.slice().reverse().map((r,i) => {
              const isLatest = i === 0;
              const prev = q.revisions[q.revisions.length - 1 - i - 1];
              const delta = prev ? r.value - prev.value : 0;
              return `
              <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
                <div style="width:10px;display:flex;flex-direction:column;align-items:center;padding-top:3px">
                  <span style="width:9px;height:9px;border-radius:50%;background:${isLatest?'var(--brand)':'var(--border-strong)'};flex-shrink:0"></span>
                </div>
                <div style="flex:1;min-width:0">
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                    <span style="font-size:12px;font-weight:600;color:var(--text-primary)">${r.rev}${isLatest?' <span class="badge badge-green" style="font-size:8px">CURRENT</span>':''}</span>
                    <span style="font-size:11px;font-family:var(--font-mono);color:var(--text-muted)">${r.date}</span>
                  </div>
                  <div style="display:flex;gap:14px;margin-top:3px;font-size:11px">
                    <span style="font-family:var(--font-mono);color:var(--text-primary)">${crmFmt(r.value)}</span>
                    <span style="color:${r.margin<(CRMData.marginThreshold||20)?'var(--red)':'var(--green)'}">${r.margin}% margin</span>
                    ${delta ? `<span style="color:${delta<0?'var(--red)':'var(--green)'};font-family:var(--font-mono)">${delta<0?'▼':'▲'} ${crmFmt(Math.abs(delta))}</span>` : ''}
                  </div>
                  ${r.note ? `<div style="font-size:11px;color:var(--text-muted);margin-top:3px;font-style:italic">${r.note}</div>` : ''}
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${!closed ? `<button class="btn btn-primary btn-sm" onclick="openNewRevisionModal('${q.id}')">Create revision</button>` : ''}
          <button class="btn btn-secondary btn-sm" onclick="showToast('Generating quotation PDF for ${q.id} ${cur.rev}','success')">Download PDF</button>
          <button class="btn btn-secondary btn-sm" onclick="closeCRMModal();openOppDetail('${q.rfq}')">View opportunity</button>
          <button class="btn btn-ghost btn-sm" onclick="closeCRMModal()">Close</button>
        </div>
      </div>
    </div>`);
}

/* ── Create a new revision during negotiation ── */
function openNewRevisionModal(id) {
  const q = crmQuoteById(id);
  if (!q) return;
  const cur = crmQuoteCurrent(q);
  const nextRev = 'Rev ' + String.fromCharCode(65 + q.revisions.length);
  const lbl = 'font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;display:block;margin-bottom:4px';
  const inp = 'width:100%;background:var(--bg-surface);border:1px solid var(--border-md);border-radius:var(--radius-sm);padding:8px 12px;font-size:13px;color:var(--text-primary);outline:none;font-family:var(--font-body)';

  openCRMModal(`
    <div style="background:var(--bg-elevated);border:1px solid var(--border-md);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-lg)">
      <div style="padding:18px 22px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">New revision — ${nextRev}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${q.id} · ${q.client} · supersedes ${cur.rev}</div>
        </div>
        <button class="btn-icon" onclick="closeCRMModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div style="padding:20px 22px;display:flex;flex-direction:column;gap:13px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <label style="${lbl}">Revised value (${q.currency||'USD'})</label>
            <input id="revValue" type="number" value="${cur.value}" style="${inp};font-family:var(--font-mono)"/>
          </div>
          <div>
            <label style="${lbl}">Margin %</label>
            <input id="revMargin" type="number" step="0.1" value="${cur.margin}" style="${inp};font-family:var(--font-mono)"/>
          </div>
        </div>
        <div>
          <label style="${lbl}">Revision note</label>
          <textarea id="revNote" rows="2" placeholder="What changed in this revision and why…" style="${inp};resize:vertical"></textarea>
        </div>
        <div>
          <label style="${lbl}">Status after this revision</label>
          <select id="revStatus" style="${inp}">
            ${['negotiation','submitted','pending','won','lost'].map(s=>`<option value="${s}"${q.status===s?' selected':''}>${QUOTE_STATUS_LBL[s]}</option>`).join('')}
          </select>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="saveNewRevision('${q.id}')">Save revision</button>
          <button class="btn btn-secondary" onclick="closeCRMModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function saveNewRevision(id) {
  const q = crmQuoteById(id);
  if (!q) return;
  const value  = +(document.getElementById('revValue')  || {}).value || 0;
  const margin = +(document.getElementById('revMargin') || {}).value || 0;
  const note   = ((document.getElementById('revNote')   || {}).value || '').trim();
  const status = (document.getElementById('revStatus')  || {}).value || q.status;
  if (!value) { showToast('Revised value is required', 'warn'); return; }

  const rev = 'Rev ' + String.fromCharCode(65 + q.revisions.length);
  q.revisions.push({ rev, date: new Date().toISOString().split('T')[0], value, margin, note: note || `${rev} issued.` });
  q.status = status;
  showToast(`${q.id} ${rev} saved`, 'success');
  openQuoteDetail(id);      // refresh the detail modal
  renderMktQuoteLog();      // refresh the underlying table
}

