import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PATCH — update ticket status, optionally create utility charge
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, chargeAmount, chargeDescription } = body;

        // Update the ticket status
        const ticket = await prisma.ticket.update({
            where: { id },
            data: { status },
            include: { tenant: true, property: true },
        });

        // If resolving with a utility charge, create a UTILITY payment for the tenant
        if (status === 'RESOLVED' && chargeAmount && chargeAmount > 0) {
            // Find the tenant's active booking for this property
            const booking = await prisma.booking.findFirst({
                where: {
                    tenantId: ticket.tenantId,
                    status: 'CONFIRMED',
                    bed: { room: { propertyId: ticket.propertyId } },
                },
            });

            if (booking) {
                await prisma.payment.create({
                    data: {
                        amount: parseFloat(chargeAmount),
                        status: 'PENDING',
                        invoiceType: 'UTILITY',
                        tenantId: ticket.tenantId,
                        bookingId: booking.id,
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // due in 7 days
                        razorpayOrderId: null,
                        razorpayPaymentId: null,
                        paidDate: null,
                    },
                });
            }
        }

        return NextResponse.json({ ticket });
    } catch (error) {
        console.error('Ticket update error:', error);
        return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
    }
}
