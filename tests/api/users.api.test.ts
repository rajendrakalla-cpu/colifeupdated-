import { test, expect } from '@playwright/test';
import { loadFixtures } from '../helpers/fixtures';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

// /users/me returns { user: {...}, bookings: [...], tickets: [...], payments: [...] }
test.describe('GET /api/v1/users/me', () => {
    test('returns 401 without auth', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/users/me`);
        expect(res.status()).toBe(401);
    });

    test('returns TENANT profile nested in user key', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/users/me`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.user.id).toBe(fx.tenant.id);
        expect(body.user.role).toBe('TENANT');
        expect(body.user.phone).toBe(fx.tenant.phone);
    });

    test('TENANT response includes bookings, tickets, payments', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/users/me`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
        });
        const body = await res.json();
        expect(body).toHaveProperty('bookings');
        expect(body).toHaveProperty('tickets');
        expect(body).toHaveProperty('payments');
        expect(Array.isArray(body.bookings)).toBe(true);
    });

    test('returns OWNER profile with properties', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/users/me`, {
            headers: { Authorization: `Bearer ${fx.owner.token}` },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.user.id).toBe(fx.owner.id);
        expect(body.user.role).toBe('OWNER');
        expect(body).toHaveProperty('properties');
    });

    test('returns ADMIN profile', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/users/me`, {
            headers: { Authorization: `Bearer ${fx.admin.token}` },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.user.id).toBe(fx.admin.id);
        expect(body.user.role).toBe('ADMIN');
    });

    test('profile does not expose password fields', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/users/me`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
        });
        const body = await res.json();
        expect(body.user).not.toHaveProperty('password');
        expect(body.user).not.toHaveProperty('passwordHash');
    });
});

test.describe('PATCH /api/v1/users/me', () => {
    test('returns 401 without auth', async ({ request }) => {
        const res = await request.patch(`${BASE}/api/v1/users/me`, {
            data: { name: 'New Name' },
        });
        expect(res.status()).toBe(401);
    });

    test('TENANT can update their name', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.patch(`${BASE}/api/v1/users/me`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
            data: { name: 'Updated Tenant Name' },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        // PATCH returns the updated user directly (not wrapped)
        expect(body.name).toBe('Updated Tenant Name');
    });

    test('cannot elevate role to ADMIN via PATCH /me', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.patch(`${BASE}/api/v1/users/me`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
            data: { role: 'ADMIN' },
        });
        // Route strips `role` from body and returns updated user with original role
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.role).toBe('TENANT');
    });
});
