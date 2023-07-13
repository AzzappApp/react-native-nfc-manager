import { NextResponse } from 'next/server';
import { getSessionData } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import { buildApplePass } from '#helpers/pass/apple';
import type { SessionData } from '@azzapp/auth/viewer';

const createPass = async (
  _: Request,
  { params }: { params: { lang: string } },
) => {
  let viewer: SessionData;
  try {
    viewer = await getSessionData();

    if (viewer.isAnonymous || !viewer.profileId) {
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

  const pass = await buildApplePass(viewer.profileId, params.lang);

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
