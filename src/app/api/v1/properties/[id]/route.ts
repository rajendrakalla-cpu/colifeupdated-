import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const property = await prisma.property.findUnique({
            where: { id },
            include: {
                rooms: {
                    include: {
                        beds: true
                    }
                },
                owner: {
                    select: {
                        name: true,
                        phone: true,
                        avatar: true
                    }
                }
            }
        });

        if (!property) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 });
        }

        // Calculate occupancy
        let totalBeds = 0;
        let occupiedBeds = 0;

        property.rooms.forEach(room => {
            totalBeds += room.capacity;
            room.beds.forEach(bed => {
                if (bed.isOccupied) occupiedBeds++;
            });
        });

        return NextResponse.json({
            ...property,
            totalBeds,
            occupiedBeds,
            occupancy: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
            manager: property.owner // Map owner to manager for frontend compatibility
        });

    } catch (error) {
        console.error('Error fetching property:', error);
        return NextResponse.json({ error: 'Failed to fetch property details' }, { status: 500 });
    }
}
