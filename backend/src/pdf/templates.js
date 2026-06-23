const PDFDocument = require("pdfkit");

// ── Shared helpers ─────────────────────────────────────────────

const BRAND = {
  orange: "#e8622a",
  dark:   "#0d0f12",
  grey:   "#6b7280",
  light:  "#f3f4f6",
  black:  "#111827",
};

function addHeader(doc, title, subtitle) {
  doc.rect(0, 0, doc.page.width, 60).fill(BRAND.dark);
  doc.fillColor("white").fontSize(18).font("Helvetica-Bold")
    .text("NexaForge ERP", 40, 18);
  doc.fontSize(9).fillColor(BRAND.orange)
    .text(title.toUpperCase(), 40, 38);
  if (subtitle) {
    doc.fillColor(BRAND.grey).text(subtitle, doc.page.width - 250, 22, { width: 210, align: "right" });
  }
  doc.moveDown(3);
}

function addFooter(doc, pageNo) {
  const y = doc.page.height - 40;
  doc.rect(0, y - 5, doc.page.width, 45).fill(BRAND.light);
  doc.fillColor(BRAND.grey).fontSize(8)
    .text(
      `NexaForge ERP — Confidential   |   Generated ${new Date().toISOString()}   |   Page ${pageNo}`,
      40, y + 4, { align: "center", width: doc.page.width - 80 }
    );
}

function sectionTitle(doc, text) {
  doc.rect(40, doc.y, doc.page.width - 80, 20).fill(BRAND.orange);
  doc.fillColor("white").fontSize(10).font("Helvetica-Bold")
    .text(text, 46, doc.y - 16);
  doc.moveDown(1.2);
}

function fieldRow(doc, label, value, y) {
  doc.fillColor(BRAND.grey).fontSize(8).font("Helvetica")
    .text(label, 40, y);
  doc.fillColor(BRAND.black).fontSize(9).font("Helvetica-Bold")
    .text(value || "—", 180, y);
}

function table(doc, headers, rows, startY) {
  const colW = (doc.page.width - 80) / headers.length;
  let y = startY || doc.y;

  // Header row
  doc.rect(40, y, doc.page.width - 80, 18).fill(BRAND.dark);
  headers.forEach((h, i) => {
    doc.fillColor("white").fontSize(8).font("Helvetica-Bold")
      .text(h, 42 + i * colW, y + 4, { width: colW - 4 });
  });
  y += 20;

  // Data rows
  rows.forEach((row, ri) => {
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 80;
    }
    if (ri % 2 === 0) doc.rect(40, y, doc.page.width - 80, 16).fill(BRAND.light);
    row.forEach((cell, i) => {
      doc.fillColor(BRAND.black).fontSize(8).font("Helvetica")
        .text(String(cell ?? "—"), 42 + i * colW, y + 3, { width: colW - 4 });
    });
    y += 18;
  });

  doc.y = y + 10;
}

module.exports = { addHeader, addFooter, sectionTitle, fieldRow, table, BRAND };
