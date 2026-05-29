/**
 * Seed — CRM / Marketing data (S-19 persistence, Phase 0).
 * Mirrors the frontend in-memory seeds that previously lived only in
 * `Sprint 1/js/marketing.js` (CRMData.*) and `marketing2.js`
 * (MktPrequalData / MktIntelData / MktContactsData), so a real backend
 * shows the same data the demo mode used to fabricate.
 *
 * Dialect-aware: json columns (competitors.strengths/weaknesses) are stored as
 * JSON text — valid for Postgres json and SQLite TEXT alike. quote_log rows use
 * explicit ids so quote_revisions can reference them on both dialects.
 */

const jsonCol = (v) => JSON.stringify(v);

// Appointment dates are relative to seed time, matching the old JS generator.
function at(dayOffset, h, m = 0) {
  const x = new Date();
  x.setDate(x.getDate() + dayOffset);
  x.setHours(h, m, 0, 0);
  return x.toISOString();
}

const QID = (n) => `5a000000-0000-0000-0000-0000000000${String(n).padStart(2, "0")}`;

exports.seed = async function (knex) {
  // Clear in reverse dependency order (quote_revisions → quote_log via FK).
  await knex("bid_outcomes").del();
  await knex("competitors").del();
  await knex("prequalifications").del();
  await knex("crm_contacts").del();
  await knex("crm_appointments").del();
  await knex("quote_approvals").del();
  await knex("quote_revisions").del();
  await knex("quote_log").del();

  // ── Quote log + revision history ──────────────────────────────
  const quotes = [
    { id: QID(1), ref: "Q-2025-031", rfq_no: "OPP-005",      client_name: "Dragon Oil",          project: "Duplex SS Pressure Vessel — 2205",        owner: "S. Mathews", status: "pending",     valid_until: "2025-06-22",
      revisions: [
        { rev: "Rev A", rev_date: "2025-04-05", value: 205000, margin: 25.0, note: "Initial submission against RFQ." },
        { rev: "Rev B", rev_date: "2025-04-15", value: 196000, margin: 22.0, note: "Re-quoted after duplex plate price update." },
        { rev: "Rev C", rev_date: "2025-04-22", value: 188000, margin: 19.7, note: "Client pushback — sour-service premium partially absorbed." },
      ] },
    { id: QID(2), ref: "Q-2025-030", rfq_no: "ITT-2025-018", client_name: "Dubai Petroleum",     project: "Floating Roof Tank — 100,000L API 650",   owner: "M. Hassan",  status: "submitted",   valid_until: "2025-06-26",
      revisions: [{ rev: "Rev A", rev_date: "2025-04-26", value: 820000, margin: 26.6, note: "Initial tender submission." }] },
    { id: QID(3), ref: "Q-2025-029", rfq_no: "OPP-004",      client_name: "EMARAT",              project: "Fixed Roof Storage Tank — 100,000L",      owner: "M. Hassan",  status: "negotiation", valid_until: "2025-06-25",
      revisions: [
        { rev: "Rev A", rev_date: "2025-04-12", value: 560000, margin: 34.0, note: "Initial quotation." },
        { rev: "Rev B", rev_date: "2025-04-25", value: 510000, margin: 30.0, note: "15% discount discussion — revised commercial terms." },
      ] },
    { id: QID(4), ref: "Q-2025-028", rfq_no: "ITT-2025-014", client_name: "GAL",                 project: "Scrubber Column 316L — 4m dia",           owner: "S. Mathews", status: "submitted",   valid_until: "2025-06-20",
      revisions: [{ rev: "Rev A", rev_date: "2025-04-20", value: 145000, margin: 24.0, note: "Submitted after technical clarification." }] },
    { id: QID(5), ref: "Q-2025-027", rfq_no: "OPP-008",      client_name: "Gulf Pharmaceutical", project: "Jacketed Mixing Vessel — 20L",            owner: "M. Hassan",  status: "submitted",   valid_until: "2025-05-18",
      revisions: [{ rev: "Rev A", rev_date: "2025-04-18", value: 38000, margin: 32.0, note: "GMP-spec vessel quotation." }] },
    { id: QID(6), ref: "Q-2025-022", rfq_no: "OPP-003",      client_name: "ENOC",                project: "Shell & Tube Heat Exchanger — 304 SS",    owner: "M. Hassan",  status: "won",         valid_until: "2025-05-12",
      revisions: [
        { rev: "Rev A", rev_date: "2025-03-01", value: 150000, margin: 30.0, note: "Initial submission." },
        { rev: "Rev B", rev_date: "2025-03-12", value: 142000, margin: 28.0, note: "Final negotiated price — order won." },
      ] },
    { id: QID(7), ref: "Q-2025-019", rfq_no: "OPP-001",      client_name: "ADNOC Gas",           project: "316L Cone Roof Tank — 20,000L",           owner: "M. Hassan",  status: "won",         valid_until: "2025-04-28",
      revisions: [{ rev: "Rev A", rev_date: "2025-02-28", value: 284000, margin: 27.5, note: "Submitted & accepted — ADNOC framework." }] },
    { id: QID(8), ref: "Q-2025-018", rfq_no: "OPP-002",      client_name: "Petrofac UAE",        project: "ASME VIII Pressure Vessel — 3 units",     owner: "S. Mathews", status: "won",         valid_until: "2025-04-20",
      revisions: [
        { rev: "Rev A", rev_date: "2025-02-10", value: 102000, margin: 26.0, note: "Initial 3-unit quotation." },
        { rev: "Rev B", rev_date: "2025-02-20", value: 97500,  margin: 23.0, note: "Schedule-based discount — LOI received." },
      ] },
    { id: QID(9), ref: "Q-2025-011", rfq_no: "OPP-011",      client_name: "NAPESCO",             project: "GRP Separator Skid",                      owner: "S. Mathews", status: "lost",        valid_until: "2025-05-08",
      revisions: [{ rev: "Rev A", rev_date: "2025-03-08", value: 74000, margin: 10.8, note: "Single submission — lost to competitor 22% lower." }] },
  ];

  await knex("quote_log").insert(quotes.map(({ revisions, ...q }) => ({ ...q, currency: "USD" })));
  const revisions = [];
  quotes.forEach((q) => q.revisions.forEach((r) => revisions.push({ quote_log_id: q.id, ...r })));
  await knex("quote_revisions").insert(revisions);

  // ── Quote approvals (margin-gated sign-off queue) ─────────────
  await knex("quote_approvals").insert([
    { ref: "QA-001", opp_ref: "OPP-005", quote: "Duplex SS Pressure Vessel — 2205",   client_name: "Dragon Oil",      rev: "Rev C", sell: 188000, cost: 151000, margin: 19.7, status: "pending",  requested_by: "S. Mathews", requested_on: "2025-04-22", reason: "Margin 19.7% below 20% floor — sour-service material premium absorbed to stay competitive." },
    { ref: "QA-002", opp_ref: "OPP-006", quote: "Floating Roof Tank — 316L",          client_name: "Dubai Petroleum", rev: "Rev A", sell: 820000, cost: 602000, margin: 26.6, status: "pending",  requested_by: "M. Hassan",  requested_on: "2025-04-26", reason: "Large-bore tender — discount authority requested for competitive positioning." },
    { ref: "QA-003", opp_ref: "OPP-004", quote: "Fixed Roof Storage Tank — 100,000L", client_name: "EMARAT",          rev: "Rev B", sell: 510000, cost: 357000, margin: 30.0, status: "approved", requested_by: "M. Hassan",  requested_on: "2025-04-25", reason: "Standard margin — approved by GM.", decided_by: "GM", decided_on: "2025-04-25" },
    { ref: "QA-004", opp_ref: "OPP-011", quote: "GRP Separator Skid",                 client_name: "NAPESCO",         rev: "Rev A", sell: 74000,  cost: 66000,  margin: 10.8, status: "rejected", requested_by: "S. Mathews", requested_on: "2025-03-10", reason: "Margin 10.8% too thin on sub-contracted GRP scope.", decided_by: "GM", decided_on: "2025-03-11" },
  ]);

  // ── CRM appointments (dates relative to seed time) ────────────
  await knex("crm_appointments").insert([
    { ref: "AP-001", type: "meeting",   title: "ADNOC framework review",      client_name: "ADNOC",               start_at: at(0, 10, 0),  duration_min: 60,  location: "ADNOC HQ, Abu Dhabi", owner: "M. Hassan",  notes: "Quarterly framework agreement review." },
    { ref: "AP-002", type: "call",      title: "Dragon Oil duplex Q&A",       client_name: "Dragon Oil",          start_at: at(0, 14, 30), duration_min: 30,  location: "Teams",               owner: "S. Mathews", notes: "Technical clarification on 2205 material." },
    { ref: "AP-003", type: "sitevisit", title: "EMARAT tank site survey",     client_name: "EMARAT",              start_at: at(2, 9, 0),   duration_min: 180, location: "Jebel Ali",           owner: "M. Hassan",  notes: "Pre-bid site survey for 100kL tank." },
    { ref: "AP-004", type: "meeting",   title: "Dubai Petroleum bid kickoff", client_name: "Dubai Petroleum",     start_at: at(3, 11, 0),  duration_min: 90,  location: "Conf Room A",         owner: "M. Hassan",  notes: "ITT-2025-018 internal bid kickoff." },
    { ref: "AP-005", type: "call",      title: "Petrofac delivery sync",      client_name: "Petrofac UAE",        start_at: at(5, 15, 0),  duration_min: 30,  location: "Phone",               owner: "S. Mathews", notes: "PV delivery schedule confirmation." },
    { ref: "AP-006", type: "followup",  title: "Gulf Pharma scope sign-off",  client_name: "Gulf Pharmaceutical", start_at: at(7, 13, 0),  duration_min: 45,  location: "Teams",               owner: "M. Hassan",  notes: "Finalise jacketed vessel scope." },
    { ref: "AP-007", type: "meeting",   title: "GAL clarification meeting",   client_name: "GAL",                 start_at: at(-1, 10, 0), duration_min: 60,  location: "GAL Office",          owner: "S. Mathews", notes: "Scrubber column technical clarification." },
  ]);

  // ── CRM contacts ──────────────────────────────────────────────
  await knex("crm_contacts").insert([
    { ref: "CT-001", name: "Eng. Khalid Al-Mansoori", title: "Senior Procurement Engineer", company: "ADNOC",           email: "k.mansoori@adnoc.ae",       phone: "+971 2 602 0000", last_contact: "2025-04-28", follow_up_due: "2025-06-01", follow_up_note: "Follow up on OPP-001 expansion",        avatar_bg: "#0F6E56", initials: "KM" },
    { ref: "CT-002", name: "Mr. James Okafor",        title: "Contracts Manager",           company: "Petrofac UAE",    email: "j.okafor@petrofac.com",     phone: "+971 4 800 4000", last_contact: "2025-04-15", follow_up_due: "2025-05-20", follow_up_note: "PV delivery schedule confirmation",    avatar_bg: "#185FA5", initials: "JO" },
    { ref: "CT-003", name: "Ms. Priya Nair",          title: "Project Engineer",            company: "ENOC",            email: "p.nair@enoc.ae",            phone: "+971 4 337 9900", last_contact: "2025-03-20", follow_up_due: "2025-06-15", follow_up_note: "QC clearance follow-up",               avatar_bg: "#854F0B", initials: "PN" },
    { ref: "CT-004", name: "Eng. Tariq Al-Yasi",      title: "Head of Projects",            company: "EMARAT",          email: "t.alyasi@emarat.ae",        phone: "+971 4 406 1111", last_contact: "2025-04-25", follow_up_due: "2025-05-28", follow_up_note: "Discount negotiation — 100k tank",     avatar_bg: "#534AB7", initials: "TA" },
    { ref: "CT-005", name: "Mr. Alistair Mackenzie",  title: "Technical Director",          company: "Dragon Oil",      email: "a.mackenzie@dragonoil.com", phone: "+971 4 305 3000", last_contact: "2025-04-22", follow_up_due: "2025-05-15", follow_up_note: "Technical Q&A on duplex spec",         avatar_bg: "#791F1F", initials: "AM" },
    { ref: "CT-006", name: "Eng. Saeed Al-Qasim",     title: "VP Engineering",              company: "Dubai Petroleum", email: "s.alqasim@dubpet.ae",       phone: "+971 4 213 6000", last_contact: "2025-04-26", follow_up_due: "2025-05-30", follow_up_note: "Bid submission for ITT-2025-018",      avatar_bg: "#3B6D11", initials: "SQ" },
    { ref: "CT-007", name: "Eng. Ali Tamimi",         title: "Project Procurement Lead",    company: "GAL",             email: "a.tamimi@gal.ae",           phone: "+971 6 000 1234", last_contact: "2025-04-20", follow_up_due: "2025-05-10", follow_up_note: "Technical clarification meeting",      avatar_bg: "#0F6E56", initials: "AT" },
    { ref: "CT-008", name: "Dr. Fatima Al-Rashidi",   title: "Head of Operations",          company: "Gulf Pharma",     email: "f.alrashidi@gulfpharma.ae", phone: "+971 4 000 5678", last_contact: "2025-04-24", follow_up_due: "2025-05-16", follow_up_note: "Scope sign-off for jacketed vessel",   avatar_bg: "#6366f1", initials: "FR" },
  ]);

  // ── Pre-qualification registry (daysLeft is derived at render time) ──
  await knex("prequalifications").insert([
    { ref: "PQ-001", authority: "ADNOC",           category: "Pressure Vessel Fabricator (ASME VIII)",  status: "active",   submitted: "2023-11-01", expiry: "2025-11-01", contact: "Vendor.Dev@adnoc.ae" },
    { ref: "PQ-002", authority: "ADMA-OPCO",        category: "Storage Tank Fabricator (API 650)",       status: "active",   submitted: "2024-02-15", expiry: "2026-02-15", contact: "procurement@admaopco.ae" },
    { ref: "PQ-003", authority: "ENOC",             category: "Heat Exchanger Fabricator (TEMA)",        status: "expiring", submitted: "2023-05-20", expiry: "2025-06-20", contact: "vendors@enoc.ae" },
    { ref: "PQ-004", authority: "Dubai Petroleum",  category: "Structural Steel Fabricator",             status: "active",   submitted: "2024-01-10", expiry: "2026-01-10", contact: "procurement@dubpet.ae" },
    { ref: "PQ-005", authority: "DEWA",             category: "Pressure Vessel & Piping (ASME B31.3)",   status: "pending",  submitted: "2025-03-01", expiry: null,         contact: "suppliers@dewa.gov.ae" },
    { ref: "PQ-006", authority: "ADNOC Gas",        category: "API 650 Tank Fabricator",                 status: "expired",  submitted: "2022-08-01", expiry: "2024-08-01", contact: "vendor@adnocgas.ae" },
    { ref: "PQ-007", authority: "Petrofac",         category: "Qualified Sub-Contractor (Fabrication)",  status: "active",   submitted: "2024-06-10", expiry: "2026-06-10", contact: "subcontractors@petrofac.com" },
  ]);

  // ── Competitor intel ──────────────────────────────────────────
  await knex("competitors").insert([
    { ref: "C01", name: "Alpha Fabricators LLC", region: "Dubai, UAE",    size: "Medium", strengths: jsonCol(["API 650 tanks", "Low pricing"]),     weaknesses: jsonCol(["Limited ASME cert", "Long lead times"]),  win_rate: 40, avg_gap: -8 },
    { ref: "C02", name: "Gulf Steel Works",      region: "Sharjah, UAE",  size: "Large",  strengths: jsonCol(["Large capacity", "CS fabrication"]),  weaknesses: jsonCol(["SS limited", "No ADNOC pre-qual"]),       win_rate: 55, avg_gap: 3 },
    { ref: "C03", name: "ProFab Engineering",    region: "Abu Dhabi, UAE", size: "Small", strengths: jsonCol(["ADNOC approved", "SS expertise"]),    weaknesses: jsonCol(["Capacity constrained", "High overhead"]), win_rate: 60, avg_gap: 5 },
    { ref: "C04", name: "Emirates Steel Fab",    region: "Dubai, UAE",    size: "Large",  strengths: jsonCol(["Price aggressive", "Fast delivery"]), weaknesses: jsonCol(["Quality issues", "NDT subcontracted"]),   win_rate: 45, avg_gap: -12 },
  ]);

  // ── Bid outcomes (win/loss record vs competitors) ─────────────
  await knex("bid_outcomes").insert([
    { tender: "ITT-2025-011 (Dragon Oil, Duplex PV)", result: "quoted", our_price: 188000, competitor: "ProFab Engineering",  their_price: null,   gap: null, notes: "Awaiting result" },
    { tender: "NAPESCO GRP Skid",                      result: "lost",   our_price: 74000,  competitor: "Gulf Steel Works",    their_price: 60000,  gap: -22,  notes: "Competitor 22% below — review sub-material costs" },
    { tender: "ENOC Heat Exchanger",                   result: "won",    our_price: 142000, competitor: "Alpha Fabricators",   their_price: 158000, gap: 11,   notes: "Won on technical compliance & lead time" },
    { tender: "ADNOC 316L Storage Tank",               result: "won",    our_price: 284000, competitor: "Emirates Steel Fab",  their_price: 271000, gap: -5,   notes: "Won on ADNOC pre-qual & ASME cert advantage" },
    { tender: "Petrofac Pressure Vessel",              result: "won",    our_price: 97500,  competitor: "Gulf Steel Works",    their_price: 105000, gap: 8,    notes: "Won on delivery schedule + welding certs" },
  ]);

  console.log("✓ CRM/Marketing seed — 9 quotes (+revisions), 4 approvals, 7 appts, 8 contacts, 7 prequals, 4 competitors, 5 bid outcomes");
};
