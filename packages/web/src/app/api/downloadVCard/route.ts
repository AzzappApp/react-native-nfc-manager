import * as Sentry from '@sentry/nextjs';
import { decompressFromEncodedURIComponent } from 'lz-string';
import { NextResponse } from 'next/server';
import { getProfileById, getWebCardById } from '@azzapp/data';
import { parseContactCard } from '@azzapp/shared/contactCardHelpers';
import { verifyHmacWithPassword } from '@azzapp/shared/crypto';
import { buildVCardFromSerializedContact } from '@azzapp/shared/vCardHelpers';

import { buildAvatarUrl } from '#helpers/avatar';
import cors from '#helpers/cors';
import { withPluginsRoute } from '#helpers/queries';
import { shareBackVCardFilename } from '#helpers/shareBackHelper';
import type { NextRequest } from 'next/server';

const downloadVCard = async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const c = searchParams.get('c');
  const username = searchParams.get('u');

  if (!c || !username) {
    return new NextResponse(null, {
      status: 400,
    });
  }

  let contactData: string;
  let signature: string;
  try {
    [contactData, signature] = JSON.parse(
      decompressFromEncodedURIComponent(c as string),
    );
  } catch {
    Sentry.captureException(
      `ShareBack Invalid request - unable to parse contact data and signature from query string ${c}`,
    );

    return new NextResponse(null, {
      status: 400,
    });
  }

  if (!contactData || !signature) {
    Sentry.captureException(
      `ShareBack Invalid request - contact data or signature missing from query string ${c}`,
    );

    return new NextResponse(null, {
      status: 400,
    });
  }

  const isValid = await verifyHmacWithPassword(
    process.env.CONTACT_CARD_SIGNATURE_SECRET ?? '',
    signature,
    decodeURIComponent(contactData),
    { salt: username },
  );

  if (!isValid) {
    Sentry.captureException(
      `ShareBack Invalid request - signature is not valid from query string ${c}`,
    );
    return new NextResponse(null, {
      status: 400,
    });
  }

  const buildVCardContact = parseContactCard(decodeURIComponent(contactData));

  const [storedProfile, webCard] = await Promise.all([
    getProfileById(buildVCardContact.profileId),
    getWebCardById(buildVCardContact.webCardId),
  ]);

  const avatarUrl =
    storedProfile && (await buildAvatarUrl(storedProfile, webCard));

  const additionalData = {
    urls: (webCard?.commonInformation?.urls ?? []).concat(
      storedProfile?.contactCard?.urls?.filter(url => url.selected) ?? [],
    ),
    socials: (webCard?.commonInformation?.socials ?? []).concat(
      storedProfile?.contactCard?.socials?.filter(social => social.selected) ??
        [],
    ),
    avatarUrl,
    avatar: undefined as { type: string; base64: string } | undefined,
  };

  if (additionalData.avatarUrl) {
    const data = await fetch(additionalData.avatarUrl);
    const blob = await data.arrayBuffer();
    const base64 = Buffer.from(blob).toString('base64');

    additionalData.avatar = {
      type: data.headers.get('content-type')?.split('/')[1] ?? 'png',
      base64,
    };
  }

  const { vCard } = await buildVCardFromSerializedContact(
    webCard?.userName ?? '',
    contactData,
    additionalData,
  );

  const vCardContactString = vCard.toString();

  const vCardFileName = shareBackVCardFilename(buildVCardContact);

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
