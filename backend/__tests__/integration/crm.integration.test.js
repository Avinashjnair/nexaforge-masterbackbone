'use strict';

/**
 * CRM / Marketing persistence integration tests (S-19, Phases 2–3).
 *
 * Runs the real Express app against a throwaway SQLite database (the `local`
 * knex env + migrations-sqlite shim), so the actual SQL is exercised — revision
 * aggregation, margin derivation, JSON-column roundtrip, unique handling. A JWT
 * is signed directly, so no Redis/login round-trip is required.
 */

const path = require('path');
const os   = require('os');
const fs   = require('fs');

process.env.NODE_ENV    = 'local';
process.env.JWT_SECRET  = 'test-secret-crm-int';
process.env.SQLITE_FILE = path.join(os.tmpdir(), `nexaforge-crm-test-${process.pid}.sqlite`);

const request = require('supertest');
const jwt     = require('jsonwebtoken');

const db  = require('../../src/db/knex');
const app = require('../../src/app');

const token = jwt.sign(
  { sub: 'u-test', email: 'gm@nexaforge.com', role: 'gm', name: 'GM Test', department: 'gm' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);
const auth = (r) => r.set('Authorization', `Bearer ${token}`);

beforeAll(async () => {
  await db.migrate.latest();
});

afterAll(async () => {
  await db.destroy();
  try { fs.unlinkSync(process.env.SQLITE_FILE); } catch { /* ignore */ }
});

describe('quote-log + revisions', () => {
  let quoteId;

  test('creates a quote with an auto-generated ref', async () => {
    const res = await auth(request(app).post('/api/quote-log'))
      .send({ client_name: 'Dragon Oil', project: 'Duplex PV', owner: 'S. Mathews', status: 'pending' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.ref).toMatch(/^Q-\d{4}-\d{3}$/);
    quoteId = res.body.id;
  });

  test('adds revisions and the list returns them oldest→newest with current = last', async () => {
    await auth(request(app).post(`/api/quote-log/${quoteId}/revisions`))
      .send({ rev: 'Rev A', rev_date: '2025-04-05', value: 205000, margin: 25 });
    await auth(request(app).post(`/api/quote-log/${quoteId}/revisions`))
      .send({ rev: 'Rev B', rev_date: '2025-04-22', value: 188000, margin: 19.7 });

    const res = await auth(request(app).get('/api/quote-log'));
    expect(res.status).toBe(200);
    const row = res.body.find((q) => q.id === quoteId);
    expect(row.revisions).toHaveLength(2);
    expect(row.revisions[0].rev).toBe('Rev A');
    expect(row.revisions[1].rev).toBe('Rev B');
    expect(Number(row.revisions[1].value)).toBe(188000);
    expect(row.status).toBe('revised'); // adding a revision flips status
  });

  test('rejects a revision on a missing quote with 404', async () => {
    const res = await auth(request(app).post('/api/quote-log/00000000-0000-0000-0000-000000000000/revisions'))
      .send({ rev: 'Rev A', rev_date: '2025-04-05', value: 1 });
    expect(res.status).toBe(404);
  });

  test('deletes the quote and cascades its revisions', async () => {
    const del = await auth(request(app).delete(`/api/quote-log/${quoteId}`));
    expect(del.status).toBe(204);
    const revs = await db('quote_revisions').where('quote_log_id', quoteId);
    expect(revs).toHaveLength(0);
  });
});

describe('quote-approvals', () => {
  let approvalId;

  test('derives margin from sell/cost when not supplied', async () => {
    const res = await auth(request(app).post('/api/quote-approvals'))
      .send({ quote: 'Bridge', client_name: 'Acme', sell: 125000, cost: 102500 });
    expect(res.status).toBe(201);
    expect(res.body.ref).toMatch(/^QA-\d{3}$/);
    expect(Math.abs(res.body.margin - 18)).toBeLessThan(0.1);
    approvalId = res.body.id;
  });

  test('records a decision with decided_by from the JWT', async () => {
    const res = await auth(request(app).patch(`/api/quote-approvals/${approvalId}/decision`))
      .send({ status: 'approved' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
    expect(res.body.decided_by).toBe('GM Test');
  });

  test('guards against deciding twice (409)', async () => {
    const res = await auth(request(app).patch(`/api/quote-approvals/${approvalId}/decision`))
      .send({ status: 'rejected' });
    expect(res.status).toBe(409);
  });

  test('rejects an invalid decision status (400)', async () => {
    const res = await auth(request(app).patch(`/api/quote-approvals/${approvalId}/decision`))
      .send({ status: 'maybe' });
    expect(res.status).toBe(400);
  });
});

describe('appointments', () => {
  test('requires title and start_at', async () => {
    const res = await auth(request(app).post('/api/crm/appointments')).send({ type: 'meeting' });
    expect(res.status).toBe(400);
  });

  test('creates and lists appointments', async () => {
    const create = await auth(request(app).post('/api/crm/appointments'))
      .send({ title: 'Site walk', start_at: '2026-06-01T09:00:00Z', type: 'sitevisit' });
    expect(create.status).toBe(201);
    const list = await auth(request(app).get('/api/crm/appointments'));
    expect(list.status).toBe(200);
    expect(list.body.length).toBeGreaterThanOrEqual(1);
  });
});

describe('contacts', () => {
  test('auto-derives initials from name', async () => {
    const res = await auth(request(app).post('/api/crm/contacts')).send({ name: 'Jane Roe', company: 'Acme' });
    expect(res.status).toBe(201);
    expect(res.body.initials).toBe('JR');
  });
});

describe('prequalifications', () => {
  test('creates with an auto-generated ref', async () => {
    const res = await auth(request(app).post('/api/prequalifications'))
      .send({ authority: 'ADNOC', category: 'Structural' });
    expect(res.status).toBe(201);
    expect(res.body.ref).toMatch(/^PQ-\d{3}$/);
  });

  test('rejects a duplicate ref with 409', async () => {
    await auth(request(app).post('/api/prequalifications')).send({ ref: 'PQ-DUP', authority: 'X' });
    const dup = await auth(request(app).post('/api/prequalifications')).send({ ref: 'PQ-DUP', authority: 'Y' });
    expect(dup.status).toBe(409);
  });
});

describe('competitors + bid outcomes', () => {
  test('roundtrips json columns through SQLite TEXT', async () => {
    const create = await auth(request(app).post('/api/competitors'))
      .send({ name: 'RivalCo', region: 'GCC', strengths: ['price', 'speed'], weaknesses: ['qa'], win_rate: 40 });
    expect(create.status).toBe(201);
    expect(Array.isArray(create.body.strengths)).toBe(true);
    expect(create.body.strengths[0]).toBe('price');

    const get = await auth(request(app).get(`/api/competitors/${create.body.id}`));
    expect(Array.isArray(get.body.weaknesses)).toBe(true);
    expect(get.body.weaknesses[0]).toBe('qa');
  });

  test('records and lists bid outcomes', async () => {
    const create = await auth(request(app).post('/api/competitors/bids'))
      .send({ tender: 'Metro Phase 2', result: 'won', our_price: 980000 });
    expect(create.status).toBe(201);
    const list = await auth(request(app).get('/api/competitors/bids/all'));
    expect(list.status).toBe(200);
    expect(list.body.length).toBeGreaterThanOrEqual(1);
  });
});

describe('auth guard', () => {
  test('rejects requests without a token (401)', async () => {
    const res = await request(app).get('/api/quote-log');
    expect(res.status).toBe(401);
  });
});
