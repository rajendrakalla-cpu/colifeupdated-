import { NextResponse } from 'next/server';
import { PrismaClient, Role, KycStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, name, role = 'TENANT' } = body;

        if (!phone || !name) {
            return NextResponse.json({ error: 'Phone and Name are required' }, { status: 400 });
        }

        // Mock generating an email since email is required unique in our mock schema 
        // but perhaps not strictly collected at phone registration
        const mockEmail = `${phone}@colifemock.com`;

        const user = await prisma.user.create({
            data: {
                phone,
                name,
                email: mockEmail,
                role: role as Role,
                kycStatus: KycStatus.PENDING,
            }
        });

        // Simulating the access token using the user email like the OTP verify route
        return NextResponse.json({
            accessToken: user.email,
            user
        }, { status: 201 });
    } catch (error) {
        console.error('Error registering user:', error);
        return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
    }
}
