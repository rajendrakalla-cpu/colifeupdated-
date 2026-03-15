import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';

export async function POST(request: Request) {
    try {
        const { phone, otp } = await request.json();

        if (!phone || !otp) {
            return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
        }

        // TODO: replace with real OTP provider (e.g. Twilio Verify, MSG91)
        // For now, accept any 6-digit code in development; require env-based code in production
        const isValidOtp =
            process.env.NODE_ENV !== 'production'
                ? /^\d{4,6}$/.test(otp)
                : otp === process.env.OTP_BYPASS_CODE; // set only for automated tests

        if (!isValidOtp) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
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
            return NextResponse.json({
                isRegistered: false,
                message: 'OTP verified. Please complete registration.',
            });
        }

        const accessToken = await signToken({ userId: user.id, email: user.email ?? null, role: user.role });

        return NextResponse.json({ isRegistered: true, accessToken, user });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
    }
}
