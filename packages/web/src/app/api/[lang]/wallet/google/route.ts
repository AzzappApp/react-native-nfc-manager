import {
  BarcodeTypeEnum,
  GenericClient,
  GenericTypeEnum,
  MultipleDevicesAndHoldersAllowedStatusEnum,
  StateEnum,
} from 'google-wallet/lib/cjs/generic';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { getSessionData } from '@azzapp/auth/viewer';
import {
  getContactCard,
  getProfilesByIds,
  buildDefaultContactCard,
} from '@azzapp/data/domains';
import { serializeAndSignContactCard } from '@azzapp/shared/contactCardSignHelpers';
import ERRORS from '@azzapp/shared/errors';
import { buildUserUrlWithContactCard } from '@azzapp/shared/urlHelpers';
import type { SessionData } from '@azzapp/auth/viewer';
import type {
  GenericClass,
  GenericObject,
} from 'google-wallet/lib/cjs/generic';

const getGoogleWalletPass = async (
  _: Request,
  { params: { lang } }: { params: { lang: string } },
) => {
  let viewer: SessionData;
  try {
    viewer = await getSessionData();

    if (viewer.isAnonymous || !viewer.profileId) {
      return NextResponse.json(
        { message: ERRORS.UNAUTORIZED },
        { status: 401 },
      );
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

  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_PASS_CREDENTIALS ?? '', 'base64').toString(),
  );

  const generic = new GenericClient(credentials);

  const classPrefix = 'concatCard_class';

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

  let contactCard = await getContactCard(viewer.profileId);

  const [profile] = await getProfilesByIds([viewer.profileId]);

  if (!contactCard && profile) {
    contactCard = buildDefaultContactCard(profile);
  }

  if (contactCard) {
    const { data, signature } = await serializeAndSignContactCard(
      profile?.userName ?? '',
      contactCard,
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
            (`${contactCard?.firstName ?? ''} ${
              contactCard?.lastName ?? ''
            }`.trim() ||
              contactCard?.company) ??
            '',
        },
      },
      genericType: GenericTypeEnum.GENERIC_OTHER,
      barcode: {
        type: BarcodeTypeEnum.QR_CODE,
        value: buildUserUrlWithContactCard(
          profile?.userName ?? '',
          data,
          signature,
        ),
        alternateText: '',
      },
      classId: classData.id,
      id: `${process.env.GOOGLE_PASS_ISSUER_ID}.${objectSuffix}.${viewer.profileId}`,
      hexBackgroundColor:
        contactCard?.backgroundStyle?.backgroundColor ?? '#000000',
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
      `${objectSuffix}.${viewer.profileId}`,
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

  return NextResponse.json({ message: ERRORS.NOT_FOUND }, { status: 404 });
};

export const { GET } = { GET: getGoogleWalletPass };

export const runtime = 'nodejs';
