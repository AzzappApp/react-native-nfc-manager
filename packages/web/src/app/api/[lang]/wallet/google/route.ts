import {
  BarcodeTypeEnum,
  GenericClient,
  GenericTypeEnum,
  MultipleDevicesAndHoldersAllowedStatusEnum,
  StateEnum,
} from 'google-wallet/lib/cjs/generic';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import {
  buildDefaultContactCard,
  getProfileByUserAndWebCard,
  getWebCardById,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';
import { buildUserUrlWithContactCard } from '@azzapp/shared/urlHelpers';
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
  const webCardId = new URL(req.url).searchParams.get('webCardId')!;
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
    const profile = await getProfileByUserAndWebCard(userId, webCardId);
    if (!profile) {
      return NextResponse.json(
        { message: ERRORS.UNAUTHORIZED },
        { status: 401 },
      );
    }

    const credentials = JSON.parse(
      Buffer.from(
        process.env.GOOGLE_PASS_CREDENTIALS ?? '',
        'base64',
      ).toString(),
    );

    const generic = new GenericClient(credentials);

    const classPrefix = 'contactCard_class';

    const classData: GenericClass = {
      // Define the class data
      id: `${process.env.GOOGLE_PASS_ISSUER_ID}.${classPrefix}`,
      multipleDevicesAndHoldersAllowedStatus:
        MultipleDevicesAndHoldersAllowedStatusEnum.ONE_USER_ALL_DEVICES,
    };

    let genericClass = await generic.getClass(
      process.env.GOOGLE_PASS_ISSUER_ID ?? '',
      `${classPrefix}`,
    );

    if (!genericClass) {
      genericClass = await generic.createClass(classData);
    } else {
      genericClass = await generic.patchClass(classData);
    }

    // Create or update a contact card object
    const objectSuffix = 'contactCard_object';

    const webCard = await getWebCardById(profile.webCardId);

    let contactCard = profile.contactCard;

    if (!contactCard && webCard) {
      contactCard = await buildDefaultContactCard(webCard, currentUserId);
    }

    if (contactCard) {
      const { data, signature } = await serializeAndSignContactCard(
        webCard?.userName ?? '',
        profile.id,
        profile.webCardId,
        contactCard,
        webCard?.commonInformation,
      );

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
              webCard?.userName, // empty string is not allowed
          },
        },
        genericType: GenericTypeEnum.GENERIC_OTHER,
        barcode: {
          type: BarcodeTypeEnum.QR_CODE,
          value: buildUserUrlWithContactCard(
            webCard?.userName ?? '',
            data,
            signature,
          ),
          alternateText: '',
        },
        classId: classData.id,
        id: `${process.env.GOOGLE_PASS_ISSUER_ID}.${objectSuffix}.${profile.id}`,
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

      let genericObject = await generic.getObject(
        process.env.GOOGLE_PASS_ISSUER_ID ?? '',
        `${objectSuffix}.${profile.id}`,
      );
      if (!genericObject) {
        genericObject = await generic.createObject(objectData);
      } else {
        // Update the object data
        genericObject = await generic.patchObject(objectData);
      }

      const token = jwt.sign(
        {
          iss: credentials.client_email,
          aud: 'google',
          origins: [new URL(process.env.NEXT_PUBLIC_URL ?? '').hostname],
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

  return NextResponse.json({ message: ERRORS.NOT_FOUND }, { status: 404 });
};

export const { GET } = { GET: withPluginsRoute(getGoogleWalletPass) };

export const runtime = 'nodejs';
