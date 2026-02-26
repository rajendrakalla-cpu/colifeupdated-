import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { phone, otp } = await request.json();

        if (!phone || !otp) {
            return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
        }

        // Simulate successful OTP verification for any code
        console.log(`[SIMULATION] Verifying OTP ${otp} for ${phone}`);

        // Normalize phone: strip +91 prefix if present for DB lookup
        const normalizedPhone = phone.replace(/^\+91/, '');

        // Find user by phone — try both with and without prefix
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { phone: phone },
                    { phone: normalizedPhone },
                    { phone: `+91${normalizedPhone}` },
                ]
            }
        });

        if (!user) {
            // User needs to register
            return NextResponse.json({
                isRegistered: false,
                message: 'OTP verified. Please complete registration.'
            });
        }

        // For this frontend mockup architecture, we return the user's email 
        // which will subsequently be utilized as a mocked 'token' in the GET requests
        return NextResponse.json({
            isRegistered: true,
            accessToken: user.email,
            user
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
    }
}
