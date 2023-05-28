import { NextResponse } from 'next/server';
import { destroySession, setSession } from '@azzapp/auth/session';
import { generateTokens } from '@azzapp/auth/tokens';
import { getSessionData } from '@azzapp/auth/viewer';
import { getProfilesByIds } from '@azzapp/data/domains';
import ERRORS from '@azzapp/shared/errors';
import type { User } from '@azzapp/auth/viewer';

type NewProfileBody = {
  profileId: string;
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

  const { profileId, authMethod } =
    ((await req.json()) as NewProfileBody) || {};

  try {
    const [profile] = await getProfilesByIds([profileId]);
    // TODO use unique index error instead
    if (!profile || profile.userId !== viewer.userId) {
      return NextResponse.json({ message: ERRORS.FORBIDDEN }, { status: 403 });
    }

    if (authMethod === 'token') {
      const { token, refreshToken } = await generateTokens({
        userId: viewer.userId,
        profileId,
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
