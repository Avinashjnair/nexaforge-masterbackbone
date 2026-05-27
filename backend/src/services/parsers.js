const ExcelJS = require("exceljs");
const pdfParse = require("pdf-parse");

/**
 * Parse an XLSX/XLS file buffer and extract BOM line items.
 * Expects columns (case-insensitive): description, quantity, unit, material, part_no / pn
 */
async function parseXlsxBom(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return { source: "xlsx", item_count: 0, items: [] };

  const rows = [];
  let headers = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const values = row.values.slice(1); // row.values is 1-indexed with null at [0]
    if (rowNumber === 1) {
      headers = values.map((v) => (v != null ? String(v).trim() : ""));
    } else {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = values[i] != null ? values[i] : ""; });
      rows.push(obj);
    }
  });

  const items = rows
    .filter((r) => {
      const descKey = Object.keys(r).find((k) => k.toLowerCase() === "description" || k.toLowerCase() === "desc");
      return descKey && r[descKey];
    })
    .map((r, idx) => {
      const get = (...keys) => {
        for (const k of keys) {
          const found = Object.keys(r).find((rk) => rk.toLowerCase() === k.toLowerCase());
          if (found && r[found]) return String(r[found]).trim();
        }
        return null;
      };
      return {
        line_no: idx + 1,
        pn: get("pn", "part_no", "part no", "item no", "item_no"),
        description: get("description", "desc", "item description") || `Item ${idx + 1}`,
        quantity: Number(get("quantity", "qty", "qty.") || 1),
        unit: get("unit", "uom", "unit of measure") || "pcs",
        material: get("material", "material grade", "grade"),
        item_type: "part",
      };
    });

  return { source: "xlsx", item_count: items.length, items };
}

/**
 * Parse a PDF buffer and attempt to extract a BOM table.
 * Uses heuristic: looks for lines with numbers (qty) and text (description).
 */
async function parsePdfBom(buffer) {
  const data = await pdfParse(buffer);
  const lines = data.text.split("\n").map((l) => l.trim()).filter(Boolean);

  const items = [];
  // Heuristic: lines matching "<number> <description>" or "<pn> <description> <qty>"
  const rowPattern = /^(\S+)\s+(.+?)\s+(\d+(?:\.\d+)?)\s*(pcs|kg|m|ea|set|nos)?/i;

  lines.forEach((line, idx) => {
    const match = line.match(rowPattern);
    if (match) {
      items.push({
        line_no: items.length + 1,
        pn: match[1].length <= 20 ? match[1] : null,
        description: match[2].trim(),
        quantity: Number(match[3]),
        unit: match[4] || "pcs",
        material: null,
        item_type: "part",
        source_line: idx + 1,
      });
    }
  });

  return { source: "pdf", page_count: data.numpages, item_count: items.length, items, raw_text_length: data.text.length };
}

/**
 * Parse a DXF file buffer and extract BLOCK/INSERT entities as assembly items.
 * dxf-parser gives us entities; we look for INSERT (placed blocks) with counts.
 */
function parseDxfBom(buffer) {
  let DxfParser;
  try {
    DxfParser = require("dxf-parser");
  } catch {
    return { source: "dxf", error: "dxf-parser not installed", items: [] };
  }

  const parser = new DxfParser();
  const text = buffer.toString("utf8");

  let dxf;
  try {
    dxf = parser.parseSync(text);
  } catch (e) {
    return { source: "dxf", error: `Parse failed: ${e.message}`, items: [] };
  }

  const insertCounts = {};
  const entities = dxf.entities || [];

  entities
    .filter((e) => e.type === "INSERT")
    .forEach((e) => {
      const name = e.name || e.block || "UNKNOWN";
      insertCounts[name] = (insertCounts[name] || 0) + (e.count || 1);
    });

  const items = Object.entries(insertCounts).map(([name, qty], idx) => ({
    line_no: idx + 1,
    pn: name,
    description: name.replace(/_/g, " "),
    quantity: qty,
    unit: "pcs",
    material: null,
    item_type: "part",
  }));

  return { source: "dxf", item_count: items.length, items };
}

module.exports = { parseXlsxBom, parsePdfBom, parseDxfBom };
