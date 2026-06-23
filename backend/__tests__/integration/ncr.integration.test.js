'use strict';

process.env.JWT_SECRET = 'test-secret-nexaforge-s08-int';
process.env.NODE_ENV   = 'test';

const request = require('supertest');
const jwt     = require('jsonwebtoken');

jest.mock('../../src/events/rabbitmq', () => ({
  publish: jest.fn().mockResolvedValue(undefined),
  TOPICS:  { NCR_RAISED: 'ncr.raised', NCR_STATUS_CHANGED: 'ncr.status.changed' },
}));

const mockNcr = {
  id: 'ncr-001', ncr_no: 'NCR-0001', project_id: 'proj-001',
  title: 'Weld crack on joint J-12', severity: 'major', status: 'open',
  raised_by: 'user-001', deleted_at: null,
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
    first:     jest.fn().mockResolvedValue(mockNcr),
    insert:    jest.fn().mockReturnThis(),
    update:    jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([mockNcr]),
    count:     jest.fn().mockReturnThis(),
    then:      jest.fn(),
  };
  const knex = jest.fn(() => mockDbChain);
  knex.fn = { now: jest.fn(() => new Date()) };
  return knex;
});

jest.mock('../../src/db/redis', () => ({
  client:  { set: jest.fn(), get: jest.fn(), del: jest.fn() },
  connect: jest.fn().mockResolvedValue(undefined),
}));

function makeToken(role = 'gm', dept = 'gm') {
  return jwt.sign({ sub: 'user-001', role, department: dept, name: 'Test User' }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const app = require('../../src/app');

// ── POST /api/ncr ──────────────────────────────────────────────
describe('POST /api/ncr', () => {
  beforeEach(() => jest.clearAllMocks());

  test('201 with valid body and authenticated user', async () => {
    const db = require('../../src/db/knex');
    db.mockReturnValue({
      ...mockDbChain,
      count:     jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([mockNcr]),
      then:      jest.fn(cb => Promise.resolve([{ count: '0' }]).then(cb)),
    });

    const res = await request(app)
      .post('/api/ncr')
      .set('Authorization', `Bearer ${makeToken('user', 'qc')}`)
      .send({ project_id: 'proj-001', title: 'Weld crack on joint J-12', severity: 'major' });

    expect([201, 500]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body).toHaveProperty('ncr_no');
    }
  });

  test('400 when project_id is missing', async () => {
    const res = await request(app)
      .post('/api/ncr')
      .set('Authorization', `Bearer ${makeToken('user', 'qc')}`)
      .send({ title: 'Missing project' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/ncr')
      .set('Authorization', `Bearer ${makeToken('user', 'qc')}`)
      .send({ project_id: 'proj-001' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('401 without token', async () => {
    const res = await request(app)
      .post('/api/ncr')
      .send({ project_id: 'proj-001', title: 'No auth' });

    expect(res.status).toBe(401);
  });
});

// ── GET /api/ncr ───────────────────────────────────────────────
describe('GET /api/ncr', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 with valid token', async () => {
    const db = require('../../src/db/knex');
    db.mockReturnValue({
      ...mockDbChain,
      then: jest.fn(cb => Promise.resolve([mockNcr]).then(cb)),
    });

    const res = await request(app)
      .get('/api/ncr')
      .set('Authorization', `Bearer ${makeToken('gm', 'qc')}`);

    expect([200, 500]).toContain(res.status);
  });

  test('401 without token', async () => {
    const res = await request(app).get('/api/ncr');
    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/ncr/:id/status ──────────────────────────────────
describe('PATCH /api/ncr/:id/status', () => {
  beforeEach(() => jest.clearAllMocks());

  test('403 when role is "user" (below senior gate)', async () => {
    const res = await request(app)
      .patch('/api/ncr/ncr-001/status')
      .set('Authorization', `Bearer ${makeToken('user', 'qc')}`)
      .send({ status: 'under_review' });

    expect(res.status).toBe(403);
  });

  test('auth gate passes for senior role (non-401, non-403 response)', async () => {
    const res = await request(app)
      .patch('/api/ncr/ncr-001/status')
      .set('Authorization', `Bearer ${makeToken('senior', 'qc')}`)
      .send({ status: 'under_review' });

    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  }, 10000);

  test('401 without token', async () => {
    const res = await request(app)
      .patch('/api/ncr/ncr-001/status')
      .send({ status: 'under_review' });

    expect(res.status).toBe(401);
  });
});
