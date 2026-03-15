import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';
import { Role, KycStatus } from '@prisma/client';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, name, email, role = 'TENANT' } = body;

        if (!phone || !name) {
            return NextResponse.json({ error: 'Phone and Name are required' }, { status: 400 });
        }

        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { phone },
                    ...(email ? [{ email }] : []),
                ],
            },
        });

        if (existing) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const user = await prisma.user.create({
            data: {
                phone,
                name,
                email: email ?? null,
                role: role as Role,
                kycStatus: KycStatus.PENDING,
            },
        });

        const accessToken = await signToken({ userId: user.id, email: user.email ?? null, role: user.role });

        return NextResponse.json({ accessToken, user }, { status: 201 });
    } catch (error) {
        console.error('Error registering user:', error);
        return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
    }
}
