import { PrismaClient } from '@prisma/client';
import { SignJWT } from 'jose';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function getSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET env var is required for tests');
    return new TextEncoder().encode(secret);
}

async function generateToken(payload: { userId: string; email: string | null; role: string }): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(getSecret());
}

export default async function globalSetup() {
    // Create test users (upsert so re-runs are safe)
    const [tenant, owner, admin] = await Promise.all([
        prisma.user.upsert({
            where: { phone: '+910000000001' },
            update: { name: 'Test Tenant', role: 'TENANT' },
            create: {
                phone: '+910000000001',
                name: 'Test Tenant',
                email: 'test.tenant@colife.test',
                role: 'TENANT',
            },
        }),
        prisma.user.upsert({
            where: { phone: '+910000000002' },
            update: { name: 'Test Owner', role: 'OWNER' },
            create: {
                phone: '+910000000002',
                name: 'Test Owner',
                email: 'test.owner@colife.test',
                role: 'OWNER',
            },
        }),
        prisma.user.upsert({
            where: { phone: '+910000000003' },
            update: { name: 'Test Admin', role: 'ADMIN' },
            create: {
                phone: '+910000000003',
                name: 'Test Admin',
                email: 'test.admin@colife.test',
                role: 'ADMIN',
            },
        }),
    ]);

    // Create a test property owned by the test owner
    const property = await prisma.property.upsert({
        where: { id: 'test-property-e2e-id-00000001' },
        update: {},
        create: {
            id: 'test-property-e2e-id-00000001',
            name: 'E2E Test Property',
            location: 'Koramangala',
            city: 'Bangalore',
            address: '1st Block, Koramangala, Bangalore',
            price: 8000,
            type: 'COLIVING',
            gender: 'UNISEX',
            amenities: ['WiFi', 'AC', 'Laundry'],
            images: [],
            description: 'A test property for E2E testing',
            highlights: ['Great Location'],
            availableFrom: new Date(),
            deposit: 16000,
            lockIn: '3 months',
            isApproved: true,
            ownerId: owner.id,
        },
    });

    // Create a test room + bed in that property
    const room = await prisma.room.upsert({
        where: { id: 'test-room-e2e-id-000000001' },
        update: {},
        create: {
            id: 'test-room-e2e-id-000000001',
            name: 'Room 101',
            type: 'Double Sharing',
            capacity: 2,
            price: 8000,
            propertyId: property.id,
        },
    });

    await prisma.bed.upsert({
        where: { id: 'test-bed-e2e-id-0000000001' },
        update: {},
        create: {
            id: 'test-bed-e2e-id-0000000001',
            name: 'Bed A',
            isOccupied: false,
            roomId: room.id,
        },
    });

    // Generate JWT tokens
    const [tenantToken, ownerToken, adminToken] = await Promise.all([
        generateToken({ userId: tenant.id, email: tenant.email ?? null, role: tenant.role }),
        generateToken({ userId: owner.id, email: owner.email ?? null, role: owner.role }),
        generateToken({ userId: admin.id, email: admin.email ?? null, role: admin.role }),
    ]);

    // Write fixture file consumed by tests
    const fixtures = {
        tenant: { id: tenant.id, token: tenantToken, phone: tenant.phone },
        owner: { id: owner.id, token: ownerToken, phone: owner.phone },
        admin: { id: admin.id, token: adminToken, phone: admin.phone },
        property: { id: property.id },
        room: { id: room.id },
        bed: { id: 'test-bed-e2e-id-0000000001' },
    };

    fs.writeFileSync(
        path.join(__dirname, 'fixtures', 'test-users.json'),
        JSON.stringify(fixtures, null, 2)
    );

    await prisma.$disconnect();
}
