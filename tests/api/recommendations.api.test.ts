import { test, expect } from '@playwright/test';
import { loadFixtures } from '../helpers/fixtures';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('GET /api/v1/ai/recommendations', () => {
    test('returns 200 without auth (public route)', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/ai/recommendations`);
        expect(res.status()).toBe(200);
    });

    test('returns an array', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/ai/recommendations`);
        const body = await res.json();
        expect(Array.isArray(body)).toBe(true);
    });

    test('each item has property, score, and reasons', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/ai/recommendations`);
        const body = await res.json();
        body.forEach((item: any) => {
            expect(item).toHaveProperty('property');
            expect(item).toHaveProperty('score');
            expect(item).toHaveProperty('reasons');
            expect(Array.isArray(item.reasons)).toBe(true);
            expect(typeof item.score).toBe('number');
        });
    });

    test('respects limit query param', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/ai/recommendations?limit=3`);
        const body = await res.json();
        expect(body.length).toBeLessThanOrEqual(3);
    });

    test('limit=1 returns at most 1 result', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/ai/recommendations?limit=1`);
        const body = await res.json();
        expect(body.length).toBeLessThanOrEqual(1);
    });

    test('limit is capped at 20', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/ai/recommendations?limit=100`);
        const body = await res.json();
        expect(body.length).toBeLessThanOrEqual(20);
    });

    test('property object includes occupancy and bed fields', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/ai/recommendations?limit=5`);
        const body = await res.json();
        body.forEach((item: any) => {
            expect(item.property).toHaveProperty('totalBeds');
            expect(item.property).toHaveProperty('availableBeds');
            expect(item.property).toHaveProperty('occupancy');
        });
    });

    test('score is a positive number', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/ai/recommendations?limit=10`);
        const body = await res.json();
        body.forEach((item: any) => {
            expect(item.score).toBeGreaterThan(0);
        });
    });

    test('results are sorted by score descending', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/ai/recommendations?limit=10`);
        const body = await res.json();
        for (let i = 1; i < body.length; i++) {
            expect(body[i - 1].score).toBeGreaterThanOrEqual(body[i].score);
        }
    });

    test('reasons array is non-empty for every result', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/ai/recommendations?limit=10`);
        const body = await res.json();
        body.forEach((item: any) => {
            expect(item.reasons.length).toBeGreaterThan(0);
        });
    });

    test('only approved properties are recommended', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/ai/recommendations?limit=20`);
        const body = await res.json();
        body.forEach((item: any) => {
            expect(item.property.isApproved).toBe(true);
        });
    });

    test('test property (seeded) appears in results', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/ai/recommendations?limit=100`);
        const body = await res.json();
        const ids = body.map((item: any) => item.property.id);
        expect(ids).toContain(fx.property.id);
    });

    test('authenticated request returns personalized results', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/ai/recommendations?limit=5`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
        });
        expect(res.status()).toBe(200);
        expect(Array.isArray(await res.json())).toBe(true);
    });
});
