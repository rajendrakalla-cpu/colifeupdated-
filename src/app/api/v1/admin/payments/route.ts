import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');

        const where: any = {};
        if (status === 'PENDING') where.status = 'PENDING';
        if (status === 'CAPTURED') where.status = 'CAPTURED';

        const payments = await prisma.payment.findMany({
            where,
            include: {
                tenant: { select: { name: true, phone: true } },
                booking: {
                    include: {
                        room: {
                            include: {
                                property: { select: { name: true, city: true, platformFeePercent: true, owner: { select: { name: true } } } },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const totalRevenue = payments
            .filter(p => p.status === 'CAPTURED')
            .reduce((sum, p) => sum + p.amount, 0);

        const platformRevenue = payments
            .filter(p => p.status === 'CAPTURED')
            .reduce((sum, p) => {
                const feePercent = p.booking?.room?.property?.platformFeePercent || 5;
                return sum + (p.amount * feePercent / 100);
            }, 0);

        return NextResponse.json({ payments, totalRevenue, platformRevenue });
    } catch (error) {
        console.error('Admin payments error:', error);
        return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }
}
