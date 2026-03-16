/**
 * Lightweight API test runner using Node fetch + node:test
 * Runs all account/auth/API flows without Playwright subprocess overhead.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'test-users.json');

let fx;
try {
    fx = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf-8'));
} catch {
    console.error('❌ fixtures/test-users.json not found. Run: npx tsx tests/global-setup.ts');
    process.exit(1);
}

const h = (token) => ({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' });
const get  = (path, token) => fetch(`${BASE}${path}`, { headers: h(token) });
const post = (path, body, token) => fetch(`${BASE}${path}`, { method: 'POST', headers: h(token), body: JSON.stringify(body) });
const patch = (path, body, token) => fetch(`${BASE}${path}`, { method: 'PATCH', headers: h(token), body: JSON.stringify(body) });

// ─── AUTH ────────────────────────────────────────────────────────────────────
describe('Auth — POST /api/v1/auth/send-otp', () => {
    test('400 when phone is missing', async () => {
        const r = await post('/api/v1/auth/send-otp', {});
        assert.ok([400, 429].includes(r.status), `got ${r.status}`);
    });
    test('accepts valid phone number format', async () => {
        const r = await post('/api/v1/auth/send-otp', { phone: '+919876543210' });
        assert.ok([200, 429].includes(r.status), `got ${r.status}`);
    });
});

describe('Auth — POST /api/v1/auth/verify-otp', () => {
    test('400 when firebaseIdToken is missing', async () => {
        const r = await post('/api/v1/auth/verify-otp', {});
        assert.equal(r.status, 400);
        const body = await r.json();
        assert.match(body.error, /firebaseIdToken/i);
    });
    test('401 for invalid firebase token', async () => {
        const r = await post('/api/v1/auth/verify-otp', { firebaseIdToken: 'invalid-token-xyz' });
        assert.equal(r.status, 401);
    });
});

describe('Auth — POST /api/v1/auth/register (create accounts)', () => {
    const ts = Date.now();

    test('create TENANT account', async () => {
        const r = await post('/api/v1/auth/register', {
            phone: `+91800${ts}1`,
            name: 'Test Tenant Reg',
            role: 'TENANT',
        });
        // 201 = new user, 409 = already exists (re-run)
        assert.ok([201, 409].includes(r.status), `got ${r.status}`);
        if (r.status === 201) {
            const body = await r.json();
            assert.ok(body.accessToken, 'should return JWT');
            assert.equal(body.user.role, 'TENANT');
        }
    });

    test('create OWNER account', async () => {
        const r = await post('/api/v1/auth/register', {
            phone: `+91800${ts}2`,
            name: 'Test Owner Reg',
            role: 'OWNER',
        });
        assert.ok([201, 409].includes(r.status), `got ${r.status}`);
        if (r.status === 201) {
            const body = await r.json();
            assert.ok(body.accessToken, 'should return JWT');
            assert.equal(body.user.role, 'OWNER');
        }
    });

    test('returns 400 when phone is missing', async () => {
        const r = await post('/api/v1/auth/register', { name: 'No Phone' });
        assert.ok([400, 500].includes(r.status), `got ${r.status}`);
    });
    test('returns 409 for duplicate phone', async () => {
        const r = await post('/api/v1/auth/register', {
            phone: fx.tenant.phone,
            name: 'Duplicate',
        });
        assert.equal(r.status, 409);
    });
});

describe('Auth middleware', () => {
    test('protected route returns 401 without token', async () => {
        const r = await get('/api/v1/tickets');
        assert.equal(r.status, 401);
    });
    test('protected route returns 401 with bad token', async () => {
        const r = await get('/api/v1/tickets', 'bad-token');
        assert.equal(r.status, 401);
    });
    test('public properties route works without token', async () => {
        const r = await get('/api/v1/properties');
        assert.ok([200, 304].includes(r.status), `got ${r.status}`);
    });
});

// ─── SIGN BACK IN (users/me) ─────────────────────────────────────────────────
describe('Sign in — GET /api/v1/users/me (all user types)', () => {
    test('TENANT can sign in and get profile', async () => {
        const r = await get('/api/v1/users/me', fx.tenant.token);
        assert.equal(r.status, 200);
        const body = await r.json();
        assert.equal(body.user.id, fx.tenant.id);
        assert.equal(body.user.role, 'TENANT');
        assert.equal(body.user.phone, fx.tenant.phone);
        assert.ok(Array.isArray(body.bookings));
        assert.ok(Array.isArray(body.tickets));
        assert.ok(Array.isArray(body.payments));
        assert.ok(!body.user.password, 'should not expose password');
    });
    test('OWNER can sign in and get profile with properties', async () => {
        const r = await get('/api/v1/users/me', fx.owner.token);
        assert.equal(r.status, 200);
        const body = await r.json();
        assert.equal(body.user.id, fx.owner.id);
        assert.equal(body.user.role, 'OWNER');
        assert.ok(Array.isArray(body.properties));
    });
    test('ADMIN can sign in and get profile', async () => {
        const r = await get('/api/v1/users/me', fx.admin.token);
        assert.equal(r.status, 200);
        const body = await r.json();
        assert.equal(body.user.id, fx.admin.id);
        assert.equal(body.user.role, 'ADMIN');
    });
    test('TENANT can update profile', async () => {
        const r = await patch('/api/v1/users/me', { name: 'Updated Tenant Name' }, fx.tenant.token);
        assert.equal(r.status, 200);
        const body = await r.json();
        assert.equal(body.name, 'Updated Tenant Name');
    });
    test('TENANT cannot elevate role to ADMIN', async () => {
        const r = await patch('/api/v1/users/me', { role: 'ADMIN' }, fx.tenant.token);
        assert.equal(r.status, 200);
        const body = await r.json();
        assert.equal(body.role, 'TENANT');
    });
});

// ─── PROPERTIES ──────────────────────────────────────────────────────────────
describe('Properties', () => {
    test('GET /api/v1/properties returns list (public)', async () => {
        const r = await get('/api/v1/properties');
        assert.equal(r.status, 200);
        const body = await r.json();
        assert.ok(Array.isArray(body.properties) || body.properties !== undefined, 'has properties array');
    });
    test('GET /api/v1/properties/:id returns test property', async () => {
        const r = await get(`/api/v1/properties/${fx.property.id}`);
        assert.equal(r.status, 200);
        const body = await r.json();
        assert.equal(body.property?.id ?? body.id, fx.property.id);
    });
    test('OWNER can create a property', async () => {
        const r = await post('/api/v1/properties', {
            name: 'New E2E Property',
            location: 'Indiranagar',
            city: 'Bangalore',
            address: '100 Indiranagar, Bangalore',
            price: 9500,
            type: 'COLIVING',
            gender: 'UNISEX',
            amenities: ['WiFi', 'AC'],
            description: 'Test property created in E2E tests',
            highlights: ['Central location'],
            availableFrom: new Date().toISOString(),
            deposit: 19000,
            lockIn: '3 months',
        }, fx.owner.token);
        assert.ok([201, 200, 409].includes(r.status), `got ${r.status}`);
    });
});

// ─── TICKETS ─────────────────────────────────────────────────────────────────
describe('Tickets', () => {
    let ticketId;
    test('GET /api/v1/tickets returns 401 without auth', async () => {
        const r = await get('/api/v1/tickets');
        assert.equal(r.status, 401);
    });
    test('TENANT can list their tickets', async () => {
        const r = await get('/api/v1/tickets', fx.tenant.token);
        assert.ok([200].includes(r.status), `got ${r.status}`);
        const body = await r.json();
        assert.ok(Array.isArray(body.tickets ?? body), 'returns tickets array');
    });
    test('TENANT can create a ticket', async () => {
        const r = await post('/api/v1/tickets', {
            title: 'E2E Test Ticket',
            description: 'This is a test ticket created by the E2E test suite',
            category: 'MAINTENANCE',
            priority: 'MEDIUM',
            propertyId: fx.property.id,
        }, fx.tenant.token);
        assert.ok([200, 201].includes(r.status), `got ${r.status}`);
        if (r.status === 201 || r.status === 200) {
            const body = await r.json();
            ticketId = body.ticket?.id ?? body.id;
        }
    });
});

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
describe('Payments', () => {
    test('GET /api/v1/payments requires auth', async () => {
        const r = await get('/api/v1/payments');
        assert.equal(r.status, 401);
    });
    test('TENANT can list payments', async () => {
        const r = await get('/api/v1/payments', fx.tenant.token);
        assert.ok([200].includes(r.status), `got ${r.status}`);
        const body = await r.json();
        assert.ok(Array.isArray(body.payments ?? body), 'returns payments array');
    });
});

// ─── ADMIN ───────────────────────────────────────────────────────────────────
describe('Admin', () => {
    test('GET /api/v1/admin/stats returns stats', async () => {
        const r = await get('/api/v1/admin/stats', fx.admin.token);
        assert.ok([200].includes(r.status), `got ${r.status}`);
    });
    test('GET /api/v1/admin/users returns user list', async () => {
        const r = await get('/api/v1/admin/users', fx.admin.token);
        assert.ok([200].includes(r.status), `got ${r.status}`);
        const body = await r.json();
        assert.ok(Array.isArray(body.users), 'returns users array');
        assert.ok(body.users.length > 0, 'has at least one user');
    });
    test('ADMIN can see all 3 test users', async () => {
        const r = await get('/api/v1/admin/users', fx.admin.token);
        const body = await r.json();
        const phones = body.users.map(u => u.phone);
        assert.ok(phones.includes(fx.tenant.phone), 'tenant exists');
        assert.ok(phones.includes(fx.owner.phone), 'owner exists');
        assert.ok(phones.includes(fx.admin.phone), 'admin exists');
    });
});

// ─── AI RECOMMENDATIONS ──────────────────────────────────────────────────────
describe('AI Recommendations', () => {
    test('GET /api/v1/ai/recommendations returns list (with auth)', async () => {
        const r = await get('/api/v1/ai/recommendations?limit=3', fx.tenant.token);
        assert.ok([200].includes(r.status), `got ${r.status}`);
        const body = await r.json();
        assert.ok(Array.isArray(body), 'returns array');
    });
    test('GET /api/v1/ai/recommendations works without auth (public route)', async () => {
        const r = await get('/api/v1/ai/recommendations?limit=3');
        assert.equal(r.status, 200);
    });
});
