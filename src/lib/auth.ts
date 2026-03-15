import { NextRequest } from 'next/server';
import { prisma } from './prisma';

/**
 * Reads the authenticated user ID injected by middleware and returns the full
 * User record from the database. Returns null if the request is unauthenticated.
 */
export async function getUser(request: NextRequest | Request) {
    const userId = (request as NextRequest).headers.get('x-user-id');
    if (!userId) return null;
    return prisma.user.findUnique({ where: { id: userId } });
}

/**
 * Returns just the user ID from the injected header (no DB hit).
 */
export function getUserId(request: NextRequest | Request): string | null {
    return (request as NextRequest).headers.get('x-user-id');
}

/**
 * Returns the user role from the injected header (no DB hit).
 */
export function getUserRole(request: NextRequest | Request): string | null {
    return (request as NextRequest).headers.get('x-user-role');
}
