import { NextResponse } from 'next/server';
import { getProfileById } from '@azzapp/data/domains';
import ERRORS from '@azzapp/shared/errors';
import { buildApplePass } from '#helpers/pass/apple';
import { getSessionData } from '#helpers/tokens';

// TODO check if auth token is sent in request
const createPass = async (
  _: Request,
  {
    params,
    searchParams,
  }: {
    params: { lang: string };
    searchParams: { profileId: string };
  },
) => {
  const profileId = searchParams.profileId;
  try {
    const { userId } = (await getSessionData()) ?? {};
    const profile = await getProfileById(profileId);
    if (!profile || profile.userId !== userId) {
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

  const pass = await buildApplePass(profileId, params.lang);

  if (pass) {
    return new Response(pass.getAsBuffer(), {
      headers: {
        'Content-Type': pass.mimeType,
      },
    });
  } else {
    return NextResponse.json({ message: ERRORS.NOT_FOUND }, { status: 404 });
  }
};

export const { GET } = { GET: createPass };

export const runtime = 'edge';
