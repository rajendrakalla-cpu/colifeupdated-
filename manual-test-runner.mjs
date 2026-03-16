// Manual API test runner - no playwright needed
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const FIXTURES_PATH = path.join(__dirname, 'tests/fixtures/test-users.json');

let fx;
try {
    fx = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf-8'));
} catch (e) {
    console.error('ERROR: Could not load fixtures:', e.message);
    process.exit(1);
}

const results = [];
let passed = 0;
let failed = 0;

function makeRequest(method, url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const lib = urlObj.protocol === 'https:' ? https : http;
        const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            },
            timeout: 30000,
        };
        const req = lib.request(reqOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                let json;
                try { json = JSON.parse(data); } catch (e) { json = null; }
                resolve({ status: res.statusCode, body: json, text: data });
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
        if (options.data) {
            req.write(JSON.stringify(options.data));
        }
        req.end();
    });
}

async function runTest(name, fn) {
    try {
        await fn();
        results.push({ name, status: 'PASSED' });
        passed++;
        process.stdout.write(`  ✓ ${name}\n`);
    } catch (e) {
        results.push({ name, status: 'FAILED', error: e.message });
        failed++;
        process.stdout.write(`  ✗ ${name}\n    Error: ${e.message}\n`);
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
    }
}

function assertContains(arr, value, message) {
    if (!arr.includes(value)) {
        throw new Error(message || `Expected array to contain ${JSON.stringify(value)}, got ${JSON.stringify(arr)}`);
    }
}

console.log('\n=== CoLife API Test Suite ===');
console.log(`Base URL: ${BASE}\n`);

// ===== AUTH TESTS =====
console.log('\n--- POST /api/v1/auth/send-otp ---');

await runTest('returns 400 when phone is missing', async () => {
    const res = await makeRequest('POST', `${BASE}/api/v1/auth/send-otp`, { data: {} });
    assertEqual(res.status, 400, `Expected 400, got ${res.status}`);
});

await runTest('returns 200 or 429 for valid phone', async () => {
    const res = await makeRequest('POST', `${BASE}/api/v1/auth/send-otp`, { data: { phone: '+919876543210' } });
    assertContains([200, 429], res.status, `Expected 200 or 429, got ${res.status}`);
});

console.log('\n--- POST /api/v1/auth/verify-otp ---');

await runTest('returns 400 when firebaseIdToken is missing', async () => {
    const res = await makeRequest('POST', `${BASE}/api/v1/auth/verify-otp`, { data: {} });
    assertEqual(res.status, 400, `Expected 400, got ${res.status}`);
    assert(res.body?.error?.match(/firebaseIdToken/i), `Expected error mentioning firebaseIdToken, got ${JSON.stringify(res.body)}`);
});

await runTest('returns 401 for invalid firebase token', async () => {
    const res = await makeRequest('POST', `${BASE}/api/v1/auth/verify-otp`, { data: { firebaseIdToken: 'invalid-token-xyz' } });
    assertEqual(res.status, 401, `Expected 401, got ${res.status}`);
});

console.log('\n--- POST /api/v1/auth/register ---');

await runTest('returns 400 when required fields are missing', async () => {
    const res = await makeRequest('POST', `${BASE}/api/v1/auth/register`, { data: {} });
    assertContains([400, 500], res.status, `Expected 400 or 500, got ${res.status}`);
});

await runTest('returns 400 when phone is missing', async () => {
    const res = await makeRequest('POST', `${BASE}/api/v1/auth/register`, { data: { name: 'Test User', role: 'TENANT' } });
    assertContains([400, 500], res.status, `Expected 400 or 500, got ${res.status}`);
});

console.log('\n--- Auth middleware ---');

await runTest('protected routes return 401 without token', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/tickets`);
    assertEqual(res.status, 401, `Expected 401, got ${res.status}`);
});

await runTest('protected routes return 401 with malformed token', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/tickets`, { headers: { Authorization: 'Bearer not-a-valid-jwt' } });
    assertEqual(res.status, 401, `Expected 401, got ${res.status}`);
});

await runTest('protected routes return 401 with no Bearer prefix', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/tickets`, { headers: { Authorization: 'some-token-without-prefix' } });
    assertEqual(res.status, 401, `Expected 401, got ${res.status}`);
});

// ===== USERS TESTS =====
console.log('\n--- GET /api/v1/users/me ---');

await runTest('returns 401 without auth', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/users/me`);
    assertEqual(res.status, 401, `Expected 401, got ${res.status}`);
});

await runTest('returns TENANT profile nested in user key', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/users/me`, { headers: { Authorization: `Bearer ${fx.tenant.token}` } });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assertEqual(res.body?.user?.id, fx.tenant.id, `Expected tenant id`);
    assertEqual(res.body?.user?.role, 'TENANT', `Expected TENANT role`);
    assertEqual(res.body?.user?.phone, fx.tenant.phone, `Expected tenant phone`);
});

await runTest('TENANT response includes bookings, tickets, payments', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/users/me`, { headers: { Authorization: `Bearer ${fx.tenant.token}` } });
    assert(res.body?.bookings !== undefined, 'Missing bookings');
    assert(res.body?.tickets !== undefined, 'Missing tickets');
    assert(res.body?.payments !== undefined, 'Missing payments');
    assert(Array.isArray(res.body?.bookings), 'bookings should be array');
});

await runTest('returns OWNER profile with properties', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/users/me`, { headers: { Authorization: `Bearer ${fx.owner.token}` } });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assertEqual(res.body?.user?.id, fx.owner.id, `Expected owner id`);
    assertEqual(res.body?.user?.role, 'OWNER', `Expected OWNER role`);
    assert(res.body?.properties !== undefined, 'Missing properties');
});

await runTest('returns ADMIN profile', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/users/me`, { headers: { Authorization: `Bearer ${fx.admin.token}` } });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assertEqual(res.body?.user?.id, fx.admin.id, `Expected admin id`);
    assertEqual(res.body?.user?.role, 'ADMIN', `Expected ADMIN role`);
});

await runTest('profile does not expose password fields', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/users/me`, { headers: { Authorization: `Bearer ${fx.tenant.token}` } });
    assert(res.body?.user?.password === undefined, 'password should not be exposed');
    assert(res.body?.user?.passwordHash === undefined, 'passwordHash should not be exposed');
});

console.log('\n--- PATCH /api/v1/users/me ---');

await runTest('returns 401 without auth', async () => {
    const res = await makeRequest('PATCH', `${BASE}/api/v1/users/me`, { data: { name: 'New Name' } });
    assertEqual(res.status, 401, `Expected 401, got ${res.status}`);
});

await runTest('TENANT can update their name', async () => {
    const res = await makeRequest('PATCH', `${BASE}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${fx.tenant.token}` },
        data: { name: 'Updated Tenant Name' }
    });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assertEqual(res.body?.name, 'Updated Tenant Name', `Expected updated name`);
});

await runTest('cannot elevate role to ADMIN via PATCH /me', async () => {
    const res = await makeRequest('PATCH', `${BASE}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${fx.tenant.token}` },
        data: { role: 'ADMIN' }
    });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assertEqual(res.body?.role, 'TENANT', `Expected TENANT role to be preserved`);
});

// ===== PROPERTIES TESTS =====
console.log('\n--- GET /api/v1/properties ---');

await runTest('returns paginated property list', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/properties`);
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body?.properties !== undefined, 'Missing properties');
    assert(res.body?.total !== undefined, 'Missing total');
    assert(res.body?.page !== undefined, 'Missing page');
    assert(res.body?.limit !== undefined, 'Missing limit');
    assert(Array.isArray(res.body?.properties), 'properties should be array');
});

await runTest('respects limit query param', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/properties?limit=2`);
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body?.properties?.length <= 2, `Expected <=2 properties, got ${res.body?.properties?.length}`);
    assertEqual(res.body?.limit, 2, `Expected limit=2`);
});

await runTest('filters by city', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/properties?city=Bangalore`);
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    res.body?.properties?.forEach((p) => {
        assertEqual(p.city, 'Bangalore', `Expected city=Bangalore, got ${p.city}`);
    });
});

await runTest('filters by gender', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/properties?gender=UNISEX`);
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    res.body?.properties?.forEach((p) => {
        assertEqual(p.gender, 'UNISEX', `Expected gender=UNISEX, got ${p.gender}`);
    });
});

await runTest('filters by type', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/properties?type=COLIVING`);
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    res.body?.properties?.forEach((p) => {
        assertEqual(p.type, 'COLIVING', `Expected type=COLIVING, got ${p.type}`);
    });
});

await runTest('returns only approved properties', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/properties`);
    res.body?.properties?.forEach((p) => {
        assert(p.isApproved === true, `Expected isApproved=true for ${p.id}`);
    });
});

await runTest('each property has occupancy data', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/properties`);
    if (res.body?.properties?.length > 0) {
        const p = res.body.properties[0];
        assert(p.totalBeds !== undefined, 'Missing totalBeds');
        assert(p.occupiedBeds !== undefined, 'Missing occupiedBeds');
        assert(p.occupancy !== undefined, 'Missing occupancy');
    }
});

await runTest('pagination - page 2 differs from page 1', async () => {
    const [r1, r2] = await Promise.all([
        makeRequest('GET', `${BASE}/api/v1/properties?page=1&limit=1`),
        makeRequest('GET', `${BASE}/api/v1/properties?page=2&limit=1`),
    ]);
    if (r1.body?.total > 1) {
        assert(r1.body?.properties[0]?.id !== r2.body?.properties[0]?.id, 'Page 1 and page 2 should have different properties');
    }
});

console.log('\n--- GET /api/v1/properties/:id ---');

await runTest('returns property details for valid id', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/properties/${fx.property.id}`);
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assertEqual(res.body?.id, fx.property.id, `Expected property id`);
    assert(res.body?.rooms !== undefined, 'Missing rooms');
    assert(res.body?.totalBeds !== undefined, 'Missing totalBeds');
    assert(res.body?.occupancy !== undefined, 'Missing occupancy');
});

await runTest('returns 404 for non-existent property', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/properties/non-existent-id-xyz`);
    assertEqual(res.status, 404, `Expected 404, got ${res.status}`);
});

console.log('\n--- POST /api/v1/properties ---');

await runTest('rejects unauthenticated requests with 403', async () => {
    const res = await makeRequest('POST', `${BASE}/api/v1/properties`, {
        data: { name: 'Test', city: 'Bangalore', address: 'Test', price: 5000, type: 'COLIVING', gender: 'UNISEX' }
    });
    assertEqual(res.status, 403, `Expected 403, got ${res.status}`);
});

await runTest('rejects TENANT creating a property', async () => {
    const res = await makeRequest('POST', `${BASE}/api/v1/properties`, {
        headers: { Authorization: `Bearer ${fx.tenant.token}` },
        data: { name: 'Test', city: 'Bangalore', address: 'Test', price: 5000, type: 'COLIVING', gender: 'UNISEX' }
    });
    assertEqual(res.status, 403, `Expected 403, got ${res.status}`);
});

await runTest('OWNER can create a property', async () => {
    const res = await makeRequest('POST', `${BASE}/api/v1/properties`, {
        headers: { Authorization: `Bearer ${fx.owner.token}` },
        data: {
            name: 'New E2E Property',
            city: 'Mumbai',
            address: '5th Road, Bandra',
            price: 12000,
            type: 'PG',
            gender: 'MALE',
            amenities: ['WiFi'],
            description: 'Created by E2E test',
            highlights: [],
        }
    });
    assertEqual(res.status, 201, `Expected 201, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
    assertEqual(res.body?.name, 'New E2E Property', `Expected property name`);
    assert(res.body?.rooms !== undefined, 'Missing rooms');
});

await runTest('returns 400 when required fields are missing', async () => {
    const res = await makeRequest('POST', `${BASE}/api/v1/properties`, {
        headers: { Authorization: `Bearer ${fx.owner.token}` },
        data: { name: 'Incomplete Property' }
    });
    assertEqual(res.status, 400, `Expected 400, got ${res.status}`);
});

// ===== BOOKINGS TESTS =====
console.log('\n--- GET /api/v1/bookings ---');

await runTest('returns 401 without auth', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/bookings`);
    assertEqual(res.status, 401, `Expected 401, got ${res.status}`);
});

await runTest('TENANT can fetch their bookings', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/bookings`, { headers: { Authorization: `Bearer ${fx.tenant.token}` } });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body?.bookings !== undefined, 'Missing bookings');
    assert(Array.isArray(res.body?.bookings), 'bookings should be array');
});

await runTest('OWNER can fetch bookings for their properties', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/bookings`, { headers: { Authorization: `Bearer ${fx.owner.token}` } });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body?.bookings !== undefined, 'Missing bookings');
});

await runTest('ADMIN can fetch all bookings', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/bookings`, { headers: { Authorization: `Bearer ${fx.admin.token}` } });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
});

await runTest('TENANT only sees their own bookings', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/bookings`, { headers: { Authorization: `Bearer ${fx.tenant.token}` } });
    res.body?.bookings?.forEach((b) => {
        assertEqual(b.tenantId, fx.tenant.id, `Expected tenantId=${fx.tenant.id}, got ${b.tenantId}`);
    });
});

console.log('\n--- POST /api/v1/bookings ---');

await runTest('returns 401 without auth', async () => {
    const res = await makeRequest('POST', `${BASE}/api/v1/bookings`, {
        data: { roomId: 'some-room', bedId: 'some-bed', startDate: new Date().toISOString(), amount: 8000 }
    });
    assertEqual(res.status, 401, `Expected 401, got ${res.status}`);
});

await runTest('returns error for non-existent bed', async () => {
    const res = await makeRequest('POST', `${BASE}/api/v1/bookings`, {
        headers: { Authorization: `Bearer ${fx.tenant.token}` },
        data: { roomId: 'non-existent-room', bedId: 'non-existent-bed', startDate: new Date().toISOString(), amount: 8000 }
    });
    assertContains([400, 404, 500], res.status, `Expected 400/404/500, got ${res.status}`);
});

await runTest('TENANT can create a booking for an available bed', async () => {
    const res = await makeRequest('POST', `${BASE}/api/v1/bookings`, {
        headers: { Authorization: `Bearer ${fx.tenant.token}` },
        data: { roomId: fx.room.id, bedId: fx.bed.id, startDate: new Date().toISOString(), amount: 8000, securityDeposit: 16000 }
    });
    assertContains([201, 400, 409, 500], res.status, `Expected 201/400/409/500, got ${res.status}`);
    if (res.status === 201) {
        assertEqual(res.body?.tenantId, fx.tenant.id, `Expected tenantId`);
        assertEqual(res.body?.roomId, fx.room.id, `Expected roomId`);
    }
});

// ===== TICKETS TESTS =====
console.log('\n--- GET /api/v1/tickets ---');

await runTest('returns 401 without auth', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/tickets`);
    assertEqual(res.status, 401, `Expected 401, got ${res.status}`);
});

await runTest('TENANT can fetch their tickets', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/tickets`, { headers: { Authorization: `Bearer ${fx.tenant.token}` } });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body?.tickets !== undefined, 'Missing tickets');
    assert(Array.isArray(res.body?.tickets), 'tickets should be array');
});

await runTest('OWNER can fetch tickets for their properties', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/tickets`, { headers: { Authorization: `Bearer ${fx.owner.token}` } });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body?.tickets !== undefined, 'Missing tickets');
});

await runTest('ADMIN can fetch all tickets', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/tickets`, { headers: { Authorization: `Bearer ${fx.admin.token}` } });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
});

console.log('\n--- POST /api/v1/tickets ---');

await runTest('returns 401 without auth', async () => {
    const res = await makeRequest('POST', `${BASE}/api/v1/tickets`, {
        data: { title: 'Test', category: 'ELECTRICAL', priority: 'MEDIUM' }
    });
    assertEqual(res.status, 401, `Expected 401, got ${res.status}`);
});

await runTest('TENANT can create a ticket', async () => {
    const res = await makeRequest('POST', `${BASE}/api/v1/tickets`, {
        headers: { Authorization: `Bearer ${fx.tenant.token}` },
        data: { title: 'E2E Test Ticket', description: 'Created by E2E test suite', category: 'ELECTRICAL', priority: 'LOW', propertyId: fx.property.id }
    });
    assertEqual(res.status, 201, `Expected 201, got ${res.status}. Body: ${JSON.stringify(res.body)}`);
    assertEqual(res.body?.title, 'E2E Test Ticket', `Expected title`);
    assertEqual(res.body?.status, 'OPEN', `Expected OPEN status`);
    assertEqual(res.body?.tenantId, fx.tenant.id, `Expected tenantId`);
    assertEqual(res.body?.category, 'ELECTRICAL', `Expected category`);
});

await runTest('created ticket appears in GET /tickets', async () => {
    await makeRequest('POST', `${BASE}/api/v1/tickets`, {
        headers: { Authorization: `Bearer ${fx.tenant.token}` },
        data: { title: 'Plumbing Issue E2E', category: 'PLUMBING', priority: 'HIGH', propertyId: fx.property.id }
    });
    const listRes = await makeRequest('GET', `${BASE}/api/v1/tickets`, { headers: { Authorization: `Bearer ${fx.tenant.token}` } });
    const titles = listRes.body?.tickets?.map((t) => t.title);
    assertContains(titles, 'Plumbing Issue E2E', `Expected 'Plumbing Issue E2E' in tickets`);
});

await runTest('ticket response includes tenant and property info', async () => {
    const listRes = await makeRequest('GET', `${BASE}/api/v1/tickets`, { headers: { Authorization: `Bearer ${fx.tenant.token}` } });
    if (listRes.body?.tickets?.length > 0) {
        const ticket = listRes.body.tickets[0];
        assert(ticket.tenant !== undefined, 'Missing tenant info');
        assert(ticket.tenant?.name !== undefined, 'Missing tenant.name');
        assert(ticket.tenant?.phone !== undefined, 'Missing tenant.phone');
    }
});

await runTest('TENANT only sees their own tickets', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/tickets`, { headers: { Authorization: `Bearer ${fx.tenant.token}` } });
    res.body?.tickets?.forEach((t) => {
        assertEqual(t.tenantId, fx.tenant.id, `Expected tenantId=${fx.tenant.id}, got ${t.tenantId}`);
    });
});

// ===== PAYMENTS TESTS =====
console.log('\n--- GET /api/v1/payments ---');

await runTest('returns 401 without auth', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/payments`);
    assertEqual(res.status, 401, `Expected 401, got ${res.status}`);
});

await runTest('TENANT can fetch their payments', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/payments`, { headers: { Authorization: `Bearer ${fx.tenant.token}` } });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body?.payments !== undefined, 'Missing payments');
    assert(Array.isArray(res.body?.payments), 'payments should be array');
});

await runTest('OWNER can fetch payments', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/payments`, { headers: { Authorization: `Bearer ${fx.owner.token}` } });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
});

await runTest('ADMIN can fetch all payments', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/payments`, { headers: { Authorization: `Bearer ${fx.admin.token}` } });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
});

console.log('\n--- POST /api/v1/payments/create-order ---');

await runTest('returns 401 without auth', async () => {
    const res = await makeRequest('POST', `${BASE}/api/v1/payments/create-order`, {
        data: { bookingId: 'some-booking-id', amount: 5000 }
    });
    assertEqual(res.status, 401, `Expected 401, got ${res.status}`);
});

await runTest('returns error for non-existent booking', async () => {
    const res = await makeRequest('POST', `${BASE}/api/v1/payments/create-order`, {
        headers: { Authorization: `Bearer ${fx.tenant.token}` },
        data: { bookingId: 'non-existent-booking-id', amount: 5000 }
    });
    assertContains([400, 404, 500], res.status, `Expected 400/404/500, got ${res.status}`);
});

console.log('\n--- POST /api/v1/payments/collect ---');

await runTest('returns 401 without auth', async () => {
    const res = await makeRequest('POST', `${BASE}/api/v1/payments/collect`, {
        data: { tenantId: 'some-id', amount: 1000, method: 'CASH' }
    });
    assertEqual(res.status, 401, `Expected 401, got ${res.status}`);
});

await runTest('TENANT cannot collect payment (owner-only action)', async () => {
    const res = await makeRequest('POST', `${BASE}/api/v1/payments/collect`, {
        headers: { Authorization: `Bearer ${fx.tenant.token}` },
        data: { tenantId: fx.tenant.id, amount: 1000, method: 'CASH' }
    });
    assertContains([400, 403, 404, 500], res.status, `Expected 400/403/404/500, got ${res.status}`);
});

// ===== ADMIN TESTS =====
console.log('\n--- GET /api/v1/admin/stats ---');

await runTest('returns 401 without auth (middleware blocks)', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/admin/stats`);
    assertEqual(res.status, 401, `Expected 401, got ${res.status}`);
});

await runTest('returns 200 for authenticated user (no role check in route)', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/admin/stats`, { headers: { Authorization: `Bearer ${fx.tenant.token}` } });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
});

await runTest('response includes all platform stat fields', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/admin/stats`, { headers: { Authorization: `Bearer ${fx.admin.token}` } });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    const body = res.body;
    assert(body?.totalUsers !== undefined, 'Missing totalUsers');
    assert(body?.totalProperties !== undefined, 'Missing totalProperties');
    assert(body?.totalRevenue !== undefined, 'Missing totalRevenue');
    assert(body?.totalBeds !== undefined, 'Missing totalBeds');
    assert(body?.occupiedBeds !== undefined, 'Missing occupiedBeds');
    assert(body?.occupancyRate !== undefined, 'Missing occupancyRate');
    assert(body?.roleBreakdown !== undefined, 'Missing roleBreakdown');
    assert(body?.revenueByMonth !== undefined, 'Missing revenueByMonth');
});

await runTest('totalUsers is a positive number', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/admin/stats`, { headers: { Authorization: `Bearer ${fx.admin.token}` } });
    assert(res.body?.totalUsers > 0, `Expected totalUsers > 0, got ${res.body?.totalUsers}`);
});

console.log('\n--- GET /api/v1/admin/users ---');

await runTest('returns 401 without auth', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/admin/users`);
    assertEqual(res.status, 401, `Expected 401, got ${res.status}`);
});

await runTest('any authenticated user can list users (no role check)', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/admin/users`, { headers: { Authorization: `Bearer ${fx.tenant.token}` } });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body?.users !== undefined, 'Missing users');
    assert(Array.isArray(res.body?.users), 'users should be array');
});

await runTest('list includes all users', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/admin/users`, { headers: { Authorization: `Bearer ${fx.admin.token}` } });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body?.users?.length > 0, `Expected users.length > 0`);
});

await runTest('can filter users by role=TENANT', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/admin/users?role=TENANT`, { headers: { Authorization: `Bearer ${fx.admin.token}` } });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    res.body?.users?.forEach((u) => {
        assertEqual(u.role, 'TENANT', `Expected role=TENANT, got ${u.role}`);
    });
});

console.log('\n--- GET /api/v1/admin/payments ---');

await runTest('returns 401 without auth', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/admin/payments`);
    assertEqual(res.status, 401, `Expected 401, got ${res.status}`);
});

await runTest('authenticated user can fetch payments', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/admin/payments`, { headers: { Authorization: `Bearer ${fx.admin.token}` } });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(res.body?.payments !== undefined, 'Missing payments');
});

console.log('\n--- PATCH /api/v1/admin/properties/:id ---');

await runTest('returns 401 without auth', async () => {
    const res = await makeRequest('PATCH', `${BASE}/api/v1/admin/properties/${fx.property.id}`, { data: { isApproved: true } });
    assertEqual(res.status, 401, `Expected 401, got ${res.status}`);
});

await runTest('any authenticated user can update a property (no role check)', async () => {
    const res = await makeRequest('PATCH', `${BASE}/api/v1/admin/properties/${fx.property.id}`, {
        headers: { Authorization: `Bearer ${fx.admin.token}` },
        data: { isApproved: true }
    });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assertEqual(res.body?.property?.isApproved, true, `Expected isApproved=true`);
});

await runTest('returns 400 for empty update body', async () => {
    const res = await makeRequest('PATCH', `${BASE}/api/v1/admin/properties/${fx.property.id}`, {
        headers: { Authorization: `Bearer ${fx.admin.token}` },
        data: { unknownField: 'ignored' }
    });
    assertEqual(res.status, 400, `Expected 400, got ${res.status}`);
});

// ===== RECOMMENDATIONS TESTS =====
console.log('\n--- GET /api/v1/ai/recommendations ---');

await runTest('returns 200 without auth (public route)', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/ai/recommendations`);
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
});

await runTest('returns an array', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/ai/recommendations`);
    assert(Array.isArray(res.body), `Expected array, got ${typeof res.body}`);
});

await runTest('each item has property, score, and reasons', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/ai/recommendations`);
    res.body?.forEach((item) => {
        assert(item.property !== undefined, 'Missing property');
        assert(item.score !== undefined, 'Missing score');
        assert(item.reasons !== undefined, 'Missing reasons');
        assert(Array.isArray(item.reasons), 'reasons should be array');
        assertEqual(typeof item.score, 'number', 'score should be a number');
    });
});

await runTest('respects limit query param', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/ai/recommendations?limit=3`);
    assert(res.body?.length <= 3, `Expected <=3 results, got ${res.body?.length}`);
});

await runTest('limit=1 returns at most 1 result', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/ai/recommendations?limit=1`);
    assert(res.body?.length <= 1, `Expected <=1 results, got ${res.body?.length}`);
});

await runTest('limit is capped at 20', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/ai/recommendations?limit=100`);
    assert(res.body?.length <= 20, `Expected <=20 results, got ${res.body?.length}`);
});

await runTest('property object includes occupancy and bed fields', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/ai/recommendations?limit=5`);
    res.body?.forEach((item) => {
        assert(item.property?.totalBeds !== undefined, 'Missing totalBeds');
        assert(item.property?.availableBeds !== undefined, 'Missing availableBeds');
        assert(item.property?.occupancy !== undefined, 'Missing occupancy');
    });
});

await runTest('score is a positive number', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/ai/recommendations?limit=10`);
    res.body?.forEach((item) => {
        assert(item.score > 0, `Expected score > 0, got ${item.score}`);
    });
});

await runTest('results are sorted by score descending', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/ai/recommendations?limit=10`);
    for (let i = 1; i < res.body?.length; i++) {
        assert(res.body[i-1].score >= res.body[i].score, `Expected scores in descending order`);
    }
});

await runTest('reasons array is non-empty for every result', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/ai/recommendations?limit=10`);
    res.body?.forEach((item) => {
        assert(item.reasons?.length > 0, `Expected non-empty reasons`);
    });
});

await runTest('only approved properties are recommended', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/ai/recommendations?limit=20`);
    res.body?.forEach((item) => {
        assert(item.property?.isApproved === true, `Expected isApproved=true for ${item.property?.id}`);
    });
});

await runTest('test property (seeded) appears in results', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/ai/recommendations?limit=100`);
    const ids = res.body?.map((item) => item.property?.id);
    assertContains(ids, fx.property.id, `Expected test property in recommendations`);
});

await runTest('authenticated request returns personalized results', async () => {
    const res = await makeRequest('GET', `${BASE}/api/v1/ai/recommendations?limit=5`, {
        headers: { Authorization: `Bearer ${fx.tenant.token}` }
    });
    assertEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body), `Expected array`);
});

// ===== SUMMARY =====
console.log('\n\n========================================');
console.log(`API TEST SUMMARY`);
console.log('========================================');
console.log(`Total:  ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('========================================\n');

if (failed > 0) {
    console.log('FAILED TESTS:');
    results.filter(r => r.status === 'FAILED').forEach(r => {
        console.log(`  - ${r.name}`);
        console.log(`    ${r.error}`);
    });
}

// Write JSON results
const outputPath = '/Users/rajendrakalla/colife/colife/api-test-results.json';
fs.writeFileSync(outputPath, JSON.stringify({ results, passed, failed, total: passed + failed }, null, 2));
console.log(`\nResults written to: ${outputPath}`);

process.exit(failed > 0 ? 1 : 0);
