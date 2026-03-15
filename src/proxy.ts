import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ─── Rate limiter (in-memory, per-instance) ──────────────────────────────────
// Suitable for single-instance deployments. For multi-instance, replace with
// an Upstash Redis rate limiter (@upstash/ratelimit).
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 auth attempts per minute per IP

function rateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true; // allowed
    }

    if (entry.count >= RATE_LIMIT_MAX) return false; // blocked

    entry.count += 1;
    return true;
}

// ─── Routes that do NOT require authentication ────────────────────────────────
const PUBLIC_PREFIXES = [
    '/api/v1/auth/',       // login / register
    '/api/v1/webhooks/',   // Razorpay webhook (signed separately)
    '/api/v1/properties',  // public property listing & detail
    '/api/cron/',          // cron jobs authenticated via CRON_SECRET header
];

function isPublic(pathname: string): boolean {
    return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not set');
    return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only process /api/ routes
    if (!pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // Rate-limit auth endpoints
    if (pathname.startsWith('/api/v1/auth/')) {
        const ip =
            request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
            request.headers.get('x-real-ip') ??
            'unknown';

        if (!rateLimit(ip)) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }
    }

    // Allow public routes through without JWT check
    if (isPublic(pathname)) {
        return NextResponse.next();
    }

    // Validate JWT
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { payload } = await jwtVerify(token, getSecret());
        const { userId, email, role } = payload as {
            userId: string;
            email: string | null;
            role: string;
        };

        // Inject user info into downstream request headers
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', userId);
        requestHeaders.set('x-user-email', email ?? '');
        requestHeaders.set('x-user-role', role);

        return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
}

export const config = {
    matcher: '/api/:path*',
};
