import { test, expect } from '@playwright/test';
import { loadFixtures } from '../helpers/fixtures';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('GET /api/v1/tickets', () => {
    test('returns 401 without auth', async ({ request }) => {
        const res = await request.get(`${BASE}/api/v1/tickets`);
        expect(res.status()).toBe(401);
    });

    test('TENANT can fetch their tickets', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/tickets`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('tickets');
        expect(Array.isArray(body.tickets)).toBe(true);
    });

    test('OWNER can fetch tickets for their properties', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/tickets`, {
            headers: { Authorization: `Bearer ${fx.owner.token}` },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body).toHaveProperty('tickets');
    });

    test('ADMIN can fetch all tickets', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/tickets`, {
            headers: { Authorization: `Bearer ${fx.admin.token}` },
        });
        expect(res.status()).toBe(200);
    });
});

test.describe('POST /api/v1/tickets', () => {
    test('returns 401 without auth', async ({ request }) => {
        const res = await request.post(`${BASE}/api/v1/tickets`, {
            data: { title: 'Test', category: 'ELECTRICAL', priority: 'MEDIUM' },
        });
        expect(res.status()).toBe(401);
    });

    test('TENANT can create a ticket', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.post(`${BASE}/api/v1/tickets`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
            data: {
                title: 'E2E Test Ticket',
                description: 'Created by E2E test suite',
                category: 'ELECTRICAL',
                priority: 'LOW',
                propertyId: fx.property.id,
            },
        });
        expect(res.status()).toBe(201);
        const body = await res.json();
        expect(body.title).toBe('E2E Test Ticket');
        expect(body.status).toBe('OPEN');
        expect(body.tenantId).toBe(fx.tenant.id);
        expect(body.category).toBe('ELECTRICAL');
    });

    test('created ticket appears in GET /tickets', async ({ request }) => {
        const fx = loadFixtures();
        await request.post(`${BASE}/api/v1/tickets`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
            data: {
                title: 'Plumbing Issue E2E',
                category: 'PLUMBING',
                priority: 'HIGH',
                propertyId: fx.property.id,
            },
        });

        const listRes = await request.get(`${BASE}/api/v1/tickets`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
        });
        const body = await listRes.json();
        const titles = body.tickets.map((t: any) => t.title);
        expect(titles).toContain('Plumbing Issue E2E');
    });

    test('ticket response includes tenant and property info', async ({ request }) => {
        const fx = loadFixtures();
        const listRes = await request.get(`${BASE}/api/v1/tickets`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
        });
        const body = await listRes.json();
        if (body.tickets.length > 0) {
            const ticket = body.tickets[0];
            expect(ticket).toHaveProperty('tenant');
            expect(ticket.tenant).toHaveProperty('name');
            expect(ticket.tenant).toHaveProperty('phone');
        }
    });

    test('TENANT only sees their own tickets', async ({ request }) => {
        const fx = loadFixtures();
        const res = await request.get(`${BASE}/api/v1/tickets`, {
            headers: { Authorization: `Bearer ${fx.tenant.token}` },
        });
        const body = await res.json();
        body.tickets.forEach((t: any) => {
            expect(t.tenantId).toBe(fx.tenant.id);
        });
    });
});
