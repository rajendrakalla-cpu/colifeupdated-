import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const { paymentId, description, amount } = await req.json();

        if (!paymentId || !description || amount === undefined) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // Create a UtilityLineItem
            const lineItem = await tx.utilityLineItem.create({
                data: {
                    paymentId,
                    description,
                    amount: Number(amount)
                }
            });

            // Update the parent Payment total amount
            const updatedPayment = await tx.payment.update({
                where: { id: paymentId },
                data: {
                    amount: {
                        increment: Number(amount)
                    }
                }
            });

            return { lineItem, updatedPayment };
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error("Add Charge Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Failed to add charge" }, { status: 500 });
    }
}
