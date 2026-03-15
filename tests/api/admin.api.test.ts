import { test, expect } from '@playwright/test';
import { loadFixtures } from '../helpers/fixtures';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

// NOTE: Admin routes are protected by JWT middleware but have no role-based checks in
// the route handlers themselves — any authenticated user can access them.

test.describe('GET /api/v1/admin/stats', () => {
    test('returns 401 without auth (middleware blocks)', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/admin/stats`);
        expect(res.status()).toBe(401);
    });

    test('returns 200 for authenticated user (no role check in route)', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/admin/stats`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
        });
        expect(res.status()).toBe(200);
    });

    test('response includes all platform stat fields', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/admin/stats`, {
            headers: { Authorization: `Bearer ${fx.admin.token}` },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('totalUsers');
        expect(body).toHaveProperty('totalProperties');
        expect(body).toHaveProperty('totalRevenue');
        expect(body).toHaveProperty('totalBeds');
        expect(body).toHaveProperty('occupiedBeds');
        expect(body).toHaveProperty('occupancyRate');
        expect(body).toHaveProperty('roleBreakdown');
        expect(body).toHaveProperty('revenueByMonth');
    });

    test('totalUsers is a positive number', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/admin/stats`, {
            headers: { Authorization: `Bearer ${fx.admin.token}` },
        });
        const body = await res.json();
        expect(body.totalUsers).toBeGreaterThan(0);
    });
});

test.describe('GET /api/v1/admin/users', () => {
    test('returns 401 without auth', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/admin/users`);
        expect(res.status()).toBe(401);
    });

    test('any authenticated user can list users (no role check)', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/admin/users`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('users');
        expect(Array.isArray(body.users)).toBe(true);
    });

    test('list includes all users', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/admin/users`, {
            headers: { Authorization: `Bearer ${fx.admin.token}` },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.users.length).toBeGreaterThan(0);
    });

    test('can filter users by role=TENANT', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/admin/users?role=TENANT`, {
            headers: { Authorization: `Bearer ${fx.admin.token}` },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        body.users.forEach((u: any) => {
            expect(u.role).toBe('TENANT');
        });
    });
});

test.describe('GET /api/v1/admin/payments', () => {
    test('returns 401 without auth', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/admin/payments`);
        expect(res.status()).toBe(401);
    });

    test('authenticated user can fetch payments', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/admin/payments`, {
            headers: { Authorization: `Bearer ${fx.admin.token}` },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('payments');
    });
});

test.describe('PATCH /api/v1/admin/properties/:id', () => {
    test('returns 401 without auth', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.patch(`${BASE}/api/v1/admin/properties/${fx.property.id}`, {
            data: { isApproved: true },
        });
        expect(res.status()).toBe(401);
    });

    test('any authenticated user can update a property (no role check in route)', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.patch(`${BASE}/api/v1/admin/properties/${fx.property.id}`, {
            headers: { Authorization: `Bearer ${fx.admin.token}` },
            data: { isApproved: true },
        });
        expect(res.status()).toBe(200);
        // Response is wrapped: { property: {...} }
        const body = await res.json();
        expect(body.property.isApproved).toBe(true);
    });

    test('returns 400 for empty update body', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.patch(`${BASE}/api/v1/admin/properties/${fx.property.id}`, {
            headers: { Authorization: `Bearer ${fx.admin.token}` },
            data: { unknownField: 'ignored' },
        });
        expect(res.status()).toBe(400);
    });
});
