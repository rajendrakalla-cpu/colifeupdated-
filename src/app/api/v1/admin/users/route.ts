import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const role = url.searchParams.get('role');
        const search = url.searchParams.get('search');

        const where: any = {};
        if (role) where.role = role;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const users = await prisma.user.findMany({
            where,
            include: {
                bankAccounts: true,
                _count: { select: { properties: true, bookings: true, payments: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Admin users error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, phone, email, role, gender } = body;

        if (!name || !phone || !role) {
            return NextResponse.json({ error: 'name, phone, and role are required' }, { status: 400 });
        }

        // Check if phone already exists
        const existing = await prisma.user.findUnique({ where: { phone } });
        if (existing) {
            return NextResponse.json({ error: 'A user with this phone number already exists' }, { status: 409 });
        }

        const user = await prisma.user.create({
            data: {
                name,
                phone,
                email: email ?? null,
                role,
                gender: gender || 'MALE',
                kycStatus: 'PENDING',
                isActive: true,
            },
        });

        return NextResponse.json({ user }, { status: 201 });
    } catch (error) {
        console.error('Admin user create error:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
