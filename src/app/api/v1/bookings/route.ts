import { NextResponse } from 'next/server';
import { PrismaClient, BookingStatus, Role } from '@prisma/client';

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

        // Tenants see only their bookings. Owners/Admins see all bookings.
        let whereClause = {};
        if (user.role === Role.TENANT) {
            whereClause = { tenantId: user.id };
        } else if (user.role === Role.OWNER) {
            // Fetch all bookings for properties owned by this owner
            const ownerProperties = await prisma.property.findMany({ select: { id: true }, where: { ownerId: user.id } });
            const propertyIds = ownerProperties.map(p => p.id);
            const rooms = await prisma.room.findMany({ select: { id: true }, where: { propertyId: { in: propertyIds } } });
            const roomIds = rooms.map(r => r.id);
            whereClause = { roomId: { in: roomIds } };
        }

        const bookings = await prisma.booking.findMany({
            where: whereClause,
            include: {
                room: {
                    include: { property: true }
                },
                tenant: { select: { name: true, phone: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ bookings });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { roomId, bedId, startDate, endDate, amount } = body;

        // Verify the bed is available
        const bed = await prisma.bed.findUnique({ where: { id: bedId } });
        if (!bed || bed.isOccupied) {
            return NextResponse.json({ error: 'Bed is not available' }, { status: 400 });
        }

        // Transaction to create booking and mark bed as occupied
        const booking = await prisma.$transaction(async (prisma) => {
            const newBooking = await prisma.booking.create({
                data: {
                    tenantId: user.id,
                    roomId,
                    bedId,
                    status: BookingStatus.PENDING,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    amount,
                }
            });

            await prisma.bed.update({
                where: { id: bedId },
                data: { isOccupied: true }
            });

            return newBooking;
        });

        return NextResponse.json(booking, { status: 201 });
    } catch (error) {
        console.error('Error creating booking:', error);
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }
}
