import cuid2 from '@paralleldrive/cuid2';
import { jwtVerify, SignJWT } from 'jose';
import { NextResponse } from 'next/server';
import {
  createFreeSubscriptionForBetaAndroidPeriod,
  createUser,
  getProfilesByUser,
  getUserByEmail,
  transaction,
  updateUser,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { retrieveSigninInfos, type SigninInfos } from '#helpers/auth';
import type { Profile, User } from '@azzapp/data';
import type { NextRequest } from 'next/server';

export const oauthSignin =
  ({
    authorizeURL,
    redirectURI,
    clientId,
    csrfSecret,
  }: {
    authorizeURL: string;
    redirectURI: string;
    clientId: string;
    csrfSecret: Uint8Array;
  }) =>
  async (req: NextRequest) => {
    let platform = req.nextUrl.searchParams.get('platform');
    if (platform !== 'android' && platform !== 'ios') {
      platform = 'ios';
    }
    const url = new URL(authorizeURL);
    url.searchParams.append('client_id', clientId);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('redirect_uri', redirectURI);
    const csrfToken = await new SignJWT({ csrf: cuid2.createId(), platform })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('10m')
      .sign(csrfSecret);

    url.searchParams.append('state', csrfToken);
    url.searchParams.append('scope', 'profile email openid');
    url.searchParams.append('access_type', 'online');

    console.log('Oauth redirect url', url.toString());

    return NextResponse.redirect(url.toString(), { status: 302 });
  };

const redirectToApp = (data: SigninInfos | { error: string }) => {
  const appScheme =
    process.env.NEXT_PUBLIC_PLATFORM === 'development'
      ? 'azzapp-dev'
      : process.env.NEXT_PUBLIC_PLATFORM === 'staging'
        ? 'azzapp-staging'
        : 'azzapp';
  return NextResponse.redirect(
    `${appScheme}://login?data=${JSON.stringify(data)}`,
    {
      status: 302,
    },
  );
};

export const oauthSigninCallback =
  ({
    tokenURL,
    clientId,
    clientSecret,
    redirectURI,
    csrfSecret,
    profileURL,
  }: {
    tokenURL: string;
    clientId: string;
    clientSecret: string;
    redirectURI: string;
    csrfSecret: Uint8Array;
    profileURL: string;
  }) =>
  async (request: NextRequest) => {
    const code = request.nextUrl.searchParams.get('code');
    const state = request.nextUrl.searchParams.get('state');
    if (typeof code !== 'string' || typeof state !== 'string') {
      return redirectToApp({ error: ERRORS.INVALID_REQUEST });
    }

    let platform: string | null;
    try {
      const { payload } = await jwtVerify(state, csrfSecret, {
        algorithms: ['HS256'],
      });
      platform = payload.platform as string | null;
    } catch {
      return redirectToApp({ error: ERRORS.INVALID_REQUEST });
    }

    let accessToken: string;
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectURI,
        client_id: clientId,
        client_secret: clientSecret,
      });

      const response = await fetch(tokenURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      const data = await response.json();
      accessToken = data.access_token;
    } catch (error) {
      console.error(error);
      return redirectToApp({ error: ERRORS.INVALID_REQUEST });
    }
    if (!accessToken) {
      return redirectToApp({ error: ERRORS.INVALID_REQUEST });
    }

    let googleProfile: any;
    try {
      googleProfile = await fetch(profileURL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).then(res => res.json());
    } catch (error) {
      console.error(error);
      return redirectToApp({ error: ERRORS.INVALID_REQUEST });
    }
    if (!googleProfile) {
      return redirectToApp({ error: ERRORS.INVALID_REQUEST });
    }

    const email: string = googleProfile.email;
    if (!email) {
      return redirectToApp({ error: 'LinkedIn email is required' });
    }

    let user: User | null = null;
    let profile: Profile | null = null;
    const userContactData = {
      firstName: googleProfile.given_name,
      lastName: googleProfile.family_name,
      email: googleProfile.email,
      avatarUrl: googleProfile.picture,
    };
    try {
      user = await getUserByEmail(email);
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
        profile = profiles[0] ?? null;
        updateUser(user.id, {
          userContactData: {
            ...user.userContactData,
            ...userContactData,
          },
          locale: user.locale ?? googleProfile.locale?.language ?? null,
        });
      } else {
        const newUser = {
          email,
          phoneNumber: null,
          password: null,
          locale: googleProfile.locale?.language ?? null,
          roles: null,
          termsOfUseAcceptedVersion: null,
          termsOfUseAcceptedAt: null,
          hasAcceptedCommunications: false,
          emailConfirmed: googleProfile.email_verified ?? false,
          phoneNumberConfirmed: false,
          appleId: null,
          userContactData,
        };
        await transaction(async () => {
          const userId = await createUser(newUser);
          user = {
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
          };
          if (platform === 'android') {
            await createFreeSubscriptionForBetaAndroidPeriod([userId]);
          }
          if (oldUser) {
            await updateUser(oldUser.id, {
              replacedBy: userId,
            });
          }
        });
      }
    } catch (error) {
      console.error(error);
      return redirectToApp({ error: ERRORS.INVALID_REQUEST });
    }

    let signinInfos: SigninInfos;
    try {
      signinInfos = await retrieveSigninInfos(user!, profile);
    } catch (error) {
      if (error instanceof Error && error.message === 'User deleted') {
        return redirectToApp({ error: ERRORS.FORBIDDEN });
      } else {
        console.error(error);
        return redirectToApp({ error: ERRORS.INVALID_REQUEST });
      }
    }

    return redirectToApp(signinInfos);
  };
