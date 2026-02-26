import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const city = searchParams.get('city');
        const type = searchParams.get('type');
        const gender = searchParams.get('gender');

        const skip = (page - 1) * limit;

        const whereClause: any = {
            isApproved: true,
        };

        if (city) whereClause.city = city;
        if (type) whereClause.type = type;
        if (gender) whereClause.gender = gender;

        const [properties, total] = await Promise.all([
            prisma.property.findMany({
                where: whereClause,
                include: {
                    rooms: {
                        include: {
                            beds: true
                        }
                    }
                },
                skip,
                take: limit,
            }),
            prisma.property.count({ where: whereClause })
        ]);

        // Format the response to match the frontend expectations
        const formattedProperties = properties.map(property => {
            let totalBeds = 0;
            let occupiedBeds = 0;

            property.rooms.forEach(room => {
                totalBeds += room.capacity;
                room.beds.forEach(bed => {
                    if (bed.isOccupied) occupiedBeds++;
                });
            });

            return {
                ...property,
                totalBeds,
                occupiedBeds,
                occupancy: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
            };
        });

        return NextResponse.json({
            properties: formattedProperties,
            total,
            page,
            limit,
        });

    } catch (error) {
        console.error('Error fetching properties:', error);
        return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
    }
}

// Utility for mocking auth
async function getAuthenticatedUser(request: Request) {
    const { searchParams } = new URL(request.url);
    const mockEmail = searchParams.get('mockEmail');
    if (!mockEmail) return null;
    return prisma.user.findUnique({ where: { email: mockEmail } });
}

export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser(request);
        if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Only property owners can create properties' }, { status: 403 });
        }

        const body = await request.json();
        const {
            name, location, city, address, price, originalPrice,
            type, gender, amenities, description, highlights,
            availableFrom, deposit, lockIn, images,
            lat, lng, ownerId: explicitOwnerId,
            rooms: roomsInput // [{ name, type, capacity, price }]
        } = body;

        // Validate required fields
        if (!name || !city || !address || !price || !type || !gender) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Admin can assign property to a specific owner
        const propertyOwnerId = (user.role === 'ADMIN' && explicitOwnerId) ? explicitOwnerId : user.id;

        // Create property + rooms + beds in a single transaction
        const property = await prisma.$transaction(async (tx) => {
            const newProperty = await tx.property.create({
                data: {
                    name,
                    location: location || city,
                    city,
                    address,
                    price: parseFloat(price),
                    originalPrice: originalPrice ? parseFloat(originalPrice) : null,
                    type,
                    gender,
                    amenities: amenities || [],
                    images: images || [],
                    description: description || '',
                    highlights: highlights || [],
                    availableFrom: availableFrom ? new Date(availableFrom) : new Date(),
                    deposit: deposit ? parseFloat(deposit) : parseFloat(price) * 2,
                    lockIn: lockIn || '3 months',
                    lat: lat ? parseFloat(lat) : null,
                    lng: lng ? parseFloat(lng) : null,
                    isApproved: true, // Auto-approve for demo
                    ownerId: propertyOwnerId,
                }
            });

            // Create rooms and beds
            const roomsToCreate = roomsInput && roomsInput.length > 0
                ? roomsInput
                : [{ name: 'Room 101', type: 'Double Sharing', capacity: 2, price: parseFloat(price) }];

            for (const roomData of roomsToCreate) {
                const room = await tx.room.create({
                    data: {
                        name: roomData.name,
                        type: roomData.type,
                        capacity: parseInt(roomData.capacity),
                        price: parseFloat(roomData.price || price),
                        propertyId: newProperty.id,
                    }
                });

                // Auto-create beds based on room capacity
                const capacity = parseInt(roomData.capacity);
                for (let i = 1; i <= capacity; i++) {
                    await tx.bed.create({
                        data: {
                            name: `Bed ${String.fromCharCode(64 + i)}`, // Bed A, Bed B, etc.
                            isOccupied: false,
                            roomId: room.id,
                        }
                    });
                }
            }

            return tx.property.findUnique({
                where: { id: newProperty.id },
                include: { rooms: { include: { beds: true } } }
            });
        });

        return NextResponse.json(property, { status: 201 });

    } catch (error) {
        console.error('Error creating property:', error);
        return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
    }
}
