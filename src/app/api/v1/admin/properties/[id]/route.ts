import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();

        const allowedFields: Record<string, boolean> = {
            isApproved: true, platformFeePercent: true,
            name: true, location: true, city: true, address: true,
            price: true, type: true, gender: true, description: true,
            deposit: true, lockIn: true, amenities: true,
        };

        const data: any = {};
        for (const key of Object.keys(body)) {
            if (allowedFields[key]) data[key] = body[key];
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const property = await prisma.property.update({
            where: { id },
            data,
            include: { owner: { select: { name: true, phone: true, email: true } } },
        });

        return NextResponse.json({ property });
    } catch (error) {
        console.error('Admin property update error:', error);
        return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
    }
}
