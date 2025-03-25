import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import {
  createUser,
  getProfilesByUser,
  getUserByEmail,
  updateUser,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { retrieveSigninInfos } from '#helpers/auth';
import type { SigninInfos } from '#helpers/auth';
import type { Profile, User } from '@azzapp/data';
import type { NextRequest } from 'next/server';

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
const NEXT_PUBLIC_API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT!;

const LINKED_IN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const csrfSecret = new TextEncoder().encode(process.env.LINKEDIN_TOKEN_SECRET);

const redirectToApp = (data: SigninInfos | { error: string }) =>
  NextResponse.redirect(`azzapp://login?data=${JSON.stringify(data)}`, {
    status: 302,
  });

const linkedInSigninCallback = async (request: NextRequest) => {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  if (typeof code !== 'string' || typeof state !== 'string') {
    return redirectToApp({ error: ERRORS.INVALID_REQUEST });
  }

  if (!jwtVerify(state, csrfSecret, { algorithms: ['HS256'] })) {
    return redirectToApp({ error: ERRORS.INVALID_REQUEST });
  }

  let accessToken: string;
  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${NEXT_PUBLIC_API_ENDPOINT}/signin/linkedin/callback`,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    const response = await fetch(LINKED_IN_TOKEN_URL, {
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

  let linkedInProfile: any;
  try {
    linkedInProfile = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).then(res => res.json());
  } catch (error) {
    console.error(error);
    return redirectToApp({ error: ERRORS.INVALID_REQUEST });
  }
  if (!linkedInProfile) {
    return redirectToApp({ error: ERRORS.INVALID_REQUEST });
  }

  const email: string = linkedInProfile.email;
  if (!email) {
    return redirectToApp({ error: 'LinkedIn email is required' });
  }

  let user: User | null = null;
  let profile: Profile | null = null;
  const userContactData = {
    firstName: linkedInProfile.given_name,
    lastName: linkedInProfile.family_name,
    email: linkedInProfile.email,
    avatarUrl: linkedInProfile.picture,
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
        locale: user.locale ?? linkedInProfile.locale?.language ?? null,
      });
    } else {
      const newUser = {
        email,
        phoneNumber: null,
        password: null,
        locale: linkedInProfile.locale?.language ?? null,
        roles: null,
        termsOfUseAcceptedVersion: null,
        termsOfUseAcceptedAt: null,
        hasAcceptedCommunications: false,
        emailConfirmed: linkedInProfile.email_verified ?? false,
        phoneNumberConfirmed: false,
        appleId: null,
        userContactData,
      };
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
      if (oldUser) {
        await updateUser(oldUser.id, {
          replacedBy: userId,
        });
      }
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

export { linkedInSigninCallback as GET };
