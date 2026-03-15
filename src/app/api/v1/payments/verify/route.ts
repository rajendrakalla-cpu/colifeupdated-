import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const user = await getUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = await request.json();

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return NextResponse.json({ error: 'Missing Razorpay verification fields' }, { status: 400 });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
        }

        // Verify Razorpay signature
        const body = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpaySignature) {
            return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
        }

        // Update payment record if paymentId provided
        if (paymentId) {
            await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'CAPTURED',
                    razorpayPaymentId,
                },
            });
        }

        return NextResponse.json({ success: true, message: 'Payment verified successfully' });
    } catch (error) {
        console.error('Error verifying payment:', error);
        return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
    }
}
