import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        // Basic security for cron (in production, use headers to secure this endpoint)
        const fiveDaysFromNow = new Date();
        fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

        // Find active Bookings where nextRentDate <= 5 days from now
        const activeBookings = await prisma.booking.findMany({
            where: {
                status: 'CONFIRMED',
                nextRentDate: {
                    lte: fiveDaysFromNow,
                }
            }
        });

        const generatedInvoices = [];

        for (const booking of activeBookings) {
            // Create a Payment record (Type: MONTHLY_RENT, Status: PENDING)
            const paymentDate = booking.nextRentDate || new Date();

            const payment = await prisma.payment.create({
                data: {
                    amount: booking.amount,
                    status: 'PENDING',
                    invoiceType: 'MONTHLY_RENT',
                    dueDate: paymentDate,
                    tenantId: booking.tenantId,
                    bookingId: booking.id,
                }
            });

            // Update booking nextRentDate to next month
            const nextDate = new Date(paymentDate);
            nextDate.setMonth(nextDate.getMonth() + 1);

            await prisma.booking.update({
                where: { id: booking.id },
                data: { nextRentDate: nextDate }
            });

            generatedInvoices.push(payment);
        }

        return NextResponse.json({ success: true, count: generatedInvoices.length, generatedInvoices });
    } catch (error) {
        console.error("Cron Error:", error);
        return NextResponse.json({ success: false, error: "Failed to generate invoices" }, { status: 500 });
    }
}
