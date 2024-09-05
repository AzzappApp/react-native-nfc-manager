import * as Sentry from '@sentry/nextjs';
import { decompressFromEncodedURIComponent } from 'lz-string';
import { NextResponse } from 'next/server';
import { withAxiom } from 'next-axiom';
import { verifyHmacWithPassword } from '@azzapp/shared/crypto';
import { buildVCardFromShareBackContact } from '@azzapp/shared/vCardHelpers';

import { generateSaltFromValues } from '#helpers/shareBackHelper';
import type { ShareBackContact } from '@azzapp/shared/vCardHelpers';
import type { NextRequest } from 'next/server';

const shareBackVCard = async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const c = searchParams.get('c');

  if (!c) {
    return new NextResponse(null, {
      status: 400,
    });
  }

  let contactData: Record<string, string>;
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

  const shareBackContactValues = generateSaltFromValues(
    contactData as ShareBackContact,
  );

  const isValid = await verifyHmacWithPassword(
    process.env.CONTACT_CARD_SIGNATURE_SECRET ?? '',
    signature,
    JSON.stringify(contactData, null, 2),
    { salt: shareBackContactValues },
  );

  if (!isValid) {
    Sentry.captureException(
      `ShareBack Invalid request - signature is not valid from query string ${c}`,
    );
    return new NextResponse(null, {
      status: 400,
    });
  }
  const buildVCardContact = buildVCardFromShareBackContact(
    contactData as ShareBackContact,
  );
  const vCardContactString = buildVCardContact.toString();

  let vCardFileName = `${contactData?.firstName?.trim() ? `-${contactData.firstName.trim()}` : ''}${contactData?.lastName?.trim() ? `-${contactData.lastName.trim()}` : ''}`;
  if (!vCardFileName) {
    vCardFileName = 'azzapp-contact';
  }

  return new Response(vCardContactString, {
    headers: {
      'Content-Disposition': `attachment; filename="${vCardFileName}.vcf"`,
      'Content-Type': 'text/vcard',
    },
  });
};

export const { GET } = { GET: withAxiom(shareBackVCard) };
