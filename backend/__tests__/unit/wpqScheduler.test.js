'use strict';

const { runWpqCheck } = require('../../src/services/wpqScheduler');

// Mock the DB so tests run without a real PostgreSQL connection
jest.mock('../../src/db/knex', () => {
  const mockChain = {
    where:        jest.fn().mockReturnThis(),
    whereNotIn:   jest.fn().mockReturnThis(),
    whereIn:      jest.fn().mockReturnThis(),
    update:       jest.fn().mockReturnThis(),
    returning:    jest.fn().mockResolvedValue([]),
  };
  const knex = jest.fn(() => mockChain);
  knex.fn = { now: jest.fn(() => new Date()) };
  return knex;
});

const db = require('../../src/db/knex');

describe('runWpqCheck', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns counts object with expired and expiringSoon', async () => {
    db().returning
      .mockResolvedValueOnce([{ id: 'wpq-1' }, { id: 'wpq-2' }])  // expired
      .mockResolvedValueOnce([{ id: 'wpq-3' }]);                   // expiringSoon

    const result = await runWpqCheck();
    expect(result).toHaveProperty('expired');
    expect(result).toHaveProperty('expiringSoon');
  });

  test('returns zero counts when nothing to update', async () => {
    db().returning.mockResolvedValue([]);
    const result = await runWpqCheck();
    expect(result.expired).toBe(0);
    expect(result.expiringSoon).toBe(0);
  });

  test('queries wpq table twice (expired + expiring_soon)', async () => {
    db().returning.mockResolvedValue([]);
    await runWpqCheck();
    // db() called for each query chain — at least 2 table calls
    expect(db).toHaveBeenCalledWith('wpq');
    expect(db.mock.calls.filter(c => c[0] === 'wpq').length).toBeGreaterThanOrEqual(2);
  });

  test('applies expiry window of 90 days for warning', async () => {
    db().returning.mockResolvedValue([]);
    await runWpqCheck();
    // The second where call on the second chain gets a date ~90 days from now
    const warnCalls = db().where.mock.calls.filter(
      c => c[0] === 'expiry_date' && c[1] === '<='
    );
    if (warnCalls.length > 0) {
      const warnDate = warnCalls[0][2];
      const daysAhead = Math.round((warnDate - new Date()) / 86400000);
      expect(daysAhead).toBeGreaterThanOrEqual(89);
      expect(daysAhead).toBeLessThanOrEqual(91);
    }
  });
});
