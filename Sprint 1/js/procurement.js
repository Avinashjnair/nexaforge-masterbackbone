/* ============================================================
   NexaForge ERP — Procurement Module
   Covers: Purchase Requests (PR) · Purchase Orders (PO)
           Approved Vendor List (AVL) · GRN log · Overview KPIs
   ============================================================ */

'use strict';

/* ── Data store ─────────────────────────────────────────────── */
const ProcData = {
  selectedProject: 'all',
  activeTab: 'overview',

  prs: [
    {
      id: 'PR-2024-089', project: 'P-2402', item: 'SA-240 304 plate 12mm', pn: 'SHELL-PV-304',
      qty: 1, unit: 'SET', requiredBy: '2025-07-01', priority: 'high',
      status: 'pending', raisedBy: 'Store Manager', raised: '2025-04-20',
      approvedBy: null, poRef: null,
      justification: 'Critical path item — shell fabrication cannot start without plates.'
    },
    {
      id: 'PR-2024-088', project: 'P-2401', item: 'Nozzle DN50 150LB WNRF', pn: 'NZ-50-150LB',
      qty: 4, unit: 'EA', requiredBy: '2025-07-15', priority: 'medium',
      status: 'po-issued', raisedBy: 'Production', raised: '2025-04-15',
      approvedBy: 'Procurement Mgr', poRef: 'PO-2024-415',
      justification: 'Stock depleted — 2 EA on hand, 6 EA required per BOM.'
    },
    {
      id: 'PR-2024-087', project: 'P-2401', item: 'Top angle 316L 75×75×8', pn: 'ANG-316L-75',
      qty: 20, unit: 'M', requiredBy: '2025-07-01', priority: 'medium',
      status: 'po-issued', raisedBy: 'Production', raised: '2025-04-10',
      approvedBy: 'Procurement Mgr', poRef: 'PO-2024-414',
      justification: 'Remnant stock insufficient — 18M on hand, 32M required.'
    },
    {
      id: 'PR-2024-086', project: 'P-2402', item: '2:1 Ellipsoidal heads SA-240 304', pn: 'HEAD-EL-304',
      qty: 4, unit: 'EA', requiredBy: '2025-07-15', priority: 'high',
      status: 'pending', raisedBy: 'Production', raised: '2025-04-22',
      approvedBy: null, poRef: null,
      justification: 'Required for 3-unit pressure vessel assembly. Long lead item.'
    },
    {
      id: 'PR-2024-085', project: 'P-2401', item: 'Shell plate 316L 10mm', pn: 'PLT-316L-10',
      qty: 8, unit: 'SHT', requiredBy: '2025-06-10', priority: 'high',
      status: 'grn-received', raisedBy: 'Store Manager', raised: '2025-03-20',
      approvedBy: 'Procurement Mgr', poRef: 'PO-2024-412',
      justification: 'MRP shortfall — 10 SHT on hand vs 18 SHT required.'
    },
    {
      id: 'PR-2024-084', project: 'P-2401', item: 'Grinding discs 125mm', pn: 'GRND-125',
      qty: 60, unit: 'EA', requiredBy: '2025-06-01', priority: 'low',
      status: 'grn-received', raisedBy: 'Store Manager', raised: '2025-03-15',
      approvedBy: 'Procurement Mgr', poRef: 'PO-2024-411',
      justification: 'Consumable replenishment — stock below reorder level.'
    },
  ],

  pos: [
    {
      id: 'PO-2024-415', project: 'P-2401', supplier: 'Boltun / ITW',
      item: 'Nozzle DN50 150LB WNRF', pn: 'NZ-50-150LB',
      qty: 4, unit: 'EA', value: 4800,
      issued: '2025-04-16', deliveryDate: '2025-06-30',
      status: 'confirmed', prRef: 'PR-2024-088',
      paymentTerms: '30 days net', notes: 'Confirm MTC with delivery.'
    },
    {
      id: 'PO-2024-414', project: 'P-2401', supplier: 'Outokumpu',
      item: 'Top angle 316L 75×75×8', pn: 'ANG-316L-75',
      qty: 20, unit: 'M', value: 3200,
      issued: '2025-04-12', deliveryDate: '2025-06-28',
      status: 'in-transit', prRef: 'PR-2024-087',
      paymentTerms: '45 days net', notes: 'Shipment departed Helsinki 2025-05-10.'
    },
    {
      id: 'PO-2024-413', project: 'P-2403', supplier: 'Rolled Alloys',
      item: 'Tube sheet 316L TS-01', pn: 'TS-316L-01',
      qty: 2, unit: 'EA', value: 12400,
      issued: '2025-03-25', deliveryDate: '2025-04-20',
      status: 'overdue', prRef: null,
      paymentTerms: '30 days net', notes: 'Delivery missed — supplier citing production delays. NCR-031 raised on received batch.'
    },
    {
      id: 'PO-2024-412', project: 'P-2401', supplier: 'Outokumpu',
      item: 'Shell plate 316L 10mm (8 SHT)', pn: 'PLT-316L-10',
      qty: 8, unit: 'SHT', value: 28600,
      issued: '2025-03-22', deliveryDate: '2025-05-15',
      status: 'grn-received', prRef: 'PR-2024-085',
      paymentTerms: '45 days net', notes: 'GRN-088 logged. QC pass — batch HN-44810.'
    },
    {
      id: 'PO-2024-411', project: 'P-2401', supplier: 'Lincoln Electric',
      item: 'Filler wire ER316L 45kg', pn: 'WELD-ER316L',
      qty: 45, unit: 'KG', value: 1350,
      issued: '2025-03-10', deliveryDate: '2025-03-28',
      status: 'grn-received', prRef: 'PR-2024-084',
      paymentTerms: '30 days net', notes: 'GRN-086 logged. QC pass — lot FW-2231.'
    },
  ],

  vendors: [
    {
      id: 'V-001', name: 'Outokumpu', category: '316L / 304 SS plate & coil',
      country: 'Finland', status: 'approved',
      prequalDate: '2024-01-15', nextReview: '2026-01-15',
      score: 94, onTime: 91, ncrRate: 1.2, orders: 14,
      mtcCapability: true, iso: 'ISO 9001:2015', adnocApproved: true,
      contact: 'sales.me@outokumpu.com', trend: 'up'
    },
    {
      id: 'V-002', name: 'Rolled Alloys', category: 'Specialty alloy plate',
      country: 'USA', status: 'conditional',
      prequalDate: '2023-06-01', nextReview: '2025-06-01',
      score: 72, onTime: 78, ncrRate: 4.8, orders: 6,
      mtcCapability: true, iso: 'ISO 9001:2015', adnocApproved: false,
      contact: 'orders@rolledalloys.com', trend: 'down'
    },
    {
      id: 'V-003', name: 'Sandvik', category: 'Tube & pipe stainless',
      country: 'Sweden', status: 'approved',
      prequalDate: '2024-03-10', nextReview: '2026-03-10',
      score: 88, onTime: 93, ncrRate: 1.8, orders: 9,
      mtcCapability: true, iso: 'ISO 9001:2015', adnocApproved: true,
      contact: 'tubes.me@sandvik.com', trend: 'stable'
    },
    {
      id: 'V-004', name: 'Boltun / ITW', category: 'Flanges & fittings',
      country: 'UAE', status: 'approved',
      prequalDate: '2024-06-20', nextReview: '2026-06-20',
      score: 95, onTime: 97, ncrRate: 0.5, orders: 22,
      mtcCapability: true, iso: 'ISO 9001:2015', adnocApproved: true,
      contact: 'procurement@boltun.ae', trend: 'up'
    },
    {
      id: 'V-005', name: 'Lincoln Electric', category: 'Welding consumables',
      country: 'USA', status: 'approved',
      prequalDate: '2023-11-01', nextReview: '2025-11-01',
      score: 98, onTime: 99, ncrRate: 0.2, orders: 31,
      mtcCapability: true, iso: 'ISO 9001:2015', adnocApproved: true,
      contact: 'me.sales@lincolnelectric.com', trend: 'up'
    },
    {
      id: 'V-006', name: 'Al Essa Industrial', category: 'Carbon steel & structural',
      country: 'UAE', status: 'approved',
      prequalDate: '2024-02-10', nextReview: '2026-02-10',
      score: 85, onTime: 88, ncrRate: 2.1, orders: 17,
      mtcCapability: false, iso: 'ISO 9001:2015', adnocApproved: false,
      contact: 'sales@alessa.ae', trend: 'stable'
    },
    {
      id: 'V-007', name: 'Emirates Steel', category: 'CS plate, angles & channels',
      country: 'UAE', status: 'under-review',
      prequalDate: null, nextReview: null,
      score: null, onTime: null, ncrRate: null, orders: 0,
      mtcCapability: true, iso: null, adnocApproved: false,
      contact: 'procurement@emiratessteel.ae', trend: 'stable'
    },
  ],

  grns: [
    {
      id: 'GRN-089', project: 'P-2402', poRef: null,
      item: 'Dish ends — 2:1 ellipsoidal SA-240 304', pn: 'HEAD-EL-304',
      supplier: 'Endress+Hauser', qty: '6 EA',
      received: '2025-04-28', receivedBy: 'Store Manager',
      status: 'pending-qc', heatNo: 'DH-2204',
      notes: 'Received without prior PO — emergency delivery. Pending QC clearance.'
    },
    {
      id: 'GRN-088', project: 'P-2401', poRef: 'PO-2024-412',
      item: 'Shell plates 316L 10mm', pn: 'PLT-316L-10',
      supplier: 'Outokumpu', qty: '4 SHT',
      received: '2025-03-10', receivedBy: 'Store Manager',
      status: 'qc-pass', heatNo: 'HN-44810',
      notes: 'All MTCs verified. QC clearance IR-001 issued.'
    },
    {
      id: 'GRN-087', project: 'P-2403', poRef: 'PO-2024-413',
      item: 'Tube sheet 316L TS-01', pn: 'TS-316L-01',
      supplier: 'Rolled Alloys', qty: '2 EA',
      received: '2025-04-01', receivedBy: 'Store Manager',
      status: 'qc-fail', heatNo: 'HN-44821',
      notes: 'QC FAIL — Mo content 2.08% vs min 2.10%. NCR-031 raised. Material quarantined.'
    },
    {
      id: 'GRN-086', project: 'P-2401', poRef: 'PO-2024-411',
      item: 'Filler wire ER316L 45kg', pn: 'WELD-ER316L',
      supplier: 'Lincoln Electric', qty: '45 KG',
      received: '2025-03-28', receivedBy: 'Store Manager',
      status: 'qc-pass', heatNo: 'FW-2231',
      notes: 'Lot traceability confirmed. Released to weld bay store.'
    },
  ]
};

/* ── Active tab state ───────────────────────────────────────── */
let procActiveTab = 'overview';

/* ── Main renderer ──────────────────────────────────────────── */
async function renderProcurement() {
  const el = document.getElementById('pageContent');

  // Load live data
  const [posRes] = await Promise.allSettled([
    ProcurementAPI.pos({ limit: 100 })
  ]);

  if (posRes.status === 'fulfilled') {
    const rawPOs = posRes.value.materialRequests || posRes.value || [];
    ProcData.pos = rawPOs.map(po => ({
      id: po.id,
      project: po.project_id || 'all',
      supplier: po.supplier_name || '—',
      item: po.item_description || '—',
      pn: po.part_number || '—',
      qty: po.quantity || 0,
      unit: po.unit || 'EA',
      value: po.estimated_cost || 0,
      issued: po.created_at || new Date(),
      deliveryDate: po.required_date || new Date(),
      status: po.status === 'ordered' ? 'confirmed' : po.status === 'received' ? 'grn-received' : po.status,
      prRef: po.id
    }));
  }

  const openPRs  = ProcData.prs.filter(p => p.status === 'pending').length;
  const overduePOs = ProcData.pos.filter(p => p.status === 'overdue').length;

  el.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Procurement</div>
        <div class="page-subtitle">Purchase requests · PO management · Approved vendor list · Goods receipt</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary btn-sm" onclick="renderProcurement()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M13 7.5A5.5 5.5 0 112.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M2 2v3h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Refresh
        </button>
        <button class="btn btn-primary btn-sm" onclick="openRaisePRModal()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Raise PR
        </button>
      </div>
    </div>

    <!-- Sub-tabs -->
    <div class="proc-tabs">
      <button class="proc-tab active" data-ptab="overview"  onclick="switchProcTab('overview')">
        Overview
      </button>
      <button class="proc-tab" data-ptab="prs" onclick="switchProcTab('prs')">
        Purchase Requests
        ${openPRs > 0 ? `<span class="proc-tab-count warn">${openPRs} pending</span>` : ''}
      </button>
      <button class="proc-tab" data-ptab="pos" onclick="switchProcTab('pos')">
        Purchase Orders
        ${overduePOs > 0 ? `<span class="proc-tab-count err">${overduePOs} overdue</span>` : ''}
      </button>
      <button class="proc-tab" data-ptab="avl" onclick="switchProcTab('avl')">
        Vendor List (AVL)
      </button>
      <button class="proc-tab" data-ptab="grn" onclick="switchProcTab('grn')">
        GRN Log
      </button>
    </div>

    <div id="procTabContent"></div>

    <!-- Modal -->
    <div id="procModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:200;backdrop-filter:blur(5px)" onclick="closeProcModal()">
      <div id="procModalContent" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(560px,94vw)" onclick="event.stopPropagation()"></div>
    </div>
  `;

  switchProcTab(procActiveTab);
}

function switchProcTab(tab) {
  procActiveTab = tab;
  document.querySelectorAll('.proc-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.ptab === tab);
  });
  const map = {
    overview: renderProcOverview,
    prs:      renderProcPRs,
    pos:      renderProcPOs,
    avl:      renderProcAVL,
    grn:      renderProcGRN,
  };
  if (map[tab]) map[tab]();
}

function closeProcModal() { document.getElementById('procModal').style.display = 'none'; }
function openProcModal(html) {
  document.getElementById('procModalContent').innerHTML = html;
  document.getElementById('procModal').style.display = 'block';
}

/* ═══════════════════════════════════════════════════════════
   TAB 1 — OVERVIEW
═══════════════════════════════════════════════════════════ */
function renderProcOverview() {
  const totalPOValue   = ProcData.pos.reduce((s, p) => s + p.value, 0);
  const openPRs        = ProcData.prs.filter(p => p.status === 'pending').length;
  const activePOs      = ProcData.pos.filter(p => !['grn-received'].includes(p.status)).length;
  const overduePOs     = ProcData.pos.filter(p => p.status === 'overdue').length;
  const pendingGRNs    = ProcData.grns.filter(g => g.status === 'pending-qc').length;

  const prByStatus = {
    pending:       ProcData.prs.filter(p => p.status === 'pending').length,
    'po-issued':   ProcData.prs.filter(p => p.status === 'po-issued').length,
    'grn-received':ProcData.prs.filter(p => p.status === 'grn-received').length,
  };

  document.getElementById('procTabContent').innerHTML = `
    <!-- KPI strip -->
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label: 'Open purchase requests', value: openPRs,     color: openPRs > 0 ? 'var(--amber)' : 'var(--text-muted)' },
        { label: 'Active POs',             value: activePOs,   color: 'var(--blue)' },
        { label: 'Overdue POs',            value: overduePOs,  color: overduePOs > 0 ? 'var(--red)' : 'var(--text-muted)' },
        { label: 'Pending GRN / QC',       value: pendingGRNs, color: pendingGRNs > 0 ? 'var(--amber)' : 'var(--text-muted)' },
        { label: 'Total PO value (YTD)',    value: fmt(totalPOValue), color: 'var(--green)' },
      ].map(k => `
        <div class="metric-card">
          <div class="metric-label">${k.label}</div>
          <div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div>
        </div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
      <!-- PR pipeline funnel -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">PR pipeline</span>
          <button class="btn btn-ghost btn-sm" onclick="switchProcTab('prs')">All PRs →</button>
        </div>
        ${[
          { label: 'Pending approval', count: prByStatus['pending'],       color: 'var(--amber)', icon: '⏳' },
          { label: 'PO issued',        count: prByStatus['po-issued'],     color: 'var(--blue)',  icon: '📄' },
          { label: 'GRN received',     count: prByStatus['grn-received'],  color: 'var(--green)', icon: '✓' },
        ].map(s => `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
            <div style="width:32px;height:32px;border-radius:var(--radius-sm);background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;font-size:16px">${s.icon}</div>
            <div style="flex:1">
              <div style="font-size:12px;color:var(--text-secondary)">${s.label}</div>
            </div>
            <div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:${s.color}">${s.count}</div>
          </div>`).join('')}
        <button class="btn btn-secondary btn-sm" style="margin-top:12px;width:100%" onclick="openRaisePRModal()">
          <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Raise new PR
        </button>
      </div>

      <!-- PO status summary -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">PO status</span>
          <button class="btn btn-ghost btn-sm" onclick="switchProcTab('pos')">All POs →</button>
        </div>
        ${ProcData.pos.map(po => {
          const stMap = {
            confirmed:     ['var(--blue)',  'Confirmed'],
            'in-transit':  ['var(--brand)', 'In transit'],
            overdue:       ['var(--red)',    'Overdue'],
            'grn-received':['var(--green)',  'Received'],
            draft:         ['var(--text-muted)', 'Draft'],
          };
          const [col, lbl] = stMap[po.status] || ['var(--text-muted)', po.status];
          const days = daysUntil(po.deliveryDate);
          const daysStr = po.status === 'grn-received' ? 'Received' : po.status === 'overdue' ? `${Math.abs(days)}d late` : `${days}d`;
          const daysCol = po.status === 'overdue' ? 'var(--red)' : days < 14 ? 'var(--amber)' : 'var(--text-muted)';
          return `
          <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
            <div style="width:8px;height:8px;border-radius:50%;background:${col};flex-shrink:0;box-shadow:0 0 5px ${col}60"></div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:500;color:var(--text-primary);font-family:var(--font-mono)">${po.id}</div>
              <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${po.item}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:11px;color:${col};font-weight:500">${lbl}</div>
              <div style="font-size:10px;color:${daysCol}">${daysStr}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Recent GRNs + spend by project -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <!-- Recent GRNs -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Recent GRN activity</span>
          <button class="btn btn-ghost btn-sm" onclick="switchProcTab('grn')">All GRNs →</button>
        </div>
        ${ProcData.grns.slice(0, 4).map(g => {
          const stMap = { 'pending-qc':'var(--amber)', 'qc-pass':'var(--green)', 'qc-fail':'var(--red)' };
          const stLbl = { 'pending-qc':'Pending QC', 'qc-pass':'QC Pass', 'qc-fail':'QC Fail' };
          const col = stMap[g.status] || 'var(--text-muted)';
          return `
          <div style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border)">
            <div style="width:8px;height:8px;border-radius:50%;background:${col};flex-shrink:0;margin-top:4px;box-shadow:0 0 5px ${col}60"></div>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:500;color:var(--text-primary)">${g.id} <span style="font-size:10px;color:var(--text-muted);font-family:var(--font-mono)">${g.project}</span></div>
              <div style="font-size:11px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${g.item}</div>
              <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${g.supplier} · ${g.received}</div>
            </div>
            <span class="badge" style="font-size:10px;background:${col}18;color:${col};border:1px solid ${col}40;flex-shrink:0">${stLbl[g.status]||g.status}</span>
          </div>`;
        }).join('')}
        <button class="btn btn-secondary btn-sm" style="margin-top:12px;width:100%" onclick="openLogGRNModal()">Log new GRN</button>
      </div>

      <!-- Spend by project -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">PO spend by project</span>
        </div>
        ${AppState.projects.map(proj => {
          const projPOs   = ProcData.pos.filter(p => p.project === proj.id);
          const projSpend = projPOs.reduce((s, p) => s + p.value, 0);
          const pct = totalPOValue ? Math.round((projSpend / totalPOValue) * 100) : 0;
          const col = { 'P-2401':'var(--brand)', 'P-2402':'var(--blue)', 'P-2403':'var(--amber)' }[proj.id] || 'var(--green)';
          return `
          <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
              <div>
                <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${proj.id}</span>
                <span style="font-size:12px;color:var(--text-primary);margin-left:6px">${proj.name.split('—')[0].trim()}</span>
              </div>
              <span style="font-family:var(--font-display);font-size:14px;font-weight:700;color:${col}">${fmt(projSpend)}</span>
            </div>
            <div class="progress-bar" style="height:5px">
              <div class="progress-fill" style="width:${pct}%;background:${col}"></div>
            </div>
          </div>`;
        }).join('')}
        <div style="padding-top:12px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:12px;color:var(--text-secondary)">Total PO commitment</span>
          <span style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--text-primary)">${fmt(totalPOValue)}</span>
        </div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   TAB 2 — PURCHASE REQUESTS
═══════════════════════════════════════════════════════════ */
let prFilter = 'all';

function renderProcPRs() {
  const statusMap = {
    pending:       ['badge-amber',  'Pending approval'],
    approved:      ['badge-blue',   'Approved'],
    'po-issued':   ['badge-accent', 'PO issued'],
    'grn-received':['badge-green',  'GRN received'],
  };
  const prioMap = {
    high:   ['var(--red)',    'High'],
    medium: ['var(--amber)',  'Medium'],
    low:    ['var(--text-muted)', 'Low'],
  };

  const filtered = prFilter === 'all' ? ProcData.prs : ProcData.prs.filter(p => p.status === prFilter);

  document.getElementById('procTabContent').innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">Purchase requests</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          ${['all','pending','po-issued','grn-received'].map(f => `
            <button class="btn btn-ghost btn-sm" id="prf-${f}" style="${prFilter===f?'color:var(--brand)':''}" onclick="setPRFilter('${f}')">
              ${f === 'all' ? 'All' : f === 'po-issued' ? 'PO Issued' : f === 'grn-received' ? 'Received' : 'Pending'}
            </button>`).join('')}
          <button class="btn btn-primary btn-sm" onclick="openRaisePRModal()">
            <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Raise PR
          </button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>PR No.</th>
              <th>Project</th>
              <th>Item description</th>
              <th>Qty / Unit</th>
              <th>Priority</th>
              <th>Required by</th>
              <th>Status</th>
              <th>Raised by</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(pr => {
              const [badgeCls, badgeLbl] = statusMap[pr.status] || ['badge-muted', pr.status];
              const [prioCls, prioLbl]   = prioMap[pr.priority] || ['var(--text-muted)', pr.priority];
              const days = daysUntil(pr.requiredBy);
              const daysCol = days < 14 ? 'var(--red)' : days < 30 ? 'var(--amber)' : 'var(--text-muted)';
              return `
              <tr onclick="openPRDetail('${pr.id}')" style="cursor:pointer">
                <td><span style="font-family:var(--font-mono);font-size:12px;color:var(--brand)">${pr.id}</span></td>
                <td><span style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary)">${pr.project}</span></td>
                <td>
                  <div style="font-weight:500;color:var(--text-primary)">${pr.item}</div>
                  <div style="font-size:11px;color:var(--text-muted)">${pr.pn}</div>
                </td>
                <td style="font-family:var(--font-mono);font-size:12px">${pr.qty} ${pr.unit}</td>
                <td>
                  <span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;color:${prioCls}">
                    <span style="width:6px;height:6px;border-radius:50%;background:${prioCls};flex-shrink:0"></span>
                    ${prioLbl}
                  </span>
                </td>
                <td>
                  <div style="font-size:12px;color:${daysCol}">${fmtDate(pr.requiredBy)}</div>
                  <div style="font-size:10px;color:${daysCol};opacity:.7">${days}d</div>
                </td>
                <td><span class="badge ${badgeCls}" style="font-size:10px">${badgeLbl}</span></td>
                <td style="font-size:12px;color:var(--text-secondary)">${pr.raisedBy}</td>
                <td>
                  <div style="display:flex;gap:4px">
                    ${pr.status === 'pending' ? `
                      <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();approvePR('${pr.id}')" title="Approve">Approve</button>` : ''}
                    <button class="btn-icon" onclick="event.stopPropagation();openPRDetail('${pr.id}')" title="View">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8M8 1h4m0 0v4m0-4L5.5 7.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function setPRFilter(f) {
  prFilter = f;
  renderProcPRs();
}

function approvePR(id) {
  const pr = ProcData.prs.find(p => p.id === id);
  if (!pr) return;
  pr.status = 'approved';
  pr.approvedBy = 'Procurement Mgr';
  showToast(`${id} approved — ready for PO issue`, 'success');
  renderProcPRs();
}

function openPRDetail(id) {
  const pr = ProcData.prs.find(p => p.id === id);
  if (!pr) return;
  const statusMap = {
    pending:       ['badge-amber',  'Pending approval'],
    approved:      ['badge-blue',   'Approved'],
    'po-issued':   ['badge-accent', 'PO issued'],
    'grn-received':['badge-green',  'GRN received'],
  };
  const [badgeCls, badgeLbl] = statusMap[pr.status] || ['badge-muted', pr.status];
  const wfSteps = ['Raised', 'Approved', 'PO Issued', 'GRN Received'];
  const wfIdx   = { pending: 0, approved: 1, 'po-issued': 2, 'grn-received': 3 }[pr.status] ?? 0;

  openProcModal(`
    <div class="proc-modal-inner">
      <div class="proc-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:12px;color:var(--brand);margin-bottom:3px">${pr.id} · ${pr.project}</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${pr.item}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="badge ${badgeCls}" style="font-size:10px">${badgeLbl}</span>
          <button class="btn-icon" onclick="closeProcModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
      </div>
      <div class="proc-modal-body">
        <!-- Workflow -->
        <div style="display:flex;align-items:center;gap:0;padding:8px 0;margin-bottom:4px">
          ${wfSteps.map((lbl, i) => `
            <div style="display:flex;align-items:center;gap:4px;font-size:10px;font-weight:500;color:${i < wfIdx ? 'var(--green)' : i === wfIdx ? 'var(--brand)' : 'var(--text-muted)'}">
              <span style="width:8px;height:8px;border-radius:50%;background:${i < wfIdx ? 'var(--green)' : i === wfIdx ? 'var(--brand)' : 'transparent'};border:1.5px solid ${i < wfIdx ? 'var(--green)' : i === wfIdx ? 'var(--brand)' : 'var(--border-strong)'};flex-shrink:0"></span>
              ${lbl}
            </div>
            ${i < wfSteps.length - 1 ? '<div style="flex:1;height:1px;background:var(--border);min-width:10px;max-width:24px"></div>' : ''}`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          ${[['Part number', pr.pn], ['Quantity', `${pr.qty} ${pr.unit}`], ['Priority', pr.priority.toUpperCase()]].map(([l,v]) => `
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px">${l}</div>
              <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${v}</div>
            </div>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${[
            ['Required by', fmtDate(pr.requiredBy)],
            ['Raised by', pr.raisedBy],
            ['Raised on', fmtDate(pr.raised)],
            ['Approved by', pr.approvedBy || '—'],
          ].map(([l,v]) => `
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px">${l}</div>
              <div style="font-size:12px;color:var(--text-primary)">${v}</div>
            </div>`).join('')}
        </div>
        ${pr.justification ? `
          <div style="padding:10px 12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm)">
            <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:4px">Justification</div>
            <div style="font-size:12px;color:var(--text-secondary);line-height:1.6">${pr.justification}</div>
          </div>` : ''}
        ${pr.poRef ? `
          <div style="padding:10px 12px;background:var(--blue-bg);border:1px solid rgba(74,158,255,.2);border-radius:var(--radius-sm);font-size:12px;color:var(--blue)">
            PO reference: <strong>${pr.poRef}</strong>
          </div>` : ''}
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${pr.status === 'pending' ? `<button class="btn btn-primary" onclick="closeProcModal();approvePR('${pr.id}')">Approve PR</button>` : ''}
          ${pr.status === 'approved' ? `<button class="btn btn-primary" onclick="closeProcModal();showToast('Issue PO for ${pr.id}','info')">Issue PO</button>` : ''}
          <button class="btn btn-secondary" onclick="closeProcModal();showToast('PR printed','info')">Print PR</button>
          <button class="btn btn-ghost" onclick="closeProcModal()">Close</button>
        </div>
      </div>
    </div>`);
}

/* ═══════════════════════════════════════════════════════════
   TAB 3 — PURCHASE ORDERS
═══════════════════════════════════════════════════════════ */
let poFilter = 'all';

function renderProcPOs() {
  const statusMap = {
    draft:          ['badge-muted',  'Draft'],
    confirmed:      ['badge-blue',   'Confirmed'],
    'in-transit':   ['badge-accent', 'In transit'],
    overdue:        ['badge-red',    'Overdue'],
    'grn-received': ['badge-green',  'Received'],
  };

  const filtered = poFilter === 'all' ? ProcData.pos : ProcData.pos.filter(p => p.status === poFilter);
  const totalFiltered = filtered.reduce((s, p) => s + p.value, 0);

  document.getElementById('procTabContent').innerHTML = `
    <!-- PO status KPI row -->
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'All POs',       value: ProcData.pos.length,                                                color:'var(--text-primary)' },
        { label:'Confirmed',     value: ProcData.pos.filter(p=>p.status==='confirmed').length,              color:'var(--blue)' },
        { label:'In transit',    value: ProcData.pos.filter(p=>p.status==='in-transit').length,             color:'var(--brand)' },
        { label:'Overdue',       value: ProcData.pos.filter(p=>p.status==='overdue').length,                color:'var(--red)' },
        { label:'Total value',   value: fmt(ProcData.pos.reduce((s,p)=>s+p.value,0)),                       color:'var(--green)' },
      ].map(k => `
        <div class="metric-card">
          <div class="metric-label">${k.label}</div>
          <div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div>
        </div>`).join('')}
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Purchase orders</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          ${['all','confirmed','in-transit','overdue','grn-received'].map(f => `
            <button class="btn btn-ghost btn-sm" style="${poFilter===f?'color:var(--brand)':''}" onclick="setPOFilter('${f}')">
              ${f === 'all' ? 'All' : f === 'in-transit' ? 'In transit' : f === 'grn-received' ? 'Received' : f.charAt(0).toUpperCase()+f.slice(1)}
            </button>`).join('')}
          <button class="btn btn-primary btn-sm" onclick="openIssuePOModal()">
            <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Issue PO
          </button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>PO No.</th>
              <th>Project</th>
              <th>Supplier</th>
              <th>Item</th>
              <th>Value</th>
              <th>Issued</th>
              <th>Delivery</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(po => {
              const [badgeCls, badgeLbl] = statusMap[po.status] || ['badge-muted', po.status];
              const days = daysUntil(po.deliveryDate);
              const daysCol = po.status === 'overdue' ? 'var(--red)' : days < 14 ? 'var(--amber)' : 'var(--text-muted)';
              const daysStr = po.status === 'grn-received' ? '—' : po.status === 'overdue' ? `${Math.abs(days)}d late` : `${days}d`;
              return `
              <tr onclick="openPODetail('${po.id}')" style="cursor:pointer">
                <td><span style="font-family:var(--font-mono);font-size:12px;color:var(--brand)">${po.id}</span></td>
                <td><span style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary)">${po.project}</span></td>
                <td style="font-size:13px;color:var(--text-primary)">${po.supplier}</td>
                <td>
                  <div style="font-weight:500;color:var(--text-primary)">${po.item}</div>
                  <div style="font-size:11px;color:var(--text-muted)">${po.qty} ${po.unit}</div>
                </td>
                <td style="font-family:var(--font-mono);font-size:13px;color:var(--blue)">${fmt(po.value)}</td>
                <td style="font-size:12px;color:var(--text-muted)">${fmtDate(po.issued)}</td>
                <td>
                  <div style="font-size:12px;color:${daysCol}">${fmtDate(po.deliveryDate)}</div>
                  <div style="font-size:10px;color:${daysCol};opacity:.8">${daysStr}</div>
                </td>
                <td><span class="badge ${badgeCls}" style="font-size:10px">${badgeLbl}</span></td>
                <td>
                  <button class="btn-icon" onclick="event.stopPropagation();openPODetail('${po.id}')" title="View">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8M8 1h4m0 0v4m0-4L5.5 7.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      ${filtered.length > 0 ? `
        <div style="padding:12px 14px 0;border-top:1px solid var(--border);display:flex;justify-content:space-between;font-size:12px;color:var(--text-secondary)">
          <span>${filtered.length} order${filtered.length !== 1 ? 's' : ''}</span>
          <span>Total: <strong style="color:var(--text-primary);font-family:var(--font-mono)">${fmt(totalFiltered)}</strong></span>
        </div>` : ''}
    </div>`;
}

function setPOFilter(f) {
  poFilter = f;
  renderProcPOs();
}

function openPODetail(id) {
  const po = ProcData.pos.find(p => p.id === id);
  if (!po) return;
  const statusMap = {
    confirmed:     ['badge-blue',   'Confirmed'],
    'in-transit':  ['badge-accent', 'In transit'],
    overdue:       ['badge-red',    'Overdue'],
    'grn-received':['badge-green',  'Received'],
    draft:         ['badge-muted',  'Draft'],
  };
  const [badgeCls, badgeLbl] = statusMap[po.status] || ['badge-muted', po.status];
  const days = daysUntil(po.deliveryDate);

  openProcModal(`
    <div class="proc-modal-inner">
      <div class="proc-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:12px;color:var(--brand);margin-bottom:3px">${po.id} · ${po.project}</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${po.item}</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${po.supplier}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="badge ${badgeCls}" style="font-size:10px">${badgeLbl}</span>
          <button class="btn-icon" onclick="closeProcModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
      </div>
      <div class="proc-modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          ${[
            ['Value', `<span style="color:var(--blue);font-weight:700">${fmt(po.value)}</span>`],
            ['Quantity', `${po.qty} ${po.unit}`],
            ['Delivery', po.status === 'grn-received' ? 'Received' : `${Math.abs(days)}d ${days < 0 ? 'overdue' : 'remaining'}`],
          ].map(([l,v]) => `
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px">${l}</div>
              <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${v}</div>
            </div>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${[
            ['Part number', po.pn],
            ['Payment terms', po.paymentTerms],
            ['Issued', fmtDate(po.issued)],
            ['Delivery date', fmtDate(po.deliveryDate)],
          ].map(([l,v]) => `
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px">${l}</div>
              <div style="font-size:12px;color:var(--text-primary)">${v}</div>
            </div>`).join('')}
        </div>
        ${po.prRef ? `
          <div style="padding:9px 12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:12px;color:var(--text-secondary)">
            PR reference: <span style="font-family:var(--font-mono);color:var(--brand)">${po.prRef}</span>
          </div>` : ''}
        ${po.notes ? `
          <div style="padding:10px 12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm)">
            <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:4px">Notes</div>
            <div style="font-size:12px;color:var(--text-secondary);line-height:1.6">${po.notes}</div>
          </div>` : ''}
        ${po.status === 'overdue' ? `
          <div style="padding:10px 12px;background:var(--red-bg);border:1px solid rgba(245,101,101,.2);border-radius:var(--radius-sm);font-size:12px;color:var(--red)">
            <strong>Overdue by ${Math.abs(days)} days.</strong> Contact supplier immediately.
          </div>` : ''}
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${po.status !== 'grn-received' ? `<button class="btn btn-primary" onclick="closeProcModal();openLogGRNModal()">Log GRN</button>` : ''}
          <button class="btn btn-secondary" onclick="closeProcModal();showToast('PO printed','info')">Print PO</button>
          ${po.status === 'overdue' ? `<button class="btn btn-secondary" style="color:var(--red)" onclick="closeProcModal();showToast('Expedite note sent to ${po.supplier}','warn')">Expedite</button>` : ''}
          <button class="btn btn-ghost" onclick="closeProcModal()">Close</button>
        </div>
      </div>
    </div>`);
}

/* ═══════════════════════════════════════════════════════════
   TAB 4 — APPROVED VENDOR LIST
═══════════════════════════════════════════════════════════ */
function renderProcAVL() {
  const approved     = ProcData.vendors.filter(v => v.status === 'approved').length;
  const conditional  = ProcData.vendors.filter(v => v.status === 'conditional').length;
  const underReview  = ProcData.vendors.filter(v => v.status === 'under-review').length;
  const avgScore     = Math.round(ProcData.vendors.filter(v => v.score).reduce((s,v) => s + v.score, 0) / ProcData.vendors.filter(v => v.score).length);

  document.getElementById('procTabContent').innerHTML = `
    <div class="metric-grid" style="margin-bottom:20px">
      ${[
        { label:'Approved vendors',   value: approved,     color:'var(--green)' },
        { label:'Conditional',        value: conditional,  color:'var(--amber)' },
        { label:'Under review',       value: underReview,  color:'var(--blue)' },
        { label:'Avg quality score',  value: avgScore+'%', color: avgScore >= 85 ? 'var(--green)' : 'var(--amber)' },
      ].map(k => `
        <div class="metric-card">
          <div class="metric-label">${k.label}</div>
          <div class="metric-value" style="font-size:26px;color:${k.color}">${k.value}</div>
        </div>`).join('')}
    </div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
      <span style="font-size:12px;color:var(--text-muted)">${ProcData.vendors.length} vendors on register</span>
      <button class="btn btn-primary btn-sm" onclick="openAddVendorModal()">
        <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Add vendor
      </button>
    </div>

    <div class="avl-grid">
      ${ProcData.vendors.map(v => {
        const stMap = {
          approved:      ['var(--green)',       'Approved',      'badge-green'],
          conditional:   ['var(--amber)',       'Conditional',   'badge-amber'],
          'under-review':['var(--blue)',        'Under review',  'badge-blue'],
          suspended:     ['var(--red)',         'Suspended',     'badge-red'],
        };
        const [stCol, stLbl, stBadge] = stMap[v.status] || ['var(--text-muted)', v.status, 'badge-muted'];
        const trendIcon  = { up:'↑', down:'↓', stable:'→' }[v.trend] || '→';
        const trendColor = { up:'var(--green)', down:'var(--red)', stable:'var(--text-muted)' }[v.trend];
        const reviewDays = v.nextReview ? daysUntil(v.nextReview) : null;
        const scoreColor = v.score >= 90 ? 'var(--green)' : v.score >= 80 ? 'var(--amber)' : 'var(--red)';
        return `
        <div class="avl-card" onclick="openVendorDetail('${v.id}')">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
            <div>
              <div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:2px">${v.name}</div>
              <div style="font-size:11px;color:var(--text-muted)">${v.category}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:1px">${v.country}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px">
              <span class="badge ${stBadge}" style="font-size:10px">${stLbl}</span>
              ${v.score !== null ? `<span style="font-size:12px;color:${trendColor};font-weight:600">${trendIcon}</span>` : ''}
            </div>
          </div>

          ${v.score !== null ? `
            <div style="margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span style="font-size:11px;color:var(--text-muted)">Quality score</span>
                <span style="font-family:var(--font-display);font-size:18px;font-weight:700;color:${scoreColor}">${v.score}%</span>
              </div>
              <div class="progress-bar" style="height:4px">
                <div class="progress-fill" style="width:${v.score}%;background:${scoreColor}"></div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;color:var(--text-muted);margin-bottom:10px">
              <div>On-time delivery<br><strong style="color:var(--text-primary);font-size:12px">${v.onTime}%</strong></div>
              <div>NCR rate<br><strong style="color:${v.ncrRate > 3 ? 'var(--red)' : 'var(--text-primary)'};font-size:12px">${v.ncrRate}%</strong></div>
            </div>` : `
            <div style="padding:12px;background:var(--bg-elevated);border-radius:var(--radius-sm);font-size:11px;color:var(--text-muted);margin-bottom:10px;text-align:center">
              Pre-qualification in progress
            </div>`}

          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${v.mtcCapability ? `<span class="badge badge-green" style="font-size:10px">MTC capable</span>` : ''}
            ${v.adnocApproved ? `<span class="badge badge-blue" style="font-size:10px">ADNOC approved</span>` : ''}
            ${v.iso ? `<span class="badge badge-muted" style="font-size:10px">${v.iso}</span>` : ''}
          </div>

          ${reviewDays !== null && reviewDays < 180 ? `
            <div style="margin-top:10px;padding:7px 9px;background:${reviewDays < 30 ? 'var(--red-bg)' : 'var(--amber-bg)'};border-radius:var(--radius-sm);font-size:11px;color:${reviewDays < 30 ? 'var(--red)' : 'var(--amber)'}">
              Review due in ${reviewDays}d — ${fmtDate(v.nextReview)}
            </div>` : ''}
          ${v.status === 'conditional' ? `
            <div style="margin-top:8px;padding:7px 9px;background:var(--red-bg);border-radius:var(--radius-sm);font-size:11px;color:var(--red)">
              Conditional — escalation review recommended
            </div>` : ''}
        </div>`;
      }).join('')}
    </div>`;
}

function openVendorDetail(id) {
  const v = ProcData.vendors.find(x => x.id === id);
  if (!v) return;
  const stMap = {
    approved:      ['badge-green',  'Approved'],
    conditional:   ['badge-amber',  'Conditional'],
    'under-review':['badge-blue',   'Under review'],
    suspended:     ['badge-red',    'Suspended'],
  };
  const [badgeCls, badgeLbl] = stMap[v.status] || ['badge-muted', v.status];
  const vendorPOs = ProcData.pos.filter(p => p.supplier === v.name);

  openProcModal(`
    <div class="proc-modal-inner">
      <div class="proc-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:12px;color:var(--brand);margin-bottom:3px">${v.id} · ${v.country}</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${v.name}</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:2px">${v.category}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="badge ${badgeCls}" style="font-size:10px">${badgeLbl}</span>
          <button class="btn-icon" onclick="closeProcModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
      </div>
      <div class="proc-modal-body">
        ${v.score !== null ? `
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
            ${[['Quality score', v.score+'%'], ['On-time delivery', v.onTime+'%'], ['NCR rate', v.ncrRate+'%']].map(([l,val]) => `
              <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
                <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px">${l}</div>
                <div style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--text-primary)">${val}</div>
              </div>`).join('')}
          </div>` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${[
            ['Pre-qual date', v.prequalDate ? fmtDate(v.prequalDate) : 'Not yet qualified'],
            ['Next review',   v.nextReview  ? fmtDate(v.nextReview) : '—'],
            ['ISO cert',      v.iso  || '—'],
            ['Contact',       v.contact],
          ].map(([l,val]) => `
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px">${l}</div>
              <div style="font-size:12px;color:var(--text-primary)">${val}</div>
            </div>`).join('')}
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${v.mtcCapability ? `<span class="badge badge-green">MTC capable</span>` : `<span class="badge badge-muted">No MTC capability</span>`}
          ${v.adnocApproved ? `<span class="badge badge-blue">ADNOC approved</span>` : `<span class="badge badge-muted">Not ADNOC approved</span>`}
        </div>
        ${vendorPOs.length ? `
          <div>
            <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:8px">POs with this vendor (${vendorPOs.length})</div>
            ${vendorPOs.map(po => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:5px;font-size:12px">
                <span style="font-family:var(--font-mono);color:var(--brand)">${po.id}</span>
                <span style="color:var(--text-secondary)">${po.item}</span>
                <span style="font-family:var(--font-mono);color:var(--blue)">${fmt(po.value)}</span>
              </div>`).join('')}
          </div>` : ''}
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-secondary" onclick="closeProcModal();showToast('Vendor profile exported','info')">Export profile</button>
          <button class="btn btn-ghost" onclick="closeProcModal()">Close</button>
        </div>
      </div>
    </div>`);
}

/* ═══════════════════════════════════════════════════════════
   TAB 5 — GRN LOG
═══════════════════════════════════════════════════════════ */
function renderProcGRN() {
  const stMap = {
    'pending-qc':['badge-amber',  'Pending QC'],
    'qc-pass':   ['badge-green',  'QC Pass'],
    'qc-fail':   ['badge-red',    'QC Fail'],
    'quarantine':['badge-red',    'Quarantine'],
  };

  document.getElementById('procTabContent').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <span class="badge badge-amber">${ProcData.grns.filter(g=>g.status==='pending-qc').length} pending QC</span>
        <span class="badge badge-green">${ProcData.grns.filter(g=>g.status==='qc-pass').length} passed</span>
        <span class="badge badge-red">${ProcData.grns.filter(g=>g.status==='qc-fail'||g.status==='quarantine').length} failed / quarantined</span>
        <span style="font-size:12px;color:var(--text-muted)">${ProcData.grns.length} total receipts</span>
      </div>
      <button class="btn btn-primary btn-sm" onclick="openLogGRNModal()">
        <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        Log GRN
      </button>
    </div>

    <div style="display:flex;flex-direction:column;gap:10px">
      ${ProcData.grns.map(g => {
        const [badgeCls, badgeLbl] = stMap[g.status] || ['badge-muted', g.status];
        const stCol = { 'pending-qc':'var(--amber)', 'qc-pass':'var(--green)', 'qc-fail':'var(--red)', quarantine:'var(--red)' }[g.status] || 'var(--text-muted)';
        return `
        <div class="grn-card" onclick="openGRNDetail('${g.id}')">
          <div class="grn-header">
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span style="font-family:var(--font-mono);font-size:12px;color:var(--brand)">${g.id}</span>
                <span style="font-size:11px;color:var(--text-muted)">·</span>
                <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${g.project}</span>
                ${g.poRef ? `<span style="font-size:11px;color:var(--text-muted)">· ${g.poRef}</span>` : ''}
              </div>
              <div style="font-size:14px;font-weight:500;color:var(--text-primary)">${g.item}</div>
            </div>
            <span class="badge ${badgeCls}" style="font-size:10px;flex-shrink:0">${badgeLbl}</span>
          </div>
          <div style="display:flex;gap:16px;margin-top:8px;flex-wrap:wrap">
            <span style="font-size:11px;color:var(--text-muted);display:flex;align-items:center;gap:4px">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" stroke-width="1"/><path d="M5.5 3v3l1.5 1" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>
              ${g.received}
            </span>
            <span style="font-size:11px;color:var(--text-muted)">Supplier: <strong style="color:var(--text-primary)">${g.supplier}</strong></span>
            <span style="font-size:11px;color:var(--text-muted)">Qty: <strong style="color:var(--text-primary)">${g.qty}</strong></span>
            <span style="font-size:11px;color:var(--text-muted)">Heat: <span style="font-family:var(--font-mono)">${g.heatNo}</span></span>
          </div>
          ${g.status === 'qc-fail' ? `
            <div style="margin-top:10px;padding:8px 10px;background:var(--red-bg);border:1px solid rgba(245,101,101,.2);border-radius:var(--radius-sm);font-size:12px;color:var(--red)">
              ${g.notes}
            </div>` : ''}
          ${g.status === 'pending-qc' ? `
            <div style="margin-top:10px;display:flex;gap:8px" onclick="event.stopPropagation()">
              <button class="btn btn-primary btn-sm" onclick="showToast('Opening QC inspection for ${g.id}','info')">Start QC inspection</button>
              <button class="btn btn-secondary btn-sm" onclick="navigate('quality');showToast('QC module opened','info')">Go to QC module</button>
            </div>` : ''}
        </div>`;
      }).join('')}
    </div>`;
}

function openGRNDetail(id) {
  const g = ProcData.grns.find(x => x.id === id);
  if (!g) return;
  const stMap = {
    'pending-qc':['badge-amber',  'Pending QC'],
    'qc-pass':   ['badge-green',  'QC Pass'],
    'qc-fail':   ['badge-red',    'QC Fail'],
    'quarantine':['badge-red',    'Quarantine'],
  };
  const [badgeCls, badgeLbl] = stMap[g.status] || ['badge-muted', g.status];

  openProcModal(`
    <div class="proc-modal-inner">
      <div class="proc-modal-header">
        <div>
          <div style="font-family:var(--font-mono);font-size:12px;color:var(--brand);margin-bottom:3px">${g.id} · ${g.project}</div>
          <div style="font-family:var(--font-display);font-size:15px;font-weight:700">${g.item}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="badge ${badgeCls}" style="font-size:10px">${badgeLbl}</span>
          <button class="btn-icon" onclick="closeProcModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
        </div>
      </div>
      <div class="proc-modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${[
            ['Part number', g.pn],
            ['Quantity', g.qty],
            ['Supplier', g.supplier],
            ['Heat / batch', g.heatNo],
            ['Received', fmtDate(g.received)],
            ['Received by', g.receivedBy],
          ].map(([l,v]) => `
            <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:3px">${l}</div>
              <div style="font-size:12px;color:var(--text-primary)">${v}</div>
            </div>`).join('')}
        </div>
        ${g.poRef ? `
          <div style="padding:9px 12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:12px;color:var(--text-secondary)">
            PO reference: <span style="font-family:var(--font-mono);color:var(--brand)">${g.poRef}</span>
          </div>` : ''}
        <div style="padding:10px 12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-sm)">
          <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.09em;margin-bottom:4px">Notes</div>
          <div style="font-size:12px;color:var(--text-secondary);line-height:1.6">${g.notes}</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          ${g.status === 'pending-qc' ? `<button class="btn btn-primary" onclick="closeProcModal();navigate('quality');showToast('QC inspection opened for ${g.id}','info')">Start QC inspection</button>` : ''}
          ${g.status === 'qc-fail' ? `<button class="btn btn-secondary" style="color:var(--red)" onclick="closeProcModal();navigate('quality');showToast('NCR raised for ${g.id}','warn')">View NCR</button>` : ''}
          <button class="btn btn-secondary" onclick="closeProcModal();showToast('GRN printed','info')">Print GRN</button>
          <button class="btn btn-ghost" onclick="closeProcModal()">Close</button>
        </div>
      </div>
    </div>`);
}

/* ═══════════════════════════════════════════════════════════
   MODALS — Raise PR / Issue PO / Log GRN / Add Vendor
═══════════════════════════════════════════════════════════ */
function openRaisePRModal() {
  openProcModal(`
    <div class="proc-modal-inner">
      <div class="proc-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Raise Purchase Request</div>
        <button class="btn-icon" onclick="closeProcModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="proc-modal-body">
        <div class="proc-field-row">
          <div class="proc-field">
            <label>Project</label>
            <select>${AppState.projects.map(p => `<option>${p.id} — ${p.name.split('—')[0].trim()}</option>`).join('')}</select>
          </div>
          <div class="proc-field">
            <label>Priority</label>
            <select><option>High</option><option selected>Medium</option><option>Low</option></select>
          </div>
        </div>
        <div class="proc-field"><label>Item / description</label><input type="text" placeholder="e.g. Shell plate 316L 10mm"/></div>
        <div class="proc-field-row">
          <div class="proc-field"><label>Part number</label><input type="text" placeholder="e.g. PLT-316L-10"/></div>
          <div class="proc-field"><label>Quantity</label><input type="number" placeholder="e.g. 8"/></div>
        </div>
        <div class="proc-field-row">
          <div class="proc-field">
            <label>Unit</label>
            <select><option>EA</option><option>SHT</option><option>KG</option><option>M</option><option>SET</option><option>LTR</option></select>
          </div>
          <div class="proc-field"><label>Required by date</label><input type="date"/></div>
        </div>
        <div class="proc-field"><label>Justification / notes</label><textarea rows="3" placeholder="Reason for request — MRP shortfall, reorder, emergency…"></textarea></div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="closeProcModal();showToast('PR raised — routed to Procurement for approval','success')">Submit PR</button>
          <button class="btn btn-secondary" onclick="closeProcModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function openIssuePOModal() {
  openProcModal(`
    <div class="proc-modal-inner">
      <div class="proc-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Issue Purchase Order</div>
        <button class="btn-icon" onclick="closeProcModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="proc-modal-body">
        <div class="proc-field-row">
          <div class="proc-field">
            <label>Project</label>
            <select>${AppState.projects.map(p => `<option>${p.id} — ${p.name.split('—')[0].trim()}</option>`).join('')}</select>
          </div>
          <div class="proc-field">
            <label>PR reference (optional)</label>
            <select>
              <option value="">— None —</option>
              ${ProcData.prs.filter(p => ['pending','approved'].includes(p.status)).map(p => `<option>${p.id} — ${p.item}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="proc-field">
          <label>Supplier</label>
          <select>${ProcData.vendors.filter(v => v.status === 'approved').map(v => `<option>${v.name}</option>`).join('')}</select>
        </div>
        <div class="proc-field"><label>Item / description</label><input type="text" placeholder="Item description"/></div>
        <div class="proc-field-row">
          <div class="proc-field"><label>Part number</label><input type="text" placeholder="PN"/></div>
          <div class="proc-field"><label>Quantity</label><input type="number" placeholder="Qty"/></div>
        </div>
        <div class="proc-field-row">
          <div class="proc-field">
            <label>Unit</label>
            <select><option>EA</option><option>SHT</option><option>KG</option><option>M</option><option>SET</option></select>
          </div>
          <div class="proc-field"><label>Unit price (USD)</label><input type="number" placeholder="0.00"/></div>
        </div>
        <div class="proc-field-row">
          <div class="proc-field"><label>Delivery date</label><input type="date"/></div>
          <div class="proc-field">
            <label>Payment terms</label>
            <select><option>30 days net</option><option>45 days net</option><option>60 days net</option><option>Cash on delivery</option></select>
          </div>
        </div>
        <div class="proc-field"><label>Notes / special instructions</label><textarea rows="2" placeholder="e.g. MTC required with delivery, ADNOC-compliant packaging…"></textarea></div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="closeProcModal();showToast('PO issued and sent to supplier','success')">Issue PO</button>
          <button class="btn btn-secondary" onclick="closeProcModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function openLogGRNModal() {
  openProcModal(`
    <div class="proc-modal-inner">
      <div class="proc-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Log Goods Receipt Note (GRN)</div>
        <button class="btn-icon" onclick="closeProcModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="proc-modal-body">
        <div class="proc-field-row">
          <div class="proc-field">
            <label>Project</label>
            <select>${AppState.projects.map(p => `<option>${p.id}</option>`).join('')}</select>
          </div>
          <div class="proc-field">
            <label>PO reference (optional)</label>
            <select>
              <option value="">— None —</option>
              ${ProcData.pos.filter(p => p.status !== 'grn-received').map(p => `<option>${p.id} — ${p.item}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="proc-field"><label>Item description</label><input type="text" placeholder="Item received"/></div>
        <div class="proc-field-row">
          <div class="proc-field"><label>Part number</label><input type="text" placeholder="PN"/></div>
          <div class="proc-field"><label>Quantity received</label><input type="text" placeholder="e.g. 6 EA"/></div>
        </div>
        <div class="proc-field-row">
          <div class="proc-field"><label>Supplier</label><input type="text" placeholder="Supplier name"/></div>
          <div class="proc-field"><label>Heat / batch number</label><input type="text" placeholder="e.g. HN-44830"/></div>
        </div>
        <div class="proc-field-row">
          <div class="proc-field"><label>Date received</label><input type="date" value="${new Date().toISOString().split('T')[0]}"/></div>
          <div class="proc-field"><label>Received by</label><input type="text" placeholder="Your name"/></div>
        </div>
        <div class="proc-field"><label>Notes</label><textarea rows="2" placeholder="Delivery condition, any discrepancies…"></textarea></div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="closeProcModal();showToast('GRN logged — routed to QC for incoming inspection','success')">Log GRN</button>
          <button class="btn btn-secondary" onclick="closeProcModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}

function openAddVendorModal() {
  openProcModal(`
    <div class="proc-modal-inner">
      <div class="proc-modal-header">
        <div style="font-family:var(--font-display);font-size:15px;font-weight:700">Add vendor to AVL</div>
        <button class="btn-icon" onclick="closeProcModal()"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M11 2L2 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>
      </div>
      <div class="proc-modal-body">
        <div class="proc-field-row">
          <div class="proc-field"><label>Vendor name</label><input type="text" placeholder="Company name"/></div>
          <div class="proc-field"><label>Country</label><input type="text" placeholder="e.g. UAE"/></div>
        </div>
        <div class="proc-field"><label>Supply category</label><input type="text" placeholder="e.g. SS plate & coil, flanges, consumables…"/></div>
        <div class="proc-field-row">
          <div class="proc-field"><label>ISO certification</label><input type="text" placeholder="e.g. ISO 9001:2015"/></div>
          <div class="proc-field"><label>Contact email</label><input type="email" placeholder="procurement@vendor.com"/></div>
        </div>
        <div class="proc-field-row">
          <div class="proc-field">
            <label>MTC capability</label>
            <select><option>Yes</option><option>No</option></select>
          </div>
          <div class="proc-field">
            <label>Initial status</label>
            <select><option>Under review</option><option>Conditional</option></select>
          </div>
        </div>
        <div class="proc-field"><label>Notes / scope of supply</label><textarea rows="2" placeholder="Additional notes…"></textarea></div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" style="flex:1" onclick="closeProcModal();showToast('Vendor added — pre-qualification checklist created','success')">Add vendor</button>
          <button class="btn btn-secondary" onclick="closeProcModal()">Cancel</button>
        </div>
      </div>
    </div>`);
}
