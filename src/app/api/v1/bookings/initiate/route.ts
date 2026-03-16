import { NextResponse } from 'next/server';
import { BookingStatus, InvoiceType, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { razorpay } from '@/lib/razorpay';

const HOLD_FEE = 500; // ₹500 refundable hold fee

export async function POST(request: Request) {
    try {
        const user = await getUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { propertyId, moveInDate } = body;

        if (!propertyId) {
            return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });
        }

        const startDate = moveInDate ? new Date(moveInDate) : new Date();
        // Default 11-month tenancy
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 11);

        // Find first available bed in property
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            include: {
                rooms: {
                    include: { beds: { where: { isOccupied: false } } },
                },
                owner: true,
            },
        });

        if (!property) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 });
        }

        const availableRoom = property.rooms.find(r => r.beds.length > 0);
        const availableBed = availableRoom?.beds[0];

        if (!availableRoom || !availableBed) {
            return NextResponse.json({ error: 'No beds available in this property' }, { status: 400 });
        }

        // Create booking + hold payment in a transaction, atomically marking the bed occupied
        const { booking, payment } = await prisma.$transaction(async (tx) => {
            // Re-check availability inside the transaction to prevent race conditions
            const bed = await tx.bed.findUnique({ where: { id: availableBed.id } });
            if (!bed || bed.isOccupied) {
                throw new Error('BED_UNAVAILABLE');
            }

            // Mark bed occupied immediately so no concurrent booking can claim it
            await tx.bed.update({
                where: { id: availableBed.id },
                data: { isOccupied: true },
            });

            const booking = await tx.booking.create({
                data: {
                    tenantId: user.id,
                    roomId: availableRoom.id,
                    bedId: availableBed.id,
                    status: BookingStatus.PENDING,
                    startDate,
                    endDate,
                    amount: availableRoom.price,
                },
            });

            const payment = await tx.payment.create({
                data: {
                    tenantId: user.id,
                    bookingId: booking.id,
                    amount: HOLD_FEE,
                    status: PaymentStatus.PENDING,
                    invoiceType: InvoiceType.MOVE_IN,
                    dueDate: new Date(),
                },
            });

            return { booking, payment };
        });

        // Create Razorpay order
        const ownerAccountId = property.owner?.razorpayLinkedAccountId;
        const amountInPaise = HOLD_FEE * 100;

        const orderOptions: any = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `hold_${booking.id.slice(0, 8)}`,
            notes: { paymentId: payment.id, bookingId: booking.id, tenantId: user.id, type: 'hold_fee' },
        };

        if (ownerAccountId) {
            orderOptions.transfers = [{
                account: ownerAccountId,
                amount: Math.round(amountInPaise * 0.95),
                currency: 'INR',
                on_hold: 0,
            }];
        }

        const order = await razorpay.orders.create(orderOptions);

        await prisma.payment.update({
            where: { id: payment.id },
            data: { razorpayOrderId: order.id },
        });

        return NextResponse.json({
            bookingId: booking.id,
            paymentId: payment.id,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            prefill: {
                name: user.name,
                email: user.email ?? '',
                contact: user.phone,
            },
            propertyName: property.name,
        });
    } catch (error) {
        console.error('Error initiating booking:', error);
        return NextResponse.json({ error: 'Failed to initiate booking' }, { status: 500 });
    }
}
