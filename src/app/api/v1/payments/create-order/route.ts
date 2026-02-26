import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Initialize Razorpay instance securely
// Ensure these keys are added to .env in production
const rzp = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SKwi3vNDCmbB2f',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '5IBD7EkjI4JpVLVXclzpAG8B',
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { paymentId } = body;

        if (!paymentId) {
            return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
        }

        // Fetch the pending payment from the database
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                tenant: true,
                booking: {
                    include: {
                        room: {
                            include: {
                                property: {
                                    include: {
                                        owner: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        if (payment.status === 'CAPTURED') {
            return NextResponse.json({ error: 'Payment is already captured' }, { status: 400 });
        }

        // Create an order via Razorpay SDK
        // Razorpay accepts amounts in the smallest currency unit (paise for INR)
        const amountInPaise = Math.round(payment.amount * 100);

        const ownerAccountId = payment.booking?.room?.property?.owner?.razorpayLinkedAccountId;

        const options: any = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${payment.id.slice(0, 8)}`,
            notes: {
                paymentId: payment.id,
                tenantId: payment.tenantId,
            }
        };

        // If the owner has a linked account, route 95% of the funds to them
        if (ownerAccountId) {
            options.transfers = [
                {
                    account: ownerAccountId,
                    amount: Math.round(amountInPaise * 0.95), // Platform takes 5%
                    currency: 'INR',
                    notes: {
                        branch: "CoLife standard split"
                    },
                    linked_account_notes: ["branch"],
                    on_hold: 0
                }
            ];
        }

        const order = await rzp.orders.create(options);

        // Update the payment record with the Razorpay Order ID for tracking
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                razorpayOrderId: order.id
            }
        });

        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SKwi3vNDCmbB2f',
            prefill: {
                name: payment.tenant.name,
                email: payment.tenant.email,
                contact: payment.tenant.phone,
            }
        });

    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
    }
}
