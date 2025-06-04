import {
  BarcodeTypeEnum,
  GenericTypeEnum,
  MultipleDevicesAndHoldersAllowedStatusEnum,
  StateEnum,
} from 'google-wallet/lib/cjs/generic';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import {
  buildDefaultContactCard,
  getContactCardAccessById,
  getProfileById,
  getWebCardById,
  updateContactCardAccessHasGooglePass,
  updateHasGooglePass,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { buildUserUrlWithKey, buildWebUrl } from '@azzapp/shared/urlHelpers';
import env from '#env';
import { generateGooglePassInfos } from '#helpers/pass/google';
import { withPluginsRoute } from '#helpers/queries';
import { getSessionData } from '#helpers/tokens';
import type {
  GenericClass,
  GenericObject,
} from 'google-wallet/lib/cjs/generic';

export const maxDuration = 30; //30 seconds

const getGoogleWalletPass = async (
  req: Request,
  {
    params: { lang },
  }: {
    params: { lang: string };
  },
) => {
  const searchParams = new URL(req.url).searchParams;

  const contactCardAccessId = searchParams.get('contactCardAccessId');

  const key = searchParams.get('key');

  const hasPassData = contactCardAccessId && key;

  let currentUserId: string | undefined;
  try {
    const { userId } = (await getSessionData()) ?? {};
    if (!userId) {
      return NextResponse.json(
        { message: ERRORS.UNAUTHORIZED },
        { status: 401 },
      );
    }
    currentUserId = userId;

    let profile;

    if (!hasPassData) {
      return NextResponse.json(
        { message: ERRORS.INVALID_REQUEST },
        { status: 422 },
      );
    }

    const contactCardAccess =
      await getContactCardAccessById(contactCardAccessId);

    if (contactCardAccess && !contactCardAccess.isRevoked) {
      profile = await getProfileById(contactCardAccess.profileId);
    }

    if (!profile) {
      return NextResponse.json(
        { message: ERRORS.UNAUTHORIZED },
        { status: 401 },
      );
    }

    const credentials = JSON.parse(
      Buffer.from(env.GOOGLE_PASS_CREDENTIALS, 'base64').toString(),
    );

    const { passId, issuerId, objectId, genericClient } =
      generateGooglePassInfos(profile.id);

    const classPrefix = 'contactCard_class';

    const classData: GenericClass = {
      // Define the class data
      id: `${env.GOOGLE_PASS_ISSUER_ID}.${classPrefix}`,
      multipleDevicesAndHoldersAllowedStatus:
        MultipleDevicesAndHoldersAllowedStatusEnum.ONE_USER_ALL_DEVICES,
    };

    let genericClass = await genericClient.getClass(
      env.GOOGLE_PASS_ISSUER_ID,
      `${classPrefix}`,
    );

    if (!genericClass) {
      genericClass = await genericClient.createClass(classData);
    } else {
      genericClass = await genericClient.patchClass(classData);
    }

    // Create or update a contact card object

    const webCard = await getWebCardById(profile.webCardId);

    if (!webCard) {
      return NextResponse.json(
        { message: ERRORS.INVALID_REQUEST },
        { status: 422 },
      );
    }

    let contactCard = profile.contactCard;

    if (!contactCard) {
      contactCard = await buildDefaultContactCard(webCard, currentUserId);
    }

    const barCodeUrl = buildUserUrlWithKey({
      userName: webCard?.userName ?? '',
      contactCardAccessId,
      key,
    });

    const objectData: GenericObject = {
      // Define the object data
      cardTitle: {
        defaultValue: {
          language: lang,
          value: 'Azzapp Contact Card',
        },
      },
      header: {
        defaultValue: {
          language: lang,
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
      genericType: GenericTypeEnum.GENERIC_OTHER,
      barcode: {
        type: BarcodeTypeEnum.QR_CODE,
        value: barCodeUrl,
        alternateText: '',
      },
      classId: classData.id,
      id: passId,
      hexBackgroundColor: webCard?.cardColors?.primary ?? '#000000',
      state: StateEnum.ACTIVE,
      logo: {
        sourceUri: {
          uri: 'https://i.ibb.co/pbt44Sd/Union.png', //todo set public url for logo
        },
      },
    };

    if (contactCard.title) {
      objectData.subheader = {
        defaultValue: {
          language: lang,
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

    let genericObject = await genericClient.getObject(issuerId, objectId);
    if (!genericObject) {
      genericObject = await genericClient.createObject(objectData);
    } else {
      // Update the object data
      genericObject = await genericClient.patchObject(objectData);
    }
    if (hasPassData) {
      await updateContactCardAccessHasGooglePass(contactCardAccessId, true);
    } else {
      await updateHasGooglePass(profile.id, true);
    }

    const token = jwt.sign(
      {
        iss: credentials.client_email,
        aud: 'google',
        origins: [new URL(buildWebUrl()).hostname],
        typ: 'savetowallet',
        payload: {
          // The listed classes and objects will be created
          genericClasses: [genericClass],
          genericObjects: [genericObject],
        },
      },
      credentials.private_key,
      {
        algorithm: 'RS256',
      },
    );

    return NextResponse.json({ token });
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

export const { GET } = { GET: withPluginsRoute(getGoogleWalletPass) };

export const runtime = 'nodejs';
