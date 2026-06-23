'use strict';

jest.mock('../../src/db/knex', () => {
  const knex = jest.fn();
  knex.raw  = jest.fn();
  knex.fn   = {};
  return knex;
});

const db = require('../../src/db/knex');
const { getJobCostSummary } = require('../../src/services/jobCosting');

const mockCategories = [
  { cost_type: 'Materials',          budget: '98000',  actual: '95060', committed: '1200',  forecast: '96260',  variance: '1740' },
  { cost_type: 'Labour',             budget: '56000',  actual: '33800', committed: '16800', forecast: '50600',  variance: '5400' },
  { cost_type: 'Sub-contractors',    budget: '19400',  actual: '8600',  committed: '6600',  forecast: '15200',  variance: '4200' },
  { cost_type: 'Overhead',           budget: '28400',  actual: '14200', committed: '14200', forecast: '28400',  variance: '0' },
];

describe('getJobCostSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    db.raw = jest.fn().mockResolvedValue({ rows: mockCategories });

    const projectChain = {
      where:  jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      first:  jest.fn().mockResolvedValue({ contract_value: '284000' }),
    };
    db.mockReturnValue(projectChain);
  });

  test('returns project_id, contract_value, by_category, totals, gross_margin, margin_pct', async () => {
    const result = await getJobCostSummary('P-001');
    expect(result).toHaveProperty('project_id', 'P-001');
    expect(result).toHaveProperty('contract_value');
    expect(result).toHaveProperty('by_category');
    expect(result).toHaveProperty('totals');
    expect(result).toHaveProperty('gross_margin');
    expect(result).toHaveProperty('margin_pct');
  });

  test('totals.budget equals sum of all category budgets', async () => {
    const result = await getJobCostSummary('P-001');
    const expectedBudget = mockCategories.reduce((s, r) => s + Number(r.budget), 0);
    expect(result.totals.budget).toBeCloseTo(expectedBudget);
  });

  test('totals.actual equals sum of all category actuals', async () => {
    const result = await getJobCostSummary('P-001');
    const expectedActual = mockCategories.reduce((s, r) => s + Number(r.actual), 0);
    expect(result.totals.actual).toBeCloseTo(expectedActual);
  });

  test('gross_margin = contract_value - forecast', async () => {
    const result = await getJobCostSummary('P-001');
    const expectedMargin = result.contract_value - result.totals.forecast;
    expect(result.gross_margin).toBeCloseTo(expectedMargin);
  });

  test('margin_pct = gross_margin / contract_value × 100', async () => {
    const result = await getJobCostSummary('P-001');
    const expected = (result.gross_margin / result.contract_value) * 100;
    expect(result.margin_pct).toBeCloseTo(expected, 1);
  });

  test('margin_pct is null when contract_value is 0', async () => {
    db.mockReturnValue({
      where:  jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      first:  jest.fn().mockResolvedValue({ contract_value: '0' }),
    });
    const result = await getJobCostSummary('P-001');
    expect(result.margin_pct).toBeNull();
  });

  test('by_category contains all cost types from DB', async () => {
    const result = await getJobCostSummary('P-001');
    const types = result.by_category.map(r => r.cost_type);
    expect(types).toContain('Materials');
    expect(types).toContain('Labour');
  });

  test('handles empty category rows gracefully', async () => {
    db.raw = jest.fn().mockResolvedValue({ rows: [] });
    const result = await getJobCostSummary('P-001');
    expect(result.totals.budget).toBe(0);
    expect(result.totals.actual).toBe(0);
    expect(result.gross_margin).toBe(284000);
  });
});
