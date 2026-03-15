import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';
import { verifyFirebaseToken } from '@/lib/firebase-admin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { firebaseIdToken } = body;

        if (!firebaseIdToken) {
            return NextResponse.json({ error: 'firebaseIdToken is required' }, { status: 400 });
        }

        // Verify the Firebase ID token (this is cryptographically verified by Firebase Admin SDK)
        let decoded: Awaited<ReturnType<typeof verifyFirebaseToken>>;
        try {
            decoded = await verifyFirebaseToken(firebaseIdToken);
        } catch {
            return NextResponse.json({ error: 'Invalid or expired OTP verification' }, { status: 401 });
        }

        // Firebase stores phone number in the token
        const phone = decoded.phone_number;
        if (!phone) {
            return NextResponse.json({ error: 'Phone number not found in token' }, { status: 400 });
        }

        const normalizedPhone = phone.replace(/^\+91/, '');

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { phone },
                    { phone: normalizedPhone },
                    { phone: `+91${normalizedPhone}` },
                ],
            },
        });

        if (!user) {
            // Phone is verified — let frontend proceed to registration
            return NextResponse.json({
                isRegistered: false,
                phone,
                message: 'Phone verified. Please complete registration.',
            });
        }

        const accessToken = await signToken({ userId: user.id, email: user.email ?? null, role: user.role });

        return NextResponse.json({ isRegistered: true, accessToken, user });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
    }
}
