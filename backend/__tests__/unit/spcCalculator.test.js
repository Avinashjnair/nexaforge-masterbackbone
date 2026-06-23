'use strict';

const { calculate } = require('../../src/services/spcCalculator');

describe('SPC Calculator', () => {
  const readings = [10.1, 10.2, 9.9, 10.0, 10.3, 10.1, 9.8, 10.2, 10.0, 10.1];
  const usl = 10.5;
  const lsl = 9.5;

  test('returns null for fewer than 2 readings', () => {
    expect(calculate([10.0], usl, lsl)).toBeNull();
    expect(calculate([], usl, lsl)).toBeNull();
  });

  test('returns expected chart fields', () => {
    const result = calculate(readings, usl, lsl);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('xbar');
    expect(result).toHaveProperty('r_bar');
    expect(result).toHaveProperty('sigma');
    expect(result).toHaveProperty('ucl');
    expect(result).toHaveProperty('lcl');
    expect(result).toHaveProperty('cpk');
    expect(result).toHaveProperty('cp');
    expect(result).toHaveProperty('out_of_control_points');
    expect(result).toHaveProperty('n', readings.length);
  });

  test('xbar is mean of readings', () => {
    const result = calculate(readings, usl, lsl);
    const expected = readings.reduce((s, v) => s + v, 0) / readings.length;
    expect(result.xbar).toBeCloseTo(expected, 4);
  });

  test('UCL > xbar and LCL < xbar', () => {
    const result = calculate(readings, usl, lsl);
    expect(result.ucl).toBeGreaterThan(result.xbar);
    expect(result.lcl).toBeLessThan(result.xbar);
  });

  test('Cpk is positive for a capable process', () => {
    const result = calculate(readings, usl, lsl);
    expect(result.cpk).toBeGreaterThan(0);
  });

  test('Cpk >= 1.33 for a well-centred capable process', () => {
    // Wide tolerance, well-centred data — should be clearly capable
    const stable = [10.0, 10.01, 9.99, 10.02, 9.98, 10.0, 10.01, 9.99, 10.0, 10.0];
    const result = calculate(stable, 10.5, 9.5);
    expect(result.cpk).toBeGreaterThanOrEqual(1.33);
  });

  test('detects out-of-control points beyond UCL/LCL', () => {
    const withOutlier = [...readings, 15.0]; // extreme outlier
    const result = calculate(withOutlier, usl, lsl);
    expect(result.out_of_control_points).toContain(readings.length); // last index
  });

  test('out_of_control_points is empty for stable process', () => {
    const stable = [10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0, 10.0];
    const result = calculate(stable, usl, lsl);
    expect(result.out_of_control_points).toHaveLength(0);
  });

  test('cp is always >= cpk (cp ignores centering)', () => {
    // Off-centre process
    const offCentre = [10.3, 10.4, 10.3, 10.4, 10.3, 10.35, 10.4, 10.3];
    const result = calculate(offCentre, usl, lsl);
    expect(result.cp).toBeGreaterThanOrEqual(result.cpk);
  });
});
