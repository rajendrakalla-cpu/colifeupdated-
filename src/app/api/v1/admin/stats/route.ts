import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const [totalUsers, totalProperties, totalPayments, users, properties, payments] = await Promise.all([
            prisma.user.count(),
            prisma.property.count(),
            prisma.payment.count(),
            prisma.user.groupBy({ by: ['role'], _count: true }),
            prisma.property.aggregate({ _count: true, where: { isApproved: false } }),
            prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'CAPTURED' } }),
        ]);

        // Occupancy
        const totalBeds = await prisma.bed.count();
        const occupiedBeds = await prisma.bed.count({ where: { isOccupied: true } });

        // Revenue by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const recentPayments = await prisma.payment.findMany({
            where: { status: 'CAPTURED', createdAt: { gte: sixMonthsAgo } },
            select: { amount: true, createdAt: true },
        });

        const revenueByMonth: Record<string, number> = {};
        recentPayments.forEach(p => {
            const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, '0')}`;
            revenueByMonth[key] = (revenueByMonth[key] || 0) + p.amount;
        });

        const roleBreakdown: Record<string, number> = {};
        users.forEach(u => { roleBreakdown[u.role] = u._count; });

        return NextResponse.json({
            totalUsers,
            totalProperties,
            totalPayments,
            pendingApprovals: properties._count,
            totalRevenue: payments._sum.amount || 0,
            totalBeds,
            occupiedBeds,
            occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
            roleBreakdown,
            revenueByMonth,
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
