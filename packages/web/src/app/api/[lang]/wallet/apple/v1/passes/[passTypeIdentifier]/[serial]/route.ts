import { NextResponse } from 'next/server';
import { getContactCardAccessById, getProfileById } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { buildApplePass, checkAuthorization } from '#helpers/pass/apple';
import { withPluginsRoute } from '#helpers/queries';

const updatePass = async (
  req: Request,
  { params }: { params: { serial: string; lang: string } },
) => {
  let data;
  try {
    data = await checkAuthorization(req, params.serial);
  } catch {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let profile;
  let contactCardAccessId;
  let key;
  // old pass
  if (typeof data === 'string') {
    profile = await getProfileById(data);
  } else {
    const contactCardAccess = await getContactCardAccessById(
      data.contactCardAccessId,
    );

    if (!contactCardAccess || contactCardAccess.isRevoked) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }
    profile = await getProfileById(contactCardAccess.profileId);
    key = data.key;
    contactCardAccessId = data.contactCardAccessId;
  }
  const ifModifiedSince = req.headers.get('If-Modified-Since');

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

  const pass = await buildApplePass({
    profile,
    locale: params.lang,
    contactCardAccessId,
    key,
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
};

export const { GET } = { GET: withPluginsRoute(updatePass) };
