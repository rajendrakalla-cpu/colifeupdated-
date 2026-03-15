import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.bankAccount.delete({ where: { id } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Bank account delete error:', error);
        return NextResponse.json({ error: 'Failed to delete bank account' }, { status: 500 });
    }
}
