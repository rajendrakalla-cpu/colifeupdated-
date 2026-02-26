import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();

        const allowedFields: Record<string, boolean> = {
            name: true, phone: true, email: true, role: true,
            kycStatus: true, isActive: true, gender: true, aadhaarNumber: true,
        };

        const data: any = {};
        for (const key of Object.keys(body)) {
            if (allowedFields[key]) data[key] = body[key];
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        const user = await prisma.user.update({ where: { id }, data });
        return NextResponse.json({ user });
    } catch (error) {
        console.error('Admin user update error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
