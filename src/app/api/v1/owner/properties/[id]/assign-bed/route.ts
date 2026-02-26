import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: propertyId } = await params;
        const body = await request.json();
        const {
            bedId, roomId,
            tenantName, tenantPhone, tenantEmail, tenantGender,
            rentAmount, securityDeposit, lockIn, startDate,
            aadhaarNumber, kycDocument
        } = body;

        if (!bedId || !roomId || !tenantName || !tenantPhone || !rentAmount || !startDate) {
            return NextResponse.json({ error: 'Missing required assignment parameters' }, { status: 400 });
        }

        // Verify the property and bed exist and that the bed is actually vacant
        const bed = await prisma.bed.findUnique({
            where: { id: bedId },
            include: { room: true }
        });

        if (!bed) {
            return NextResponse.json({ error: 'Bed not found' }, { status: 404 });
        }

        if (bed.room.propertyId !== propertyId) {
            return NextResponse.json({ error: 'Bed does not belong to this property' }, { status: 400 });
        }

        if (bed.isOccupied) {
            return NextResponse.json({ error: 'Bed is strongly marked as already occupied' }, { status: 400 });
        }

        // Use a transaction to ensure atomic operations: Upsert User -> Map Booking -> Update Bed
        const result = await prisma.$transaction(async (tx) => {
            // 1. Upsert the User (Tenant) based on their phone number
            const tenant = await tx.user.upsert({
                where: { phone: tenantPhone },
                update: {
                    name: tenantName,
                    email: tenantEmail || null,
                    gender: tenantGender || null,
                    aadhaarNumber: aadhaarNumber || null,
                    kycDocument: kycDocument || null,
                    kycStatus: aadhaarNumber ? 'VERIFIED' : 'PENDING',
                    role: 'TENANT', // Ensure they are marked as a tenant
                },
                create: {
                    phone: tenantPhone,
                    name: tenantName,
                    email: tenantEmail || null,
                    gender: tenantGender || null,
                    aadhaarNumber: aadhaarNumber || null,
                    kycDocument: kycDocument || null,
                    kycStatus: aadhaarNumber ? 'VERIFIED' : 'PENDING',
                    role: 'TENANT',
                },
            });

            // 2. Create the unified Booking record
            const booking = await tx.booking.create({
                data: {
                    tenantId: tenant.id,
                    roomId: roomId,
                    bedId: bedId,
                    status: 'CONFIRMED',
                    startDate: new Date(startDate),
                    amount: parseFloat(rentAmount),
                    securityDeposit: securityDeposit ? parseFloat(securityDeposit) : null,
                    lockIn: lockIn || null,
                }
            });

            // 3. Update the Bed to indicate it's now occupied
            await tx.bed.update({
                where: { id: bedId },
                data: { isOccupied: true }
            });

            return { tenant, booking };
        });

        return NextResponse.json({
            message: 'Tenant assigned successfully',
            tenant: result.tenant,
            booking: result.booking
        });

    } catch (error) {
        console.error('Bed assignment error:', error);
        return NextResponse.json({ error: 'Failed to assign tenant to bed' }, { status: 500 });
    }
}
