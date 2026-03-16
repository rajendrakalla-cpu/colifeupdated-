import { importX509, jwtVerify } from 'jose';

// Verify Firebase ID tokens using Firebase's X.509 public certificates.
// Matches what Firebase Admin SDK does internally — no service account required.

const PROJECT_ID = (
    process.env.FIREBASE_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    'colife-17952'
).trim();
const CERTS_URI = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

export interface FirebaseTokenPayload {
    uid: string;
    phone_number?: string;
    email?: string;
    name?: string;
    sub: string;
    [key: string]: unknown;
}

export async function verifyFirebaseToken(idToken: string): Promise<FirebaseTokenPayload> {
    // Decode header to get key ID (kid)
    const [headerB64] = idToken.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString()) as { kid?: string; alg?: string };

    // Fetch current X.509 public certs (keyed by kid)
    const certsRes = await fetch(CERTS_URI, { next: { revalidate: 3600 } } as RequestInit);
    if (!certsRes.ok) throw new Error(`Failed to fetch Firebase certs: ${certsRes.status}`);
    const certs = await certsRes.json() as Record<string, string>;

    const cert = header.kid ? certs[header.kid] : Object.values(certs)[0];
    if (!cert) throw new Error(`No Firebase cert found for kid: ${header.kid}`);

    const publicKey = await importX509(cert, 'RS256');

    const { payload } = await jwtVerify(idToken, publicKey, {
        issuer: `https://securetoken.google.com/${PROJECT_ID}`,
        audience: PROJECT_ID,
    });

    return { ...payload, uid: payload.sub as string } as FirebaseTokenPayload;
}
