import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { bookingId, deductions, moveOutDate } = await req.json();

        if (!bookingId || deductions === undefined) {
            return NextResponse.json({ error: "Booking ID and deductions are required" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const booking = await tx.booking.findUnique({
                where: { id: bookingId }
            });

            if (!booking) throw new Error("Booking not found");

            const securityDeposit = booking.securityDeposit || 0;
            const refundAmount = securityDeposit - Number(deductions);

            // 1. Mark Booking status as COMPLETED
            const updatedBooking = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'COMPLETED',
                    endDate: new Date(moveOutDate || Date.now())
                }
            });

            // 2. CRITICAL: Update the linked Bed status to AVAILABLE
            await tx.bed.update({
                where: { id: booking.bedId },
                data: { isOccupied: false }
            });

            // 3. Record the final settlement Payment entry
            const settlementPayment = await tx.payment.create({
                data: {
                    amount: Math.abs(refundAmount),
                    // If refundAmount is positive, it's a refund that the owner owes to the tenant
                    // If refundAmount is negative, it's an amount the tenant owes the owner
                    status: refundAmount >= 0 ? 'REFUNDED' : 'PENDING',
                    invoiceType: 'SECURITY_DEPOSIT',
                    dueDate: new Date(moveOutDate || Date.now()),
                    tenantId: booking.tenantId,
                    bookingId: booking.id,
                }
            });

            return {
                updatedBooking,
                settlementPayment,
                securityDeposit,
                deductions: Number(deductions),
                netRefund: refundAmount
            };
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error("Move-Out Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
