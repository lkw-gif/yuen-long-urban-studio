import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { verifyGoogleIdToken } from '../lib/verify-google-id-token.ts';

const clientId = '1234567890-test.apps.googleusercontent.com';
const now = Math.floor(Date.now() / 1000);
const keys = await webcrypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true,
  ['sign', 'verify'],
);
const publicKey = { ...await webcrypto.subtle.exportKey('jwk', keys.publicKey), kid: 'test-key', use: 'sig', alg: 'RS256' };
const fetchKeys = async () => new Response(JSON.stringify({ keys: [publicKey] }), { status: 200 });
const base64url = value => Buffer.from(value).toString('base64url');

async function signToken(overrides = {}) {
  const header = base64url(JSON.stringify({ alg: 'RS256', kid: 'test-key', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: 'https://accounts.google.com',
    aud: clientId,
    sub: 'school-user-123',
    email: 'student@keilong.edu.hk',
    email_verified: true,
    hd: 'keilong.edu.hk',
    iat: now - 60,
    exp: now + 3600,
    ...overrides,
  }));
  const content = `${header}.${payload}`;
  const signature = await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5', keys.privateKey, Buffer.from(content));
  return `${content}.${base64url(signature)}`;
}

const good = await signToken();
assert.equal((await verifyGoogleIdToken(good, clientId, 'keilong.edu.hk', fetchKeys)).allowed, true);
assert.equal((await verifyGoogleIdToken(await signToken({ hd: 'gmail.com' }), clientId, 'keilong.edu.hk', fetchKeys)).allowed, false);
assert.equal((await verifyGoogleIdToken(await signToken({ email: 'student@gmail.com' }), clientId, 'keilong.edu.hk', fetchKeys)).allowed, false);
assert.equal((await verifyGoogleIdToken(await signToken({ email_verified: false }), clientId, 'keilong.edu.hk', fetchKeys)).allowed, false);
await assert.rejects(verifyGoogleIdToken(good, 'other-client', 'keilong.edu.hk', fetchKeys), /claims/);
await assert.rejects(verifyGoogleIdToken(await signToken({ exp: now - 1 }), clientId, 'keilong.edu.hk', fetchKeys), /claims/);
const altered = good.replace('.ey', '.ez');
await assert.rejects(verifyGoogleIdToken(altered, clientId, 'keilong.edu.hk', fetchKeys));
console.log('Google ID token validation checks passed.');
