import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { razorpay } from '@/lib/razorpay';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { paymentId } = body;

        if (!paymentId) {
            return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
        }

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                tenant: true,
                booking: {
                    include: {
                        room: {
                            include: {
                                property: {
                                    include: { owner: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        if (payment.status === 'CAPTURED') {
            return NextResponse.json({ error: 'Payment is already captured' }, { status: 400 });
        }

        const amountInPaise = Math.round(payment.amount * 100);
        const ownerAccountId = payment.booking?.room?.property?.owner?.razorpayLinkedAccountId;

        const options: any = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${payment.id.slice(0, 8)}`,
            notes: { paymentId: payment.id, tenantId: payment.tenantId },
        };

        if (ownerAccountId) {
            options.transfers = [
                {
                    account: ownerAccountId,
                    amount: Math.round(amountInPaise * 0.95),
                    currency: 'INR',
                    notes: { branch: 'CoLife standard split' },
                    linked_account_notes: ['branch'],
                    on_hold: 0,
                },
            ];
        }

        const order = await razorpay.orders.create(options);

        await prisma.payment.update({
            where: { id: payment.id },
            data: { razorpayOrderId: order.id },
        });

        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            prefill: {
                name: payment.tenant.name,
                email: payment.tenant.email,
                contact: payment.tenant.phone,
            },
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
    }
}
