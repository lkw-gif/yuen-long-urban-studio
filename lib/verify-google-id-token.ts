const GOOGLE_KEYS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ALLOWED_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

type GoogleKeySet = {
  keys: Array<JsonWebKey & { kid?: string; use?: string; alg?: string }>;
};

type GoogleClaims = {
  aud?: string;
  email?: string;
  email_verified?: boolean | string;
  exp?: number;
  hd?: string;
  iat?: number;
  iss?: string;
  sub?: string;
};

function decodeBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const decoded = atob(padded);
  return Uint8Array.from(decoded, character => character.charCodeAt(0));
}

function parseJsonPart<T>(part: string): T {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(part))) as T;
}

/** Verify Google's RS256 signature and identity claims in the browser. */
export async function verifyGoogleIdToken(
  credential: string,
  clientId: string,
  allowedDomain: string,
  fetchKeys: typeof fetch = fetch,
) {
  const parts = credential.split('.');
  if (parts.length !== 3 || parts.some(part => !part)) throw new Error('Malformed Google ID token');
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = parseJsonPart<{ alg?: string; kid?: string }>(encodedHeader);
  const claims = parseJsonPart<GoogleClaims>(encodedPayload);
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Unsupported Google ID token');

  const response = await fetchKeys(GOOGLE_KEYS_URL, { cache: 'default' });
  if (!response.ok) throw new Error('Could not load Google signing keys');
  const keySet = (await response.json()) as GoogleKeySet;
  const signingKey = keySet.keys.find(key => key.kid === header.kid && key.kty === 'RSA' && key.use === 'sig');
  if (!signingKey) throw new Error('Google signing key was not found');
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    signingKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const signature = new Uint8Array(decodeBase64Url(encodedSignature));
  const content = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const authentic = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, signature, content);
  if (!authentic) throw new Error('Invalid Google ID token signature');

  const now = Math.floor(Date.now() / 1000);
  if (!ALLOWED_ISSUERS.has(claims.iss ?? '') ||
      claims.aud !== clientId ||
      !claims.sub ||
      !Number.isFinite(claims.exp) ||
      (claims.exp ?? 0) <= now ||
      !Number.isFinite(claims.iat) ||
      (claims.iat ?? 0) > now + 60) {
    throw new Error('Invalid Google ID token claims');
  }

  const email = claims.email?.trim() ?? '';
  const domain = allowedDomain.trim().toLowerCase();
  const allowed = (
    (claims.email_verified === true || claims.email_verified === 'true') &&
    claims.hd?.trim().toLowerCase() === domain &&
    email.toLowerCase().endsWith(`@${domain}`)
  );
  return { allowed, email, exp: (claims.exp ?? 0) * 1000 };
}
