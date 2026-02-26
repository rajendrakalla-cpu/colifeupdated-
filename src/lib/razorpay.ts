import Razorpay from "razorpay";

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay environment variables are not defined");
}

export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function createOrder({
    amount,
    receipt,
    ownerAccountId,
}: {
    amount: number;
    receipt: string;
    ownerAccountId?: string;
}) {
    const options: any = {
        amount: amount * 100, // Razorpay works in paise
        currency: "INR",
        receipt,
    };

    // If we have an owner linked account, transfer 98% (or whatever logic) to them
    // Platform keeps 2%
    if (ownerAccountId) {
        const ownerShare = Math.round(amount * 100 * 0.98);
        options.transfers = [
            {
                account: ownerAccountId,
                amount: ownerShare,
                currency: "INR",
                notes: {
                    receipt,
                },
                on_hold: false,
            },
        ];
    }

    return await razorpay.orders.create(options);
}
