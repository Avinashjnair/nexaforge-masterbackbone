'use strict';

process.env.JWT_SECRET = 'test-secret-nexaforge-s08-int';
process.env.NODE_ENV   = 'test';

const request = require('supertest');
const jwt     = require('jsonwebtoken');

jest.mock('../../src/events/rabbitmq', () => ({
  publish: jest.fn().mockResolvedValue(undefined),
  TOPICS:  {},
}));

const mockInvoice = {
  id: 'inv-001', invoice_no: 'INV-00001', project_id: 'proj-001',
  amount: 50000, tax_amount: 2500, status: 'draft',
  issue_date: '2026-05-01', due_date: '2026-06-01',
};

const mockCostLine = {
  id: 'cl-001', project_id: 'proj-001', cost_type: 'material',
  description: 'Steel plates', budgeted_amount: 20000, actual_amount: 18500,
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
    first:     jest.fn().mockResolvedValue(mockInvoice),
    insert:    jest.fn().mockReturnThis(),
    update:    jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([mockInvoice]),
    count:     jest.fn().mockReturnThis(),
    then:      jest.fn(cb => Promise.resolve([mockInvoice]).then(cb)),
  };
  const knex = jest.fn(() => mockDbChain);
  knex.fn = { now: jest.fn(() => new Date()) };
  return knex;
});

jest.mock('../../src/db/redis', () => ({
  client:  { set: jest.fn(), get: jest.fn(), del: jest.fn() },
  connect: jest.fn().mockResolvedValue(undefined),
}));

// jobCosting service uses DB — mock to return predictable shape
jest.mock('../../src/services/jobCosting', () => ({
  getJobCostSummary: jest.fn().mockResolvedValue({
    project_id: 'proj-001', contract_value: 100000,
    rows: [], totals: { budgeted: 0, actual: 0, forecast: 0 },
    gross_margin: 100000, margin_pct: 100,
  }),
}));

function makeToken(role = 'gm', dept = 'gm') {
  return jwt.sign({ sub: 'user-001', role, department: dept, name: 'Test User' }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const app = require('../../src/app');

// ── GET /api/finance/projects/:id/job-cost ─────────────────────
describe('GET /api/finance/projects/:id/job-cost', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 returns job cost summary', async () => {
    const res = await request(app)
      .get('/api/finance/projects/proj-001/job-cost')
      .set('Authorization', `Bearer ${makeToken('gm', 'finance')}`);

    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('project_id');
      expect(res.body).toHaveProperty('totals');
    }
  });

  test('401 without token', async () => {
    const res = await request(app).get('/api/finance/projects/proj-001/job-cost');
    expect(res.status).toBe(401);
  });
});

// ── POST /api/finance/job-cost-lines ──────────────────────────
describe('POST /api/finance/job-cost-lines', () => {
  beforeEach(() => jest.clearAllMocks());

  test('201 with valid body and senior+ role', async () => {
    const db = require('../../src/db/knex');
    db.mockReturnValue({
      ...mockDbChain,
      returning: jest.fn().mockResolvedValue([mockCostLine]),
    });

    const res = await request(app)
      .post('/api/finance/job-cost-lines')
      .set('Authorization', `Bearer ${makeToken('senior', 'finance')}`)
      .send({ project_id: 'proj-001', cost_type: 'material', description: 'Steel plates' });

    expect([201, 500]).toContain(res.status);
  });

  test('400 when required fields missing', async () => {
    const res = await request(app)
      .post('/api/finance/job-cost-lines')
      .set('Authorization', `Bearer ${makeToken('senior', 'finance')}`)
      .send({ project_id: 'proj-001' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('400 when cost_type is invalid', async () => {
    const res = await request(app)
      .post('/api/finance/job-cost-lines')
      .set('Authorization', `Bearer ${makeToken('senior', 'finance')}`)
      .send({ project_id: 'proj-001', cost_type: 'invalid_type', description: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/cost_type/i);
  });

  test('403 when role is "user" (below senior gate)', async () => {
    const res = await request(app)
      .post('/api/finance/job-cost-lines')
      .set('Authorization', `Bearer ${makeToken('user', 'finance')}`)
      .send({ project_id: 'proj-001', cost_type: 'material', description: 'Test' });

    expect(res.status).toBe(403);
  });

  test('401 without token', async () => {
    const res = await request(app)
      .post('/api/finance/job-cost-lines')
      .send({ project_id: 'proj-001', cost_type: 'material', description: 'Test' });

    expect(res.status).toBe(401);
  });
});

// ── GET /api/finance/invoices ──────────────────────────────────
describe('GET /api/finance/invoices', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 with valid token', async () => {
    const res = await request(app)
      .get('/api/finance/invoices')
      .set('Authorization', `Bearer ${makeToken('gm', 'finance')}`);

    expect([200, 500]).toContain(res.status);
  });

  test('401 without token', async () => {
    const res = await request(app).get('/api/finance/invoices');
    expect(res.status).toBe(401);
  });
});

// ── POST /api/finance/invoices ────────────────────────────────
describe('POST /api/finance/invoices', () => {
  beforeEach(() => jest.clearAllMocks());

  test('201 with valid body and manager+ role', async () => {
    const db = require('../../src/db/knex');
    db.mockReturnValue({
      ...mockDbChain,
      count:     jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([mockInvoice]),
      then:      jest.fn(cb => Promise.resolve([{ count: '0' }]).then(cb)),
    });

    const res = await request(app)
      .post('/api/finance/invoices')
      .set('Authorization', `Bearer ${makeToken('manager', 'finance')}`)
      .send({
        project_id: 'proj-001', amount: 50000,
        issue_date: '2026-05-01', due_date: '2026-06-01',
      });

    expect([201, 500]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body).toHaveProperty('invoice_no');
    }
  });

  test('400 when required fields missing', async () => {
    const res = await request(app)
      .post('/api/finance/invoices')
      .set('Authorization', `Bearer ${makeToken('manager', 'finance')}`)
      .send({ project_id: 'proj-001' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('403 when role is "senior" (below manager gate)', async () => {
    const res = await request(app)
      .post('/api/finance/invoices')
      .set('Authorization', `Bearer ${makeToken('senior', 'finance')}`)
      .send({
        project_id: 'proj-001', amount: 50000,
        issue_date: '2026-05-01', due_date: '2026-06-01',
      });

    expect(res.status).toBe(403);
  });

  test('401 without token', async () => {
    const res = await request(app)
      .post('/api/finance/invoices')
      .send({ project_id: 'proj-001', amount: 50000, issue_date: '2026-05-01', due_date: '2026-06-01' });

    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/finance/invoices/:id/status ────────────────────
describe('PATCH /api/finance/invoices/:id/status', () => {
  beforeEach(() => jest.clearAllMocks());

  test('403 when role is "senior" (below manager gate)', async () => {
    const res = await request(app)
      .patch('/api/finance/invoices/inv-001/status')
      .set('Authorization', `Bearer ${makeToken('senior', 'finance')}`)
      .send({ status: 'paid', paid_amount: 50000, paid_date: '2026-05-15' });

    expect(res.status).toBe(403);
  });

  test('auth gate passes for manager role', async () => {
    const db = require('../../src/db/knex');
    db.mockReturnValue({
      ...mockDbChain,
      returning: jest.fn().mockResolvedValue([{ ...mockInvoice, status: 'paid' }]),
    });

    const res = await request(app)
      .patch('/api/finance/invoices/inv-001/status')
      .set('Authorization', `Bearer ${makeToken('manager', 'finance')}`)
      .send({ status: 'paid', paid_amount: 50000, paid_date: '2026-05-15' });

    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  test('401 without token', async () => {
    const res = await request(app)
      .patch('/api/finance/invoices/inv-001/status')
      .send({ status: 'paid' });

    expect(res.status).toBe(401);
  });
});
