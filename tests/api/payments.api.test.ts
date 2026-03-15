import { test, expect } from '@playwright/test';
import { loadFixtures } from '../helpers/fixtures';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('GET /api/v1/payments', () => {
    test('returns 401 without auth', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/payments`);
        expect(res.status()).toBe(401);
    });

    test('TENANT can fetch their payments', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/payments`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('payments');
        expect(Array.isArray(body.payments)).toBe(true);
    });

    test('OWNER can fetch payments', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/payments`, {
            headers: { Authorization: `Bearer ${fx.owner.token}` },
        });
        expect(res.status()).toBe(200);
    });

    test('ADMIN can fetch all payments', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/payments`, {
            headers: { Authorization: `Bearer ${fx.admin.token}` },
        });
        expect(res.status()).toBe(200);
    });
});

test.describe('POST /api/v1/payments/create-order', () => {
    test('returns 401 without auth', async ({ request }) => {
        const res = await request.post(`${BASE}/api/v1/payments/create-order`, {
            data: { bookingId: 'some-booking-id', amount: 5000 },
        });
        expect(res.status()).toBe(401);
    });

    test('returns error for non-existent booking', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.post(`${BASE}/api/v1/payments/create-order`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
            data: { bookingId: 'non-existent-booking-id', amount: 5000 },
        });
        expect([400, 404, 500]).toContain(res.status());
    });
});

test.describe('POST /api/v1/payments/collect', () => {
    test('returns 401 without auth', async ({ request }) => {
        const res = await request.post(`${BASE}/api/v1/payments/collect`, {
            data: { tenantId: 'some-id', amount: 1000, method: 'CASH' },
        });
        expect(res.status()).toBe(401);
    });

    test('TENANT cannot collect payment (owner-only action)', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.post(`${BASE}/api/v1/payments/collect`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
            data: { tenantId: fx.tenant.id, amount: 1000, method: 'CASH' },
        });
        expect([400, 403, 404, 500]).toContain(res.status());
    });
});
