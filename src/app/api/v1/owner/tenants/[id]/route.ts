import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: tenantId } = await params;
        const body = await request.json();

        // Verify the tenant exists and belongs to a property owned by this owner
        // In production, check the owner's session. For now, accept ownerId from query.
        const url = new URL(request.url);
        const ownerId = url.searchParams.get('ownerId') || body.ownerId;

        if (!ownerId) {
            return NextResponse.json({ error: 'ownerId is required' }, { status: 400 });
        }

        // Check tenant is assigned to a property owned by this owner
        const booking = await prisma.booking.findFirst({
            where: {
                tenantId,
                status: 'CONFIRMED',
                room: { property: { ownerId } },
            },
        });

        if (!booking) {
            return NextResponse.json({ error: 'Tenant is not assigned to any of your properties' }, { status: 403 });
        }

        const allowedFields: Record<string, boolean> = {
            name: true, phone: true, email: true, aadhaarNumber: true, gender: true,
        };

        const data: any = {};
        for (const key of Object.keys(body)) {
            if (allowedFields[key]) data[key] = body[key];
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const tenant = await prisma.user.update({ where: { id: tenantId }, data });
        return NextResponse.json({ tenant });
    } catch (error) {
        console.error('Owner tenant edit error:', error);
        return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 });
    }
}
