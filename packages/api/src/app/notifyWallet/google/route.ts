import * as Sentry from '@sentry/nextjs';
import { BarcodeTypeEnum } from 'google-wallet/lib/cjs/generic';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import {
  getContactCardAccessById,
  getProfileById,
  getWebCardById,
  updateHasGooglePass,
} from '@azzapp/data';
import { checkServerAuth } from '@azzapp/service/serverAuthServices';
import ERRORS from '@azzapp/shared/errors';
import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';
import { buildUserUrlWithContactCard } from '@azzapp/shared/urlHelpers';
import { generateGooglePassInfos } from '#helpers/pass/google';
import { withPluginsRoute } from '#helpers/queries';

const NotifyGooglePassWalletSchema = z.object({
  serial: z.string(),
  locale: z.string(),
});

export const POST = withPluginsRoute(async (req: Request) => {
  try {
    await checkServerAuth(headers());
    const body = await req.json();
    const { serial, locale } = NotifyGooglePassWalletSchema.parse(body);

    const { objectId, issuerId, genericClient } =
      generateGooglePassInfos(serial);

    // Check if the pass exists on google wallet
    const currentPass = await genericClient.getObject(issuerId, objectId);

    if (!currentPass) {
      await updateHasGooglePass(serial, false);

      return NextResponse.json({ message: 'removed' }, { status: 200 });
    }

    let profile;

    const contactCardAccess = await getContactCardAccessById(serial);
    if (contactCardAccess) {
      if (contactCardAccess.isRevoked) {
        await updateHasGooglePass(serial, false);
        return NextResponse.json(
          { message: ERRORS.FORBIDDEN },
          { status: 403 },
        );
      }

      profile = await getProfileById(contactCardAccess.profileId);
      if (!profile) {
        return NextResponse.json(
          { message: ERRORS.INVALID_REQUEST },
          { status: 400 },
        );
      }
    }
    if (!profile) {
      profile = await getProfileById(serial);
    }
    if (!profile) {
      return NextResponse.json(
        { message: ERRORS.INVALID_REQUEST },
        { status: 400 },
      );
    }

    const webCard = await getWebCardById(profile.webCardId);

    let contactCard = profile.contactCard;

    if (!contactCard && webCard) {
      contactCard = {
        firstName: webCard.firstName,
        lastName: webCard.lastName,
        company: webCard.companyName,
      };
    }

    if (contactCard) {
      let barCodeUrl;
      if (!contactCardAccess) {
        const { data, signature } = await serializeAndSignContactCard(
          webCard?.userName ?? '',
          profile.id,
          profile.webCardId,
          contactCard,
          webCard?.isMultiUser ? webCard?.commonInformation : undefined,
        );

        barCodeUrl = buildUserUrlWithContactCard(
          webCard?.userName ?? '',
          data,
          signature,
        );
      }

      const objectData = {
        ...currentPass,
        // Define the object data
        header: {
          defaultValue: {
            language: locale,
            value:
              `${contactCard?.firstName ?? ''} ${
                contactCard?.lastName ?? ''
              }`.trim() ||
              webCard?.commonInformation?.company?.trim() ||
              contactCard?.company?.trim() ||
              webCard?.userName ||
              ' ', // empty string is not allowed
          },
        },
        hexBackgroundColor: webCard?.cardColors?.primary ?? '#000000',
      };

      if (barCodeUrl) {
        objectData.barcode = {
          type: BarcodeTypeEnum.QR_CODE,
          value: barCodeUrl,
          alternateText: '',
        };
      }

      if (contactCard.title) {
        objectData.subheader = {
          defaultValue: {
            language: locale,
            value: contactCard?.title ?? ' ',
          },
        };
      }

      if (contactCard?.company) {
        objectData.textModulesData = [
          {
            id: 'company',
            body: contactCard?.company,
          },
        ];
      }

      await genericClient.patchObject(objectData);
    }

    return NextResponse.json({ message: 'updated' }, { status: 200 });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { message: ERRORS.INVALID_REQUEST },
      { status: 400 },
    );
  }
});

export const runtime = 'nodejs';
