import { createRemoteJWKSet, jwtVerify } from 'jose';

// Verify Firebase ID tokens using Firebase's public JWKS endpoint.
// No service account key required — uses the same public keys Firebase itself uses.

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'colife-17952';
const JWKS_URI = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

const getJWKS = (() => {
    let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
    return () => {
        if (!jwks) jwks = createRemoteJWKSet(new URL(JWKS_URI));
        return jwks;
    };
})();

export interface FirebaseTokenPayload {
    uid: string;
    phone_number?: string;
    email?: string;
    name?: string;
    [key: string]: unknown;
}

export async function verifyFirebaseToken(idToken: string): Promise<FirebaseTokenPayload> {
    const { payload } = await jwtVerify(idToken, getJWKS(), {
        issuer: `https://securetoken.google.com/${PROJECT_ID}`,
        audience: PROJECT_ID,
    });
    return payload as FirebaseTokenPayload;
}
