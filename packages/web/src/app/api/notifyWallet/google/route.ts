import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import {
  getProfileById,
  getWebCardById,
  updateHasGooglePass,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { generateGooglePassInfos } from '#helpers/pass/google';
import { withPluginsRoute } from '#helpers/queries';
import { checkServerAuth } from '#helpers/tokens';

const NotifyGooglePassWalletSchema = z.object({
  profileId: z.string(),
  locale: z.string(),
});

export const POST = withPluginsRoute(async (req: Request) => {
  try {
    await checkServerAuth();
    const body = await req.json();
    const { profileId, locale } = NotifyGooglePassWalletSchema.parse(body);

    const { objectId, issuerId, genericClient } =
      generateGooglePassInfos(profileId);

    // Check if the pass exists on google wallet
    const currentPass = await genericClient.getObject(issuerId, objectId);

    if (!currentPass) {
      await updateHasGooglePass(profileId, false);

      return NextResponse.json({ message: 'removed' }, { status: 200 });
    }

    const profile = await getProfileById(profileId);
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
