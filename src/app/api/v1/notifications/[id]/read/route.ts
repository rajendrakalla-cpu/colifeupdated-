import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        await prisma.notification.updateMany({
            where: { id, userId: user.id },
            data: { isRead: true },
        });

        return NextResponse.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification:', error);
        return NextResponse.json({ error: 'Failed to mark notification' }, { status: 500 });
    }
}
