import { fromGlobalId } from 'graphql-relay';
import { NextResponse } from 'next/server';
import { destroySession, setSession } from '@azzapp/auth/session';
import { generateTokens } from '@azzapp/auth/tokens';
import { getSessionData } from '@azzapp/auth/viewer';
import { createProfile, getProfileByUserName } from '@azzapp/data/domains';
import ERRORS from '@azzapp/shared/errors';
import type { User } from '@azzapp/auth/viewer';
import type { ProfileKind } from '@azzapp/data/domains';

type NewProfileBody = {
  userName: string;
  profileKind: ProfileKind;
  profileCategoryId: string | null;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  companyActivityId?: string | null;
  authMethod?: 'cookie' | 'token';
};

export const POST = async (req: Request) => {
  let viewer: User;
  try {
    viewer = await getSessionData();
    if (viewer.isAnonymous) {
      return NextResponse.json(
        { message: ERRORS.UNAUTORIZED },
        { status: 401 },
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message === ERRORS.INVALID_TOKEN) {
      return NextResponse.json({ message: e.message }, { status: 401 });
    }
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }

  const {
    userName,
    firstName,
    lastName,
    companyName,
    profileKind,
    profileCategoryId: profileCategoryIdGQL,
    companyActivityId: companyActivityIdGQL,
    authMethod,
  } = ((await req.json()) as NewProfileBody) || {};

  let profileCategoryId: string | null = null;
  let companyActivityId: string | null = null;
  // TODO: validate received data more thoroughly
  try {
    profileCategoryId = getIDFromGQLID(profileCategoryIdGQL, 'ProfileCategory');
    companyActivityId = companyActivityIdGQL
      ? getIDFromGQLID(companyActivityIdGQL, 'CompanyActivity')
      : null;
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }
  if (!userName || !profileKind) {
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }

  try {
    // TODO use unique index error instead
    if (await getProfileByUserName(userName)) {
      return NextResponse.json(
        { message: ERRORS.USERNAME_ALREADY_EXISTS },
        { status: 400 },
      );
    }
    const profile = await createProfile({
      userId: viewer.userId,
      userName,
      profileKind,
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      companyName: companyName ?? null,
      companyActivityId: companyActivityId ?? null,
      profileCategoryId: profileCategoryId ?? null,
      colorPalette: '#FFFFFF,#000000', // from #197 specification issue
      interests: null,
    });

    if (authMethod === 'token') {
      const { token, refreshToken } = await generateTokens({
        userId: viewer.userId,
        profileId: profile.id,
      });
      return destroySession(
        NextResponse.json({ profileId: profile.id, token, refreshToken }),
      );
    } else {
      return setSession(NextResponse.json({ profileId: profile.id }), {
        userId: viewer.userId,
        profileId: profile.id,
        isAnonymous: false,
      });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: ERRORS.INTERNAL_SERVER_ERROR },
      { status: 500 },
    );
  }
};

export const runtime = 'edge';

function getIDFromGQLID(
  gqlID: string | null | undefined,
  expectedType: string,
) {
  if (!gqlID) {
    return null;
  }
  const { id, type } = fromGlobalId(gqlID);
  if (type !== expectedType) {
    throw new Error(`invalid ${type}`);
  }
  return id;
}
