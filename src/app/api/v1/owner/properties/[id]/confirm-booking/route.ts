import { NextResponse } from 'next/server';
import { InvoiceType, PaymentStatus, BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

const HOLD_FEE = 500; // ₹500 already collected as hold/booking fee

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id: propertyId } = await params;
        const body = await request.json();
        const { bookingId, depositAmount, rentAmount, paymentMethod, splitPayment } = body;

        if (!bookingId || !rentAmount || !paymentMethod) {
            return NextResponse.json(
                { error: 'bookingId, rentAmount, and paymentMethod are required' },
                { status: 400 }
            );
        }

        if (!['CASH', 'LINK'].includes(paymentMethod)) {
            return NextResponse.json({ error: 'paymentMethod must be CASH or LINK' }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                room: { include: { property: true } },
            },
        });

        if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

        if (booking.room.propertyId !== propertyId) {
            return NextResponse.json({ error: 'Booking does not belong to this property' }, { status: 400 });
        }

        if (user.role === 'OWNER' && booking.room.property.ownerId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (booking.status !== BookingStatus.PENDING) {
            return NextResponse.json({ error: 'Booking is not in PENDING state' }, { status: 400 });
        }

        const deposit = depositAmount ? parseFloat(String(depositAmount)) : 0;
        const rent = parseFloat(String(rentAmount));
        const isCapture = paymentMethod === 'CASH';

        const result = await prisma.$transaction(async (tx) => {
            const createdPayments: any[] = [];

            if (splitPayment && deposit > 0) {
                // Separate deposit payment (full deposit — no hold fee deduction on deposit)
                const depositPayment = await tx.payment.create({
                    data: {
                        tenantId: booking.tenantId,
                        bookingId: booking.id,
                        amount: deposit,
                        status: isCapture ? PaymentStatus.CAPTURED : PaymentStatus.PENDING,
                        invoiceType: InvoiceType.SECURITY_DEPOSIT,
                        dueDate: new Date(),
                        paidDate: isCapture ? new Date() : null,
                    },
                });
                createdPayments.push(depositPayment);

                // Rent minus hold fee already paid
                const netRent = Math.max(0, rent - HOLD_FEE);
                if (netRent > 0) {
                    const rentPayment = await tx.payment.create({
                        data: {
                            tenantId: booking.tenantId,
                            bookingId: booking.id,
                            amount: netRent,
                            status: isCapture ? PaymentStatus.CAPTURED : PaymentStatus.PENDING,
                            invoiceType: InvoiceType.MOVE_IN,
                            dueDate: new Date(),
                            paidDate: isCapture ? new Date() : null,
                        },
                    });
                    createdPayments.push(rentPayment);
                }
            } else {
                // Single combined payment: (deposit + rent) - hold fee already paid
                const netTotal = Math.max(0, deposit + rent - HOLD_FEE);
                if (netTotal > 0) {
                    const combined = await tx.payment.create({
                        data: {
                            tenantId: booking.tenantId,
                            bookingId: booking.id,
                            amount: netTotal,
                            status: isCapture ? PaymentStatus.CAPTURED : PaymentStatus.PENDING,
                            invoiceType: InvoiceType.MOVE_IN,
                            dueDate: new Date(),
                            paidDate: isCapture ? new Date() : null,
                        },
                    });
                    createdPayments.push(combined);
                }
            }

            const confirmedBooking = await tx.booking.update({
                where: { id: booking.id },
                data: {
                    status: BookingStatus.CONFIRMED,
                    securityDeposit: deposit > 0 ? deposit : null,
                },
            });

            return { booking: confirmedBooking, payments: createdPayments };
        });

        return NextResponse.json({
            message: 'Booking confirmed successfully',
            booking: result.booking,
            payments: result.payments,
        });
    } catch (error) {
        console.error('Confirm booking error:', error);
        return NextResponse.json({ error: 'Failed to confirm booking' }, { status: 500 });
    }
}
