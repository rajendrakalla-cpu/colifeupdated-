import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET — feed of all posts for a property
export async function GET(request: Request, { params }: { params: Promise<{ propertyId: string }> }) {
    try {
        const { propertyId } = await params;

        const posts = await prisma.communityPost.findMany({
            where: { propertyId },
            include: {
                author: { select: { name: true, avatar: true, role: true } },
                rsvps: {
                    include: { user: { select: { name: true, id: true } } },
                },
                _count: { select: { rsvps: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ posts });
    } catch (error) {
        console.error('Community feed error:', error);
        return NextResponse.json({ error: 'Failed to fetch community feed' }, { status: 500 });
    }
}

// POST — owner creates a post or event
export async function POST(request: Request, { params }: { params: Promise<{ propertyId: string }> }) {
    try {
        const { propertyId } = await params;
        const url = new URL(request.url);
        const mockEmail = url.searchParams.get('mockEmail');
        if (!mockEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: mockEmail } });
        if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Only owners/admins can create posts' }, { status: 403 });
        }

        const body = await request.json();
        const { title, content, type, eventDate, eventTime, eventVenue, maxAttendees } = body;

        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }

        const post = await prisma.communityPost.create({
            data: {
                title,
                content,
                type: type || 'ANNOUNCEMENT',
                eventDate: eventDate ? new Date(eventDate) : null,
                eventTime: eventTime || null,
                eventVenue: eventVenue || null,
                maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
                propertyId,
                authorId: user.id,
            },
            include: {
                author: { select: { name: true, avatar: true, role: true } },
                rsvps: true,
                _count: { select: { rsvps: true } },
            },
        });

        return NextResponse.json({ post }, { status: 201 });
    } catch (error) {
        console.error('Community post create error:', error);
        return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
}
