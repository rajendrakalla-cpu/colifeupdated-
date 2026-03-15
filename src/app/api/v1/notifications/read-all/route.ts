import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function PATCH(request: Request) {
    try {
        const user = await getUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await prisma.notification.updateMany({
            where: { userId: user.id, isRead: false },
            data: { isRead: true },
        });

        return NextResponse.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking notifications:', error);
        return NextResponse.json({ error: 'Failed to mark notifications' }, { status: 500 });
    }
}
