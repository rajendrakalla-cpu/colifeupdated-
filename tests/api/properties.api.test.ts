import { test, expect } from '@playwright/test';
import { loadFixtures } from '../helpers/fixtures';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('GET /api/v1/properties', () => {
    test('returns paginated property list', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/properties`);
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('properties');
        expect(body).toHaveProperty('total');
        expect(body).toHaveProperty('page');
        expect(body).toHaveProperty('limit');
        expect(Array.isArray(body.properties)).toBe(true);
    });

    test('respects limit query param', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/properties?limit=2`);
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.properties.length).toBeLessThanOrEqual(2);
        expect(body.limit).toBe(2);
    });

    test('filters by city', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/properties?city=Bangalore`);
        expect(res.status()).toBe(200);
        const body = await res.json();
        body.properties.forEach((p: any) => {
            expect(p.city).toBe('Bangalore');
        });
    });

    test('filters by gender', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/properties?gender=UNISEX`);
        expect(res.status()).toBe(200);
        const body = await res.json();
        body.properties.forEach((p: any) => {
            expect(p.gender).toBe('UNISEX');
        });
    });

    test('filters by type', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/properties?type=COLIVING`);
        expect(res.status()).toBe(200);
        const body = await res.json();
        body.properties.forEach((p: any) => {
            expect(p.type).toBe('COLIVING');
        });
    });

    test('returns only approved properties', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/properties`);
        const body = await res.json();
        body.properties.forEach((p: any) => {
            expect(p.isApproved).toBe(true);
        });
    });

    test('each property has occupancy data', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/properties`);
        const body = await res.json();
        if (body.properties.length > 0) {
            const p = body.properties[0];
            expect(p).toHaveProperty('totalBeds');
            expect(p).toHaveProperty('occupiedBeds');
            expect(p).toHaveProperty('occupancy');
        }
    });

    test('pagination - page 2 differs from page 1', async ({ request }) => {
        const [p1, p2] = await Promise.all([
            request.get(`${BASE}/api/v1/properties?page=1&limit=1`),
            request.get(`${BASE}/api/v1/properties?page=2&limit=1`),
        ]);
        const b1 = await p1.json();
        const b2 = await p2.json();
        if (b1.total > 1) {
            expect(b1.properties[0]?.id).not.toBe(b2.properties[0]?.id);
        }
    });
});

test.describe('GET /api/v1/properties/:id', () => {
    test('returns property details for valid id', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/properties/${fx.property.id}`);
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.id).toBe(fx.property.id);
        expect(body).toHaveProperty('rooms');
        expect(body).toHaveProperty('totalBeds');
        expect(body).toHaveProperty('occupancy');
    });

    test('returns 404 for non-existent property', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/properties/non-existent-id-xyz`);
        expect(res.status()).toBe(404);
    });
});

test.describe('POST /api/v1/properties (authenticated)', () => {
    test('rejects unauthenticated requests with 403 (route is public but handler checks role)', async ({ request }) => {
        const res = await request.post(`${BASE}/api/v1/properties`, {
            data: { name: 'Test', city: 'Bangalore', address: 'Test', price: 5000, type: 'COLIVING', gender: 'UNISEX' },
        });
        // /api/v1/properties is in PUBLIC_PREFIXES so middleware lets it through,
        // but the handler calls getUser() which returns null → 403
        expect(res.status()).toBe(403);
    });

    test('rejects TENANT creating a property', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.post(`${BASE}/api/v1/properties`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
            data: { name: 'Test', city: 'Bangalore', address: 'Test', price: 5000, type: 'COLIVING', gender: 'UNISEX' },
        });
        expect(res.status()).toBe(403);
    });

    test('OWNER can create a property', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.post(`${BASE}/api/v1/properties`, {
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
            },
        });
        expect(res.status()).toBe(201);
        const body = await res.json();
        expect(body.name).toBe('New E2E Property');
        expect(body).toHaveProperty('rooms');
    });

    test('returns 400 when required fields are missing', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.post(`${BASE}/api/v1/properties`, {
            headers: { Authorization: `Bearer ${fx.owner.token}` },
            data: { name: 'Incomplete Property' },
        });
        expect(res.status()).toBe(400);
    });
});
