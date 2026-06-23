/**
 * SPC Calculator — Cpk, X̄-R, UCL/LCL
 *
 * Uses subgroup size n=1 (individual measurements) with moving range when
 * there are fewer than 5 readings, otherwise standard X̄-R with subgroup
 * size 5 for richer charts.
 */

// d2 constants for X̄-R chart (subgroup sizes 2–10)
const D2 = { 2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326, 6: 2.534, 7: 2.704, 8: 2.847, 9: 2.970, 10: 3.078 };
// D3, D4 for LCL_R / UCL_R
const D3 = { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0.076, 8: 0.136, 9: 0.184, 10: 0.223 };
const D4 = { 2: 3.267, 3: 2.574, 4: 2.282, 5: 2.114, 6: 2.004, 7: 1.924, 8: 1.864, 9: 1.816, 10: 1.777 };
// A2 for UCL_X / LCL_X
const A2 = { 2: 1.880, 3: 1.023, 4: 0.729, 5: 0.577, 6: 0.483, 7: 0.419, 8: 0.373, 9: 0.337, 10: 0.308 };

function mean(arr) {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stdDev(arr, xbar) {
  const m = xbar !== undefined ? xbar : mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

/**
 * Calculate SPC control chart parameters from an array of individual readings.
 *
 * @param {number[]} readings  - Raw measurement values
 * @param {number}   usl       - Upper specification limit
 * @param {number}   lsl       - Lower specification limit
 * @returns {object} Chart parameters
 */
function calculate(readings, usl, lsl) {
  if (!readings || readings.length < 2) {
    return null;
  }

  const n = readings.length;
  const subgroupSize = n >= 10 ? 5 : 2; // use subgroup 5 when we have enough data

  const xbar = mean(readings);
  const sigma = stdDev(readings, xbar);

  // Moving range approach for control limits (works for any n)
  const movingRanges = [];
  for (let i = 1; i < readings.length; i++) {
    movingRanges.push(Math.abs(readings[i] - readings[i - 1]));
  }
  const rBar = mean(movingRanges);

  // Estimated process std dev from moving range (d2 for n=2)
  const sigmaEst = rBar / D2[2];

  // X̄ chart control limits
  const ucl = xbar + 3 * sigmaEst;
  const lcl = xbar - 3 * sigmaEst;

  // Cpk — uses the estimated sigma from moving range (short-term capability)
  const cpkUpper = (usl - xbar) / (3 * sigmaEst);
  const cpkLower = (xbar - lsl) / (3 * sigmaEst);
  const cpk = Math.min(cpkUpper, cpkLower);

  // Cp — potential capability (ignores centering)
  const cp = (usl - lsl) / (6 * sigmaEst);

  // Flag out-of-control points (beyond 3σ from mean)
  const outOfControlPoints = readings
    .map((v, i) => ({ index: i, value: v }))
    .filter(({ value }) => value > ucl || value < lcl)
    .map(({ index }) => index);

  return {
    xbar:    +xbar.toFixed(6),
    r_bar:   +rBar.toFixed(6),
    sigma:   +sigmaEst.toFixed(6),
    ucl:     +ucl.toFixed(6),
    lcl:     +lcl.toFixed(6),
    cpk:     +cpk.toFixed(4),
    cp:      +cp.toFixed(4),
    out_of_control_points: outOfControlPoints,
    n,
  };
}

module.exports = { calculate };
