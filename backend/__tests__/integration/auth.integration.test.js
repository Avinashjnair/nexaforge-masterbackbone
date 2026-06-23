'use strict';

/**
 * Auth integration tests — POST /auth/login, POST /auth/refresh, DELETE /auth/logout
 * Uses supertest against the Express app with mocked DB and Redis.
 * Refresh token is now an HttpOnly cookie (nf_rt), not a response body field.
 */

process.env.JWT_SECRET          = 'test-secret-nexaforge-s08-int';
process.env.JWT_ACCESS_EXPIRES  = '15m';
process.env.JWT_REFRESH_EXPIRES = '7d';
process.env.NODE_ENV            = 'test';

const bcrypt   = require('bcrypt');
const request  = require('supertest');
const jwt      = require('jsonwebtoken');

// ── Mock DB ───────────────────────────────────────────────────
const mockUser = {
  id:            'user-001',
  email:         'gm@nexaforge.com',
  password_hash: bcrypt.hashSync('Password123!', 8),
  role:          'gm',
  department:    'gm',
  full_name:     'General Manager',
  is_active:     true,
};

const mockDbChain = {
  where:   jest.fn().mockReturnThis(),
  first:   jest.fn().mockResolvedValue(mockUser),
  update:  jest.fn().mockResolvedValue(1),
};

jest.mock('../../src/db/knex', () => {
  const knex = jest.fn(() => mockDbChain);
  knex.fn = { now: jest.fn(() => new Date()) };
  return knex;
});

// ── Mock Redis ────────────────────────────────────────────────
const mockRedis = {
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn(),
  del: jest.fn().mockResolvedValue(1),
};

jest.mock('../../src/db/redis', () => ({
  client: mockRedis,
  connect: jest.fn().mockResolvedValue(undefined),
}));

const app = require('../../src/app');

// ── Helpers ───────────────────────────────────────────────────
function makeRefreshToken(userId = 'user-001') {
  const { v4: uuidv4 } = require('uuid');
  const jti = uuidv4();
  const token = jwt.sign(
    { sub: userId, jti },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  return { token, jti };
}

function extractSetCookie(res, name) {
  const cookies = res.headers['set-cookie'] || [];
  const match = cookies.find(c => c.startsWith(`${name}=`));
  if (!match) return null;
  return match.split(';')[0].slice(name.length + 1);
}

// ── Tests ──────────────────────────────────────────────────────
describe('POST /auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 with valid credentials — sets HttpOnly nf_rt cookie', async () => {
    mockDbChain.first.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'gm@nexaforge.com', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('access_token');
    expect(res.body).not.toHaveProperty('refresh_token');
    expect(res.body.user.email).toBe('gm@nexaforge.com');
    expect(res.body.user.role).toBe('gm');

    // Refresh token must be in a cookie, not the body
    const cookieHeader = res.headers['set-cookie'] || [];
    const rtCookie = cookieHeader.find(c => c.startsWith('nf_rt='));
    expect(rtCookie).toBeDefined();
    expect(rtCookie).toMatch(/HttpOnly/i);
    expect(rtCookie).toMatch(/SameSite=Strict/i);
    expect(rtCookie).toMatch(/Path=\/auth/i);

    // Access token must be a valid JWT with correct claims
    const payload = jwt.verify(res.body.access_token, process.env.JWT_SECRET);
    expect(payload.role).toBe('gm');
    expect(payload.department).toBe('gm');
  });

  test('400 when email is missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ password: 'Password123!' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test('400 when password is missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'gm@nexaforge.com' });
    expect(res.status).toBe(400);
  });

  test('401 when user not found', async () => {
    mockDbChain.first.mockResolvedValue(null);
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@nexaforge.com', password: 'Password123!' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid credentials/i);
  });

  test('401 when password is wrong', async () => {
    mockDbChain.first.mockResolvedValue(mockUser);
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'gm@nexaforge.com', password: 'WrongPassword!' });
    expect(res.status).toBe(401);
  });

  test('401 when user is inactive', async () => {
    mockDbChain.first.mockResolvedValue({ ...mockUser, is_active: false });
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'gm@nexaforge.com', password: 'Password123!' });
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/refresh', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 with valid nf_rt cookie — returns new access token and rotates cookie', async () => {
    const { token, jti } = makeRefreshToken();
    mockRedis.get.mockResolvedValue('user-001');
    mockDbChain.first.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', `nf_rt=${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('access_token');
    expect(res.body).not.toHaveProperty('refresh_token');

    // Rotated cookie must be present and different from the original
    const newCookieValue = extractSetCookie(res, 'nf_rt');
    expect(newCookieValue).toBeTruthy();
    expect(newCookieValue).not.toBe(token);

    // Old JTI must have been revoked
    expect(mockRedis.del).toHaveBeenCalledWith(`refresh:${jti}`);
  });

  test('401 when nf_rt cookie is absent', async () => {
    const res = await request(app).post('/auth/refresh');
    expect(res.status).toBe(401);
  });

  test('401 when refresh token is revoked (not in Redis)', async () => {
    const { token } = makeRefreshToken();
    mockRedis.get.mockResolvedValue(null);

    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', `nf_rt=${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/revoked/i);
  });

  test('401 when refresh token is malformed', async () => {
    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', 'nf_rt=not.a.jwt');
    expect(res.status).toBe(401);
  });
});

describe('DELETE /auth/logout', () => {
  beforeEach(() => jest.clearAllMocks());

  test('204 with valid nf_rt cookie — revokes from Redis and clears cookie', async () => {
    const { token, jti } = makeRefreshToken();

    const res = await request(app)
      .delete('/auth/logout')
      .set('Cookie', `nf_rt=${token}`);

    expect(res.status).toBe(204);
    expect(mockRedis.del).toHaveBeenCalledWith(`refresh:${jti}`);

    // Cookie must be cleared (expires in the past or max-age=0)
    const cookies = res.headers['set-cookie'] || [];
    const clearedCookie = cookies.find(c => c.startsWith('nf_rt='));
    expect(clearedCookie).toBeDefined();
    expect(clearedCookie).toMatch(/nf_rt=(?:;|$)/);
  });

  test('204 even without nf_rt cookie (graceful)', async () => {
    const res = await request(app).delete('/auth/logout');
    expect(res.status).toBe(204);
  });

  test('204 when token is already invalid (no error thrown)', async () => {
    const res = await request(app)
      .delete('/auth/logout')
      .set('Cookie', 'nf_rt=invalid.token.here');
    expect(res.status).toBe(204);
  });
});

describe('GET /health', () => {
  test('200 without authentication', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
});
