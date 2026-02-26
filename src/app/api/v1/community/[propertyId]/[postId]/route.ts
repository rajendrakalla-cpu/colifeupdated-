import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE — owner deletes a post
export async function DELETE(request: Request, { params }: { params: Promise<{ propertyId: string; postId: string }> }) {
    try {
        const { postId } = await params;
        const url = new URL(request.url);
        const mockEmail = url.searchParams.get('mockEmail');
        if (!mockEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: mockEmail } });
        if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Only owners/admins can delete posts' }, { status: 403 });
        }

        await prisma.communityPost.delete({ where: { id: postId } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Community post delete error:', error);
        return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }
}
