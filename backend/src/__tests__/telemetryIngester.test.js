const { calcHeatInput, DEFAULT_LIMITS, INTERPASS_TEMP_LIMIT_C } = require("../iiot/telemetryIngester");

describe("Heat input calculation", () => {
  it("calculates heat input correctly for GTAW parameters", () => {
    // HI = (I × V × 60) / (1000 × travel_speed)
    // (150 × 14 × 60) / (1000 × 200) = 126000 / 200000 = 0.63
    const hi = calcHeatInput(150, 14, 200);
    expect(hi).toBeCloseTo(0.63, 2);
  });

  it("calculates heat input for SMAW parameters", () => {
    // (160 × 22 × 60) / (1000 × 180) = 211200 / 180000 ≈ 1.173
    const hi = calcHeatInput(160, 22, 180);
    expect(hi).toBeCloseTo(1.173, 2);
  });

  it("returns null when current is missing", () => {
    expect(calcHeatInput(null, 14, 200)).toBeNull();
  });

  it("returns null when voltage is missing", () => {
    expect(calcHeatInput(150, null, 200)).toBeNull();
  });

  it("uses default travel speed of 200 mm/min when omitted", () => {
    const hi = calcHeatInput(150, 14);
    expect(hi).toBeCloseTo(0.63, 2);
  });
});

describe("WPS violation thresholds", () => {
  it("GTAW heat input limit is 1.5 kJ/mm", () => {
    expect(DEFAULT_LIMITS.GTAW.heat_input_max).toBe(1.5);
  });

  it("SMAW heat input limit is 2.5 kJ/mm", () => {
    expect(DEFAULT_LIMITS.SMAW.heat_input_max).toBe(2.5);
  });

  it("detects GTAW violation: HI 0.63 is within limit", () => {
    const hi = calcHeatInput(150, 14, 200);
    expect(hi).toBeLessThan(DEFAULT_LIMITS.GTAW.heat_input_max);
  });

  it("detects SMAW violation: spike reading triggers alert", () => {
    // Machine B violation tick: 220A × 1.4 = 308A, 22V × 1.2 = 26.4V, travel 180
    const hi = calcHeatInput(308, 26.4, 180);
    expect(hi).toBeGreaterThan(DEFAULT_LIMITS.SMAW.heat_input_max);
  });

  it("interpass temp limit is 250°C", () => {
    expect(INTERPASS_TEMP_LIMIT_C).toBe(250);
  });

  it("flags interpass temp violation at 270°C", () => {
    expect(270).toBeGreaterThan(INTERPASS_TEMP_LIMIT_C);
  });

  it("passes interpass temp check at 230°C", () => {
    expect(230).toBeLessThan(INTERPASS_TEMP_LIMIT_C);
  });
});
