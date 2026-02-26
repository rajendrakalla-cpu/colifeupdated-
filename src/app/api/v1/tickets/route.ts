import { NextResponse } from 'next/server';
import { PrismaClient, TicketStatus, Role } from '@prisma/client';

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

        // Tenants see only their tickets. Owners/Admins see tickets for their properties.
        if (user.role === Role.TENANT) {
            whereClause = { tenantId: user.id };
        } else if (user.role === Role.OWNER) {
            // Find all properties owned by this owner
            const ownerProperties = await prisma.property.findMany({ select: { id: true }, where: { ownerId: user.id } });
            const propertyIds = ownerProperties.map(p => p.id);
            whereClause = { propertyId: { in: propertyIds } };
        }

        const tickets = await prisma.ticket.findMany({
            where: whereClause,
            include: {
                tenant: { select: { name: true, phone: true } },
                property: { select: { name: true, location: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ tickets });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { title, description, category, priority, propertyId } = body;

        const ticket = await prisma.ticket.create({
            data: {
                title,
                description,
                category,
                priority,
                status: TicketStatus.OPEN,
                tenantId: user.id,
                propertyId
            }
        });

        return NextResponse.json(ticket, { status: 201 });
    } catch (error) {
        console.error('Error creating ticket:', error);
        return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
    }
}
