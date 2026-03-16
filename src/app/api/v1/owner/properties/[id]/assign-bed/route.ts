import { NextResponse } from 'next/server';
import { InvoiceType, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id: propertyId } = await params;
        const body = await request.json();
        const {
            bedId, roomId,
            tenantName, tenantPhone, tenantEmail, tenantGender,
            rentAmount, securityDeposit, lockIn, startDate,
            aadhaarNumber, kycDocument,
            paymentMethod, splitPayment,
        } = body;

        if (!bedId || !roomId || !tenantName || !tenantPhone || !rentAmount || !startDate) {
            return NextResponse.json({ error: 'Missing required assignment parameters' }, { status: 400 });
        }

        const bed = await prisma.bed.findUnique({
            where: { id: bedId },
            include: { room: { include: { property: true } } },
        });

        if (!bed) return NextResponse.json({ error: 'Bed not found' }, { status: 404 });
        if (bed.room.propertyId !== propertyId) {
            return NextResponse.json({ error: 'Bed does not belong to this property' }, { status: 400 });
        }
        if (user.role === 'OWNER' && bed.room.property.ownerId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (bed.isOccupied) {
            return NextResponse.json({ error: 'Bed is already occupied' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Upsert tenant user
            const tenant = await tx.user.upsert({
                where: { phone: tenantPhone },
                update: {
                    name: tenantName,
                    email: tenantEmail || null,
                    gender: tenantGender || null,
                    aadhaarNumber: aadhaarNumber || null,
                    kycDocument: kycDocument || null,
                    kycStatus: aadhaarNumber ? 'VERIFIED' : 'PENDING',
                    role: 'TENANT',
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

            const booking = await tx.booking.create({
                data: {
                    tenantId: tenant.id,
                    roomId,
                    bedId,
                    status: 'CONFIRMED',
                    startDate: new Date(startDate),
                    amount: parseFloat(rentAmount),
                    securityDeposit: securityDeposit ? parseFloat(securityDeposit) : null,
                    lockIn: lockIn || null,
                },
            });

            await tx.bed.update({ where: { id: bedId }, data: { isOccupied: true } });

            // Create payment records if a payment method is specified
            if (paymentMethod && paymentMethod !== 'NONE') {
                const isCapture = paymentMethod === 'CASH';
                const rent = parseFloat(rentAmount);
                const dep = securityDeposit ? parseFloat(securityDeposit) : 0;

                if (splitPayment && dep > 0) {
                    await tx.payment.create({
                        data: {
                            tenantId: tenant.id,
                            bookingId: booking.id,
                            amount: dep,
                            status: isCapture ? PaymentStatus.CAPTURED : PaymentStatus.PENDING,
                            invoiceType: InvoiceType.SECURITY_DEPOSIT,
                            dueDate: new Date(),
                            paidDate: isCapture ? new Date() : null,
                        },
                    });
                    if (rent > 0) {
                        await tx.payment.create({
                            data: {
                                tenantId: tenant.id,
                                bookingId: booking.id,
                                amount: rent,
                                status: isCapture ? PaymentStatus.CAPTURED : PaymentStatus.PENDING,
                                invoiceType: InvoiceType.MOVE_IN,
                                dueDate: new Date(),
                                paidDate: isCapture ? new Date() : null,
                            },
                        });
                    }
                } else {
                    const total = dep + rent;
                    if (total > 0) {
                        await tx.payment.create({
                            data: {
                                tenantId: tenant.id,
                                bookingId: booking.id,
                                amount: total,
                                status: isCapture ? PaymentStatus.CAPTURED : PaymentStatus.PENDING,
                                invoiceType: InvoiceType.MOVE_IN,
                                dueDate: new Date(),
                                paidDate: isCapture ? new Date() : null,
                            },
                        });
                    }
                }
            }

            return { tenant, booking };
        });

        return NextResponse.json({
            message: 'Tenant assigned successfully',
            tenant: result.tenant,
            booking: result.booking,
        });
    } catch (error) {
        console.error('Bed assignment error:', error);
        return NextResponse.json({ error: 'Failed to assign tenant to bed' }, { status: 500 });
    }
}
