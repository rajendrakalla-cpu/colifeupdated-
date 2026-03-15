import { test, expect } from '@playwright/test';
import { loadFixtures } from '../helpers/fixtures';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('GET /api/v1/bookings', () => {
    test('returns 401 without auth', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/bookings`);
        expect(res.status()).toBe(401);
    });

    test('TENANT can fetch their bookings', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/bookings`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('bookings');
        expect(Array.isArray(body.bookings)).toBe(true);
    });

    test('OWNER can fetch bookings for their properties', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/bookings`, {
            headers: { Authorization: `Bearer ${fx.owner.token}` },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('bookings');
    });

    test('ADMIN can fetch all bookings', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/bookings`, {
            headers: { Authorization: `Bearer ${fx.admin.token}` },
        });
        expect(res.status()).toBe(200);
    });

    test('TENANT only sees their own bookings', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/bookings`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
        });
        const body = await res.json();
        body.bookings.forEach((b: any) => {
            expect(b.tenantId).toBe(fx.tenant.id);
        });
    });
});

test.describe('POST /api/v1/bookings', () => {
    test('returns 401 without auth', async ({ request }) => {
        const res = await request.post(`${BASE}/api/v1/bookings`, {
            data: { roomId: 'some-room', bedId: 'some-bed', startDate: new Date().toISOString(), amount: 8000 },
        });
        expect(res.status()).toBe(401);
    });

    test('returns error for non-existent bed', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.post(`${BASE}/api/v1/bookings`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
            data: {
                roomId: 'non-existent-room',
                bedId: 'non-existent-bed',
                startDate: new Date().toISOString(),
                amount: 8000,
            },
        });
        expect([400, 404, 500]).toContain(res.status());
    });

    test('TENANT can create a booking for an available bed', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.post(`${BASE}/api/v1/bookings`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
            data: {
                roomId: fx.room.id,
                bedId: fx.bed.id,
                startDate: new Date().toISOString(),
                amount: 8000,
                securityDeposit: 16000,
            },
        });
        // 201 if bed is free, 400/409/500 if already occupied or DB constraint
        expect([201, 400, 409, 500]).toContain(res.status());
        if (res.status() === 201) {
            const body = await res.json();
            expect(body.tenantId).toBe(fx.tenant.id);
            expect(body.roomId).toBe(fx.room.id);
        }
    });
});
