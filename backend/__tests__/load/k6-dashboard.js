/**
 * k6 Load Test — NexaForge ERP API
 * Target: 50 concurrent VUs, P95 < 500ms reads / < 1000ms writes, < 1% errors
 *
 * Run (dev):      k6 run --env BASE_URL=http://localhost:3000 k6-dashboard.js
 * Run (staging):  k6 run --env BASE_URL=https://api.nexaforge.com k6-dashboard.js
 * Run with output: k6 run --out json=results.json k6-dashboard.js
 */

import http  from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ── Custom metrics ─────────────────────────────────────────────
const errorRate   = new Rate('error_rate');
const readTrend   = new Trend('read_duration',  true);
const writeTrend  = new Trend('write_duration', true);

// ── Config ─────────────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '30s', target: 10  },   // ramp up
    { duration: '2m',  target: 50  },   // hold at 50 VUs
    { duration: '30s', target: 0   },   // ramp down
  ],
  thresholds: {
    http_req_duration:              ['p(95)<500'],    // all P95 < 500ms
    'http_req_duration{type:write}':['p(95)<1000'],  // writes P95 < 1s
    error_rate:                     ['rate<0.01'],   // < 1% errors
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// ── Login once per test and share token ────────────────────────
export function setup() {
  const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email:    'gm@nexaforge.com',
    password: 'Password123!',
  }), { headers: { 'Content-Type': 'application/json' } });

  check(res, { 'login 200': r => r.status === 200 });

  const body = JSON.parse(res.body);
  return { token: body.access_token };
}

// ── VU scenario ────────────────────────────────────────────────
export default function (data) {
  const headers = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // ── Read endpoints ──────────────────────────────────────────
  const reads = [
    `${BASE_URL}/api/projects`,
    `${BASE_URL}/api/ncr`,
    `${BASE_URL}/api/wps`,
    `${BASE_URL}/api/machines`,
    `${BASE_URL}/api/dashboard/overview`,
    `${BASE_URL}/api/material-requests`,
  ];

  for (const url of reads) {
    const res = http.get(url, { headers, tags: { type: 'read' } });
    readTrend.add(res.timings.duration);
    errorRate.add(res.status >= 400 && res.status !== 404);
    check(res, {
      [`GET ${url.replace(BASE_URL, '')} < 400`]: r => r.status < 400 || r.status === 404,
    });
  }

  // ── Finance reads (role-gated, 200 expected for GM token) ──
  const financeReads = [
    `${BASE_URL}/api/finance/invoices`,
    `${BASE_URL}/api/finance/cash-flow`,
  ];

  for (const url of financeReads) {
    const res = http.get(url, { headers, tags: { type: 'read' } });
    readTrend.add(res.timings.duration);
    errorRate.add(res.status >= 500);
    check(res, {
      [`GET ${url.replace(BASE_URL, '')} not 500`]: r => r.status !== 500,
    });
  }

  // ── Write: new project (10% of VUs) ────────────────────────
  if (Math.random() < 0.1) {
    const res = http.post(
      `${BASE_URL}/api/projects`,
      JSON.stringify({ project_no: `P-LOAD-${Date.now()}`, name: 'Load test project' }),
      { headers, tags: { type: 'write' } }
    );
    writeTrend.add(res.timings.duration);
    errorRate.add(res.status >= 500);
    check(res, { 'POST /projects not 500': r => r.status !== 500 });
  }

  // ── Write: MRP replenishment check (5% of VUs) ─────────────
  // Uses a known seed project ID; 404 is acceptable in load test
  if (Math.random() < 0.05) {
    const res = http.get(
      `${BASE_URL}/api/mrp/1`,
      { headers, tags: { type: 'read' } }
    );
    readTrend.add(res.timings.duration);
    errorRate.add(res.status >= 500);
    check(res, { 'GET /api/mrp/1 not 500': r => r.status !== 500 });
  }

  sleep(1);
}

// ── Teardown — log summary ─────────────────────────────────────
export function teardown(data) {
  console.log('[k6] load test complete');
}
