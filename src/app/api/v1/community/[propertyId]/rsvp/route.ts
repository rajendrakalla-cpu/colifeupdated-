import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

// POST — tenant RSVPs to an event
export async function POST(request: Request, { params }: { params: Promise<{ propertyId: string }> }) {
    try {
        const user = await getUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { postId, status } = body;

        if (!postId || !status) {
            return NextResponse.json({ error: 'postId and status are required' }, { status: 400 });
        }

        // Upsert — update if already RSVP'd, create if not
        const rsvp = await prisma.eventRSVP.upsert({
            where: { postId_userId: { postId, userId: user.id } },
            update: { status },
            create: { postId, userId: user.id, status },
            include: { user: { select: { name: true, id: true } } },
        });

        return NextResponse.json({ rsvp });
    } catch (error) {
        console.error('RSVP error:', error);
        return NextResponse.json({ error: 'Failed to RSVP' }, { status: 500 });
    }
}
