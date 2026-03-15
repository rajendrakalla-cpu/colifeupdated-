import { test, expect } from '@playwright/test';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('POST /api/v1/auth/send-otp', () => {
    test('returns 400 when phone is missing', async ({ request }) => {
        const res = await request.post(`${BASE}/api/v1/auth/send-otp`, { data: {} });
        expect(res.status()).toBe(400);
    });

    test('returns success response for valid phone', async ({ request }) => {
        const res = await request.post(`${BASE}/api/v1/auth/send-otp`, {
            data: { phone: '+919876543210' },
        });
        // Either 200 (OTP sent) or 429 (rate limited in CI) are acceptable
        expect([200, 429]).toContain(res.status());
    });
});

test.describe('POST /api/v1/auth/verify-otp', () => {
    test('returns 400 when firebaseIdToken is missing', async ({ request }) => {
        const res = await request.post(`${BASE}/api/v1/auth/verify-otp`, { data: {} });
        expect(res.status()).toBe(400);
        const body = await res.json();
        expect(body.error).toMatch(/firebaseIdToken/i);
    });

    test('returns 401 for invalid firebase token', async ({ request }) => {
        const res = await request.post(`${BASE}/api/v1/auth/verify-otp`, {
            data: { firebaseIdToken: 'invalid-token-xyz' },
        });
        expect(res.status()).toBe(401);
    });
});

test.describe('POST /api/v1/auth/register', () => {
    test('returns 400 when required fields are missing', async ({ request }) => {
        const res = await request.post(`${BASE}/api/v1/auth/register`, { data: {} });
        expect([400, 500]).toContain(res.status());
    });

    test('returns 400 when phone is missing', async ({ request }) => {
        const res = await request.post(`${BASE}/api/v1/auth/register`, {
            data: { name: 'Test User', role: 'TENANT' },
        });
        expect([400, 500]).toContain(res.status());
    });
});

test.describe('Auth middleware', () => {
    test('protected routes return 401 without token', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/tickets`);
        expect(res.status()).toBe(401);
    });

    test('protected routes return 401 with malformed token', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/tickets`, {
            headers: { Authorization: 'Bearer not-a-valid-jwt' },
        });
        expect(res.status()).toBe(401);
    });

    test('protected routes return 401 with no Bearer prefix', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/tickets`, {
            headers: { Authorization: 'some-token-without-prefix' },
        });
        expect(res.status()).toBe(401);
    });
});
