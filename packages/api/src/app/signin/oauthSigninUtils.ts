import cuid2 from '@paralleldrive/cuid2';
import { jwtVerify, SignJWT } from 'jose';
import { jwtDecode } from 'jwt-decode';
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
import env from '#env';
import { retrieveSigninInfos, type SigninInfos } from '#helpers/auth';
import { getApiEndpoint } from '#helpers/request';
import type { Profile, User } from '@azzapp/data';
import type { NextRequest } from 'next/server';

type OpenIdProfile = {
  email: string;
  email_verified: boolean;
  picture: string;
  given_name: string;
  family_name: string;
  // linkedIn profileUrl
  locale: { language: string };
};

export const oauthSignin =
  ({
    authorizeURL,
    redirectURI,
    clientId,
    csrfSecret,
    prompt,
    scope,
    errorCallback,
  }: {
    authorizeURL: string;
    redirectURI: string;
    clientId: string;
    csrfSecret: Uint8Array;
    scope?: string;
    prompt?: string;
    errorCallback?: string;
  }) =>
  async (req: NextRequest) => {
    let platform = req.nextUrl.searchParams.get('platform');
    if (platform !== 'android' && platform !== 'ios' && platform !== 'web') {
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
    url.searchParams.append('scope', scope ?? 'profile email openid');
    url.searchParams.append('access_type', 'online');
    if (clientId === env.APPLE_CLIENT_ID) {
      url.searchParams.append('response_mode', 'form_post');
    }

    if (errorCallback) {
      url.searchParams.append('error_callback', errorCallback);
    }

    if (prompt) {
      url.searchParams.append('prompt', prompt);
    }

    return NextResponse.redirect(url.toString(), { status: 302 });
  };

const redirectToApp = (
  data: SigninInfos | { error: string },
  platform?: string | null,
) => {
  if (platform === 'web') {
    return NextResponse.redirect(
      `${env.NEXT_PUBLIC_USER_MGMT_URL}/api/oAuthSignin?data=${JSON.stringify(data)}`,
      {
        status: 302,
      },
    );
  }
  const appScheme =
    env.NEXT_PUBLIC_PLATFORM === 'development'
      ? 'azzapp-dev'
      : env.NEXT_PUBLIC_PLATFORM === 'staging'
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
    clientSecret: string | (() => Promise<string>);
    redirectURI: string;
    csrfSecret: Uint8Array;
    profileURL?: string;
  }) =>
  async (request: NextRequest) => {
    const isPost = request.method === 'POST';

    let code: string | null = null;
    let state: string | null = null;
    let userRaw: string | null = null;

    if (isPost) {
      const formData = await request.formData();
      code = formData.get('code') as string | null;
      state = formData.get('state') as string | null;
      userRaw = formData.get('user') as string | null;
    } else {
      const urlParams = request.nextUrl.searchParams;
      code = urlParams.get('code');
      state = urlParams.get('state');
    }

    if (typeof code !== 'string' || typeof state !== 'string') {
      console.error('Invalid code or state: ', code, state);
      return redirectToApp({ error: ERRORS.INVALID_REQUEST });
    }

    let platform: string | null;
    try {
      const { payload } = await jwtVerify(state, csrfSecret, {
        algorithms: ['HS256'],
      });
      platform = payload.platform as string | null;
    } catch (e) {
      console.error(e);
      return redirectToApp({ error: ERRORS.INVALID_REQUEST });
    }

    let accessToken: string;
    let id_token: string;
    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${getApiEndpoint(request)}${redirectURI}`,
        client_id: clientId,
        client_secret:
          typeof clientSecret === 'string'
            ? clientSecret
            : await clientSecret(),
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
      id_token = data.id_token;
    } catch (error) {
      console.error(error);
      return redirectToApp({ error: ERRORS.INVALID_REQUEST }, platform);
    }
    if (!accessToken) {
      return redirectToApp({ error: ERRORS.INVALID_REQUEST }, platform);
    }

    let connectProfile: OpenIdProfile | null = null;
    try {
      if (profileURL) {
        connectProfile = await fetch(profileURL, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }).then(res => res.json());
      } else {
        connectProfile = await jwtDecode(id_token);

        // add infos from userRaw (first connection only)
        if (userRaw && connectProfile) {
          const userInfo = JSON.parse(userRaw);
          connectProfile = {
            ...connectProfile,
            given_name: userInfo.name?.firstName ?? connectProfile.given_name,
            family_name: userInfo.name?.lastName ?? connectProfile.family_name,
            email: userInfo.email ?? connectProfile.email,
            email_verified: userInfo.email
              ? true
              : connectProfile.email_verified,
          };
        }
      }
    } catch (error) {
      console.error(error);
      return redirectToApp({ error: ERRORS.INVALID_REQUEST }, platform);
    }
    if (!connectProfile) {
      return redirectToApp({ error: ERRORS.INVALID_REQUEST }, platform);
    }
    const email: string = connectProfile.email;
    if (!email) {
      return redirectToApp({ error: 'LinkedIn email is required' }, platform);
    }

    let user: User;
    let profile: Profile | null;
    try {
      [user, profile] = await transaction(
        async (): Promise<[User, Profile | null]> => {
          const userContactData = {
            firstName: connectProfile.given_name,
            lastName: connectProfile.family_name,
            email: connectProfile.email,
            avatarUrl: connectProfile.picture,
          };

          let user = await getUserByEmail(email);
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
            const updates = {
              userContactData: {
                ...user.userContactData,
                ...userContactData,
              },
              emailConfirmed: true,
              locale: user.locale ?? connectProfile.locale?.language ?? null,
            };
            await updateUser(user.id, updates);
            user = {
              ...user,
              ...updates,
            };
            const profiles = await getProfilesByUser(user.id);
            return [
              {
                ...user,
                ...updates,
              },
              profiles[0] ?? null,
            ];
          } else {
            const newUser = {
              email,
              phoneNumber: null,
              password: null,
              locale: connectProfile.locale?.language ?? null,
              roles: null,
              termsOfUseAcceptedVersion: null,
              termsOfUseAcceptedAt: null,
              hasAcceptedCommunications: false,
              emailConfirmed: true,
              phoneNumberConfirmed: false,
              appleId: null,
              userContactData,
            };
            const userId = await createUser(newUser);
            if (platform === 'android') {
              await createFreeSubscriptionForBetaAndroidPeriod([userId]);
            }
            if (oldUser) {
              await updateUser(oldUser.id, {
                replacedBy: userId,
              });
            }
            return [
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
                cookiePreferences: null,
              },
              null,
            ];
          }
        },
      );
    } catch (error) {
      console.error(error);
      return redirectToApp({ error: ERRORS.INVALID_REQUEST }, platform);
    }

    let signinInfos: SigninInfos;
    try {
      signinInfos = await retrieveSigninInfos(user, profile);
    } catch (error) {
      if (error instanceof Error && error.message === 'User deleted') {
        return redirectToApp({ error: ERRORS.FORBIDDEN }, platform);
      } else {
        console.error(error);
        return redirectToApp({ error: ERRORS.INVALID_REQUEST }, platform);
      }
    }

    return redirectToApp(signinInfos, platform);
  };
