import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserId } from '@/lib/auth';

// GET — fetch bank accounts for a user
export async function GET(request: Request) {
    try {
        const userId = getUserId(request);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const accounts = await prisma.bankAccount.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ accounts });
    } catch (error) {
        console.error('Bank account fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch bank accounts' }, { status: 500 });
    }
}

// POST — add a new bank account
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { accountHolder, accountNumber, ifscCode, bankName } = body;
        const userId = getUserId(request);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!accountHolder || !accountNumber || !ifscCode || !bankName) {
            return NextResponse.json({ error: 'All account fields are required' }, { status: 400 });
        }

        // If this is the first account, make it primary. Otherwise, set existing ones to non-primary.
        const existingCount = await prisma.bankAccount.count({ where: { userId } });
        if (existingCount > 0) {
            await prisma.bankAccount.updateMany({ where: { userId }, data: { isPrimary: false } });
        }

        const account = await prisma.bankAccount.create({
            data: { userId, accountHolder, accountNumber, ifscCode, bankName, isPrimary: true },
        });

        return NextResponse.json({ account }, { status: 201 });
    } catch (error) {
        console.error('Bank account create error:', error);
        return NextResponse.json({ error: 'Failed to create bank account' }, { status: 500 });
    }
}
