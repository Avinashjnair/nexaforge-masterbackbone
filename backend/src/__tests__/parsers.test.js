const XLSX = require("xlsx");
const { parseXlsxBom } = require("../services/parsers");

describe("XLSX BOM parser", () => {
  function makeXlsxBuffer(rows) {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BOM");
    return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  it("parses standard columns correctly", () => {
    const buffer = makeXlsxBuffer([
      { description: "Shell Plate 316L", quantity: 4, unit: "pcs", material: "316L", pn: "P-001" },
      { description: "Nozzle DN50",       quantity: 8, unit: "pcs", material: "316L", pn: "N-002" },
    ]);

    const result = parseXlsxBom(buffer);
    expect(result.source).toBe("xlsx");
    expect(result.item_count).toBe(2);
    expect(result.items[0].description).toBe("Shell Plate 316L");
    expect(result.items[0].quantity).toBe(4);
    expect(result.items[0].pn).toBe("P-001");
    expect(result.items[1].quantity).toBe(8);
  });

  it("handles case-insensitive column names", () => {
    const buffer = makeXlsxBuffer([
      { DESCRIPTION: "Gasket Set", QTY: 12, UNIT: "set" },
    ]);

    const result = parseXlsxBom(buffer);
    expect(result.item_count).toBe(1);
    expect(result.items[0].description).toBe("Gasket Set");
    expect(result.items[0].quantity).toBe(12);
  });

  it("defaults quantity to 1 when missing", () => {
    const buffer = makeXlsxBuffer([
      { description: "Pressure Gauge" },
    ]);

    const result = parseXlsxBom(buffer);
    expect(result.items[0].quantity).toBe(1);
  });

  it("filters out rows with no description", () => {
    const buffer = makeXlsxBuffer([
      { description: "Valid Item", quantity: 1 },
      { quantity: 5 }, // no description — should be filtered
      { description: "", quantity: 3 }, // empty description — filtered
    ]);

    const result = parseXlsxBom(buffer);
    expect(result.item_count).toBe(1);
  });

  it("assigns sequential line numbers", () => {
    const buffer = makeXlsxBuffer([
      { description: "Item A", quantity: 1 },
      { description: "Item B", quantity: 2 },
      { description: "Item C", quantity: 3 },
    ]);

    const result = parseXlsxBom(buffer);
    expect(result.items.map((i) => i.line_no)).toEqual([1, 2, 3]);
  });
});
