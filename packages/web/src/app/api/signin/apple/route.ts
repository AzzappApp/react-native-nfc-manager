import * as Sentry from '@sentry/nextjs';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import {
  createFreeSubscriptionForBetaAndroidPeriod,
  createUser,
  getProfilesByUser,
  getUserByAppleId,
  getUserByEmail,
  transaction,
  updateUser,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { PLATFORM_HEADER } from '@azzapp/shared/networkHelpers';
import { handleSignInAuthMethod } from '#helpers/auth';
import cors from '#helpers/cors';
import { withPluginsRoute } from '#helpers/queries';
import type { User } from '@azzapp/data';
import type { JWTPayload } from 'jose';

const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';

const jwks = createRemoteJWKSet(new URL(APPLE_JWKS_URL));

const AppleSignInBodySchema = z.object({
  identityToken: z.string(),
  locale: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
});

const appleSignin = async (req: Request) => {
  const result = AppleSignInBodySchema.safeParse(await req.json());

  if (!result.success) {
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }
  const { identityToken, locale, firstName, lastName } = result.data;

  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(identityToken, jwks, {
      issuer: 'https://appleid.apple.com',
    }));
  } catch {
    return NextResponse.json(
      { message: ERRORS.INVALID_CREDENTIALS },
      { status: 401 },
    );
  }
  const appleId = payload.sub;
  if (!appleId) {
    return NextResponse.json(
      { message: ERRORS.INVALID_CREDENTIALS },
      { status: 401 },
    );
  }

  try {
    const email = payload.email;
    let user = await getUserByAppleId(appleId);
    let oldUser: User | null = null;

    if (user?.deleted && user.id === user.deletedBy) {
      await updateUser(user.id, {
        appleId: null,
        email: null,
        phoneNumber: null,
      });
      oldUser = user;
      user = null;
    }
    if (user) {
      const profiles = await getProfilesByUser(user.id);
      return handleSignInAuthMethod(user, profiles[0] ?? null);
    } else {
      if (!email || typeof email !== 'string') {
        return NextResponse.json(
          { message: ERRORS.INVALID_CREDENTIALS },
          { status: 401 },
        );
      }
      const user = await getUserByEmail(email);
      if (user) {
        await updateUser(user.id, {
          appleId,
          userContactData: {
            ...user.userContactData,
            firstName: firstName ?? user.userContactData?.firstName,
            lastName: lastName ?? user.userContactData?.lastName,
          },
        });
        const profiles = await getProfilesByUser(user.id);
        return handleSignInAuthMethod(user, profiles[0] ?? null);
      } else {
        const newUser = {
          email,
          phoneNumber: null,
          password: null,
          locale: locale ?? null,
          roles: null,
          termsOfUseAcceptedVersion: null,
          termsOfUseAcceptedAt: null,
          hasAcceptedCommunications: false,
          appleId,
          emailConfirmed: true,
          phoneNumberConfirmed: false,
        };

        return transaction(async () => {
          const userId = await createUser(newUser);
          if (oldUser) {
            await updateUser(oldUser.id, {
              replacedBy: userId,
            });
          }

          if (req.headers.get(PLATFORM_HEADER) === 'android') {
            await createFreeSubscriptionForBetaAndroidPeriod([userId]);
          }

          return handleSignInAuthMethod(
            {
              ...newUser,
              id: userId,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
              note: null,
              replacedBy: null,
              deleted: false,
              deletedBy: null,
              invited: false,
              nbFreeScans: 0,
              userContactData: {
                firstName,
                lastName,
              },
            },
            null,
          );
        });
      }
    }
  } catch (error) {
    console.error(error);
    Sentry.captureException(error);
    return NextResponse.json(
      { message: ERRORS.INTERNAL_SERVER_ERROR },
      { status: 500 },
    );
  }
};

export const { POST, OPTIONS } = cors({ POST: withPluginsRoute(appleSignin) });
