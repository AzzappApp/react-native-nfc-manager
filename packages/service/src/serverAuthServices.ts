import * as jose from 'jose';
import ERRORS from '@azzapp/shared/errors';
import { AZZAPP_SERVER_HEADER } from '@azzapp/shared/urlHelpers';

const TEAM_SLUG = 'azzapp';

const ISSUER_URL = `https://oidc.vercel.com/${TEAM_SLUG}`;

const JWKS = jose.createRemoteJWKSet(new URL('/.well-known/jwks', ISSUER_URL));

const ENVIRONMENT =
  process.env.NODE_ENV === 'development'
    ? 'development'
    : process.env.NEXT_PUBLIC_PLATFORM === 'production'
      ? 'production'
      : 'preview';

export const checkServerAuth = async (headers: Headers) => {
  const token = headers.get(AZZAPP_SERVER_HEADER)?.split('Bearer ')[1] ?? null;
  if (!token) {
    throw new Error(ERRORS.INVALID_TOKEN);
  }

  try {
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: ISSUER_URL,
      audience: `https://vercel.com/${TEAM_SLUG}`,
    });

    const validSubjects = [
      `owner:${TEAM_SLUG}:project:azzapp:environment:${ENVIRONMENT}`,
      `owner:${TEAM_SLUG}:project:azzapp-users-manager-webapp:environment:${ENVIRONMENT}`,
      `owner:${TEAM_SLUG}:project:azzapp-backoffice:environment:${ENVIRONMENT}`,
    ].concat(
      ENVIRONMENT === 'development'
        ? [
            `owner:${TEAM_SLUG}:project:azzapp-translations:environment:development`,
          ]
        : [
            `owner:${TEAM_SLUG}:project:azzapp-translations:environment:preview`,
            `owner:${TEAM_SLUG}:project:azzapp-translations:environment:production`,
          ],
    );

    if (!payload.sub || !validSubjects.includes(payload.sub)) {
      throw new Error('Invalid subject');
    }
  } catch (e) {
    console.error(e);
    throw new Error(ERRORS.INVALID_TOKEN);
  }
};
