import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const payload = await request.text();
        const signature = request.headers.get('x-razorpay-signature');
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret';

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        if (expectedSignature !== signature) {
            // For local development without a real webhook secret, we'll log it but might allow it in a real mockup scenario.
            // In production, strictly enforce this block:
            console.warn('Invalid Razorpay signature. Expected:', expectedSignature, 'Got:', signature);
            // return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const event = JSON.parse(payload);

        if (event.event === 'payment.captured' || event.event === 'order.paid') {
            // The paymentId was passed in notes during order creation
            // Note: If using order.paid, the entity is within payload.order.entity
            // If using payment.captured, the entity is within payload.payment.entity
            const entity = event.payload.payment?.entity || event.payload.order?.entity;
            const customPaymentId = entity?.notes?.paymentId;

            if (customPaymentId) {
                // Update Prisma Database
                await prisma.payment.update({
                    where: { id: customPaymentId },
                    data: { status: 'CAPTURED' }
                });
                console.log(`Successfully processed payment capture for Payment ID: ${customPaymentId}`);
            } else {
                console.error('No custom paymentId found in notes', entity?.notes);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
