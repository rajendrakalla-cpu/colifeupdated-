import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const user = await getUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { bookingId, amount, method } = body;

        if (!bookingId || !amount || !method) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                tenant: true,
                room: { include: { property: true } },
            },
        });

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Only the property owner (or admin) can record payments
        if (user.role !== 'ADMIN' && booking.room.property.ownerId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (method === 'CASH') {
            const payment = await prisma.payment.create({
                data: {
                    amount: parseFloat(amount),
                    status: 'CAPTURED',
                    tenantId: booking.tenantId,
                    bookingId: bookingId,
                    razorpayPaymentId: `CASH_${Date.now()}`,
                    paidDate: new Date(),
                },
            });
            return NextResponse.json({ message: 'Cash payment recorded successfully', payment });
        } else if (method === 'LINK') {
            // Create a PENDING payment record — tenant pays via Razorpay from their dashboard
            const payment = await prisma.payment.create({
                data: {
                    amount: parseFloat(amount),
                    status: 'PENDING',
                    tenantId: booking.tenantId,
                    bookingId: bookingId,
                },
            });
            return NextResponse.json({ message: 'Payment request raised. Tenant will see it in their dashboard.', payment });
        }

        return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    } catch (error) {
        console.error('Payment collection error:', error);
        return NextResponse.json({ error: 'Failed to collect payment' }, { status: 500 });
    }
}
