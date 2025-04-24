import { NextResponse } from 'next/server';
import { getProfileById, getProfileByUserAndWebCard } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { buildApplePass } from '#helpers/pass/apple';
import { withPluginsRoute } from '#helpers/queries';
import { getSessionData } from '#helpers/tokens';

// TODO check if auth token is sent in request
const createPass = async (
  req: Request,
  {
    params,
  }: {
    params: { lang: string };
  },
) => {
  const searchParams = new URL(req.url).searchParams;

  const webCardId = searchParams.get('webCardId');

  const profileId = searchParams.get('profileId');

  const deviceId = searchParams.get('deviceId');

  const key = searchParams.get('key');

  let userId: string | undefined;
  try {
    const data = await getSessionData();
    userId = data?.userId;
    if (!userId) {
      return NextResponse.json(
        { message: ERRORS.UNAUTHORIZED },
        { status: 401 },
      );
    }
    const profile = webCardId
      ? await getProfileByUserAndWebCard(userId, webCardId)
      : profileId
        ? await getProfileById(profileId)
        : null;
    if (!profile) {
      return NextResponse.json(
        { message: ERRORS.UNAUTHORIZED },
        { status: 401 },
      );
    }

    if (profile.userId !== userId) {
      return NextResponse.json({ message: ERRORS.FORBIDDEN }, { status: 403 });
    }

    const pass = await buildApplePass({
      profile,
      locale: params.lang,
      deviceId,
      key,
      includeBarCode: true,
    });

    if (pass) {
      return new Response(pass.getAsBuffer(), {
        headers: {
          'Content-Type': pass.mimeType,
        },
      });
    } else {
      return NextResponse.json({ message: ERRORS.NOT_FOUND }, { status: 404 });
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
};

export const { GET } = { GET: withPluginsRoute(createPass) };
