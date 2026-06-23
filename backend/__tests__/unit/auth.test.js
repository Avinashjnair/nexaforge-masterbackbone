'use strict';

process.env.JWT_SECRET = 'test-secret-nexaforge-s08';
process.env.JWT_EXPIRY  = '15m';

const jwt = require('jsonwebtoken');
const { authenticateJWT, requireRole, ROLE_HIERARCHY } = require('../../src/middleware/auth');

// ── Helpers ────────────────────────────────────────────────────
function makeToken(payload, secret = process.env.JWT_SECRET, opts = {}) {
  return jwt.sign(payload, secret, { expiresIn: '1h', ...opts });
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

// ── ROLE_HIERARCHY ─────────────────────────────────────────────
describe('ROLE_HIERARCHY', () => {
  test('contains four levels in ascending order', () => {
    expect(ROLE_HIERARCHY).toEqual(['user', 'senior', 'manager', 'gm']);
  });

  test('gm has higher index than user', () => {
    expect(ROLE_HIERARCHY.indexOf('gm')).toBeGreaterThan(ROLE_HIERARCHY.indexOf('user'));
  });
});

// ── authenticateJWT ────────────────────────────────────────────
describe('authenticateJWT', () => {
  test('valid Bearer token — calls next() and sets req.user', () => {
    const token = makeToken({ id: 'u1', role: 'manager' });
    const req  = { headers: { authorization: `Bearer ${token}` } };
    const res  = mockRes();
    const next = jest.fn();

    authenticateJWT(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.id).toBe('u1');
    expect(req.user.role).toBe('manager');
  });

  test('missing Authorization header → 401', () => {
    const req  = { headers: {} };
    const res  = mockRes();
    authenticateJWT(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('non-Bearer scheme → 401', () => {
    const req  = { headers: { authorization: 'Basic abc' } };
    const res  = mockRes();
    authenticateJWT(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('expired token → 401', () => {
    const token = makeToken({ id: 'u2', role: 'user' }, process.env.JWT_SECRET, { expiresIn: '-1s' });
    const req  = { headers: { authorization: `Bearer ${token}` } };
    const res  = mockRes();
    authenticateJWT(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Token expired' }));
  });

  test('wrong secret → 401 invalid token', () => {
    const token = makeToken({ id: 'u3', role: 'user' }, 'wrong-secret');
    const req  = { headers: { authorization: `Bearer ${token}` } };
    const res  = mockRes();
    authenticateJWT(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid token' }));
  });
});

// ── requireRole ────────────────────────────────────────────────
describe('requireRole', () => {
  function reqWithRole(role) {
    return { user: { role } };
  }

  test('gm passes a "gm" gate', () => {
    const next = jest.fn();
    requireRole('gm')(reqWithRole('gm'), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  test('gm passes a "user" gate', () => {
    const next = jest.fn();
    requireRole('user')(reqWithRole('gm'), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  test('user is blocked by "manager" gate → 403', () => {
    const res  = mockRes();
    requireRole('manager')(reqWithRole('user'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('senior passes "senior" gate', () => {
    const next = jest.fn();
    requireRole('senior')(reqWithRole('senior'), mockRes(), next);
    expect(next).toHaveBeenCalled();
  });

  test('senior is blocked by "manager" gate → 403', () => {
    const res = mockRes();
    requireRole('manager')(reqWithRole('senior'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('unknown role is blocked by any gate → 403', () => {
    const res = mockRes();
    requireRole('user')(reqWithRole('unknown'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('missing req.user is blocked → 403', () => {
    const res = mockRes();
    requireRole('user')({ user: null }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
