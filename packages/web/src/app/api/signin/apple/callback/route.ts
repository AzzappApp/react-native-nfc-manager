import { importPKCS8, SignJWT } from 'jose';
import { oauthSigninCallback } from '../../oauthSigninUtils';

const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY!;
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID!;
const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID!;
const APPLE_KEY_ID = process.env.APPLE_KEY_ID!;

export async function generateAppleClientSecret() {
  const now = Math.floor(Date.now() / 1000);

  const privateKey = await importPKCS8(APPLE_PRIVATE_KEY, 'ES256');

  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: APPLE_KEY_ID })
    .setIssuer(APPLE_TEAM_ID)
    .setSubject(APPLE_CLIENT_ID)
    .setAudience('https://appleid.apple.com')
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 60 * 6) // 6h
    .sign(privateKey);

  return jwt;
}

const appleSigninCallback = oauthSigninCallback({
  tokenURL: 'https://appleid.apple.com/auth/token',
  clientId: APPLE_CLIENT_ID,
  clientSecret: generateAppleClientSecret,
  redirectURI: `${process.env.NEXT_PUBLIC_API_ENDPOINT!}/signin/apple/callback`,
  csrfSecret: new TextEncoder().encode(process.env.APPLE_TOKEN_SECRET),
});

export { appleSigninCallback as POST };

export const runtime = 'nodejs';
