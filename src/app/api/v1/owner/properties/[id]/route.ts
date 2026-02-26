import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // Fetch the property belonging to the owner, including its rooms, beds, and current active bookings.
        const property = await prisma.property.findUnique({
            where: { id },
            include: {
                rooms: {
                    include: {
                        beds: {
                            include: {
                                bookings: {
                                    where: {
                                        status: 'CONFIRMED',
                                    },
                                    include: {
                                        tenant: {
                                            select: {
                                                id: true,
                                                name: true,
                                                phone: true,
                                                avatar: true,
                                                kycStatus: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!property) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 });
        }

        // Fetch all successful/completed payments related to this property
        const payments = await prisma.payment.findMany({
            where: {
                booking: {
                    room: {
                        propertyId: id,
                    },
                },
            },
            include: {
                tenant: {
                    select: {
                        name: true,
                        phone: true,
                    },
                },
                booking: {
                    include: {
                        room: {
                            select: { name: true },
                        },
                        bed: {
                            select: { name: true },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Calculate Overview Metrics
        let totalBeds = 0;
        let occupiedBeds = 0;

        property.rooms.forEach(room => {
            totalBeds += room.beds.length;
            room.beds.forEach(bed => {
                if (bed.isOccupied) occupiedBeds++;
            });
        });

        return NextResponse.json({
            property,
            metrics: {
                totalBeds,
                occupiedBeds,
                occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
            },
            payments,
        });
    } catch (error) {
        console.error('Owner property fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch property details' }, { status: 500 });
    }
}
