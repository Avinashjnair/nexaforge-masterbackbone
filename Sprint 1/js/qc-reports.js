/**
 * NexaForge ERP — QC Inspection Reports Engine
 * Phase 1: Incoming Material (IR-MAT) & Dimensional (IR-DIM)
 */

'use strict';

// ── Report Storage ──────────────────────────────────────────
const QCReportsData = {
    reports: [
        {
            id: 'IR-MAT-001',
            type: 'MAT',
            title: 'Incoming Material Inspection Report',
            project: 'P-2401',
            date: '2025-05-11',
            status: 'approved',
            inspector: 'Sarah Ahmed'
        },
        {
            id: 'IR-DIM-001',
            type: 'DIM',
            title: 'Dimensional Inspection Report',
            project: 'P-2401',
            date: '2025-05-11',
            status: 'pending',
            inspector: 'John Doe'
        },
        {
            id: 'IR-FIT-001',
            type: 'FIT',
            title: 'Fit-up Inspection Report',
            project: 'P-2401',
            date: '2025-05-11',
            status: 'approved',
            inspector: 'Sarah Ahmed'
        }
    ]
};

// ── Material Directory ──────────────────────────────────────
const MATERIAL_GRADES = [
    { grade: '316L', spec: 'ASTM A240', desc: 'Stainless Steel (Low Carbon)' },
    { grade: '304L', spec: 'ASTM A240', desc: 'Stainless Steel (Low Carbon)' },
    { grade: 'A36', spec: 'ASTM A36', desc: 'Carbon Structural Steel' },
    { grade: 'A516 Gr. 70', spec: 'ASTM A516', desc: 'Pressure Vessel Plate, CS' },
    { grade: 'S31803', spec: 'ASTM A240', desc: 'Duplex Stainless Steel' },
    { grade: '6061-T6', spec: 'ASTM B209', desc: 'Aluminum Alloy' }
];

const MATERIAL_TYPES = ['Plate', 'Tube', 'Pipe', 'Rod', 'Flanges', 'Fittings', 'Beam', 'Channel'];

const WELDERS = [
    { id: 'W-001', name: 'Ali Hassan', stamp: 'AH-01', certs: ['GTAW', 'SMAW'] },
    { id: 'W-002', name: 'Raj Kumar', stamp: 'RK-02', certs: ['GTAW'] },
    { id: 'W-003', name: 'Zayed Khan', stamp: 'ZK-03', certs: ['GMAW', 'FCAW'] }
];

const WPS_LIST = [
    { id: 'WPS-SS-01', process: 'GTAW', material: '316L', thickness: '3-12mm' },
    { id: 'WPS-CS-01', process: 'SMAW', material: 'A36', thickness: '6-25mm' },
    { id: 'WPS-DP-01', process: 'GTAW/SMAW', material: 'S31803', thickness: '5-20mm' }
];

// ── Registry View ───────────────────────────────────────────
function renderQC_reports_registry() {
    const el = document.getElementById('pageContent');
    const dept = document.body.dataset.dept;

    el.innerHTML = `
        <div class="page-header" style="margin-bottom:20px">
            <div>
                <div class="page-title">Inspection Reports</div>
                <div class="page-subtitle">Standardized QC reporting for all project phases</div>
            </div>
            <div class="page-actions">
                <button class="btn btn-primary btn-sm" onclick="openNewReportSelector()">
                    <svg viewBox="0 0 15 15" fill="none" style="width:14px"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    New Inspection Report
                </button>
            </div>
        </div>

        <div class="card">
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Report ID</th>
                            <th>Type</th>
                            <th>Project</th>
                            <th>Date</th>
                            <th>Inspector</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${QCReportsData.reports.map(r => `
                            <tr>
                                <td style="font-family:var(--font-mono);font-weight:700">${r.id}</td>
                                <td><span class="badge badge-muted">${r.type}</span></td>
                                <td style="font-weight:600">${r.project}</td>
                                <td style="font-size:12px">${r.date}</td>
                                <td style="font-size:12px">${r.inspector}</td>
                                <td><span class="badge ${r.status==='approved'?'badge-green':'badge-amber'}">${r.status.toUpperCase()}</span></td>
                                <td>
                                    <div style="display:flex;gap:8px">
                                        <button class="btn btn-muted btn-xs" onclick="viewInspectionReport('${r.id}')">View</button>
                                        <button class="btn btn-ghost btn-xs" onclick="printInspectionReport('${r.id}')">Print</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
window.renderQC_reports_registry = renderQC_reports_registry;

// ── New Report Selector ──────────────────────────────────────
function openNewReportSelector() {
    openQCDetailPanel(`
        <div class="qc-modal-inner">
            <div class="qc-modal-header">
                <div style="font-family:var(--font-display);font-size:16px;font-weight:700">Select Report Type</div>
                <button class="btn-icon" onclick="closeQCDetailPanel()"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>
            </div>
            <div class="qc-modal-body" style="max-height:60vh;overflow-y:auto;padding-right:8px">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="glass-hover" onclick="createNewReport('MAT')" style="padding:20px;border-radius:12px;border:1px solid var(--border);cursor:pointer;text-align:center">
                        <div style="font-size:32px;margin-bottom:12px">📦</div>
                        <div style="font-weight:700;font-size:14px">Incoming Material (IR-MAT)</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Verify raw materials vs MTC</div>
                    </div>
                    <div class="glass-hover" onclick="createNewReport('DIM')" style="padding:20px;border-radius:12px;border:1px solid var(--border);cursor:pointer;text-align:center">
                        <div style="font-size:32px;margin-bottom:12px">📏</div>
                        <div style="font-weight:700;font-size:14px">Dimensional (IR-DIM)</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Measure components vs Drawings</div>
                    </div>
                    <div class="glass-hover" onclick="createNewReport('FIT')" style="padding:20px;border-radius:12px;border:1px solid var(--border);cursor:pointer;text-align:center">
                        <div style="font-size:32px;margin-bottom:12px">🧩</div>
                        <div style="font-weight:700;font-size:14px">Fit-up (IR-FIT)</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Verify joint prep & alignment</div>
                    </div>
                    <div class="glass-hover" onclick="createNewReport('VT')" style="padding:20px;border-radius:12px;border:1px solid var(--border);cursor:pointer;text-align:center">
                        <div style="font-size:32px;margin-bottom:12px">👨‍焊接</div>
                        <div style="font-weight:700;font-size:14px">Visual Weld (IR-VT)</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Post-weld visual examination</div>
                    </div>
                    <div class="glass-hover" onclick="createNewReport('RT')" style="padding:20px;border-radius:12px;border:1px solid var(--border);cursor:pointer;text-align:center">
                        <div style="font-size:32px;margin-bottom:12px">☢️</div>
                        <div style="font-weight:700;font-size:14px">Radiography (RT)</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">X-Ray / Gamma Ray results</div>
                    </div>
                    <div class="glass-hover" onclick="createNewReport('UT')" style="padding:20px;border-radius:12px;border:1px solid var(--border);cursor:pointer;text-align:center">
                        <div style="font-size:32px;margin-bottom:12px">📡</div>
                        <div style="font-weight:700;font-size:14px">Ultrasonic (UT)</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Internal defect detection</div>
                    </div>
                    <div class="glass-hover" onclick="createNewReport('PT')" style="padding:20px;border-radius:12px;border:1px solid var(--border);cursor:pointer;text-align:center">
                        <div style="font-size:32px;margin-bottom:12px">🧪</div>
                        <div style="font-weight:700;font-size:14px">Penetrant (PT)</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Surface crack detection</div>
                    </div>
                    <div class="glass-hover" onclick="createNewReport('MT')" style="padding:20px;border-radius:12px;border:1px solid var(--border);cursor:pointer;text-align:center">
                        <div style="font-size:32px;margin-bottom:12px">🧲</div>
                        <div style="font-weight:700;font-size:14px">Magnetic (MT)</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Ferrous surface examination</div>
                    </div>
                    <div class="glass-hover" onclick="createNewReport('HT')" style="padding:20px;border-radius:12px;border:1px solid var(--border);cursor:pointer;text-align:center">
                        <div style="font-size:32px;margin-bottom:12px">🌊</div>
                        <div style="font-weight:700;font-size:14px">Hydrostatic Test (IR-HT)</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Pressure & leak testing</div>
                    </div>
                    <div class="glass-hover" onclick="createNewReport('COAT')" style="padding:20px;border-radius:12px;border:1px solid var(--border);cursor:pointer;text-align:center">
                        <div style="font-size:32px;margin-bottom:12px">🎨</div>
                        <div style="font-weight:700;font-size:14px">Coating (IR-COAT)</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Surface prep & painting check</div>
                    </div>
                    <div class="glass-hover" onclick="createNewReport('FINAL')" style="padding:20px;border-radius:12px;border:1px solid var(--border);cursor:pointer;text-align:center">
                        <div style="font-size:32px;margin-bottom:12px">🏁</div>
                        <div style="font-weight:700;font-size:14px">Final Inspection (IR-FINAL)</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Pre-dispatch verification</div>
                    </div>
                    <div class="glass-hover" onclick="createNewReport('FAT')" style="padding:20px;border-radius:12px;border:1px solid var(--border);cursor:pointer;text-align:center">
                        <div style="font-size:32px;margin-bottom:12px">🤝</div>
                        <div style="font-weight:700;font-size:14px">FAT / TPI Witness (IR-FAT)</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Customer/Third Party hosting report</div>
                    </div>
                </div>
            </div>
        </div>
    `);
}
window.openNewReportSelector = openNewReportSelector;

function createNewReport(type) {
    closeQCDetailPanel();
    if (type === 'MAT') renderIR_MAT_Form();
    if (type === 'DIM') renderIR_DIM_Form();
    if (type === 'FIT') renderIR_FIT_Form();
    if (type === 'VT') renderIR_VT_Form();
    if (['RT','UT','MT'].includes(type)) renderIR_NDT_Form(type);
    if (type === 'PT') renderIR_PT_Form();
    if (type === 'HT') renderIR_HT_Form();
    if (type === 'COAT') renderIR_COAT_Form();
    if (type === 'FINAL') renderIR_FINAL_Form();
    if (type === 'FAT') renderIR_FAT_Form();
}
window.createNewReport = createNewReport;

// ── PHASE 1: IR-MAT (Incoming Material) ───────────────────────
function renderIR_MAT_Form() {
    const el = document.getElementById('pageContent');
    el.innerHTML = `
        <div class="page-header" style="margin-bottom:20px">
            <div style="display:flex;align-items:center;gap:12px">
                <button class="btn btn-icon" onclick="renderQC_reports_registry()"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <div>
                    <div class="page-title">New Incoming Material Report</div>
                    <div class="page-subtitle">Manual entry for all sections as per Phase 1 design</div>
                </div>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary btn-sm" onclick="renderQC_reports_registry()">Discard</button>
                <button class="btn btn-primary btn-sm" onclick="saveIR_MAT()">Save Report</button>
            </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:24px">
            <!-- Header Info -->
            <div class="card" style="padding:24px">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">General Information</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px">
                    <div class="qc-field"><label>Report No</label><input type="text" id="mat-report-no" placeholder="IR-MAT-XXX"></div>
                    <div class="qc-field"><label>Project No</label><input type="text" id="mat-project-no" value="${AppState.activeProject || ''}"></div>
                    <div class="qc-field"><label>Date</label><input type="date" id="mat-date" value="${new Date().toISOString().split('T')[0]}"></div>
                    <div class="qc-field"><label>PO / Drawing Ref</label><input type="text" id="mat-ref" placeholder="PO-2401-001"></div>
                </div>
            </div>

            <!-- Section A: Material ID -->
            <div class="card" style="padding:24px">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Section A: Material Identification</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px">
                    <div class="qc-field">
                        <label>Material Type</label>
                        <select id="mat-type">
                            <option value="">-- Select Type --</option>
                            ${MATERIAL_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
                        </select>
                    </div>
                    <div class="qc-field">
                        <label>Material Grade (Searchable)</label>
                        <div style="position:relative">
                            <input type="text" id="mat-grade-search" placeholder="Search Grade..." oninput="filterMaterialGrades(this.value)">
                            <div id="mat-grade-results" class="glass-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;z-index:100;max-height:200px;overflow-y:auto"></div>
                            <input type="hidden" id="mat-grade-val">
                        </div>
                    </div>
                    <div class="qc-field"><label>Specification</label><input type="text" id="mat-spec" readonly placeholder="Auto-filled"></div>
                    <div class="qc-field"><label>Heat / Lot No</label><input type="text" id="mat-heat" placeholder="HN-44810"></div>
                    <div class="qc-field"><label>Supplier</label><input type="text" id="mat-supplier" placeholder="Outokumpu"></div>
                    <div class="qc-field"><label>Qty Received</label><input type="text" id="mat-qty-rec" placeholder="4 SHT"></div>
                    <div class="qc-field"><label>Qty Inspected</label><input type="text" id="mat-qty-insp" placeholder="4 SHT"></div>
                </div>
            </div>

            <!-- Section B: MTC Chemical -->
            <div class="card" style="padding:24px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <div style="font-weight:700;font-size:14px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Section B: MTC Chemical Analysis (%)</div>
                    <button class="btn btn-ghost btn-xs" onclick="addChemRow()">+ Add Element</button>
                </div>
                <div class="table-wrap">
                    <table class="data-table" id="chem-table">
                        <thead>
                            <tr><th>Element</th><th>Spec Min</th><th>Spec Max</th><th>Actual</th><th>Verdict</th><th width="40"></th></tr>
                        </thead>
                        <tbody id="chem-body">
                            ${['Carbon (C)', 'Manganese (Mn)', 'Chromium (Cr)', 'Nickel (Ni)', 'Molybdenum (Mo)'].map(el => `
                                <tr>
                                    <td><input type="text" value="${el}" class="form-control-xs"></td>
                                    <td><input type="text" placeholder="—" class="form-control-xs"></td>
                                    <td><input type="text" placeholder="0.030" class="form-control-xs"></td>
                                    <td><input type="text" placeholder="0.024" class="form-control-xs"></td>
                                    <td><select class="form-control-xs"><option>PASS</option><option>FAIL</option></select></td>
                                    <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Section C: Mechanical -->
            <div class="card" style="padding:24px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <div style="font-weight:700;font-size:14px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Section C: Mechanical Properties</div>
                    <button class="btn btn-ghost btn-xs" onclick="addMechRow()">+ Add Property</button>
                </div>
                <div class="table-wrap">
                    <table class="data-table" id="mech-table">
                        <thead>
                            <tr><th>Property</th><th>Spec Min</th><th>Spec Max</th><th>Actual</th><th>Verdict</th><th width="40"></th></tr>
                        </thead>
                        <tbody id="mech-body">
                            ${['Yield (0.2%) MPa', 'Tensile UTS MPa', 'Elongation %'].map(p => `
                                <tr>
                                    <td><input type="text" value="${p}" class="form-control-xs"></td>
                                    <td><input type="text" placeholder="170" class="form-control-xs"></td>
                                    <td><input type="text" placeholder="—" class="form-control-xs"></td>
                                    <td><input type="text" placeholder="310" class="form-control-xs"></td>
                                    <td><select class="form-control-xs"><option>PASS</option><option>FAIL</option></select></td>
                                    <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Section D: Visual & Dimensional -->
            <div class="card" style="padding:24px">
                 <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Section D: Visual & Dimensional Check</div>
                 <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr><th>Check Item</th><th>Result</th><th>Remarks</th></tr>
                        </thead>
                        <tbody>
                            ${['Surface condition (no pits/scale)', 'Edge condition (no laminations)', 'Plate marking legibility', 'Thickness check', 'Width / Length check'].map(item => `
                                <tr>
                                    <td>${item}</td>
                                    <td><select class="form-control-xs"><option>OK</option><option>NOT OK</option><option>N/A</option></select></td>
                                    <td><input type="text" class="form-control-xs" placeholder="Notes..."></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                 </div>
            </div>

            <!-- Footer Sign-off -->
            <div class="card" style="padding:24px;background:var(--bg-elevated)">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Report Finalization</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
                    <div class="qc-field"><label>Final Result</label><select id="mat-final-result"><option>ACCEPTED</option><option>REJECTED</option><option>CONDITIONAL</option></select></div>
                    <div class="qc-field"><label>Overall Remarks</label><textarea id="mat-final-remarks" rows="3" placeholder="Enter final conclusions..."></textarea></div>
                </div>
                <div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end">
                     <button class="btn btn-primary" onclick="saveIR_MAT()">Finalize & Save Report</button>
                </div>
            </div>
        </div>
    `;
}
window.renderIR_MAT_Form = renderIR_MAT_Form;

function addChemRow() {
    const tbody = document.getElementById('chem-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" placeholder="Element" class="form-control-xs"></td>
        <td><input type="text" placeholder="—" class="form-control-xs"></td>
        <td><input type="text" placeholder="—" class="form-control-xs"></td>
        <td><input type="text" placeholder="—" class="form-control-xs"></td>
        <td><select class="form-control-xs"><option>PASS</option><option>FAIL</option></select></td>
        <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
    `;
    tbody.appendChild(tr);
}
window.addChemRow = addChemRow;

function addMechRow() {
    const tbody = document.getElementById('mech-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" placeholder="Property" class="form-control-xs"></td>
        <td><input type="text" placeholder="—" class="form-control-xs"></td>
        <td><input type="text" placeholder="—" class="form-control-xs"></td>
        <td><input type="text" placeholder="—" class="form-control-xs"></td>
        <td><select class="form-control-xs"><option>PASS</option><option>FAIL</option></select></td>
        <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
    `;
    tbody.appendChild(tr);
}
window.addMechRow = addMechRow;

// ── Material Search Logic ───────────────────────────────────
function filterMaterialGrades(val) {
    const results = document.getElementById('mat-grade-results');
    if (!val) { results.style.display = 'none'; return; }
    
    const matches = MATERIAL_GRADES.filter(m => 
        m.grade.toLowerCase().includes(val.toLowerCase()) || 
        m.spec.toLowerCase().includes(val.toLowerCase())
    );
    
    if (matches.length === 0) {
        results.innerHTML = `<div style="padding:10px;font-size:12px;color:var(--text-muted)">No matches found</div>`;
    } else {
        results.innerHTML = matches.map(m => `
            <div class="dropdown-item" onclick="selectMaterialGrade('${m.grade}', '${m.spec}')" style="padding:10px;cursor:pointer;border-bottom:1px solid var(--border)">
                <div style="font-weight:700;font-size:13px">${m.grade}</div>
                <div style="font-size:11px;color:var(--text-muted)">${m.spec} — ${m.desc}</div>
            </div>
        `).join('');
    }
    results.style.display = 'block';
}
window.filterMaterialGrades = filterMaterialGrades;

function selectMaterialGrade(grade, spec) {
    document.getElementById('mat-grade-search').value = grade;
    document.getElementById('mat-grade-val').value = grade;
    document.getElementById('mat-spec').value = spec;
    document.getElementById('mat-grade-results').style.display = 'none';
}
window.selectMaterialGrade = selectMaterialGrade;

function saveIR_MAT() {
    showToast('Incoming Material Report saved successfully', 'success');
    renderQC_reports_registry();
}
window.saveIR_MAT = saveIR_MAT;

// ── PHASE 1: IR-DIM (Dimensional) ─────────────────────────────
function renderIR_DIM_Form() {
    const el = document.getElementById('pageContent');
    el.innerHTML = `
        <div class="page-header" style="margin-bottom:20px">
            <div style="display:flex;align-items:center;gap:12px">
                <button class="btn btn-icon" onclick="renderQC_reports_registry()"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <div>
                    <div class="page-title">New Dimensional Inspection Report</div>
                    <div class="page-subtitle">Manual measurement entry as per Phase 1 design</div>
                </div>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary btn-sm" onclick="renderQC_reports_registry()">Discard</button>
                <button class="btn btn-primary btn-sm" onclick="saveIR_DIM()">Save Report</button>
            </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:24px">
            <!-- Header Info -->
            <div class="card" style="padding:24px">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">General Information</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px">
                    <div class="qc-field"><label>Report No</label><input type="text" id="dim-report-no" placeholder="IR-DIM-XXX"></div>
                    <div class="qc-field"><label>Job / Project No</label><input type="text" value="${AppState.activeProject || 'P-2401'}" placeholder="e.g. P-2401"></div>
                    <div class="qc-field"><label>ITP Activity Ref</label><input type="text" placeholder="e.g. ITP-QC-05 (Dimensional Survey)"></div>
                    <div class="qc-field"><label>Component Name</label><input type="text" id="dim-comp" placeholder="Shell Course 1"></div>
                    <div class="qc-field"><label>Drawing Ref</label><input type="text" id="dim-dwg" placeholder="DWG-SH-001"></div>
                    <div class="qc-field"><label>Date</label><input type="date" id="dim-date" value="${new Date().toISOString().split('T')[0]}"></div>
                </div>
            </div>

            <!-- Section B: Linear Dimensions -->
            <div class="card" style="padding:24px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <div style="font-weight:700;font-size:14px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Section B: Linear Dimensions</div>
                    <button class="btn btn-ghost btn-xs" onclick="addDimRow()">+ Add Dimension</button>
                </div>
                <div class="table-wrap">
                    <table class="data-table" id="dim-table">
                        <thead>
                            <tr><th width="80">Bubble No.</th><th>Check Item</th><th>Dwg Value</th><th>Tolerance</th><th>Actual</th><th>Verdict</th><th width="40"></th></tr>
                        </thead>
                        <tbody id="dim-body">
                            <tr>
                                <td><input type="text" value="B1" class="form-control-xs"></td>
                                <td><input type="text" value="Overall Length" class="form-control-xs"></td>
                                <td><input type="text" placeholder="1500mm" class="form-control-xs"></td>
                                <td><input type="text" placeholder="±2mm" class="form-control-xs"></td>
                                <td><input type="text" placeholder="1501" class="form-control-xs"></td>
                                <td><select class="form-control-xs"><option>✓</option><option>✕</option></select></td>
                                <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Section C: Roundness / Ovality -->
            <div class="card" style="padding:24px">
                 <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Section C: Roundness / Ovality Check</div>
                 <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr><th>Position</th><th>Measured Diameter (mm)</th><th>Tolerance Limit</th><th>Verdict</th></tr>
                        </thead>
                        <tbody>
                            ${['0° (North)', '90° (East)', '180° (South)', '270° (West)'].map(pos => `
                                <tr>
                                    <td style="font-weight:600">${pos}</td>
                                    <td><input type="number" class="form-control-xs" placeholder="3000"></td>
                                    <td><input type="text" class="form-control-xs" value="±30mm" readonly></td>
                                    <td><select class="form-control-xs"><option>PASS</option><option>FAIL</option></select></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                 </div>
            </div>

            <!-- Section D: Angular Dimensions -->
            <div class="card" style="padding:24px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <div style="font-weight:700;font-size:14px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Section D: Angular Dimensions</div>
                    <button class="btn btn-ghost btn-xs" onclick="addAngularDimRow()">+ Add Dimension</button>
                </div>
                <div class="table-wrap">
                    <table class="data-table" id="angular-dim-table">
                        <thead>
                            <tr><th width="80">Bubble No.</th><th>Check Item</th><th>Dwg Value</th><th>Tolerance</th><th>Actual</th><th>Verdict</th><th width="40"></th></tr>
                        </thead>
                        <tbody id="angular-dim-body">
                            <tr>
                                <td><input type="text" value="A1" class="form-control-xs"></td>
                                <td><input type="text" placeholder="Nozzle Orientation" class="form-control-xs"></td>
                                <td><input type="text" placeholder="45°" class="form-control-xs"></td>
                                <td><input type="text" placeholder="±1°" class="form-control-xs"></td>
                                <td><input type="text" placeholder="—" class="form-control-xs"></td>
                                <td><select class="form-control-xs"><option>✓</option><option>✕</option></select></td>
                                <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Section F: Instruments -->
            <div class="card" style="padding:24px">
                 <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <div style="font-weight:700;font-size:14px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Section F: Instruments Used</div>
                    <button class="btn btn-ghost btn-xs" onclick="addInstrumentRow()">+ Add Instrument</button>
                 </div>
                 <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr><th>Instrument</th><th>Serial / Cal ID</th><th>Cal Due Date</th><th width="40"></th></tr>
                        </thead>
                        <tbody id="inst-body">
                            <tr>
                                <td><input type="text" value="Steel Tape" class="form-control-xs"></td>
                                <td><input type="text" value="CAL-108" class="form-control-xs"></td>
                                <td><input type="date" value="2025-09-01" class="form-control-xs"></td>
                                <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
                            </tr>
                        </tbody>
                    </table>
                 </div>
            </div>

            <!-- Section G: Photo Attachments -->
            <div class="card" style="padding:24px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <div style="font-weight:700;font-size:14px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Section G: Photo Attachments</div>
                    <button class="btn btn-ghost btn-xs" onclick="document.getElementById('dim-photo-input').click()">+ Add Photo</button>
                    <input type="file" id="dim-photo-input" style="display:none" accept="image/*" multiple onchange="handleIRPhotoUpload(this)">
                </div>
                <div id="dim-photo-gallery" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(120px, 1fr));gap:12px">
                    <div style="aspect-ratio:1;border:2px dashed var(--border);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-muted);font-size:11px;text-align:center;padding:12px">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:8px"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        No photos attached
                    </div>
                </div>
            </div>

            <!-- Footer Sign-off -->
            <div class="card" style="padding:24px;background:var(--bg-elevated)">
                <div style="margin-top:20px;display:flex;justify-content:flex-end">
                     <button class="btn btn-primary" onclick="saveIR_DIM()">Finalize & Save Report</button>
                </div>
            </div>
        </div>
    `;
}
window.renderIR_DIM_Form = renderIR_DIM_Form;

function addDimRow() {
    const tbody = document.getElementById('dim-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" placeholder="B#" class="form-control-xs"></td>
        <td><input type="text" placeholder="Check Item" class="form-control-xs"></td>
        <td><input type="text" placeholder="—" class="form-control-xs"></td>
        <td><input type="text" placeholder="—" class="form-control-xs"></td>
        <td><input type="text" placeholder="—" class="form-control-xs"></td>
        <td><select class="form-control-xs"><option>✓</option><option>✕</option></select></td>
        <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
    `;
    tbody.appendChild(tr);
}
window.addDimRow = addDimRow;

function addAngularDimRow() {
    const tbody = document.getElementById('angular-dim-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" placeholder="A#" class="form-control-xs"></td>
        <td><input type="text" placeholder="Check Item" class="form-control-xs"></td>
        <td><input type="text" placeholder="—" class="form-control-xs"></td>
        <td><input type="text" placeholder="—" class="form-control-xs"></td>
        <td><input type="text" placeholder="—" class="form-control-xs"></td>
        <td><select class="form-control-xs"><option>✓</option><option>✕</option></select></td>
        <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
    `;
    tbody.appendChild(tr);
}
window.addAngularDimRow = addAngularDimRow;

function addInstrumentRow() {
    const tbody = document.getElementById('inst-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" placeholder="Instrument Name" class="form-control-xs"></td>
        <td><input type="text" placeholder="ID-XXX" class="form-control-xs"></td>
        <td><input type="date" class="form-control-xs"></td>
        <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
    `;
    tbody.appendChild(tr);
}
window.addInstrumentRow = addInstrumentRow;

function handleIRPhotoUpload(input, galleryId = 'dim-photo-gallery') {
    const gallery = document.getElementById(galleryId);
    if (input.files && input.files.length > 0) {
        // Clear "No photos" placeholder if first upload
        if (gallery.innerText.includes('No photos attached')) gallery.innerHTML = '';
        
        Array.from(input.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const div = document.createElement('div');
                div.style.position = 'relative';
                div.innerHTML = `
                    <img src="${e.target.result}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;border:1px solid var(--border)">
                    <button class="btn-icon" onclick="this.parentElement.remove()" style="position:absolute;top:-4px;right:-4px;background:var(--red);color:white;border-radius:50%;padding:4px;box-shadow:0 2px 4px rgba(0,0,0,0.2)">
                        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor"><path d="M2 2l10 10M12 2L2 12" stroke-width="2.5"/></svg>
                    </button>
                `;
                gallery.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    }
}
window.handleIRPhotoUpload = handleIRPhotoUpload;

function saveIR_DIM() {
    showToast('Dimensional Report saved successfully', 'success');
    renderQC_reports_registry();
}
window.saveIR_DIM = saveIR_DIM;

// ── PHASE 2: IR-FIT (Fit-up) ──────────────────────────────────
function renderIR_FIT_Form() {
    const el = document.getElementById('pageContent');
    el.innerHTML = `
        <div class="page-header" style="margin-bottom:20px">
            <div style="display:flex;align-items:center;gap:12px">
                <button class="btn btn-icon" onclick="renderQC_reports_registry()"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <div>
                    <div class="page-title">New Fit-up Inspection Report</div>
                    <div class="page-subtitle">Joint preparation & alignment verification</div>
                </div>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary btn-sm" onclick="renderQC_reports_registry()">Discard</button>
                <button class="btn btn-primary btn-sm" onclick="saveIR_FIT()">Save Report</button>
            </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:24px">
            <!-- Header Info -->
            <div class="card" style="padding:24px">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">General Information</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px">
                    <div class="qc-field"><label>Report No</label><input type="text" id="fit-report-no" placeholder="IR-FIT-XXX"></div>
                    <div class="qc-field"><label>Job / Project No</label><input type="text" value="${AppState.activeProject || 'P-2401'}"></div>
                    <div class="qc-field"><label>Date</label><input type="date" id="fit-date" value="${new Date().toISOString().split('T')[0]}"></div>
                    <div class="qc-field"><label>Drawing No</label><input type="text" id="fit-dwg" placeholder="DWG-PJ-01"></div>
                    <div class="qc-field"><label>ITP Activity Ref</label><input type="text" placeholder="e.g. ITP-QC-12"></div>
                    <div class="qc-field"><label>Spool / Line No</label><input type="text" id="fit-line" placeholder="SPL-001"></div>
                </div>
            </div>

            <!-- Fit-up Details Table -->
            <div class="card" style="padding:24px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <div style="font-weight:700;font-size:14px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Section B: Fit-up Details</div>
                    <button class="btn btn-ghost btn-xs" onclick="addFitupRow()">+ Add Fit-up</button>
                </div>
                <div class="table-wrap">
                    <table class="data-table" id="fitup-table">
                        <thead>
                            <tr>
                                <th>Location / Description</th>
                                <th width="100">Joint No</th>
                                <th width="140">WPS Ref</th>
                                <th width="90">Root Gap</th>
                                <th width="90">Hi-Lo</th>
                                <th width="90">Bevel</th>
                                <th>Heat Trace (M1/M2)</th>
                                <th width="80">Verdict</th>
                                <th width="40"></th>
                            </tr>
                        </thead>
                        <tbody id="fitup-body">
                            <!-- Initial row will be added via JS or defined here -->
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card" style="padding:24px;background:var(--bg-elevated)">
                 <div class="qc-field"><label>Fitter Name/Badge</label><input type="text" placeholder="Enter name..."></div>
                 <div style="margin-top:20px;display:flex;justify-content:flex-end">
                     <button class="btn btn-primary" onclick="saveIR_FIT()">Finalize & Save Report</button>
                 </div>
            </div>
        </div>
    `;
    
    // Add initial row
    addFitupRow();
}
window.renderIR_FIT_Form = renderIR_FIT_Form;

function saveIR_FIT() {
    showToast('Fit-up Report saved successfully', 'success');
    renderQC_reports_registry();
}
window.saveIR_FIT = saveIR_FIT;

function addFitupRow() {
    const tbody = document.getElementById('fitup-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" placeholder="e.g. Shell to Dish" class="form-control-xs"></td>
        <td><input type="text" placeholder="J-001" class="form-control-xs"></td>
        <td>
            <select class="form-control-xs">
                <option value="">-- WPS --</option>
                ${WPS_LIST.map(w => `<option value="${w.id}">${w.id}</option>`).join('')}
            </select>
        </td>
        <td><input type="text" placeholder="3.0" class="form-control-xs"></td>
        <td><input type="text" placeholder="1.0" class="form-control-xs"></td>
        <td><input type="text" placeholder="35°" class="form-control-xs"></td>
        <td>
            <div style="display:flex;gap:4px">
                <input type="text" placeholder="Heat 1" class="form-control-xs" style="width:50%">
                <input type="text" placeholder="Heat 2" class="form-control-xs" style="width:50%">
            </div>
        </td>
        <td><select class="form-control-xs"><option>✓</option><option>✕</option></select></td>
        <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
    `;
    tbody.appendChild(tr);
}
window.addFitupRow = addFitupRow;

// ── PHASE 2: IR-VT (Visual Weld) ─────────────────────────────
function renderIR_VT_Form() {
    const el = document.getElementById('pageContent');
    el.innerHTML = `
        <div class="page-header" style="margin-bottom:20px">
            <div style="display:flex;align-items:center;gap:12px">
                <button class="btn btn-icon" onclick="renderQC_reports_registry()"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <div>
                    <div class="page-title">New Visual Weld Inspection Report</div>
                    <div class="page-subtitle">Post-weld visual examination (VT)</div>
                </div>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary btn-sm" onclick="renderQC_reports_registry()">Discard</button>
                <button class="btn btn-primary btn-sm" onclick="saveIR_VT()">Save Report</button>
            </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:24px">
            <div class="card" style="padding:24px">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Welding Execution Details</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px">
                    <div class="qc-field"><label>Job / Project No</label><input type="text" value="${AppState.activeProject || 'P-2401'}"></div>
                    <div class="qc-field"><label>ITP Activity Ref</label><input type="text" placeholder="e.g. ITP-QC-15 (Visual Weld)"></div>
                    <div class="qc-field"><label>Joint No</label><input type="text" placeholder="J-101"></div>
                    <div class="qc-field">
                        <label>Welder Stamp/Name</label>
                        <select id="vt-welder">
                            <option value="">-- Select Welder --</option>
                            ${WELDERS.map(w => `<option value="${w.stamp}">${w.stamp} - ${w.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="qc-field"><label>WPS No</label><input type="text" value="WPS-SS-01" readonly></div>
                    <div class="qc-field"><label>Welding Date</label><input type="date" value="${new Date().toISOString().split('T')[0]}"></div>
                </div>
            </div>

            <div class="card" style="padding:24px">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Visual Examination Checklist</div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr><th>Examination Item</th><th>Acceptance Criteria</th><th>Result</th><th>Remarks</th></tr>
                        </thead>
                        <tbody>
                            ${['Undercut', 'Porosity / Pinholes', 'Cracks', 'Spatter / Arc Strikes', 'Reinforcement Height', 'Weld Width / Uniformity'].map(item => `
                                <tr>
                                    <td>${item}</td>
                                    <td style="font-size:11px;color:var(--text-muted)">Per Code ASME VIII / API 650</td>
                                    <td><select class="form-control-xs"><option>ACCEPT</option><option>REJECT</option><option>N/A</option></select></td>
                                    <td><input type="text" class="form-control-xs" placeholder="Observations..."></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card" style="padding:24px">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">NDT Requirements</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));gap:12px">
                    <div style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="ndt-rt"> <label for="ndt-rt">RT (Radiography)</label></div>
                    <div style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="ndt-ut"> <label for="ndt-ut">UT (Ultrasonic)</label></div>
                    <div style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="ndt-mt"> <label for="ndt-mt">MT (Magnetic)</label></div>
                    <div style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="ndt-pt"> <label for="ndt-pt">PT (Penetrant)</label></div>
                </div>
            </div>

            <!-- Section G: Photo Attachments -->
            <div class="card" style="padding:24px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <div style="font-weight:700;font-size:14px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Section G: Photo Attachments</div>
                    <button class="btn btn-ghost btn-xs" onclick="document.getElementById('vt-photo-input').click()">+ Add Photo</button>
                    <input type="file" id="vt-photo-input" style="display:none" accept="image/*" multiple onchange="handleIRPhotoUpload(this, 'vt-photo-gallery')">
                </div>
                <div id="vt-photo-gallery" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(120px, 1fr));gap:12px">
                    <div style="aspect-ratio:1;border:2px dashed var(--border);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-muted);font-size:11px;text-align:center;padding:12px">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:8px"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        No photos attached
                    </div>
                </div>
            </div>

            <div class="card" style="padding:24px;background:var(--bg-elevated)">
                 <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
                    <div class="qc-field"><label>Final Verdict</label><select id="vt-final-res"><option>ACCEPTED</option><option>REJECTED</option><option>REWORK REQUIRED</option></select></div>
                    <div class="qc-field"><label>Inspector Signature/Stamp</label><input type="text" placeholder="Stamp No..."></div>
                </div>
                <div style="margin-top:20px;display:flex;justify-content:flex-end">
                     <button class="btn btn-primary" onclick="saveIR_VT()">Complete Visual Inspection</button>
                </div>
            </div>
        </div>
    `;
}
window.renderIR_VT_Form = renderIR_VT_Form;

function saveIR_VT() {
    showToast('Visual Weld Report saved successfully', 'success');
    renderQC_reports_registry();
}
window.saveIR_VT = saveIR_VT;

// ── PHASE 3: NDT Reports (RT, UT, MT, PT) ───────────────────
function renderIR_NDT_Form(type) {
    const el = document.getElementById('pageContent');
    const titles = { RT: 'Radiography', UT: 'Ultrasonic', MT: 'Magnetic', PT: 'Liquid Penetrant' };
    const title = titles[type] || 'NDT';

    el.innerHTML = `
        <div class="page-header" style="margin-bottom:20px">
            <div style="display:flex;align-items:center;gap:12px">
                <button class="btn btn-icon" onclick="renderQC_reports_registry()"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <div>
                    <div class="page-title">${title} Inspection (IR-${type})</div>
                    <div class="page-subtitle">Post-weld non-destructive examination</div>
                </div>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary btn-sm" onclick="renderQC_reports_registry()">Discard</button>
                <button class="btn btn-primary btn-sm" onclick="saveIR_NDT('${type}')">Save NDT Report</button>
            </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:24px">
            <div class="card" style="padding:24px">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">General Information</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px">
                    <div class="qc-field"><label>Job / Project No</label><input type="text" value="${AppState.activeProject || 'P-2401'}"></div>
                    <div class="qc-field"><label>ITP Activity Ref</label><input type="text" placeholder="e.g. ITP-QC-18 (NDT)"></div>
                    <div class="qc-field"><label>Joint No</label><input type="text" placeholder="J-101"></div>
                    <div class="qc-field"><label>Report No</label><input type="text" placeholder="NDT-${type}-XXX"></div>
                    <div class="qc-field"><label>Date</label><input type="date" value="${new Date().toISOString().split('T')[0]}"></div>
                </div>
            </div>

            <div class="card" style="padding:24px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <div style="font-weight:700;font-size:14px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Examination Findings</div>
                    <button class="btn btn-ghost btn-xs" onclick="addNDTFindingRow()">+ Add Finding</button>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr><th>Segment / Area</th><th>Result</th><th>Nature of Defect</th><th>Verdict</th><th width="40"></th></tr>
                        </thead>
                        <tbody id="ndt-findings-body">
                            <tr>
                                <td><input type="text" value="0 - 250mm" class="form-control-xs"></td>
                                <td><input type="text" placeholder="Clean" class="form-control-xs"></td>
                                <td><input type="text" placeholder="None" class="form-control-xs"></td>
                                <td><select class="form-control-xs"><option>ACCEPT</option><option>REJECT</option></select></td>
                                <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card" style="padding:24px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <div style="font-weight:700;font-size:14px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Photo Attachments (Findings)</div>
                    <button class="btn btn-ghost btn-xs" onclick="document.getElementById('ndt-photo-input').click()">+ Add Photo</button>
                    <input type="file" id="ndt-photo-input" style="display:none" accept="image/*" multiple onchange="handleIRPhotoUpload(this, 'ndt-photo-gallery')">
                </div>
                <div id="ndt-photo-gallery" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(120px, 1fr));gap:12px">
                    <div style="aspect-ratio:1;border:2px dashed var(--border);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-muted);font-size:11px;text-align:center;padding:12px">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:8px"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        Attach NDT process/defect photos
                    </div>
                </div>
            </div>

            <div class="card" style="padding:24px">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Detailed NDT Report Upload</div>
                <div style="border:1px dashed var(--border);border-radius:12px;padding:32px;text-align:center;background:var(--bg-elevated)">
                    <input type="file" id="ndt-file-input" style="display:none" onchange="handleNDTFileUpload(this)">
                    <button class="btn btn-secondary" onclick="document.getElementById('ndt-file-input').click()">Upload Official NDT Report (PDF/Scan)</button>
                    <div id="ndt-file-status" style="margin-top:12px;font-size:12px;color:var(--text-muted)">Max size 10MB. Accepted: PDF, JPG, PNG</div>
                </div>
            </div>

            <div class="card" style="padding:24px;background:var(--bg-elevated)">
                 <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
                    <div class="qc-field"><label>Final Result</label><select><option>ACCEPTED</option><option>REJECTED</option><option>RE-TEST REQUIRED</option></select></div>
                    <div class="qc-field"><label>Approved By (Level II/III)</label><input type="text" placeholder="Enter name/stamp..."></div>
                </div>
                <div style="margin-top:20px;display:flex;justify-content:flex-end">
                     <button class="btn btn-primary" onclick="saveIR_NDT('${type}')">Complete ${type} Report</button>
                </div>
            </div>
        </div>
    `;
}
window.renderIR_NDT_Form = renderIR_NDT_Form;

function handleNDTFileUpload(input) {
    const status = document.getElementById('ndt-file-status');
    if (input.files && input.files[0]) {
        status.innerHTML = `<span style="color:var(--green);font-weight:700">✓ Attached: ${input.files[0].name}</span>`;
    }
}
window.handleNDTFileUpload = handleNDTFileUpload;

function saveIR_NDT(type) {
    showToast(`${type} Report saved successfully`, 'success');
    renderQC_reports_registry();
}
window.saveIR_NDT = saveIR_NDT;

function renderIR_PT_Form() {
    const el = document.getElementById('pageContent');
    el.innerHTML = `
        <div class="page-header" style="margin-bottom:20px">
            <div style="display:flex;align-items:center;gap:12px">
                <button class="btn btn-icon" onclick="renderQC_reports_registry()"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <div>
                    <div class="page-title">Liquid Penetrant Inspection (IR-PT)</div>
                    <div class="page-subtitle">Detailed in-house surface examination</div>
                </div>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary btn-sm" onclick="renderQC_reports_registry()">Discard</button>
                <button class="btn btn-primary btn-sm" onclick="saveIR_PT()">Save PT Report</button>
            </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:24px">
            <!-- General Info -->
            <div class="card" style="padding:24px">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">General Information</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px">
                    <div class="qc-field"><label>Job / Project No</label><input type="text" value="${AppState.activeProject || 'P-2401'}"></div>
                    <div class="qc-field"><label>Report No</label><input type="text" placeholder="IR-PT-XXX"></div>
                    <div class="qc-field"><label>Date</label><input type="date" value="${new Date().toISOString().split('T')[0]}"></div>
                    <div class="qc-field"><label>Drawing No</label><input type="text" placeholder="DWG-PJ-01"></div>
                    <div class="qc-field"><label>Joint / Spool No</label><input type="text" placeholder="J-101 / SPL-01"></div>
                    <div class="qc-field">
                        <label>Welding Stage</label>
                        <select class="form-control-sm">
                            <option>Final Pass</option>
                            <option>Root Pass</option>
                            <option>Intermediate Pass</option>
                        </select>
                    </div>
                    <div class="qc-field">
                        <label>Welder Stamp/Name</label>
                        <select class="form-control-sm">
                            <option value="">-- Select Welder --</option>
                            ${WELDERS.map(w => `<option value="${w.stamp}">${w.stamp} - ${w.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>

            <!-- PT Consumables -->
            <div class="card" style="padding:24px">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">PT Consumables Detail</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:24px">
                    <div style="border:1px solid var(--border);padding:16px;border-radius:8px">
                        <div style="font-weight:600;font-size:12px;margin-bottom:12px;color:var(--text-muted)">Penetrant</div>
                        <div class="qc-field"><label>Brand/Type</label><input type="text" placeholder="e.g. Magnaflux SKL-SP2"></div>
                        <div class="qc-field"><label>Batch No</label><input type="text" placeholder="Batch #"></div>
                        <div class="qc-field"><label>Expiry Date</label><input type="date"></div>
                    </div>
                    <div style="border:1px solid var(--border);padding:16px;border-radius:8px">
                        <div style="font-weight:600;font-size:12px;margin-bottom:12px;color:var(--text-muted)">Remover / Cleaner</div>
                        <div class="qc-field"><label>Brand/Type</label><input type="text" placeholder="e.g. Magnaflux SKC-S"></div>
                        <div class="qc-field"><label>Batch No</label><input type="text" placeholder="Batch #"></div>
                        <div class="qc-field"><label>Expiry Date</label><input type="date"></div>
                    </div>
                    <div style="border:1px solid var(--border);padding:16px;border-radius:8px">
                        <div style="font-weight:600;font-size:12px;margin-bottom:12px;color:var(--text-muted)">Developer</div>
                        <div class="qc-field"><label>Brand/Type</label><input type="text" placeholder="e.g. Magnaflux SKD-S2"></div>
                        <div class="qc-field"><label>Batch No</label><input type="text" placeholder="Batch #"></div>
                        <div class="qc-field"><label>Expiry Date</label><input type="date"></div>
                    </div>
                </div>
            </div>

            <!-- Examination Findings -->
            <div class="card" style="padding:24px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <div style="font-weight:700;font-size:14px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Examination Findings</div>
                    <button class="btn btn-ghost btn-xs" onclick="addNDTFindingRow()">+ Add Finding</button>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr><th>Segment / Area</th><th>Result</th><th>Nature of Defect</th><th>Verdict</th><th width="40"></th></tr>
                        </thead>
                        <tbody id="ndt-findings-body">
                            <tr>
                                <td><input type="text" placeholder="e.g. Weld Root" class="form-control-xs"></td>
                                <td><input type="text" placeholder="Clean" class="form-control-xs"></td>
                                <td><input type="text" placeholder="None" class="form-control-xs"></td>
                                <td><select class="form-control-xs"><option>ACCEPT</option><option>REJECT</option></select></td>
                                <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Photo Sections -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:24px">
                <!-- Gallery 1 -->
                <div class="card" style="padding:20px">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                        <div style="font-weight:700;font-size:13px;color:var(--brand)">1. Before Penetrant</div>
                        <button class="btn btn-ghost btn-xs" onclick="document.getElementById('pt-photo-1').click()">+ Upload</button>
                        <input type="file" id="pt-photo-1" style="display:none" accept="image/*" multiple onchange="handleIRPhotoUpload(this, 'pt-gallery-1')">
                    </div>
                    <div id="pt-gallery-1" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(80px, 1fr));gap:8px">
                        <div style="font-size:10px;color:var(--text-muted);text-align:center;padding:20px;border:1px dashed var(--border);border-radius:8px">No photos</div>
                    </div>
                </div>

                <!-- Gallery 2 -->
                <div class="card" style="padding:20px">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                        <div style="font-weight:700;font-size:13px;color:var(--brand)">2. After Penetrant</div>
                        <button class="btn btn-ghost btn-xs" onclick="document.getElementById('pt-photo-2').click()">+ Upload</button>
                        <input type="file" id="pt-photo-2" style="display:none" accept="image/*" multiple onchange="handleIRPhotoUpload(this, 'pt-gallery-2')">
                    </div>
                    <div id="pt-gallery-2" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(80px, 1fr));gap:8px">
                        <div style="font-size:10px;color:var(--text-muted);text-align:center;padding:20px;border:1px dashed var(--border);border-radius:8px">No photos</div>
                    </div>
                </div>

                <!-- Gallery 3 -->
                <div class="card" style="padding:20px">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                        <div style="font-weight:700;font-size:13px;color:var(--brand)">3. After Developer</div>
                        <button class="btn btn-ghost btn-xs" onclick="document.getElementById('pt-photo-3').click()">+ Upload</button>
                        <input type="file" id="pt-photo-3" style="display:none" accept="image/*" multiple onchange="handleIRPhotoUpload(this, 'pt-gallery-3')">
                    </div>
                    <div id="pt-gallery-3" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(80px, 1fr));gap:8px">
                        <div style="font-size:10px;color:var(--text-muted);text-align:center;padding:20px;border:1px dashed var(--border);border-radius:8px">No photos</div>
                    </div>
                </div>
            </div>

            <!-- Inspector & Verdict -->
            <div class="card" style="padding:24px;background:var(--bg-elevated)">
                 <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:24px">
                    <div class="qc-field"><label>Inspector Name</label><input type="text" placeholder="Enter name..."></div>
                    <div class="qc-field">
                        <label>Qualification Level</label>
                        <select class="form-control-xs">
                            <option>ASNT Level II</option>
                            <option>ASNT Level III</option>
                            <option>ISO 9712 Level II</option>
                            <option>ISO 9712 Level III</option>
                        </select>
                    </div>
                    <div class="qc-field"><label>Inspector Stamp</label><input type="text" placeholder="Stamp No..."></div>
                    <div class="qc-field"><label>Final Result</label><select id="pt-final-res"><option>ACCEPTED</option><option>REJECTED</option></select></div>
                </div>
                <div style="margin-top:24px;display:flex;justify-content:flex-end">
                     <button class="btn btn-primary" onclick="saveIR_PT()">Finalize & Save PT Report</button>
                </div>
            </div>
        </div>
    `;
}
window.renderIR_PT_Form = renderIR_PT_Form;

function saveIR_PT() {
    showToast('PT Inspection Report saved successfully', 'success');
    renderQC_reports_registry();
}
window.saveIR_PT = saveIR_PT;

function addNDTFindingRow() {
    const tbody = document.getElementById('ndt-findings-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" placeholder="Segment/Area" class="form-control-xs"></td>
        <td><input type="text" placeholder="Findings..." class="form-control-xs"></td>
        <td><input type="text" placeholder="Defect type..." class="form-control-xs"></td>
        <td><select class="form-control-xs"><option>ACCEPT</option><option>REJECT</option></select></td>
        <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
    `;
    tbody.appendChild(tr);
}
window.addNDTFindingRow = addNDTFindingRow;

// ── PHASE 3: IR-HT (Hydrostatic Test) ───────────────────────
function renderIR_HT_Form() {
    const el = document.getElementById('pageContent');
    el.innerHTML = `
        <div class="page-header" style="margin-bottom:20px">
            <div style="display:flex;align-items:center;gap:12px">
                <button class="btn btn-icon" onclick="renderQC_reports_registry()"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <div>
                    <div class="page-title">New Hydrostatic Test Report</div>
                    <div class="page-subtitle">Pressure & leak testing documentation</div>
                </div>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary btn-sm" onclick="renderQC_reports_registry()">Discard</button>
                <button class="btn btn-primary btn-sm" onclick="saveIR_HT()">Save Test Report</button>
            </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:24px">
            <div class="card" style="padding:24px">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">General Information</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px">
                    <div class="qc-field"><label>Job / Project No</label><input type="text" value="${AppState.activeProject || 'P-2401'}"></div>
                    <div class="qc-field"><label>ITP Activity Ref</label><input type="text" placeholder="e.g. ITP-QC-25 (Pressure Test)"></div>
                    <div class="qc-field"><label>Report No</label><input type="text" placeholder="IR-HT-XXX"></div>
                    <div class="qc-field"><label>Equipment / Spool Name</label><input type="text" placeholder="Pressure Vessel V-101"></div>
                    <div class="qc-field"><label>Test Date</label><input type="date" value="${new Date().toISOString().split('T')[0]}"></div>
                </div>
            </div>

            <div class="card" style="padding:24px">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Pressure Parameters</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:16px">
                    <div class="qc-field"><label>Design Pressure (Bar)</label><input type="number" step="0.1" value="10.0"></div>
                    <div class="qc-field"><label>Test Pressure (Bar)</label><input type="number" step="0.1" value="15.0"></div>
                    <div class="qc-field"><label>Holding Time (Min)</label><input type="number" value="30"></div>
                    <div class="qc-field"><label>Test Medium</label><input type="text" value="Potable Water"></div>
                </div>
            </div>

            <div class="card" style="padding:24px">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Instrument Traceability</div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr><th>Gauge ID</th><th>Range (Bar)</th><th>Last Cal Date</th><th>Position</th></tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><input type="text" value="G-108" class="form-control-xs"></td>
                                <td><input type="text" value="0-25" class="form-control-xs"></td>
                                <td><input type="date" value="2024-12-01" class="form-control-xs"></td>
                                <td><input type="text" value="Pump Outlet" class="form-control-xs"></td>
                            </tr>
                            <tr>
                                <td><input type="text" value="G-109" class="form-control-xs"></td>
                                <td><input type="text" value="0-25" class="form-control-xs"></td>
                                <td><input type="date" value="2024-12-05" class="form-control-xs"></td>
                                <td><input type="text" value="Top Vent" class="form-control-xs"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card" style="padding:24px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <div style="font-weight:700;font-size:14px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Test Photos (Gauges & Chart)</div>
                    <button class="btn btn-ghost btn-xs" onclick="document.getElementById('ht-photo-input').click()">+ Add Photo</button>
                    <input type="file" id="ht-photo-input" style="display:none" accept="image/*" multiple onchange="handleIRPhotoUpload(this, 'ht-photo-gallery')">
                </div>
                <div id="ht-photo-gallery" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(120px, 1fr));gap:12px">
                    <div style="aspect-ratio:1;border:2px dashed var(--border);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-muted);font-size:11px;text-align:center;padding:12px">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:8px"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        Attach photos of calibrated gauges at peak pressure
                    </div>
                </div>
            </div>

            <div class="card" style="padding:24px;background:var(--bg-elevated)">
                 <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
                    <div class="qc-field"><label>Final Test Result</label><select><option>SUCCESSFUL / PASS</option><option>FAILED / LEAK FOUND</option></select></div>
                    <div class="qc-field"><label>Third Party / Client Witness</label><input type="text" placeholder="Enter name..."></div>
                </div>
                <div style="margin-top:20px;display:flex;justify-content:flex-end">
                     <button class="btn btn-primary" onclick="saveIR_HT()">Finalize Hydro Report</button>
                </div>
            </div>
        </div>
    `;
}
window.renderIR_HT_Form = renderIR_HT_Form;

function saveIR_HT() {
    showToast('Hydrostatic Test Report saved successfully', 'success');
    renderQC_reports_registry();
}
window.saveIR_HT = saveIR_HT;

// ── PHASE 4: IR-COAT (Coating & Surface) ────────────────────
function renderIR_COAT_Form() {
    const el = document.getElementById('pageContent');
    el.innerHTML = `
        <div class="page-header" style="margin-bottom:20px">
            <div style="display:flex;align-items:center;gap:12px">
                <button class="btn btn-icon" onclick="renderQC_reports_registry()"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <div>
                    <div class="page-title">New Coating & Surface Report</div>
                    <div class="page-subtitle">Surface preparation & coating system verification</div>
                </div>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary btn-sm" onclick="renderQC_reports_registry()">Discard</button>
                <button class="btn btn-primary btn-sm" onclick="saveIR_COAT()">Save Coating Report</button>
            </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:24px">
            <div class="card" style="padding:24px">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">General Information</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px">
                    <div class="qc-field"><label>Job / Project No</label><input type="text" value="${AppState.activeProject || 'P-2401'}"></div>
                    <div class="qc-field"><label>Report No</label><input type="text" placeholder="IR-COAT-XXX"></div>
                    <div class="qc-field"><label>Drawing No</label><input type="text" placeholder="DWG-PJ-01"></div>
                    <div class="qc-field"><label>Inspection Date</label><input type="date" value="${new Date().toISOString().split('T')[0]}"></div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
                <div class="card" style="padding:24px">
                    <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Surface Preparation</div>
                    <div class="qc-field"><label>Blasting Grade</label><select><option>Sa 2.5 (Near White)</option><option>Sa 3 (White Metal)</option><option>Sa 2 (Commercial)</option></select></div>
                    <div class="qc-field"><label>Abrasive Type</label><input type="text" placeholder="e.g. Copper Slag / Garnet"></div>
                    <div class="qc-field"><label>Surface Profile (Avg Microns)</label><input type="number" placeholder="50-75"></div>
                </div>
                <div class="card" style="padding:24px">
                    <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Environmental Conditions</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                        <div class="qc-field"><label>Amb. Temp (°C)</label><input type="number" step="0.1" placeholder="32.5"></div>
                        <div class="qc-field"><label>Rel. Humidity (%)</label><input type="number" placeholder="65"></div>
                        <div class="qc-field"><label>Dew Point (°C)</label><input type="number" step="0.1" placeholder="24.2"></div>
                        <div class="qc-field"><label>Steel Temp (°C)</label><input type="number" step="0.1" placeholder="35.0"></div>
                    </div>
                </div>
            </div>

            <div class="card" style="padding:24px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <div style="font-weight:700;font-size:14px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Coating System Verification</div>
                    <button class="btn btn-ghost btn-xs" onclick="addCoatingRow()">+ Add Layer</button>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr><th>Layer</th><th>Paint Brand/Type</th><th>Batch No</th><th>Specified DFT (µ)</th><th>Actual DFT (µ)</th><th width="40"></th></tr>
                        </thead>
                        <tbody id="coating-body">
                            <tr>
                                <td><input type="text" value="Primer" class="form-control-xs"></td>
                                <td><input type="text" placeholder="Jotun Zinc Rich" class="form-control-xs"></td>
                                <td><input type="text" placeholder="B-8821" class="form-control-xs"></td>
                                <td><input type="text" placeholder="60-80" class="form-control-xs"></td>
                                <td><input type="text" placeholder="72" class="form-control-xs"></td>
                                <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card" style="padding:24px;background:var(--bg-elevated)">
                 <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
                    <div class="qc-field"><label>Final Coating Status</label><select><option>ACCEPTED</option><option>REWORK REQUIRED</option></select></div>
                    <div class="qc-field"><label>Painting Inspector</label><input type="text" placeholder="Enter name/stamp..."></div>
                </div>
                <div style="margin-top:20px;display:flex;justify-content:flex-end">
                     <button class="btn btn-primary" onclick="saveIR_COAT()">Finalize Coating Report</button>
                </div>
            </div>
        </div>
    `;
}
window.renderIR_COAT_Form = renderIR_COAT_Form;

function addCoatingRow() {
    const tbody = document.getElementById('coating-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" placeholder="e.g. Intermediate" class="form-control-xs"></td>
        <td><input type="text" placeholder="Paint brand" class="form-control-xs"></td>
        <td><input type="text" placeholder="Batch #" class="form-control-xs"></td>
        <td><input type="text" placeholder="120" class="form-control-xs"></td>
        <td><input type="text" placeholder="—" class="form-control-xs"></td>
        <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
    `;
    tbody.appendChild(tr);
}
window.addCoatingRow = addCoatingRow;

function saveIR_COAT() {
    showToast('Coating Report saved successfully', 'success');
    renderQC_reports_registry();
}
window.saveIR_COAT = saveIR_COAT;

// ── PHASE 4: IR-FINAL (Final Inspection) ────────────────────
function renderIR_FINAL_Form() {
    const el = document.getElementById('pageContent');
    el.innerHTML = `
        <div class="page-header" style="margin-bottom:20px">
            <div style="display:flex;align-items:center;gap:12px">
                <button class="btn btn-icon" onclick="renderQC_reports_registry()"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <div>
                    <div class="page-title">Final Inspection & Pre-Dispatch</div>
                    <div class="page-subtitle">Completion verification prior to release for shipping</div>
                </div>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary btn-sm" onclick="renderQC_reports_registry()">Discard</button>
                <button class="btn btn-primary btn-sm" onclick="saveIR_FINAL()">Authorize Dispatch</button>
            </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:24px">
            <div class="card" style="padding:24px">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Shipment Identification</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px">
                    <div class="qc-field"><label>Job / Project No</label><input type="text" value="${AppState.activeProject || 'P-2401'}"></div>
                    <div class="qc-field"><label>Item / Spool No</label><input type="text" placeholder="V-101 / SPL-441"></div>
                    <div class="qc-field"><label>Report No</label><input type="text" placeholder="IR-FINAL-XXX"></div>
                    <div class="qc-field"><label>Release Date</label><input type="date" value="${new Date().toISOString().split('T')[0]}"></div>
                </div>
            </div>

            <div class="card" style="padding:24px">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Final Verification Checklist</div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr><th>Check Point</th><th>Acceptance Criteria</th><th>Verdict</th><th>Remarks</th></tr>
                        </thead>
                        <tbody>
                            ${[
                                'Visual & Dimensional Completion',
                                'Nameplate Verification (Data vs Dwg)',
                                'Nozzle Orientation & Flange Face',
                                'Internal & External Cleanliness',
                                'Coating/Painting Final Finish',
                                'QC Dossier / MDR Completeness',
                                'Packing & Protection (End caps, etc)'
                            ].map(item => `
                                <tr>
                                    <td>${item}</td>
                                    <td style="font-size:11px;color:var(--text-muted)">Per Project Specifications</td>
                                    <td><select class="form-control-xs"><option>✓ PASS</option><option>✕ FAIL</option><option>N/A</option></select></td>
                                    <td><input type="text" class="form-control-xs" placeholder="..."></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card" style="padding:24px">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Dispatch Documentation</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
                    <div style="display:flex;align-items:center;gap:10px;padding:12px;border:1px solid var(--border);border-radius:8px">
                        <input type="checkbox" id="doc-dossier">
                        <label for="doc-dossier" style="font-size:13px">QC Dossier Compiled & Signed</label>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;padding:12px;border:1px solid var(--border);border-radius:8px">
                        <input type="checkbox" id="doc-dispatch">
                        <label for="doc-dispatch" style="font-size:13px">Dispatch Clearance (DCR) Received</label>
                    </div>
                </div>
            </div>

            <div class="card" style="padding:24px;background:var(--bg-elevated)">
                 <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
                    <div class="qc-field"><label>Authorized By</label><input type="text" placeholder="QA/QC Manager Name"></div>
                    <div class="qc-field"><label>Customer/TPI Approval</label><input type="text" placeholder="Witness/TPI Signature"></div>
                </div>
                <div style="margin-top:20px;display:flex;justify-content:flex-end">
                     <button class="btn btn-primary" onclick="saveIR_FINAL()">Finalize & Release for Dispatch</button>
                </div>
            </div>
        </div>
    `;
}
window.renderIR_FINAL_Form = renderIR_FINAL_Form;

function saveIR_FINAL() {
    showToast('Final Inspection Report saved. Item released for dispatch.', 'success');
    renderQC_reports_registry();
}
window.saveIR_FINAL = saveIR_FINAL;

// ── PHASE 4: IR-FAT (FAT / TPI Witness Report) ──────────────
function renderIR_FAT_Form() {
    const el = document.getElementById('pageContent');
    el.innerHTML = `
        <div class="page-header" style="margin-bottom:20px">
            <div style="display:flex;align-items:center;gap:12px">
                <button class="btn btn-icon" onclick="renderQC_reports_registry()"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <div>
                    <div class="page-title">FAT / TPI Witness Report</div>
                    <div class="page-subtitle">Host customer/third-party inspections with detailed evidence</div>
                </div>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary btn-sm" onclick="renderQC_reports_registry()">Discard</button>
                <button class="btn btn-primary btn-sm" onclick="saveIR_FAT()">Finalize FAT Report</button>
            </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:24px">
            <!-- Header -->
            <div class="card" style="padding:24px">
                <div style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">General Information</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px">
                    <div class="qc-field"><label>Job / Project No</label><input type="text" value="${AppState.activeProject || 'P-2401'}"></div>
                    <div class="qc-field"><label>Equipment / Item</label><input type="text" placeholder="e.g. Pressure Vessel V-101"></div>
                    <div class="qc-field"><label>FAT Date</label><input type="date" value="${new Date().toISOString().split('T')[0]}"></div>
                    <div class="qc-field"><label>Client / Customer</label><input type="text" placeholder="Client Name"></div>
                </div>
            </div>

            <!-- Attendance -->
            <div class="card" style="padding:24px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <div style="font-weight:700;font-size:14px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Witness Attendance</div>
                    <button class="btn btn-ghost btn-xs" onclick="addFATWitnessRow()">+ Add Participant</button>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr><th>Name</th><th>Organization</th><th>Designation</th><th width="40"></th></tr>
                        </thead>
                        <tbody id="fat-attendance-body">
                            <tr>
                                <td><input type="text" placeholder="Name" class="form-control-xs"></td>
                                <td><input type="text" placeholder="Internal / TPI / Client" class="form-control-xs"></td>
                                <td><input type="text" placeholder="QC Engineer / Inspector" class="form-control-xs"></td>
                                <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Test Procedures -->
            <div class="card" style="padding:24px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <div style="font-weight:700;font-size:14px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Test Steps & Procedures</div>
                    <button class="btn btn-ghost btn-xs" onclick="addFATStepRow()">+ Add Test Step</button>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr><th>Step</th><th>Description / Requirement</th><th>Result</th><th>Remarks</th><th width="40"></th></tr>
                        </thead>
                        <tbody id="fat-steps-body">
                            <tr>
                                <td width="60"><input type="text" value="01" class="form-control-xs"></td>
                                <td><input type="text" placeholder="e.g. Visual verification of all welds" class="form-control-xs"></td>
                                <td width="120"><select class="form-control-xs"><option>PASSED</option><option>FAILED</option><option>N/A</option></select></td>
                                <td><input type="text" placeholder="..." class="form-control-xs"></td>
                                <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Evidence Section (Photos with Description) -->
            <div class="card" style="padding:24px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                    <div style="font-weight:700;font-size:14px;color:var(--brand);text-transform:uppercase;letter-spacing:0.05em">Visual Evidence & Findings</div>
                    <button class="btn btn-ghost btn-xs" onclick="addFATEvidenceRow()">+ Add Evidence Photo</button>
                </div>
                <div id="fat-evidence-container" style="display:flex;flex-direction:column;gap:16px">
                    <!-- Evidence Row Template -->
                    <div class="fat-evidence-item" style="display:grid;grid-template-columns:150px 1fr 40px;gap:20px;padding:16px;border:1px solid var(--border);border-radius:12px;background:var(--bg-card)">
                        <div style="width:150px;height:120px;border:2px dashed var(--border);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;overflow:hidden" onclick="this.nextElementSibling.click()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            <div style="font-size:10px;margin-top:4px">Upload Photo</div>
                        </div>
                        <input type="file" style="display:none" onchange="previewFATEvidence(this)">
                        <div style="display:flex;flex-direction:column;gap:8px">
                            <label style="font-size:11px;font-weight:600;color:var(--text-muted)">Photo Description / Findings</label>
                            <textarea class="form-control" style="height:100px;font-size:13px;resize:none" placeholder="Enter detailed description of the photo, observations, or TPI comments..."></textarea>
                        </div>
                        <div style="display:flex;align-items:center;justify-content:center">
                            <button class="btn-icon" onclick="this.closest('.fat-evidence-item').remove()"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Authorization -->
            <div class="card" style="padding:24px;background:var(--bg-elevated)">
                 <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:24px">
                    <div class="qc-field"><label>FAT Outcome</label><select><option>SUCCESSFUL / RELEASED</option><option>CONDITIONALLY ACCEPTED</option><option>FAILED / RE-FAT REQUIRED</option></select></div>
                    <div class="qc-field"><label>Internal QC Authorization</label><input type="text" placeholder="Name/Stamp"></div>
                    <div class="qc-field"><label>Customer/TPI Approval</label><input type="text" placeholder="Witness Signature"></div>
                </div>
                <div style="margin-top:24px;display:flex;justify-content:flex-end">
                     <button class="btn btn-primary" onclick="saveIR_FAT()">Authorize & Save FAT Report</button>
                </div>
            </div>
        </div>
    `;
}
window.renderIR_FAT_Form = renderIR_FAT_Form;

function addFATWitnessRow() {
    const tbody = document.getElementById('fat-attendance-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" placeholder="Name" class="form-control-xs"></td>
        <td><input type="text" placeholder="Organization" class="form-control-xs"></td>
        <td><input type="text" placeholder="Designation" class="form-control-xs"></td>
        <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
    `;
    tbody.appendChild(tr);
}
window.addFATWitnessRow = addFATWitnessRow;

function addFATStepRow() {
    const tbody = document.getElementById('fat-steps-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td width="60"><input type="text" placeholder="Step" class="form-control-xs"></td>
        <td><input type="text" placeholder="Procedure description..." class="form-control-xs"></td>
        <td width="120"><select class="form-control-xs"><option>PASSED</option><option>FAILED</option><option>N/A</option></select></td>
        <td><input type="text" placeholder="..." class="form-control-xs"></td>
        <td><button class="btn-icon" onclick="this.closest('tr').remove()"><svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button></td>
    `;
    tbody.appendChild(tr);
}
window.addFATStepRow = addFATStepRow;

function addFATEvidenceRow() {
    const container = document.getElementById('fat-evidence-container');
    const div = document.createElement('div');
    div.className = 'fat-evidence-item';
    div.style.cssText = 'display:grid;grid-template-columns:150px 1fr 40px;gap:20px;padding:16px;border:1px solid var(--border);border-radius:12px;background:var(--bg-card);margin-top:12px';
    div.innerHTML = `
        <div style="width:150px;height:120px;border:2px dashed var(--border);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;overflow:hidden" onclick="this.nextElementSibling.click()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <div style="font-size:10px;margin-top:4px">Upload Photo</div>
        </div>
        <input type="file" style="display:none" onchange="previewFATEvidence(this)">
        <div style="display:flex;flex-direction:column;gap:8px">
            <label style="font-size:11px;font-weight:600;color:var(--text-muted)">Photo Description / Findings</label>
            <textarea class="form-control" style="height:100px;font-size:13px;resize:none" placeholder="Enter detailed description..."></textarea>
        </div>
        <div style="display:flex;align-items:center;justify-content:center">
            <button class="btn-icon" onclick="this.closest('.fat-evidence-item').remove()"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--red)"><path d="M2 2l10 10M12 2L2 12" stroke-width="2"/></svg></button>
        </div>
    `;
    container.appendChild(div);
}
window.addFATEvidenceRow = addFATEvidenceRow;

function previewFATEvidence(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewBox = input.previousElementSibling;
            previewBox.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}
window.previewFATEvidence = previewFATEvidence;

function saveIR_FAT() {
    showToast('FAT / TPI Witness Report saved successfully', 'success');
    renderQC_reports_registry();
}
window.saveIR_FAT = saveIR_FAT;

// ── PHASE 4: QC Dossier & MDR Builder ───────────────────────
function renderQC_qc_dossier(targetPid) {
    const el = document.getElementById('pageContent');
    const pid = targetPid || AppState.activeProject || (typeof QCData !== 'undefined' && QCData.projects[0]?.id) || 'P-2401';
    const project = (typeof AppState !== 'undefined' ? AppState.projects : []).find(p => p.id === pid) ||
                    (typeof QCData !== 'undefined' ? QCData.projects : []).find(p => p.id === pid) || { id: pid, name: pid };

    // ── Derive section status from live data ──────────────────
    const itp     = (typeof QCData !== 'undefined' ? QCData.itp[pid] : null) || [];
    const ncrs    = (typeof QCData !== 'undefined' ? QCData.ncr : []).filter(n => n.project === pid || !n.project);
    const joints  = (typeof WeldData !== 'undefined' ? WeldData.joints[pid] : null) || [];
    const pwhtList = (typeof WeldData !== 'undefined' ? WeldData.pwht?.[pid] : null) || [];
    const projectReports = (typeof QCReportsData !== 'undefined' ? QCReportsData.reports : []).filter(r => r.project === pid);

    const itpDone    = itp.filter(s => s.status === 'done').length;
    const itpTotal   = itp.length;
    const itpWithRef = itp.filter(s => s.ref && s.status === 'done').length;
    const ndeJoints  = joints.filter(j => j.nde && j.nde !== '—').length;
    const ndeAccepted= joints.filter(j => j.ndeResult === 'Accept').length;
    const hydroStep  = itp.find(s => s.activity?.toLowerCase().includes('hydrostatic') || s.activity?.toLowerCase().includes('pressure test'));
    const dimStep    = itp.find(s => s.activity?.toLowerCase().includes('dimensional'));
    const pwhtRequired = itp.some(s => s.activity?.toLowerCase().includes('pwht'));

    const sections = [
      {
        no: '1', title: 'Material Test Certificates (MTC)',
        items: itp.filter(s => s.ref && (s.activity?.toLowerCase().includes('material') || s.activity?.toLowerCase().includes('incoming') || s.activity?.toLowerCase().includes('milling') || s.activity?.toLowerCase().includes('mtc'))),
        status: itpWithRef > 0 ? 'attached' : itp.some(s=>s.activity?.toLowerCase().includes('incoming')) ? 'pending' : 'na',
        detail: itpWithRef > 0 ? `${itpWithRef} cert(s) on record` : 'No MTC refs in ITP',
      },
      {
        no: '2', title: 'Weld Map / Joint Register',
        status: joints.length > 0 ? 'attached' : 'pending',
        detail: joints.length > 0 ? `${joints.length} joints — ${joints.filter(j=>j.status==='complete').length} complete` : 'No weld joints logged',
      },
      {
        no: '3', title: 'NDT / NDE Inspection Reports',
        status: ndeJoints > 0 ? (ndeAccepted === ndeJoints ? 'attached' : 'pending') : 'pending',
        detail: ndeJoints > 0 ? `${ndeAccepted}/${ndeJoints} joints accepted` : 'No NDE records',
      },
      {
        no: '4', title: 'NCR Register',
        status: ncrs.length > 0 ? (ncrs.every(n=>n.status==='closed') ? 'attached' : 'pending') : 'na',
        detail: ncrs.length === 0 ? 'No NCRs raised' : `${ncrs.filter(n=>n.status==='open').length} open / ${ncrs.filter(n=>n.status==='closed').length} closed`,
      },
      {
        no: '5', title: 'PWHT Time-Temperature Charts',
        status: !pwhtRequired ? 'na' : pwhtList.length > 0 ? 'attached' : 'missing',
        detail: !pwhtRequired ? 'Not required per WPS' : pwhtList.length > 0 ? `${pwhtList.filter(r=>r.result==='pass').length} passed` : 'PWHT required — no records logged',
      },
      {
        no: '6', title: 'Hydrostatic / Pressure Test Certificate',
        status: hydroStep ? (hydroStep.status === 'done' ? 'attached' : 'pending') : 'pending',
        detail: hydroStep ? (hydroStep.status === 'done' ? `ITP ${hydroStep.step} — ${hydroStep.result||'Pass'}` : 'ITP step pending') : 'Not in ITP',
      },
      {
        no: '7', title: 'Dimensional Inspection Reports',
        status: dimStep ? (dimStep.status === 'done' ? 'attached' : 'pending') : 'pending',
        detail: dimStep ? (dimStep.status === 'done' ? `ITP ${dimStep.step} — Pass` : 'ITP step pending') : 'Not yet logged',
      },
      {
        no: '8', title: 'ITP Sign-off Sheet (all stages)',
        status: itpTotal === 0 ? 'missing' : itpDone === itpTotal ? 'attached' : 'pending',
        detail: itpTotal === 0 ? 'No ITP loaded' : `${itpDone}/${itpTotal} steps signed off`,
      },
      {
        no: '9', title: 'Calibration Certificates (equipment used)',
        status: (typeof QCData !== 'undefined' && QCData.calibration.length > 0) ? 'attached' : 'pending',
        detail: (typeof QCData !== 'undefined' && QCData.calibration.length) ? `${QCData.calibration.length} instruments on record` : 'No calibration data',
      },
      {
        no: '10', title: 'QC Sign-off & Client Witness Record',
        status: itp.some(s=>s.activity?.toLowerCase().includes('dispatch')||s.activity?.toLowerCase().includes('witness')) && itp.find(s=>s.activity?.toLowerCase().includes('dispatch'))?.status==='done' ? 'attached' : 'pending',
        detail: 'Pre-dispatch client witness inspection',
      },
    ];

    const attached = sections.filter(s => s.status === 'attached').length;
    const missing  = sections.filter(s => s.status === 'missing').length;
    const pending  = sections.filter(s => s.status === 'pending').length;
    const naCount  = sections.filter(s => s.status === 'na').length;
    const applicable = sections.filter(s => s.status !== 'na').length;
    const readinessPct = applicable > 0 ? Math.round((attached / applicable) * 100) : 0;

    const statusBadge = s => ({
      attached: `<span class="badge badge-green"  style="font-size:10px">Attached</span>`,
      pending:  `<span class="badge badge-amber"  style="font-size:10px">Pending</span>`,
      missing:  `<span class="badge badge-red"    style="font-size:10px">Missing</span>`,
      na:       `<span class="badge badge-muted"  style="font-size:10px">N/A</span>`,
    }[s] || '');

    const projectReports_legacy = projectReports; // keep for legacy table below

    el.innerHTML = `
        <div class="page-header" style="margin-bottom:20px">
            <div>
                <div class="page-title">QC Dossier / MDR Compiler</div>
                <div class="page-subtitle">Manufacturing Data Record — ${pid} · ${project.name || pid}</div>
            </div>
            <div class="page-actions" style="display:flex;gap:8px">
                <select id="mdrPidSelect" class="form-control" style="font-size:12px;padding:6px 10px" onchange="renderQC_qc_dossier(this.value)">
                  ${(typeof AppState !== 'undefined' ? AppState.projects : (typeof QCData !== 'undefined' ? QCData.projects : [])).map(p => `<option value="${p.id}" ${p.id===pid?'selected':''}>${p.id} — ${p.name||p.id}</option>`).join('')}
                </select>
                <button class="btn btn-primary btn-sm" onclick="generateMDRPackage('${pid}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    Print / Export MDR
                </button>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:280px 1fr;gap:24px">
            <!-- Left Panel: Readiness gauge + project details -->
            <div style="display:flex;flex-direction:column;gap:16px">
                <div class="card" style="padding:20px">
                    <div style="font-weight:700;font-size:13px;margin-bottom:14px">MDR Readiness</div>
                    <div style="position:relative;width:120px;margin:0 auto 16px">
                      <svg viewBox="0 0 120 120" width="120" height="120">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" stroke-width="10"/>
                        <circle cx="60" cy="60" r="50" fill="none"
                          stroke="${readinessPct >= 80 ? 'var(--green)' : readinessPct >= 50 ? 'var(--amber)' : 'var(--red)'}"
                          stroke-width="10" stroke-linecap="round"
                          stroke-dasharray="${Math.round(readinessPct * 3.14159)} 314.159"
                          transform="rotate(-90 60 60)"/>
                        <text x="60" y="64" text-anchor="middle" font-size="22" font-weight="700"
                          fill="${readinessPct >= 80 ? 'var(--green)' : readinessPct >= 50 ? 'var(--amber)' : 'var(--red)'}"
                          style="font-family:var(--font-display)">${readinessPct}%</text>
                        <text x="60" y="80" text-anchor="middle" font-size="9" fill="var(--text-muted)">Readiness</text>
                      </svg>
                    </div>
                    ${[
                      ['Attached', attached, 'var(--green)'],
                      ['Pending',  pending,  'var(--amber)'],
                      ['Missing',  missing,  'var(--red)'],
                      ['N/A',      naCount,  'var(--text-muted)'],
                    ].map(([l,v,c]) => `
                      <div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid var(--border-subtle)">
                        <span>${l}</span><span style="font-weight:700;color:${c}">${v}</span>
                      </div>`).join('')}
                    ${missing > 0 ? `
                    <div style="margin-top:12px;padding:8px 10px;background:var(--red-bg);border-radius:var(--radius-sm);font-size:11px;color:var(--red)">
                      ⚠ ${missing} required document(s) missing — MDR not ready for submission.
                    </div>` : readinessPct === 100 ? `
                    <div style="margin-top:12px;padding:8px 10px;background:var(--green-bg);border-radius:var(--radius-sm);font-size:11px;color:var(--green)">
                      ✓ All applicable sections complete — MDR ready for client submission.
                    </div>` : ''}
                </div>

                <div class="card" style="padding:16px">
                  <div style="font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;margin-bottom:10px">Project</div>
                  <div style="font-size:13px;font-weight:600;margin-bottom:4px">${project.name || pid}</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">Client: ${project.client || '—'}</div>
                  <div style="font-size:11px;color:var(--text-muted)">ITP progress: ${itpDone}/${itpTotal} steps</div>
                  <div style="font-size:11px;color:var(--text-muted)">Weld joints: ${joints.length} (${joints.filter(j=>j.status==='complete').length} complete)</div>
                  <div style="font-size:11px;color:var(--text-muted)">NCRs: ${ncrs.length} (${ncrs.filter(n=>n.status==='open').length} open)</div>
                </div>
            </div>

            <!-- Right Panel: Document sections checklist -->
            <div class="card">
                <div style="padding:16px;border-bottom:1px solid var(--border)">
                    <div style="font-weight:700;font-size:14px">MDR Document Sections</div>
                    <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Live status derived from ITP, NCR, weld register, and PWHT data</div>
                </div>
                <table class="data-table">
                  <thead>
                    <tr>
                      <th width="32">#</th>
                      <th>Section</th>
                      <th width="160">Status</th>
                      <th>Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${sections.map(s => `
                      <tr style="${s.status==='missing' ? 'background:rgba(239,68,68,0.04)' : ''}">
                        <td style="font-size:12px;color:var(--text-muted);font-family:var(--font-mono)">${s.no}</td>
                        <td style="font-weight:500;font-size:13px">${s.title}</td>
                        <td>${statusBadge(s.status)}</td>
                        <td style="font-size:11px;color:var(--text-muted)">${s.detail||''}</td>
                      </tr>`).join('')}
                  </tbody>
                </table>

                ${projectReports_legacy.length > 0 ? `
                <div style="padding:14px 16px;border-top:1px solid var(--border)">
                  <div style="font-size:12px;font-weight:600;margin-bottom:10px;color:var(--text-secondary)">Inspection reports available for inclusion (${projectReports_legacy.length})</div>
                  <div style="display:flex;flex-wrap:wrap;gap:8px">
                    ${projectReports_legacy.map(r=>`
                      <div style="padding:4px 10px;background:var(--bg-elevated);border-radius:20px;font-size:11px;font-family:var(--font-mono);color:var(--brand);cursor:pointer" onclick="viewInspectionReport('${r.id}')" title="${r.type}">${r.id}</div>`).join('')}
                  </div>
                </div>` : ''}
            </div>
        </div>

        <!-- Print-only MDR cover page (hidden in UI) -->
        <div id="mdr-preview-cover" style="display:none">
            <div style="height:1000px;display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px solid #000;padding:50px;font-family:serif;text-align:center">
                <div style="font-size:32px;font-weight:bold;margin-bottom:20px">MANUFACTURING DATA RECORD (MDR)</div>
                <div style="font-size:24px;margin-bottom:60px;border-bottom:2px solid #000;width:80%">PROJECT: ${pid}</div>
                <div style="font-size:18px;margin-bottom:10px">CLIENT: ${project.client || '—'}</div>
                <div style="font-size:18px;margin-bottom:10px">PROJECT: ${project.name || pid}</div>
                <div style="font-size:14px;margin-top:auto">NEXAFORGE INDUSTRIES — QUALITY CONTROL DEPARTMENT</div>
                <div style="font-size:12px">${new Date().toLocaleDateString('en-GB')}</div>
            </div>
        </div>
        <div id="mdr-print-body" style="display:none">
            <h2 style="font-family:serif">Manufacturing Data Record — ${pid}</h2>
            <table border="1" cellpadding="6" style="width:100%;border-collapse:collapse;font-size:12px">
              <thead><tr style="background:#eee"><th>#</th><th>Section</th><th>Status</th><th>Detail</th></tr></thead>
              <tbody>
                ${sections.map(s=>`<tr><td>${s.no}</td><td>${s.title}</td><td>${s.status.toUpperCase()}</td><td>${s.detail||''}</td></tr>`).join('')}
              </tbody>
            </table>
            <p style="font-size:11px;margin-top:16px">MDR Readiness: ${readinessPct}% · Generated: ${new Date().toLocaleString('en-GB')} · NexaForge QC Dept</p>
        </div>
    `;
                </div>
            </div>
        </div>

}
window.renderQC_qc_dossier = renderQC_qc_dossier;

function toggleAllDossierReports(master) {
    document.querySelectorAll('.dossier-cb').forEach(cb => cb.checked = master.checked);
}
window.toggleAllDossierReports = toggleAllDossierReports;

function generateMDRPackage(pid) {
    // Show print-only sections and trigger print dialog
    const cover = document.getElementById('mdr-preview-cover');
    const body  = document.getElementById('mdr-print-body');
    if (cover) cover.style.display = 'block';
    if (body)  body.style.display  = 'block';
    setTimeout(() => {
        window.print();
        setTimeout(() => {
            if (cover) cover.style.display = 'none';
            if (body)  body.style.display  = 'none';
        }, 1000);
    }, 150);
    typeof showToast === 'function' && showToast('Opening print dialog for MDR…', 'info');
}
window.generateMDRPackage = generateMDRPackage;

// ── View & Print Handlers ─────────────────────────────────────
function viewInspectionReport(id) {
    const el = document.getElementById('pageContent');
    const r = QCReportsData.reports.find(x => x.id === id) || QCReportsData.reports[0];
    
    // In a real app, we'd load the specific data. For now, we'll render the template with mock data.
    if (r.type === 'MAT') renderIR_MAT_View(r);
    else renderIR_DIM_View(r);
}
window.viewInspectionReport = viewInspectionReport;

function printInspectionReport(id) {
    viewInspectionReport(id);
    setTimeout(() => window.print(), 500);
}
window.printInspectionReport = printInspectionReport;

function renderIR_MAT_View(r) {
    const el = document.getElementById('pageContent');
    el.innerHTML = `
        <div class="page-header" style="margin-bottom:20px">
            <div style="display:flex;align-items:center;gap:12px">
                <button class="btn btn-icon" onclick="renderQC_reports_registry()"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <div>
                    <div class="page-title">${r.title}</div>
                    <div class="page-subtitle">Report ID: ${r.id} • Status: ${r.status.toUpperCase()}</div>
                </div>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary btn-sm" onclick="printInspectionReport('${r.id}')">Print PDF</button>
                <button class="btn btn-primary btn-sm" onclick="renderIR_MAT_Form()">Edit Report</button>
            </div>
        </div>

        <div class="report-container">
            <div class="report-header">
                <div class="report-title-block">
                    <div style="font-weight:800;font-size:14px;color:var(--text-muted);margin-bottom:4px">NEXAFORGE INDUSTRIES</div>
                    <div class="report-title">${r.title}</div>
                </div>
                <div class="report-meta-grid">
                    <div class="report-field"><label>Report No:</label><div class="value">${r.id}</div></div>
                    <div class="report-field"><label>Rev:</label><div class="value">A</div></div>
                    <div class="report-field"><label>Project No:</label><div class="value">${r.project}</div></div>
                    <div class="report-field"><label>Date:</label><div class="value">${r.date}</div></div>
                </div>
            </div>

            <div class="report-section">
                <div class="report-section-title">Section A: Material Identification</div>
                <div class="report-data-grid">
                    <div class="report-field"><label>Material Desc:</label><div class="value">316L SS Plate 12mm</div></div>
                    <div class="report-field"><label>Specification:</label><div class="value">ASTM A240 / UNS S31603</div></div>
                    <div class="report-field"><label>Heat / Lot No:</label><div class="value">HN-44810</div></div>
                    <div class="report-field"><label>Supplier:</label><div class="value">Outokumpu</div></div>
                </div>
            </div>

            <div class="report-section">
                <div class="report-section-title">Section B: Mill Test Certificate (MTC) Verification</div>
                <table class="report-table">
                    <thead>
                        <tr><th>Parameter</th><th>Spec Min</th><th>Spec Max</th><th>Actual</th><th>Verdict</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Carbon (C) %</td><td>—</td><td>0.030</td><td>0.024</td><td>✓ PASS</td></tr>
                        <tr><td>Manganese (Mn)%</td><td>—</td><td>2.00</td><td>1.80</td><td>✓ PASS</td></tr>
                        <tr><td>Chromium (Cr) %</td><td>16.00</td><td>18.00</td><td>17.20</td><td>✓ PASS</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="report-section">
                <div class="report-section-title">Section D: Visual & Dimensional Check</div>
                <table class="report-table">
                    <thead>
                        <tr><th>Check Item</th><th>Result</th><th>Remarks</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Surface condition</td><td>✓ OK</td><td>No pits or scale</td></tr>
                        <tr><td>Edge condition</td><td>✓ OK</td><td>No laminations found</td></tr>
                        <tr><td>Thickness check</td><td>✓ OK</td><td>Avg 12.1mm</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="report-footer">
                <div style="font-weight:700;font-size:12px">RESULT: <span style="color:var(--green)">ACCEPTED</span></div>
                <div class="sign-off-grid">
                    <div class="sign-off-box">
                        <div class="sign-off-label">Inspected by</div>
                        <div class="value" style="font-size:13px">${r.inspector}</div>
                        <div class="sign-off-line"></div>
                        <div style="font-size:9px">QC Inspector</div>
                    </div>
                    <div class="sign-off-box">
                        <div class="sign-off-label">Reviewed by</div>
                        <div class="sign-off-line"></div>
                        <div style="font-size:9px">QC Engineer</div>
                    </div>
                    <div class="sign-off-box">
                        <div class="sign-off-label">Approved by</div>
                        <div class="sign-off-line"></div>
                        <div style="font-size:9px">QC Manager</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderIR_DIM_View(r) {
    const el = document.getElementById('pageContent');
    el.innerHTML = `
        <div class="page-header" style="margin-bottom:20px">
            <div style="display:flex;align-items:center;gap:12px">
                <button class="btn btn-icon" onclick="renderQC_reports_registry()"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <div>
                    <div class="page-title">${r.title}</div>
                    <div class="page-subtitle">Report ID: ${r.id} • Status: ${r.status.toUpperCase()}</div>
                </div>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary btn-sm" onclick="printInspectionReport('${r.id}')">Print PDF</button>
                <button class="btn btn-primary btn-sm" onclick="renderIR_DIM_Form()">Edit Report</button>
            </div>
        </div>

        <div class="report-container">
            <div class="report-header">
                <div class="report-title-block">
                    <div style="font-weight:800;font-size:14px;color:var(--text-muted);margin-bottom:4px">NEXAFORGE INDUSTRIES</div>
                    <div class="report-title">${r.title}</div>
                </div>
                <div class="report-meta-grid">
                    <div class="report-field"><label>Report No:</label><div class="value">${r.id}</div></div>
                    <div class="report-field"><label>Project No:</label><div class="value">${r.project}</div></div>
                    <div class="report-field"><label>Date:</label><div class="value">${r.date}</div></div>
                </div>
            </div>

            <div class="report-section">
                <div class="report-section-title">Section B: Linear Dimensions</div>
                <table class="report-table">
                    <thead>
                        <tr><th>#</th><th>Dimension</th><th>Dwg</th><th>Tol</th><th>Actual</th><th>Result</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>1</td><td>Shell height</td><td>1500mm</td><td>±2mm</td><td>1501mm</td><td>✓</td></tr>
                        <tr><td>2</td><td>Circumference</td><td>9425mm</td><td>±3mm</td><td>9424mm</td><td>✓</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="report-section">
                <div class="report-section-title">Section C: Roundness / Ovality Check</div>
                <table class="report-table">
                    <thead>
                        <tr><th>Position</th><th>Measured Diameter</th><th>Tolerance</th><th>Verdict</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>0° (North)</td><td>3001mm</td><td>±30mm</td><td>PASS</td></tr>
                        <tr><td>90° (East)</td><td>2998mm</td><td>±30mm</td><td>PASS</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="report-footer">
                <div class="sign-off-grid">
                    <div class="sign-off-box">
                        <div class="sign-off-label">Inspected by</div>
                        <div class="value" style="font-size:13px">${r.inspector}</div>
                        <div class="sign-off-line"></div>
                        <div style="font-size:9px">QC Inspector</div>
                    </div>
                    <div class="sign-off-box">
                        <div class="sign-off-line"></div>
                        <div style="font-size:9px">QC Manager</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
