const bcrypt = require("bcrypt");

/**
 * Seed — initial data derived from frontend AppState mock data.
 * Matches the three live projects visible in the UI:
 *   P-2401 — 316L Storage Tank (ADNOC)
 *   P-2402 — Pressure Vessel ASME VIII (Petrofac)
 *   P-2403 — 304 SS Heat Exchanger (ENOC)
 */

exports.seed = async function (knex) {
  // Clear in reverse dependency order
  await knex("audit_log").del();
  await knex("project_control_plans").del();
  await knex("control_plan_templates").del();
  await knex("itp_sign_offs").del();
  await knex("ncr_comments").del();
  await knex("ncrs").del();
  await knex("itp_steps").del();
  await knex("nde_records").del();
  await knex("weld_joints").del();
  await knex("wpq").del();
  await knex("milestones").del();
  await knex("projects").del();
  await knex("employees").del();
  await knex("users").del();
  await knex("clients").del();
  await knex("work_centres").del();
  await knex("wps").del();

  // ── Clients ───────────────────────────────────────────────────
  const [adnoc, petrofac, enoc] = await knex("clients")
    .insert([
      {
        id: "00000000-0000-0000-0000-000000000001",
        name: "ADNOC",
        short_code: "ADNOC",
        country: "UAE",
        city: "Abu Dhabi",
        contact_name: "Ahmed Al Mansoori",
        contact_email: "ahmed.almansoori@adnoc.ae",
        is_active: true,
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        name: "Petrofac",
        short_code: "PTFC",
        country: "UAE",
        city: "Sharjah",
        contact_name: "James Harrington",
        contact_email: "j.harrington@petrofac.com",
        is_active: true,
      },
      {
        id: "00000000-0000-0000-0000-000000000003",
        name: "ENOC",
        short_code: "ENOC",
        country: "UAE",
        city: "Dubai",
        contact_name: "Sara Al Hashimi",
        contact_email: "sara.alhashimi@enoc.ae",
        is_active: true,
      },
    ])
    .returning("id");

  // ── Users ─────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Password123!", 10);

  await knex("users").insert([
    // ── dept: gm (sees all modules) ──────────────────────────────
    { id: "10000000-0000-0000-0000-000000000001", email: "gm@nexaforge.com",          password_hash: passwordHash, full_name: "General Manager",      role: "gm",      department: "gm",          is_active: true },
    // ── dept: production ─────────────────────────────────────────
    { id: "10000000-0000-0000-0000-000000000002", email: "production@nexaforge.com",  password_hash: passwordHash, full_name: "Production Manager",   role: "manager", department: "production",  is_active: true },
    // ── dept: qc ─────────────────────────────────────────────────
    { id: "10000000-0000-0000-0000-000000000003", email: "qc@nexaforge.com",          password_hash: passwordHash, full_name: "QC Manager",           role: "senior",  department: "qc",          is_active: true },
    // ── dept: qc — sub-roles surfaced by the login quick-access menu ──
    { id: "10000000-0000-0000-0000-000000000012", email: "qc_lead@nexaforge.com",      password_hash: passwordHash, full_name: "Sarah Ahmed",          role: "senior",  department: "qc",          is_active: true },
    { id: "10000000-0000-0000-0000-000000000013", email: "qc_inspector@nexaforge.com", password_hash: passwordHash, full_name: "John Doe",             role: "user",    department: "qc",          is_active: true },
    // ── dept: marketing ──────────────────────────────────────────
    { id: "10000000-0000-0000-0000-000000000004", email: "marketing@nexaforge.com",   password_hash: passwordHash, full_name: "Sales Manager",        role: "manager", department: "marketing",   is_active: true },
    // ── dept: finance ─────────────────────────────────────────────
    { id: "10000000-0000-0000-0000-000000000005", email: "finance@nexaforge.com",     password_hash: passwordHash, full_name: "Finance Manager",      role: "manager", department: "finance",     is_active: true },
    // ── dept: hr ──────────────────────────────────────────────────
    { id: "10000000-0000-0000-0000-000000000006", email: "hr@nexaforge.com",          password_hash: passwordHash, full_name: "HR Manager",           role: "manager", department: "hr",          is_active: true },
    // ── dept: procurement ─────────────────────────────────────────
    { id: "10000000-0000-0000-0000-000000000007", email: "procurement@nexaforge.com", password_hash: passwordHash, full_name: "Procurement Manager",  role: "manager", department: "procurement", is_active: true },
    // ── dept: store ───────────────────────────────────────────────
    { id: "10000000-0000-0000-0000-000000000008", email: "store@nexaforge.com",       password_hash: passwordHash, full_name: "Store Manager",        role: "manager", department: "store",       is_active: true },
    // ── dept: welding ─────────────────────────────────────────────
    { id: "10000000-0000-0000-0000-000000000009", email: "welding@nexaforge.com",     password_hash: passwordHash, full_name: "Welding Engineer",     role: "senior",  department: "welding",     is_active: true },
    // ── kept for employee FK reference ───────────────────────────
    { id: "10000000-0000-0000-0000-000000000010", email: "pm@nexaforge.com",          password_hash: passwordHash, full_name: "Project Manager",      role: "manager", department: "production",  is_active: true },
    { id: "10000000-0000-0000-0000-000000000011", email: "welder@nexaforge.com",      password_hash: passwordHash, full_name: "Lead Welder",          role: "user",    department: "welding",     is_active: true },
  ]);

  // ── Employees ─────────────────────────────────────────────────
  await knex("employees").insert([
    {
      id: "20000000-0000-0000-0000-000000000001",
      user_id: "10000000-0000-0000-0000-000000000010",
      employee_no: "EMP-001",
      full_name: "Project Manager",
      position: "Senior Project Manager",
      department: "Projects",
      nationality: "British",
      hire_date: "2020-01-15",
      status: "active",
      email: "pm@nexaforge.com",
    },
    {
      id: "20000000-0000-0000-0000-000000000002",
      user_id: "10000000-0000-0000-0000-000000000011",
      employee_no: "WLD-001",
      full_name: "Mohammed Al Rashidi",
      position: "Senior Welder",
      department: "Production",
      nationality: "Emirati",
      hire_date: "2019-03-01",
      status: "active",
      email: "welder@nexaforge.com",
    },
  ]);

  // ── Projects (from AppState) ───────────────────────────────────
  await knex("projects").insert([
    {
      id: "30000000-0000-0000-0000-000000000001",
      project_no: "P-2401",
      name: "316L Storage Tank 50,000L",
      client_id: "00000000-0000-0000-0000-000000000001",
      status: "active",
      phase: 4,
      progress_pct: 58,
      contract_value: 284000,
      currency: "USD",
      due_date: "2025-08-15",
      product_type: "Storage Tank",
      material_grade: "316L",
      project_manager_id: "20000000-0000-0000-0000-000000000001",
    },
    {
      id: "30000000-0000-0000-0000-000000000002",
      project_no: "P-2402",
      name: "Pressure Vessel ASME VIII 3-unit",
      client_id: "00000000-0000-0000-0000-000000000002",
      status: "planning",
      phase: 2,
      progress_pct: 22,
      contract_value: 97500,
      currency: "USD",
      due_date: "2025-10-30",
      product_type: "Pressure Vessel",
      material_grade: "CS",
      project_manager_id: "20000000-0000-0000-0000-000000000001",
    },
    {
      id: "30000000-0000-0000-0000-000000000003",
      project_no: "P-2403",
      name: "304 SS Heat Exchanger",
      client_id: "00000000-0000-0000-0000-000000000003",
      status: "qc_hold",
      phase: 5,
      progress_pct: 71,
      contract_value: 142000,
      currency: "USD",
      due_date: "2025-07-01",
      product_type: "Heat Exchanger",
      material_grade: "304",
      project_manager_id: "20000000-0000-0000-0000-000000000001",
    },
  ]);

  // ── Milestones for P-2401 ─────────────────────────────────────
  await knex("milestones").insert([
    {
      project_id: "30000000-0000-0000-0000-000000000001",
      name: "Contract Signing / Mobilisation",
      billing_pct: 10,
      billing_amount: 28400,
      status: "invoiced",
      target_date: "2024-02-01",
      achieved_date: "2024-02-03",
    },
    {
      project_id: "30000000-0000-0000-0000-000000000001",
      name: "Material Delivery & Inspection",
      billing_pct: 20,
      billing_amount: 56800,
      status: "invoiced",
      target_date: "2024-04-15",
      achieved_date: "2024-04-18",
    },
    {
      project_id: "30000000-0000-0000-0000-000000000001",
      name: "50% Fabrication Completion",
      billing_pct: 30,
      billing_amount: 85200,
      status: "triggered",
      target_date: "2025-03-30",
      achieved_date: "2025-04-02",
    },
    {
      project_id: "30000000-0000-0000-0000-000000000001",
      name: "Final Inspection & FAT",
      billing_pct: 30,
      billing_amount: 85200,
      status: "pending",
      target_date: "2025-07-15",
    },
    {
      project_id: "30000000-0000-0000-0000-000000000001",
      name: "Delivery & Commissioning",
      billing_pct: 10,
      billing_amount: 28400,
      status: "pending",
      target_date: "2025-08-15",
    },
  ]);

  // ── WPS ───────────────────────────────────────────────────────
  await knex("wps").insert([
    {
      id: "40000000-0000-0000-0000-000000000001",
      wps_no: "WPS-GTAW-316L-001",
      revision: "2",
      status: "active",
      process: "GTAW",
      base_metal: "316L Stainless Steel",
      filler_metal: "ER316L",
      position: "1G, 2G, 3G, 4G",
      standard: "ASME IX",
      approved_date: "2023-06-01",
      approved_by: "10000000-0000-0000-0000-000000000001",
    },
    {
      id: "40000000-0000-0000-0000-000000000002",
      wps_no: "WPS-SMAW-CS-001",
      revision: "1",
      status: "active",
      process: "SMAW",
      base_metal: "Carbon Steel A516 Gr.70",
      filler_metal: "E7018",
      position: "1G, 2G, 3G",
      standard: "ASME IX",
      approved_date: "2022-11-15",
      approved_by: "10000000-0000-0000-0000-000000000001",
    },
  ]);

  // ── WPQ ───────────────────────────────────────────────────────
  await knex("wpq").insert([
    {
      employee_id: "20000000-0000-0000-0000-000000000002",
      wps_id: "40000000-0000-0000-0000-000000000001",
      stamp_no: "NF-WLD-001",
      process: "GTAW",
      position: "All positions",
      material_group: "P-8 (Austenitic SS)",
      qualified_date: "2023-07-01",
      expiry_date: "2025-07-01",
      status: "active",
    },
  ]);

  // ── Work Centres ──────────────────────────────────────────────
  await knex("work_centres").insert([
    { code: "CUT", name: "Cutting & Bevelling", department: "Production", is_active: true },
    { code: "FIT", name: "Fit-Up & Assembly", department: "Production", is_active: true },
    { code: "WLD", name: "Welding Bay", department: "Production", is_active: true },
    { code: "NDE", name: "NDE Station", department: "Quality", is_active: true },
    { code: "PWHT", name: "Post Weld Heat Treatment", department: "Production", is_active: true },
    { code: "SURF", name: "Surface Treatment / Blasting", department: "Production", is_active: true },
    { code: "INSP", name: "Final Inspection", department: "Quality", is_active: true },
  ]);

  // ── Standard Control Plan Templates ─────────────────────────
  // Storage Tank (API 650)
  const tankTemplates = [
    { stage_no:1, stage_name:'Material Incoming',      activity:'Incoming plate & fitting inspection — visual + dimensional',           reference_doc:'API 650 Table 7.2 / EN 10029',     parameters:'Thickness ±0.3mm, flatness Class N; no laminations, pits or scale', responsible:'QC Inspector',   internal_code:'H', customer_code:'R', tpi_code:'H' },
    { stage_no:1, stage_name:'Material Incoming',      activity:'Mill test certificate (MTC) review',                                   reference_doc:'ASTM A240 / EN 10028-7',            parameters:'Chemical composition, mech properties per spec; heat number traceable', responsible:'QC Inspector',  internal_code:'H', customer_code:'R', tpi_code:'H' },
    { stage_no:2, stage_name:'Plate Preparation',      activity:'Plate cutting & marking dimensional check',                            reference_doc:'Approved fabrication drawing',      parameters:'±1mm on cut dimensions; marking legible and correct', responsible:'QC Inspector',                         internal_code:'P', customer_code:null, tpi_code:'R' },
    { stage_no:2, stage_name:'Plate Preparation',      activity:'Edge preparation verification',                                        reference_doc:'WPS / AWS D1.6',                    parameters:'Bevel angle ±2.5°, root face ±0.5mm; no cracks or scale on prep', responsible:'QC Inspector',         internal_code:'P', customer_code:null, tpi_code:'R' },
    { stage_no:3, stage_name:'Shell Rolling',           activity:'Shell rolling — roundness & seam alignment check',                    reference_doc:'API 650 §5.6.5',                    parameters:'Out-of-roundness ≤1% dia (max 25mm); vertical seam plumb ±2mm', responsible:'QC Inspector',          internal_code:'W', customer_code:null, tpi_code:'W' },
    { stage_no:4, stage_name:'Fit-up',                 activity:'Bottom plate fit-up — joints & lapping',                              reference_doc:'API 650 §7.3',                      parameters:'Lap width ≥25mm; gap ≤1.5mm; no kinks or waves', responsible:'QC Inspector',                            internal_code:'W', customer_code:'W', tpi_code:'H' },
    { stage_no:4, stage_name:'Fit-up',                 activity:'Shell course longitudinal seam fit-up (pre-weld)',                    reference_doc:'API 650 §7.3',                      parameters:'Mismatch ≤3mm; peaking ≤3mm; tack welds per WPS', responsible:'QC Inspector',                        internal_code:'W', customer_code:'W', tpi_code:'H' },
    { stage_no:4, stage_name:'Fit-up',                 activity:'Shell circumferential seam fit-up (pre-weld)',                        reference_doc:'API 650 §7.3',                      parameters:'Mismatch ≤3mm; banding ≤13mm; gap 2–4mm', responsible:'QC Inspector',                               internal_code:'W', customer_code:'W', tpi_code:'H' },
    { stage_no:4, stage_name:'Fit-up',                 activity:'Nozzle / manway orientation & fit-up check',                         reference_doc:'API 650 §7.3',                      parameters:'Orientation ±5mm; projection ±3mm; flange face level ±1mm', responsible:'QC Inspector',              internal_code:'W', customer_code:'R', tpi_code:'W' },
    { stage_no:5, stage_name:'Welding',                activity:'Welder qualification & WPS assignment verification',                   reference_doc:'ASME IX / AWS D1.6',                parameters:'Welder qualified for joint type, position and material; WPS current', responsible:'QC Inspector',  internal_code:'P', customer_code:null, tpi_code:'R' },
    { stage_no:5, stage_name:'Welding',                activity:'Visual examination — all welds (post-weld)',                          reference_doc:'API 650 §7.3.4',                    parameters:'No cracks, porosity, undercut ≤0.4mm, overlap, underfill or arc strikes', responsible:'QC Inspector', internal_code:'P', customer_code:'R', tpi_code:'W' },
    { stage_no:6, stage_name:'NDE',                    activity:'Radiographic testing (RT) — longitudinal & circumferential seams',   reference_doc:'API 650 Annex A',                   parameters:'Film density 2.0–4.0; IQI sensitivity ≤2%; 100% seam coverage', responsible:'NDT Contractor',       internal_code:'H', customer_code:'W', tpi_code:'H' },
    { stage_no:6, stage_name:'NDE',                    activity:'Vacuum box test — bottom plate laps & seams',                        reference_doc:'API 650 §7.3.5',                    parameters:'No leaks at 35 mbar; wetting agent applied; 100% coverage', responsible:'QC Inspector',             internal_code:'P', customer_code:'W', tpi_code:'W' },
    { stage_no:7, stage_name:'Hydrostatic Test',       activity:'Hydrostatic leak test — 24 hr water fill',                           reference_doc:'API 650 §7.3.6',                    parameters:'Fill to design liquid level; 24 hr hold; no leaks, no settlement', responsible:'QC Manager',          internal_code:'H', customer_code:'H', tpi_code:'H' },
    { stage_no:8, stage_name:'Final Inspection',       activity:'Final dimensional survey — plumb, radius & height',                  reference_doc:'API 650 §7.3.8',                    parameters:'Plumb ≤30mm per 10m height; radius ±13mm; height ±3%', responsible:'QC Inspector',                  internal_code:'H', customer_code:'H', tpi_code:'H' },
    { stage_no:8, stage_name:'Final Inspection',       activity:'Surface preparation & coating inspection',                           reference_doc:'SSPC-SP 6 / Paint spec',             parameters:'DFT ±10% of spec; holiday test pass; no runs or sags', responsible:'QC Inspector',                  internal_code:'P', customer_code:'R', tpi_code:'W' },
    { stage_no:8, stage_name:'Final Inspection',       activity:'Nameplate & documentation (MDR) review',                             reference_doc:'API 650 §7.3.9',                    parameters:'Nameplate data correct; MDR complete: certs, test records, drawings', responsible:'QC Manager',        internal_code:'H', customer_code:'H', tpi_code:'H' },
    { stage_no:8, stage_name:'Final Inspection',       activity:'Pre-dispatch client witness inspection',                             reference_doc:'Client PO / ITP',                   parameters:'Visual walkdown + MDR sign-off + punch list clearance', responsible:'QC Manager',                       internal_code:'H', customer_code:'H', tpi_code:'H' },
  ].map(r => ({ ...r, project_type: 'Storage Tank' }));

  // Pressure Vessel (ASME VIII Div 1)
  const pvTemplates = [
    { stage_no:1, stage_name:'Material Incoming',      activity:'Shell plate incoming inspection — visual + dimensional',              reference_doc:'ASME II / SA-240',                  parameters:'Thickness, width, length per approved data sheet; MTC heat traceability', responsible:'QC Inspector', internal_code:'H', customer_code:'R', tpi_code:'H' },
    { stage_no:1, stage_name:'Material Incoming',      activity:'Nozzle and flange material incoming inspection',                      reference_doc:'ASME II / ASME B16.5',              parameters:'Marking, dimensions, MTC per code; no visible defects', responsible:'QC Inspector',                  internal_code:'H', customer_code:'R', tpi_code:'H' },
    { stage_no:2, stage_name:'WPS/PQR Review',         activity:'Welding procedure specification (WPS / PQR) documentation review',   reference_doc:'ASME IX',                           parameters:'All WPS qualified; PQR test results meet code; welder certs current', responsible:'QC Manager',      internal_code:'H', customer_code:'R', tpi_code:'H' },
    { stage_no:3, stage_name:'Fit-up',                 activity:'Shell course longitudinal seam fit-up',                              reference_doc:'ASME VIII UW-35',                   parameters:'Mismatch ≤¼T (max 3mm); gap 2–4mm; alignment per WPS', responsible:'QC Inspector',                  internal_code:'W', customer_code:'W', tpi_code:'H' },
    { stage_no:3, stage_name:'Fit-up',                 activity:'Head-to-shell circumferential seam fit-up',                         reference_doc:'ASME VIII UW-35',                   parameters:'Offset ≤T/4 (max 3mm); weld prep angle ±2.5°', responsible:'QC Inspector',                          internal_code:'W', customer_code:'W', tpi_code:'H' },
    { stage_no:3, stage_name:'Fit-up',                 activity:'Nozzle fit-up & reinforcement pad check',                           reference_doc:'ASME VIII UW-16',                   parameters:'Nozzle orientation ±5mm; pad width per design; full pen prep', responsible:'QC Inspector',           internal_code:'W', customer_code:'R', tpi_code:'W' },
    { stage_no:4, stage_name:'Welding',                activity:'Welder ID & qualification verification',                             reference_doc:'ASME IX',                           parameters:'Qualified for joint type, position, material, thickness range', responsible:'QC Inspector',           internal_code:'P', customer_code:null, tpi_code:'R' },
    { stage_no:4, stage_name:'Welding',                activity:'Visual examination — all Cat A/B/C/D welds (post-weld)',             reference_doc:'ASME VIII UW-35',                   parameters:'No cracks; undercut ≤0.8mm; weld profile per code', responsible:'QC Inspector',                   internal_code:'P', customer_code:'R', tpi_code:'W' },
    { stage_no:5, stage_name:'PWHT',                   activity:'PWHT time-temperature chart review',                                 reference_doc:'ASME VIII UW-40',                   parameters:'Peak temp within ±14°C of required; hold time per Table UW-40; ramp rates met', responsible:'QC Inspector', internal_code:'H', customer_code:'R', tpi_code:'H' },
    { stage_no:6, stage_name:'NDE',                    activity:'Radiographic examination (RT) — all longitudinal and circ seams',   reference_doc:'ASME VIII UW-51',                   parameters:'Film density 2.0–4.0 H&D; IQI ≤2% sensitivity; no rejectable indications', responsible:'NDT Contractor', internal_code:'H', customer_code:'W', tpi_code:'H' },
    { stage_no:6, stage_name:'NDE',                    activity:'Ultrasonic examination (UT) — where RT inaccessible',               reference_doc:'ASME VIII App 12',                  parameters:'Calibration per procedure; scanning sensitivity +6 dB reference; AWS D-level tech', responsible:'NDT Contractor', internal_code:'H', customer_code:null, tpi_code:'H' },
    { stage_no:6, stage_name:'NDE',                    activity:'Liquid penetrant / magnetic particle (PT/MT) — nozzles & attachments',reference_doc:'ASME VIII App 6/7',              parameters:'No relevant linear indications; rounded indications ≤5mm diameter', responsible:'NDT Contractor',     internal_code:'P', customer_code:'R', tpi_code:'W' },
    { stage_no:7, stage_name:'Pressure Test',          activity:'Hydrostatic pressure test',                                          reference_doc:'ASME VIII UG-99',                   parameters:'1.3 × MAWP × stress ratio; 30 min hold; no leaks; no visible distortion', responsible:'QC Manager',    internal_code:'H', customer_code:'H', tpi_code:'H' },
    { stage_no:8, stage_name:'Final Inspection',       activity:'Final dimensional inspection per approved data sheet',               reference_doc:'Approved data sheet',               parameters:'All dimensions within drawing tolerance; nozzle orientation ±5mm', responsible:'QC Inspector',          internal_code:'H', customer_code:'H', tpi_code:'H' },
    { stage_no:8, stage_name:'Final Inspection',       activity:'ASME nameplate (U-stamp) verification',                             reference_doc:'ASME VIII UG-116',                  parameters:'All required fields stamped: MAWP, temp, year, NB#, Authorised Inspector stamp', responsible:'AI (Auth. Inspector)', internal_code:'H', customer_code:'H', tpi_code:'H' },
    { stage_no:8, stage_name:'Final Inspection',       activity:'Packaging & pre-dispatch documentation review (MDR)',                reference_doc:'Client PO / ASME VIII',             parameters:'MDR complete: data reports, certs of conformance, test records, drawings', responsible:'QC Manager',   internal_code:'H', customer_code:'H', tpi_code:'H' },
  ].map(r => ({ ...r, project_type: 'Pressure Vessel' }));

  // Heat Exchanger (TEMA / ASME VIII)
  const hxTemplates = [
    { stage_no:1, stage_name:'Material Incoming',      activity:'Shell material incoming inspection',                                  reference_doc:'ASME II / SA-240',                  parameters:'MTC, visual, dimensional — OD, WT, length; no laminations', responsible:'QC Inspector',             internal_code:'H', customer_code:'R', tpi_code:'H' },
    { stage_no:1, stage_name:'Material Incoming',      activity:'Tube material incoming inspection',                                   reference_doc:'ASTM A213 / A249',                  parameters:'MTC; OD ±0.1mm, WT ±10%; no dents, ovality ≤0.5mm; eddy current cert if required', responsible:'QC Inspector', internal_code:'H', customer_code:'R', tpi_code:'H' },
    { stage_no:1, stage_name:'Material Incoming',      activity:'Tube sheet material incoming inspection',                             reference_doc:'ASME II / SA-516',                  parameters:'MTC; OD ±0.5mm, thickness ±1mm; no cracks or laminations', responsible:'QC Inspector',             internal_code:'H', customer_code:'R', tpi_code:'H' },
    { stage_no:2, stage_name:'Tube Bundle Assembly',   activity:'Tube sheet drilling verification',                                   reference_doc:'TEMA / Approved drawing',            parameters:'Pitch ±0.1mm; hole diameter ±0.05mm; groove depth ±0.1mm', responsible:'QC Inspector',             internal_code:'W', customer_code:'R', tpi_code:'W' },
    { stage_no:2, stage_name:'Tube Bundle Assembly',   activity:'Baffle assembly — spacing, orientation & sealing',                   reference_doc:'TEMA / Approved drawing',            parameters:'Spacing ±3mm; orientation correct; sealing strips positioned', responsible:'QC Inspector',           internal_code:'P', customer_code:null, tpi_code:'R' },
    { stage_no:2, stage_name:'Tube Bundle Assembly',   activity:'Tube loading, positioning & protrusion check',                       reference_doc:'TEMA / Approved drawing',            parameters:'Tube protrusion 3–6mm; straight, no bow; ends clean', responsible:'QC Inspector',                  internal_code:'W', customer_code:'R', tpi_code:'W' },
    { stage_no:3, stage_name:'Tube-to-Tubesheet',      activity:'Tube-to-tubesheet mechanical rolling (expansion)',                   reference_doc:'TEMA / Mfr procedure',              parameters:'Expansion depth = 100% groove contact; torque per procedure; pull-out test ≥ spec', responsible:'QC Inspector', internal_code:'H', customer_code:'W', tpi_code:'H' },
    { stage_no:3, stage_name:'Tube-to-Tubesheet',      activity:'Tube-to-tubesheet seal welding (if specified)',                      reference_doc:'WPS / ASME IX',                     parameters:'WPS qualified for joint; visual post-weld: no cracks or undercut', responsible:'QC Inspector',        internal_code:'W', customer_code:'W', tpi_code:'H' },
    { stage_no:4, stage_name:'NDE',                    activity:'PT/MT examination — all weld joints',                               reference_doc:'ASME VIII App 6/7',                 parameters:'No relevant indications; background cleanliness; lighting ≥500 lux', responsible:'NDT Contractor',     internal_code:'P', customer_code:'R', tpi_code:'W' },
    { stage_no:4, stage_name:'NDE',                    activity:'UT thickness survey — shell after rolling / forming',               reference_doc:'API 574',                           parameters:'Min thickness above nominal minus corrosion allowance; ≥5 readings/m²', responsible:'NDT Contractor',  internal_code:'P', customer_code:null, tpi_code:'W' },
    { stage_no:5, stage_name:'Pressure Test',          activity:'Hydrostatic test — shell side',                                      reference_doc:'ASME VIII UG-99',                   parameters:'1.3 × MAWP shell side; 30 min hold; no leaks or distortion', responsible:'QC Manager',             internal_code:'H', customer_code:'H', tpi_code:'H' },
    { stage_no:5, stage_name:'Pressure Test',          activity:'Hydrostatic test — tube side',                                       reference_doc:'ASME VIII UG-99',                   parameters:'1.3 × MAWP tube side; 30 min hold; no tube-to-tubesheet leaks', responsible:'QC Manager',           internal_code:'H', customer_code:'H', tpi_code:'H' },
    { stage_no:6, stage_name:'Final Inspection',       activity:'Final dimensional inspection',                                       reference_doc:'TEMA class / Approved drawing',     parameters:'Shell OD ±1mm; nozzle orientation ±5mm; tube projection ±2mm', responsible:'QC Inspector',          internal_code:'H', customer_code:'H', tpi_code:'H' },
    { stage_no:6, stage_name:'Final Inspection',       activity:'Nameplate & documentation (MDR) review',                             reference_doc:'ASME VIII / TEMA',                  parameters:'ASME datasheet complete; TEMA class confirmed; MDR signed by AI', responsible:'QC Manager',           internal_code:'H', customer_code:'H', tpi_code:'H' },
    { stage_no:6, stage_name:'Final Inspection',       activity:'Pre-dispatch client witness inspection',                             reference_doc:'Client PO / ITP',                   parameters:'Visual walkdown; documents reviewed; punch list cleared', responsible:'QC Manager',                 internal_code:'H', customer_code:'H', tpi_code:'H' },
  ].map(r => ({ ...r, project_type: 'Heat Exchanger' }));

  await knex("control_plan_templates").insert([
    ...tankTemplates, ...pvTemplates, ...hxTemplates,
  ]);

  // Apply standard templates to the three seed projects
  const templateMap = {
    'Storage Tank':   tankTemplates,
    'Pressure Vessel': pvTemplates,
    'Heat Exchanger':  hxTemplates,
  };
  const seedProjects = [
    { id: '30000000-0000-0000-0000-000000000001', product_type: 'Storage Tank' },
    { id: '30000000-0000-0000-0000-000000000002', product_type: 'Pressure Vessel' },
    { id: '30000000-0000-0000-0000-000000000003', product_type: 'Heat Exchanger' },
  ];

  // Fetch inserted template rows to get their UUIDs
  const insertedTemplates = await knex("control_plan_templates").select("*").orderBy(["project_type","stage_no"]);
  const tplByTypeAndActivity = {};
  insertedTemplates.forEach(t => {
    tplByTypeAndActivity[`${t.project_type}|${t.activity}`] = t.id;
  });

  for (const proj of seedProjects) {
    const rows = (templateMap[proj.product_type] || []).map(t => ({
      project_id:       proj.id,
      template_item_id: tplByTypeAndActivity[`${t.project_type}|${t.activity}`] || null,
      stage_no:         t.stage_no,
      stage_name:       t.stage_name,
      activity:         t.activity,
      reference_doc:    t.reference_doc,
      parameters:       t.parameters,
      responsible:      t.responsible,
      internal_code:    t.internal_code,
      customer_code:    t.customer_code || null,
      tpi_code:         t.tpi_code      || null,
      status:           'pending',
    }));
    if (rows.length) await knex("project_control_plans").insert(rows);
  }

  console.log("✓ Seed complete — 3 projects, 4 users, 3 clients, 2 WPS, 1 WPQ loaded");
};
