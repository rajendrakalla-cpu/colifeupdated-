import { SignJWT, jwtVerify } from 'jose';

function getSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET environment variable is not set');
    return new TextEncoder().encode(secret);
}

export interface JwtPayload {
    userId: string;
    email: string | null;
    role: string;
}

export async function signToken(payload: JwtPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload> {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
}
