import * as Sentry from '@sentry/nextjs';
import { decompressFromEncodedURIComponent } from 'lz-string';
import { NextResponse } from 'next/server';
import { mergeContactCardWithCommonInfos } from '@azzapp/service/contactCardServices';
import { buildAvatarUrl } from '@azzapp/service/mediaServices';
import { buildVCardFileName } from '@azzapp/shared/contactCardHelpers';
import { buildVCardFromContactCard } from '@azzapp/shared/vCardHelpers';

import cors from '#helpers/cors';
import { verifyContactCardAccess } from '#helpers/qrCode';
import { withPluginsRoute } from '#helpers/queries';
import type { NextRequest } from 'next/server';

const downloadVCard = async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const k = searchParams.get('k');
  const username = searchParams.get('u');

  if (!k || !username) {
    return new NextResponse(null, {
      status: 400,
    });
  }

  let contactCardAccessId: string;
  let key: string;

  try {
    [contactCardAccessId, key] = JSON.parse(
      decompressFromEncodedURIComponent(k) || atob(decodeURIComponent(k)),
    );
  } catch {
    Sentry.captureException(
      `ShareBack Invalid request - unable to parse contact data and signature from query string ${k}`,
    );

    return new NextResponse(null, {
      status: 400,
    });
  }

  if (!contactCardAccessId || !key) {
    Sentry.captureException(
      `ShareBack Invalid request - contact card access id or key missing from query string ${k}`,
    );

    return new NextResponse(null, {
      status: 400,
    });
  }

  const { profile, webCard } = await verifyContactCardAccess(
    contactCardAccessId,
    key,
    username,
  );

  const contactCard = mergeContactCardWithCommonInfos(
    webCard,
    profile.contactCard,
  );

  const avatarUrl = profile && (await buildAvatarUrl(profile, webCard));

  let avatar;

  if (avatarUrl) {
    const data = await fetch(avatarUrl);
    const blob = await data.arrayBuffer();
    const base64 = Buffer.from(blob).toString('base64');

    avatar = {
      type: data.headers.get('content-type')?.split('/')[1] ?? 'png',
      base64,
    };
  }

  const vCard = await buildVCardFromContactCard(
    webCard.userName,
    profile.id,
    contactCard,
    avatar,
  );

  const vCardContactString = vCard.toString();

  const vCardFileName = buildVCardFileName('', profile.contactCard ?? {});

  return new Response(vCardContactString, {
    headers: {
      'Content-Disposition': `attachment; filename="${vCardFileName}"`,
      'Content-Type': 'text/vcard',
    },
  });
};

export const { GET, OPTIONS } = cors({
  GET: withPluginsRoute(downloadVCard),
});
