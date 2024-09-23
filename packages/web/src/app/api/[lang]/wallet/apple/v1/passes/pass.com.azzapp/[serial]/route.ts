import { NextResponse } from 'next/server';
import { getProfileById } from '@azzapp/data';
import { unseal } from '@azzapp/shared/crypto';
import ERRORS from '@azzapp/shared/errors';
import { buildApplePass } from '#helpers/pass/apple';
import { withPluginsRoute } from '#helpers/queries';

const APPLE_HEADER_PREFIX = 'ApplePass ';

const updatePass = async (
  req: Request,
  { params }: { params: { serial: string; lang: string } },
) => {
  const authorization = req.headers
    .get('Authorization')
    ?.replace(APPLE_HEADER_PREFIX, '');

  if (!authorization) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const profileId = await unseal(
    authorization,
    process.env.APPLE_TOKEN_PASSWORD ?? '',
  );

  if (profileId !== params.serial) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const ifModifiedSince = req.headers.get('If-Modified-Since');

  const profile = await getProfileById(profileId);

  if (!profile) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  if (
    ifModifiedSince &&
    'lastContactCardUpdate' in profile &&
    new Date(ifModifiedSince) >= profile.lastContactCardUpdate
  ) {
    return new NextResponse(null, {
      status: 304,
    });
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

export const { GET } = { GET: withPluginsRoute(updatePass) };
