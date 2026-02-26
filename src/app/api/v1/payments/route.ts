import { NextResponse } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Utility for mocking auth since full JWT isn't implemented yet
async function getAuthenticatedUser(request: Request) {
    const { searchParams } = new URL(request.url);
    const mockEmail = searchParams.get('mockEmail') || 'tenant1@colife.com';
    return prisma.user.findUnique({ where: { email: mockEmail } });
}

export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        let whereClause = {};

        // Tenants see only their payments. Owners/Admins see payments for their properties.
        if (user.role === Role.TENANT) {
            whereClause = { tenantId: user.id };
        } else if (user.role === Role.OWNER) {
            // Find all bookings for properties owned by this owner
            const ownerProperties = await prisma.property.findMany({ select: { id: true }, where: { ownerId: user.id } });
            const propertyIds = ownerProperties.map(p => p.id);
            const rooms = await prisma.room.findMany({ select: { id: true }, where: { propertyId: { in: propertyIds } } });
            const roomIds = rooms.map(r => r.id);
            const bookings = await prisma.booking.findMany({ select: { id: true }, where: { roomId: { in: roomIds } } });
            const bookingIds = bookings.map(b => b.id);
            whereClause = { bookingId: { in: bookingIds } };
        }

        const payments = await prisma.payment.findMany({
            where: whereClause,
            include: {
                booking: {
                    include: {
                        room: { include: { property: { select: { name: true } } } }
                    }
                },
                tenant: { select: { name: true, phone: true } }
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ payments });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }
}
