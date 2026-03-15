import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const TEST_PHONES = ['+910000000001', '+910000000002', '+910000000003'];
const TEST_PROPERTY_ID = 'test-property-e2e-id-00000001';

export default async function globalTeardown() {
    // Get test user IDs first
    const testUsers = await prisma.user.findMany({
        where: { phone: { in: TEST_PHONES } },
        select: { id: true },
    });
    const testUserIds = testUsers.map((u) => u.id);

    // Delete in FK-safe order (children before parents)
    if (testUserIds.length > 0) {
        // Delete EventRSVPs for test users
        await prisma.eventRSVP.deleteMany({ where: { userId: { in: testUserIds } } });

        // Delete community posts created by test users
        await prisma.communityPost.deleteMany({ where: { authorId: { in: testUserIds } } });

        // Delete notifications
        await prisma.notification.deleteMany({ where: { userId: { in: testUserIds } } });

        // Delete utility line items on test payments, then payments
        const testPayments = await prisma.payment.findMany({
            where: { tenantId: { in: testUserIds } },
            select: { id: true },
        });
        if (testPayments.length > 0) {
            await prisma.utilityLineItem.deleteMany({
                where: { paymentId: { in: testPayments.map((p) => p.id) } },
            });
        }
        await prisma.payment.deleteMany({ where: { tenantId: { in: testUserIds } } });

        // Delete bookings (before beds and rooms)
        await prisma.booking.deleteMany({ where: { tenantId: { in: testUserIds } } });

        // Delete tickets created by test users
        await prisma.ticket.deleteMany({ where: { tenantId: { in: testUserIds } } });

        // Delete bank accounts
        await prisma.bankAccount.deleteMany({ where: { userId: { in: testUserIds } } });
    }

    // Delete test property (Cascade: rooms → beds, tickets on property, community posts on property)
    // First remove tickets attached to the property (not yet covered above)
    await prisma.ticket.deleteMany({ where: { propertyId: TEST_PROPERTY_ID } });
    await prisma.communityPost.deleteMany({ where: { propertyId: TEST_PROPERTY_ID } });

    // Delete beds and rooms (cascade should handle beds, but be explicit)
    const testRooms = await prisma.room.findMany({
        where: { propertyId: TEST_PROPERTY_ID },
        select: { id: true },
    });
    if (testRooms.length > 0) {
        await prisma.bed.deleteMany({ where: { roomId: { in: testRooms.map((r) => r.id) } } });
        await prisma.room.deleteMany({ where: { propertyId: TEST_PROPERTY_ID } });
    }
    await prisma.property.deleteMany({ where: { id: TEST_PROPERTY_ID } });

    // Clean up any extra properties created during tests (must happen before user deletion)
    await prisma.property.deleteMany({
        where: { name: 'New E2E Property' },
    });

    // Now safe to delete test users
    if (testUserIds.length > 0) {
        await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
    }

    // Clean up fixture file
    const fixturePath = path.join(__dirname, 'fixtures', 'test-users.json');
    if (fs.existsSync(fixturePath)) fs.unlinkSync(fixturePath);

    await prisma.$disconnect();
}
