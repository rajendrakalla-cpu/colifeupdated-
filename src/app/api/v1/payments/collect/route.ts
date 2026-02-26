import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { bookingId, amount, method } = body;

        if (!bookingId || !amount || !method) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { tenant: true },
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        if (method === 'CASH') {
            // Record a manual cash payment as COMPLETED immediately
            const payment = await prisma.payment.create({
                data: {
                    amount: parseFloat(amount),
                    status: 'CAPTURED', // Assuming CAPTURED is used for successful payments
                    tenantId: booking.tenantId,
                    bookingId: bookingId,
                    razorpayPaymentId: `CASH_${Date.now()}`,
                },
            });

            return NextResponse.json({ message: 'Cash payment recorded successfully', payment });
        } else if (method === 'LINK') {
            // Simulate sending a payment link
            return NextResponse.json({ message: 'Payment link sent to tenant successfully' });
        }

        return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    } catch (error) {
        console.error('Payment collection error:', error);
        return NextResponse.json({ error: 'Failed to collect payment' }, { status: 500 });
    }
}
