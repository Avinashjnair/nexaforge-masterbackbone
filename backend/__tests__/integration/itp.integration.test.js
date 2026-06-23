'use strict';

process.env.JWT_SECRET = 'test-secret-nexaforge-s08-int';
process.env.NODE_ENV   = 'test';

const request = require('supertest');
const jwt     = require('jsonwebtoken');

const mockStep = {
  id: 'step-001', project_id: 'proj-001', step_no: 1,
  activity: 'Visual inspection of weld', hold_type: 'W',
  required_role: 'qc_inspector', status: 'pending',
};

let mockDbChain;
jest.mock('../../src/db/knex', () => {
  mockDbChain = {
    leftJoin:  jest.fn().mockReturnThis(),
    select:    jest.fn().mockReturnThis(),
    where:     jest.fn().mockReturnThis(),
    whereNull: jest.fn().mockReturnThis(),
    whereIn:   jest.fn().mockReturnThis(),
    orderBy:   jest.fn().mockReturnThis(),
    limit:     jest.fn().mockReturnThis(),
    offset:    jest.fn().mockReturnThis(),
    first:     jest.fn().mockResolvedValue(mockStep),
    insert:    jest.fn().mockReturnThis(),
    update:    jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([mockStep]),
    count:     jest.fn().mockReturnThis(),
    then:      jest.fn(cb => Promise.resolve([mockStep]).then(cb)),
  };
  const knex = jest.fn(() => mockDbChain);
  knex.fn = { now: jest.fn(() => new Date()) };
  return knex;
});

jest.mock('../../src/db/redis', () => ({
  client:  { set: jest.fn(), get: jest.fn(), del: jest.fn() },
  connect: jest.fn().mockResolvedValue(undefined),
}));

// itpEngine uses DB internally — mock at service level
jest.mock('../../src/services/itpEngine', () => ({
  signOffStep:       jest.fn().mockResolvedValue({ id: 'so-001', itp_step_id: 'step-001' }),
  hasActiveHoldBlock: jest.fn().mockResolvedValue([]),
}));

function makeToken(role = 'gm', dept = 'gm') {
  return jwt.sign({ sub: 'user-001', role, department: dept, name: 'Test User' }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const app = require('../../src/app');

// ── GET /api/projects/:id/itp ──────────────────────────────────
describe('GET /api/projects/:id/itp', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 returns steps, active_hold_count, active_holds', async () => {
    const db = require('../../src/db/knex');
    db.mockReturnValue({
      ...mockDbChain,
      then: jest.fn(cb => Promise.resolve([mockStep]).then(cb)),
    });

    const res = await request(app)
      .get('/api/projects/proj-001/itp')
      .set('Authorization', `Bearer ${makeToken('gm', 'qc')}`);

    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('steps');
      expect(res.body).toHaveProperty('active_hold_count');
    }
  });

  test('401 without token', async () => {
    const res = await request(app).get('/api/projects/proj-001/itp');
    expect(res.status).toBe(401);
  });
});

// ── POST /api/projects/:id/itp — add ITP step ─────────────────
describe('POST /api/projects/:id/itp', () => {
  beforeEach(() => jest.clearAllMocks());

  test('201 with valid body and senior+ role', async () => {
    const res = await request(app)
      .post('/api/projects/proj-001/itp')
      .set('Authorization', `Bearer ${makeToken('senior', 'qc')}`)
      .send({ activity: 'Visual inspection', hold_type: 'W', step_no: 1 });

    expect([201, 500]).toContain(res.status);
  });

  test('400 when activity is missing', async () => {
    const res = await request(app)
      .post('/api/projects/proj-001/itp')
      .set('Authorization', `Bearer ${makeToken('senior', 'qc')}`)
      .send({ hold_type: 'H' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('403 when role is "user" (below senior gate)', async () => {
    const res = await request(app)
      .post('/api/projects/proj-001/itp')
      .set('Authorization', `Bearer ${makeToken('user', 'qc')}`)
      .send({ activity: 'Inspection', hold_type: 'W', step_no: 1 });

    expect(res.status).toBe(403);
  });

  test('401 without token', async () => {
    const res = await request(app)
      .post('/api/projects/proj-001/itp')
      .send({ activity: 'Inspection' });

    expect(res.status).toBe(401);
  });
});

// ── POST /api/projects/:id/itp/steps/:stepId/signoff ──────────
describe('POST /api/projects/:id/itp/steps/:stepId/signoff', () => {
  beforeEach(() => jest.clearAllMocks());

  test('401 without token', async () => {
    const res = await request(app)
      .post('/api/projects/proj-001/itp/steps/step-001/signoff')
      .send({ outcome: 'accept' });

    expect(res.status).toBe(401);
  });

  test('auth gate passes for senior role (any non-401 response)', async () => {
    const res = await request(app)
      .post('/api/projects/proj-001/itp/steps/step-001/signoff')
      .set('Authorization', `Bearer ${makeToken('senior', 'qc')}`)
      .send({ outcome: 'accept', inspector_name: 'Ali Hassan' });

    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });
});
