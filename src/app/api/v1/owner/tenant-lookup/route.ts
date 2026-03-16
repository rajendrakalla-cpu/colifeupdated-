import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const user = await getUser(request);
        if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');

        if (!phone) {
            return NextResponse.json({ error: 'phone query parameter is required' }, { status: 400 });
        }

        const tenant = await prisma.user.findUnique({
            where: { phone },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                gender: true,
                role: true,
                kycStatus: true,
            },
        });

        if (!tenant) {
            return NextResponse.json({ found: false });
        }

        return NextResponse.json({ found: true, user: tenant });
    } catch (error) {
        console.error('Tenant lookup error:', error);
        return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
    }
}
