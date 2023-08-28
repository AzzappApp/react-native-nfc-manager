import { NextResponse } from 'next/server';
import { getProfileById } from '@azzapp/data/domains';
import { unseal } from '@azzapp/shared/crypto';
import ERRORS from '@azzapp/shared/errors';
import { buildApplePass } from '#helpers/pass/apple';

const APPLE_HEADER_PREFIX = 'ApplePass ';

const updatePass = async (
  req: Request,
  { params }: { params: { serial: string; lang: string } },
) => {
  const authorization = req.headers
    .get('Authorization')
    ?.replace(APPLE_HEADER_PREFIX, '');

  if (
    !authorization ||
    (await unseal(authorization, process.env.APPLE_TOKEN_PASSWORD ?? '')) !==
      params.serial
  ) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const ifModifiedSince = req.headers.get('If-Modified-Since');

  const profile = await getProfileById(params.serial);

  if (!profile) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  if (
    ifModifiedSince &&
    new Date(ifModifiedSince) >= profile.lastContactCardUpdate
  ) {
    return new NextResponse(null, {
      status: 304,
    });
  }

  const pass = await buildApplePass(params.serial, params.lang);

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

export const { GET } = { GET: updatePass };

export const runtime = 'edge';
