import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// In a real application, we would use an auth middleware to get the user ID
// For now, we'll mock the authenticated user based on a query param or default
async function getAuthenticatedUser(request: Request) {
    const { searchParams } = new URL(request.url);
    const mockEmail = searchParams.get('mockEmail') || 'tenant1@colife.com';

    return prisma.user.findUnique({
        where: { email: mockEmail }
    });
}

export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch different relation data based on the user's role
        let dashboardData: any = { user };

        if (user.role === 'TENANT') {
            const bookings = await prisma.booking.findMany({
                where: { tenantId: user.id },
                include: {
                    room: {
                        include: {
                            property: true
                        }
                    }
                }
            });

            const tickets = await prisma.ticket.findMany({
                where: { tenantId: user.id }
            });

            const payments = await prisma.payment.findMany({
                where: { tenantId: user.id }
            });

            dashboardData = {
                ...dashboardData,
                bookings,
                tickets,
                payments
            };
        } else if (user.role === 'OWNER') {
            const properties = await prisma.property.findMany({
                where: { ownerId: user.id },
                include: {
                    rooms: {
                        include: { beds: true }
                    },
                    tickets: true,
                }
            });

            dashboardData = {
                ...dashboardData,
                properties
            };
        }

        return NextResponse.json(dashboardData);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const user = await getAuthenticatedUser(request);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Ensure users cannot elevate their own role
        if (body.role) {
            delete body.role;
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: body
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating user profile:', error);
        return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
    }
}
