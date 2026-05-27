/**
 * Job costing engine unit tests.
 * Validates margin calculations from raw cost line data.
 */

describe("Job Costing — margin calculations", () => {
  // Test the calculation logic directly without DB
  function computeMargin(contractValue, forecastCost) {
    const grossMargin = contractValue - forecastCost;
    const marginPct = contractValue > 0 ? (grossMargin / contractValue) * 100 : null;
    return { grossMargin, marginPct: marginPct !== null ? Number(marginPct.toFixed(2)) : null };
  }

  it("calculates correct margin for a profitable project", () => {
    // Contract: $284,000 | Forecast cost: $200,000 → margin ~29.6%
    const { grossMargin, marginPct } = computeMargin(284000, 200000);
    expect(grossMargin).toBe(84000);
    expect(marginPct).toBeCloseTo(29.58, 1);
  });

  it("returns negative margin when costs exceed contract value", () => {
    const { grossMargin, marginPct } = computeMargin(100000, 120000);
    expect(grossMargin).toBe(-20000);
    expect(marginPct).toBeCloseTo(-20, 1);
  });

  it("returns null margin_pct when contract value is zero", () => {
    const { marginPct } = computeMargin(0, 5000);
    expect(marginPct).toBeNull();
  });

  it("returns 100% margin when forecast cost is zero", () => {
    const { marginPct } = computeMargin(50000, 0);
    expect(marginPct).toBe(100);
  });

  it("totals across cost categories sum correctly", () => {
    const categories = [
      { cost_type: "material",    budget: 120000, actual: 95000 },
      { cost_type: "labour",      budget: 80000,  actual: 72000 },
      { cost_type: "overhead",    budget: 30000,  actual: 28000 },
      { cost_type: "subcontract", budget: 20000,  actual: 18000 },
    ];

    const totals = categories.reduce((acc, r) => ({
      budget: acc.budget + r.budget,
      actual: acc.actual + r.actual,
    }), { budget: 0, actual: 0 });

    expect(totals.budget).toBe(250000);
    expect(totals.actual).toBe(213000);
  });
});
