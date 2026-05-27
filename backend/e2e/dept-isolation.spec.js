/**
 * UAT Comments 1 — Automated Cross-Role Department Isolation Tests
 *
 * Matrix validates 4 security axes:
 *   1. DOM Visibility     — restricted nav links do NOT appear in sidebar
 *   2. Forced Navigation  — programmatic route bypass shows 403 page
 *   3. API Boundary       — backend rejects cross-dept API calls with 403
 *   4. State Purge        — logout clears all cached dept data
 *
 * Prerequisites:
 *   - Frontend running at http://localhost:5500
 *   - Backend running at http://localhost:3000
 *   - Test users seeded: qc_user@nexaforge.com (dept: qc) and finance_user@nexaforge.com (dept: finance)
 *
 * Run:  npx playwright test e2e/dept-isolation.spec.js
 */

const { test, expect } = require('@playwright/test');

const API_BASE = 'http://localhost:3000';
const FRONTEND = 'http://localhost:5500';

// Test users — these must exist in the seeded database
const QC_USER      = { email: 'qc@nexaforge.com',      password: 'Test1234!' };
const FINANCE_USER = { email: 'finance@nexaforge.com',  password: 'Test1234!' };

/**
 * Helper: login via API and return the access token + user object
 */
async function apiLogin(request, creds) {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { email: creds.email, password: creds.password },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  return { token: body.access_token, user: body.user };
}

/**
 * Helper: login via the frontend UI (fills email/password, clicks Sign In)
 */
async function uiLogin(page, creds) {
  await page.goto(FRONTEND);
  await page.waitForSelector('#loginEmail', { timeout: 5000 });
  await page.fill('#loginEmail', creds.email);
  await page.fill('#loginPassword', creds.password);
  await page.click('#loginBtn');
  // Wait for sidebar to appear (login complete)
  await page.waitForSelector('.sidebar-nav', { timeout: 10000 });
}

// ──────────────────────────────────────────────────────────────
// Test 1: DOM Sub-Tree Visibility
// ──────────────────────────────────────────────────────────────
test.describe('DOM Visibility — sidebar isolation', () => {
  test('QC user sidebar does NOT contain Finance nav link', async ({ page }) => {
    await uiLogin(page, QC_USER);

    // The sidebar should be visible
    const sidebar = page.locator('.sidebar-nav');
    await expect(sidebar).toBeVisible();

    // Assert Finance link is NOT in the DOM
    const financeLink = sidebar.locator('a[data-page="finance"]');
    await expect(financeLink).toHaveCount(0);

    // Assert QC link IS in the DOM
    const qcLink = sidebar.locator('a[data-page="quality"]');
    await expect(qcLink).toHaveCount(1);
  });

  test('Finance user sidebar does NOT contain Production nav link', async ({ page }) => {
    await uiLogin(page, FINANCE_USER);

    const sidebar = page.locator('.sidebar-nav');
    await expect(sidebar).toBeVisible();

    // Assert Production link is NOT in the DOM
    const prodLink = sidebar.locator('a[data-page="production"]');
    await expect(prodLink).toHaveCount(0);

    // Assert Finance link IS in the DOM
    const finLink = sidebar.locator('a[data-page="finance"]');
    await expect(finLink).toHaveCount(1);
  });
});

// ──────────────────────────────────────────────────────────────
// Test 2: Forced Navigation Resilience
// ──────────────────────────────────────────────────────────────
test.describe('Forced Navigation — route guard enforcement', () => {
  test('QC user forced to /finance sees 403 page', async ({ page }) => {
    await uiLogin(page, QC_USER);

    // Programmatically call navigate('finance') via the browser console
    await page.evaluate(() => {
      // @ts-ignore — navigate is a global function in the SPA
      navigate('finance');
    });

    // Wait for the 403 page content
    await expect(page.locator('#pageContent')).toContainText('Access restricted');
    await expect(page.locator('#pageContent')).toContainText('403');
  });
});

// ──────────────────────────────────────────────────────────────
// Test 3: API Boundary Enforcement (BOLA prevention)
// ──────────────────────────────────────────────────────────────
test.describe('API Boundary — backend ABAC enforcement', () => {
  test('QC token rejected by /api/finance/invoices → 403', async ({ request }) => {
    const { token } = await apiLogin(request, QC_USER);

    const res = await request.get(`${API_BASE}/api/finance/invoices`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('department');
  });

  test('QC token rejected by /api/dashboard/finance → 403', async ({ request }) => {
    const { token } = await apiLogin(request, QC_USER);

    const res = await request.get(`${API_BASE}/api/dashboard/finance`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(403);
  });

  test('Finance token rejected by /api/dashboard/production → 403', async ({ request }) => {
    const { token } = await apiLogin(request, FINANCE_USER);

    const res = await request.get(`${API_BASE}/api/dashboard/production`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(403);
  });
});

// ──────────────────────────────────────────────────────────────
// Test 4: State Purging & Cache Integrity
// ──────────────────────────────────────────────────────────────
test.describe('State Purge — no cross-session data leakage', () => {
  test('After logout, AppState is fully reset', async ({ page }) => {
    await uiLogin(page, QC_USER);

    // Verify AppState has QC data
    const deptBefore = await page.evaluate(() => AppState.department);
    expect(deptBefore).toBe('qc');

    // Trigger logout
    await page.evaluate(() => handleLogout());

    // Wait for login overlay to reappear
    await page.waitForSelector('#loginOverlay', { timeout: 5000 });

    // Verify AppState is fully purged
    const state = await page.evaluate(() => ({
      department:  AppState.department,
      permissions: AppState.permissions,
      currentUser: AppState.currentUser,
      projects:    AppState.projects,
    }));

    expect(state.department).toBeNull();
    expect(state.permissions).toBeNull();
    expect(state.currentUser).toBeNull();
    expect(state.projects).toEqual([]);
  });
});
