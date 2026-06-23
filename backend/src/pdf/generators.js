const PDFDocument = require("pdfkit");
const db = require("../db/knex");
const { addHeader, addFooter, sectionTitle, fieldRow, table } = require("./templates");

/**
 * All generators return a Buffer containing the PDF binary.
 */

// ── ITP Report ────────────────────────────────────────────────
async function generateItpPdf(projectId) {
  const project = await db("projects as p")
    .leftJoin("clients as c", "p.client_id", "c.id")
    .select("p.*", "c.name as client_name")
    .where("p.id", projectId).first();

  const steps = await db("itp_steps").where("project_id", projectId).orderBy("step_no");

  const signOffsByStep = {};
  if (steps.length) {
    const signOffs = await db("itp_sign_offs as so")
      .leftJoin("users as u", "so.signed_by", "u.id")
      .whereIn("so.itp_step_id", steps.map((s) => s.id))
      .select("so.*", "u.full_name as inspector");
    signOffs.forEach((s) => {
      (signOffsByStep[s.itp_step_id] = signOffsByStep[s.itp_step_id] || []).push(s);
    });
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    addHeader(doc, "Inspection & Test Plan", `${project?.project_no} — ${project?.name}`);

    // Project info
    let y = doc.y;
    fieldRow(doc, "Project No.",   project?.project_no, y);      y += 16;
    fieldRow(doc, "Client",        project?.client_name, y);     y += 16;
    fieldRow(doc, "Product Type",  project?.product_type, y);    y += 16;
    fieldRow(doc, "Material Grade",project?.material_grade, y);  y += 24;
    doc.y = y;

    sectionTitle(doc, "ITP Steps");

    table(doc,
      ["#", "Activity", "H/W/R", "Status", "Inspector", "Result"],
      steps.map((s) => {
        const so = (signOffsByStep[s.id] || []).slice(-1)[0];
        return [s.step_no, s.activity, s.hold_type, s.status, so?.inspector || "", so?.result || ""];
      })
    );

    addFooter(doc, 1);
    doc.end();
  });
}

// ── NCR Report ────────────────────────────────────────────────
async function generateNcrPdf(ncrId) {
  const ncr = await db("ncrs as n")
    .leftJoin("projects as p", "n.project_id", "p.id")
    .leftJoin("users as r", "n.raised_by", "r.id")
    .leftJoin("users as a", "n.assigned_to", "a.id")
    .select("n.*", "p.project_no", "p.name as project_name", "r.full_name as raised_by_name", "a.full_name as assigned_to_name")
    .where("n.id", ncrId).first();

  const comments = await db("ncr_comments as c")
    .leftJoin("users as u", "c.user_id", "u.id")
    .select("c.*", "u.full_name as author")
    .where("c.ncr_id", ncrId).orderBy("c.created_at");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    addHeader(doc, "Non-Conformance Report", `${ncr?.ncr_no}`);

    let y = doc.y;
    fieldRow(doc, "NCR No.",       ncr?.ncr_no, y);         y += 16;
    fieldRow(doc, "Project",       `${ncr?.project_no} — ${ncr?.project_name}`, y); y += 16;
    fieldRow(doc, "Severity",      ncr?.severity?.toUpperCase(), y); y += 16;
    fieldRow(doc, "Status",        ncr?.status, y);          y += 16;
    fieldRow(doc, "Raised By",     ncr?.raised_by_name, y);  y += 16;
    fieldRow(doc, "Assigned To",   ncr?.assigned_to_name, y); y += 16;
    fieldRow(doc, "Due Date",      ncr?.due_date, y);        y += 16;
    fieldRow(doc, "Disposition",   ncr?.disposition, y);     y += 24;
    doc.y = y;

    sectionTitle(doc, "Description");
    doc.fillColor("#111827").fontSize(9).font("Helvetica")
      .text(ncr?.description || "—", 40, doc.y, { width: doc.page.width - 80 });
    doc.moveDown(1);

    if (ncr?.root_cause) {
      sectionTitle(doc, "Root Cause");
      doc.fontSize(9).text(ncr.root_cause, 40, doc.y, { width: doc.page.width - 80 });
      doc.moveDown(1);
    }

    if (ncr?.corrective_action) {
      sectionTitle(doc, "Corrective Action");
      doc.fontSize(9).text(ncr.corrective_action, 40, doc.y, { width: doc.page.width - 80 });
      doc.moveDown(1);
    }

    if (comments.length) {
      sectionTitle(doc, "Activity Log");
      table(doc,
        ["Date", "Author", "Type", "Comment"],
        comments.map((c) => [
          new Date(c.created_at).toLocaleDateString(),
          c.author,
          c.action_type,
          c.comment.slice(0, 80),
        ])
      );
    }

    addFooter(doc, 1);
    doc.end();
  });
}

// ── MRB Dossier ───────────────────────────────────────────────
async function generateMrbPdf(projectId) {
  const project = await db("projects as p")
    .leftJoin("clients as c", "p.client_id", "c.id")
    .select("p.*", "c.name as client_name").where("p.id", projectId).first();

  const [joints, ndeAll, itpSteps, ncrs, grns] = await Promise.all([
    db("weld_joints as j").leftJoin("employees as e", "j.welder_id", "e.id").leftJoin("wps as w", "j.wps_id", "w.id")
      .select("j.*", "e.full_name as welder_name", "e.employee_no", "w.wps_no").where("j.project_id", projectId),
    db("nde_records as n").leftJoin("weld_joints as j", "n.joint_id", "j.id")
      .select("n.*", "j.joint_no").where("j.project_id", projectId),
    db("itp_steps").where("project_id", projectId).orderBy("step_no"),
    db("ncrs").where("project_id", projectId),
    db("grn as g").leftJoin("purchase_orders as po", "g.po_id", "po.id")
      .select("g.*", "po.po_no").where("po.project_id", projectId),
  ]);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Cover page
    addHeader(doc, "Manufacturer's Record Book (MRB)", `${project?.project_no} — ${project?.name}`);

    let y = doc.y;
    fieldRow(doc, "Project No.",  project?.project_no, y);   y += 16;
    fieldRow(doc, "Client",       project?.client_name, y);  y += 16;
    fieldRow(doc, "Product Type", project?.product_type, y); y += 16;
    fieldRow(doc, "Material",     project?.material_grade, y); y += 16;
    fieldRow(doc, "Status",       project?.status, y);       y += 16;
    fieldRow(doc, "Compiled",     new Date().toLocaleDateString(), y); y += 24;
    doc.y = y;

    // Section 1 — Weld Register
    doc.addPage();
    addHeader(doc, "Section 1 — Weld Joint Register", project?.project_no);
    table(doc,
      ["Joint No.", "WPS", "Welder", "Stamp", "Status", "Weld Date"],
      joints.map((j) => [j.joint_no, j.wps_no, j.welder_name, j.employee_no, j.status, j.weld_date ? new Date(j.weld_date).toLocaleDateString() : ""])
    );

    // Section 2 — NDE Reports
    doc.addPage();
    addHeader(doc, "Section 2 — NDE Records", project?.project_no);
    table(doc,
      ["Joint No.", "Method", "Test Date", "Technician", "Result"],
      ndeAll.map((n) => [n.joint_no, n.method, n.test_date ? new Date(n.test_date).toLocaleDateString() : "", n.technician, n.result])
    );

    // Section 3 — ITP
    doc.addPage();
    addHeader(doc, "Section 3 — Inspection & Test Plan", project?.project_no);
    table(doc,
      ["#", "Activity", "Type", "Status"],
      itpSteps.map((s) => [s.step_no, s.activity, s.hold_type, s.status])
    );

    // Section 4 — NCRs
    doc.addPage();
    addHeader(doc, "Section 4 — Non-Conformance Reports", project?.project_no);
    table(doc,
      ["NCR No.", "Title", "Severity", "Status", "Disposition"],
      ncrs.map((n) => [n.ncr_no, n.title.slice(0, 40), n.severity, n.status, n.disposition || ""])
    );

    // Section 5 — Material Certs
    doc.addPage();
    addHeader(doc, "Section 5 — Material Receiving Records", project?.project_no);
    table(doc,
      ["GRN No.", "PO No.", "Received Date", "Inspection Status"],
      grns.map((g) => [g.grn_no, g.po_no, g.received_date ? new Date(g.received_date).toLocaleDateString() : "", g.inspection_status])
    );

    addFooter(doc, doc.bufferedPageRange().count);
    doc.end();
  });
}

// ── Quote PDF ─────────────────────────────────────────────────
async function generateQuotePdf(quoteId) {
  const quote = await db("quotes as q")
    .leftJoin("opportunities as o", "q.opportunity_id", "o.id")
    .leftJoin("clients as c", "o.client_id", "c.id")
    .select("q.*", "o.title as opportunity_title", "c.name as client_name")
    .where("q.id", quoteId).first();

  const lines = await db("quote_lines").where("quote_id", quoteId).orderBy("line_no");
  const subtotal = lines.reduce((s, l) => s + Number(l.total_price), 0);
  const discount = subtotal * (Number(quote?.discount_pct || 0) / 100);
  const total = subtotal - discount;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    addHeader(doc, "Quotation", `${quote?.quote_no} Rev.${quote?.revision}`);

    let y = doc.y;
    fieldRow(doc, "Quote No.",   quote?.quote_no, y);             y += 16;
    fieldRow(doc, "Client",      quote?.client_name, y);          y += 16;
    fieldRow(doc, "Subject",     quote?.opportunity_title, y);    y += 16;
    fieldRow(doc, "Valid Until", quote?.valid_until, y);          y += 24;
    doc.y = y;

    sectionTitle(doc, "Scope of Supply");
    table(doc,
      ["#", "Description", "Qty", "Unit", "Unit Price", "Total"],
      lines.map((l) => [l.line_no, l.description.slice(0, 45), l.quantity, l.unit || "", `$${Number(l.unit_price).toLocaleString()}`, `$${Number(l.total_price).toLocaleString()}`])
    );

    // Totals block
    const tw = 250;
    const tx = doc.page.width - tw - 40;
    let ty = doc.y + 10;
    doc.fontSize(9).fillColor("#6b7280").text("Subtotal:", tx, ty).fillColor("#111827").text(`$${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, tx + 140, ty, { align: "right", width: tw - 140 }); ty += 16;
    if (discount > 0) {
      doc.fillColor("#6b7280").text(`Discount (${quote.discount_pct}%):`, tx, ty).fillColor("#e8622a").text(`-$${discount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, tx + 140, ty, { align: "right", width: tw - 140 }); ty += 16;
    }
    doc.rect(tx, ty, tw, 22).fill("#0d0f12");
    doc.fillColor("white").font("Helvetica-Bold").fontSize(10).text("TOTAL:", tx + 6, ty + 5).text(`$${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, tx + 140, ty + 5, { align: "right", width: tw - 150 });

    if (quote?.terms) {
      doc.moveDown(3);
      sectionTitle(doc, "Terms & Conditions");
      doc.fillColor("#111827").fontSize(8).font("Helvetica").text(quote.terms, 40, doc.y, { width: doc.page.width - 80 });
    }

    addFooter(doc, 1);
    doc.end();
  });
}

// ── Invoice PDF ───────────────────────────────────────────────
async function generateInvoicePdf(invoiceId) {
  const invoice = await db("invoices as i")
    .leftJoin("projects as p", "i.project_id", "p.id")
    .leftJoin("clients as c", "p.client_id", "c.id")
    .leftJoin("milestones as m", "i.milestone_id", "m.id")
    .select("i.*", "p.project_no", "p.name as project_name", "c.name as client_name", "c.address as client_address", "m.name as milestone_name")
    .where("i.id", invoiceId).first();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    addHeader(doc, "Tax Invoice", invoice?.invoice_no);

    let y = doc.y;
    fieldRow(doc, "Invoice No.",  invoice?.invoice_no, y);   y += 16;
    fieldRow(doc, "Bill To",      invoice?.client_name, y);  y += 16;
    fieldRow(doc, "Project",      `${invoice?.project_no} — ${invoice?.project_name}`, y); y += 16;
    fieldRow(doc, "Milestone",    invoice?.milestone_name, y); y += 16;
    fieldRow(doc, "Issue Date",   invoice?.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : "", y); y += 16;
    fieldRow(doc, "Due Date",     invoice?.due_date ? new Date(invoice.due_date).toLocaleDateString() : "", y); y += 24;
    doc.y = y;

    sectionTitle(doc, "Invoice Summary");
    table(doc,
      ["Description", "Amount"],
      [
        [invoice?.milestone_name || "Professional Services", `${invoice?.currency} ${Number(invoice?.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
        ["Tax", `${invoice?.currency} ${Number(invoice?.tax_amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
      ]
    );

    const grandTotal = Number(invoice?.amount || 0) + Number(invoice?.tax_amount || 0);
    doc.moveDown(1);
    doc.rect(40, doc.y, doc.page.width - 80, 28).fill("#0d0f12");
    doc.fillColor("white").font("Helvetica-Bold").fontSize(12)
      .text(`TOTAL DUE: ${invoice?.currency} ${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        46, doc.y - 20, { width: doc.page.width - 86 });

    addFooter(doc, 1);
    doc.end();
  });
}

module.exports = { generateItpPdf, generateNcrPdf, generateMrbPdf, generateQuotePdf, generateInvoicePdf };
