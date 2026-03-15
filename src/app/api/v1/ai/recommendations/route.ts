import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);
        const userId = getUserId(request);

        // Fetch approved properties
        const properties = await prisma.property.findMany({
            where: { isApproved: true },
            include: {
                rooms: { include: { beds: true } },
            },
            take: 50,
            orderBy: { createdAt: 'desc' },
        });

        // If user is logged in, personalize based on booking history
        let userCities: string[] = [];
        let userBookedIds: string[] = [];

        if (userId) {
            const bookings = await prisma.booking.findMany({
                where: { tenantId: userId },
                include: { property: { select: { city: true, id: true } } },
                take: 10,
            });
            userCities = [...new Set(bookings.map((b: any) => b.property.city).filter(Boolean))];
            userBookedIds = bookings.map((b: any) => b.propertyId);
        }

        // Score each property
        const scored = properties
            .filter((p) => !userBookedIds.includes(p.id))
            .map((p) => {
                let score = 50;
                const reasons: string[] = [];

                if (userCities.includes(p.city)) {
                    score += 30;
                    reasons.push('Familiar location');
                }

                let totalBeds = 0;
                let availableBeds = 0;
                p.rooms.forEach((r) => {
                    totalBeds += r.capacity;
                    r.beds.forEach((b) => { if (!b.isOccupied) availableBeds++; });
                });

                if (availableBeds > 0) {
                    score += 20;
                    reasons.push(`${availableBeds} bed${availableBeds > 1 ? 's' : ''} available`);
                }

                const daysOld = (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24);
                if (daysOld < 30) {
                    score += 15;
                    reasons.push('Recently listed');
                }

                if (p.amenities.length >= 5) {
                    score += 10;
                    reasons.push('Premium amenities');
                }

                if (reasons.length === 0) reasons.push('Popular choice');

                return {
                    score,
                    reasons,
                    property: {
                        ...p,
                        totalBeds,
                        availableBeds,
                        occupancy: totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0,
                    },
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return NextResponse.json(scored);
    } catch (error) {
        console.error('Error fetching AI recommendations:', error);
        return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
    }
}
