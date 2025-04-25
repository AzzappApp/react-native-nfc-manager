import { PKPass } from 'passkit-generator';
import {
  getMediasByIds,
  buildDefaultContactCard,
  getWebCardById,
} from '@azzapp/data';
import { convertHexToRGBA, getTextColor } from '@azzapp/shared/colorsHelpers';
import { seal, unseal } from '@azzapp/shared/crypto';
import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';
import {
  buildUserUrlWithContactCard,
  buildUserUrlWithKey,
} from '@azzapp/shared/urlHelpers';
import icon from '@azzapp/web/public/pass/ICON_PADDING_15.png';
import icon2x from '@azzapp/web/public/pass/ICON_PADDING_15@2x.png';
import logo from '@azzapp/web/public/pass/LOGO_PADDING_0-40.png';
import logo2x from '@azzapp/web/public/pass/LOGO_PADDING_0-40@2x.png';
import type { Profile, WebCard } from '@azzapp/data';

const getCoverUrl = (webCard: WebCard, size: number) =>
  `${process.env.NEXT_PUBLIC_API_ENDPOINT}/cover/${webCard.userName}?width=${size}&crop=lpad&t=${webCard.updatedAt.getTime()}`;

export const APPLE_TEAM_IDENTIFIER = process.env.APPLE_TEAM_IDENTIFIER ?? ''; // Team ID

const APPLE_HEADER_PREFIX = 'ApplePass ';

export const SIGNER_CERT = Buffer.from(
  process.env.APPLE_PASS_SIGNER_CERT ?? '',
  'base64',
);

export const SIGNER_KEY = Buffer.from(
  process.env.APPLE_PASS_SIGNER_KEY ?? '',
  'base64',
);

export const SIGNER_KEY_PASSPHRASE =
  process.env.APPLE_PASS_SIGNER_KEY_PASSPHRASE;

export const APPLE_PASS_IDENTIFIER = process.env.APPLE_PASS_IDENTIFIER ?? '';

export const checkAuthorization = async (req: Request, serial: string) => {
  const authorization = req.headers
    .get('Authorization')
    ?.replace(APPLE_HEADER_PREFIX, '');

  if (!authorization) {
    throw new Error('Unauthorized');
  }

  const data = await unseal(
    authorization,
    process.env.APPLE_TOKEN_PASSWORD ?? '',
  );
  if (typeof data === 'object' && data) {
    const { contactCardAccessId, key } = data as {
      contactCardAccessId: string;
      key: string;
    };

    if (serial !== contactCardAccessId) {
      throw new Error('Unauthorized');
    }
    return { contactCardAccessId, key };
  } else if (data !== serial) {
    throw new Error('Unauthorized');
  }

  return data;
};

export const buildApplePass = async ({
  profile,
  locale,
  contactCardAccessId,
  key,
}: {
  profile: Profile;
  locale: string;
  contactCardAccessId?: string | null;
  key?: string | null;
}) => {
  const webCard = await getWebCardById(profile.webCardId);
  if (webCard) {
    const [media] = webCard.coverMediaId
      ? await getMediasByIds([webCard.coverMediaId])
      : [];

    const thumbnails: Record<string, Buffer> = {};

    if (media) {
      const thumbnail = await getCoverUrl(webCard, 90);
      const thumbnail2x = await getCoverUrl(webCard, 90 * 2);
      const thumbnail3x = await getCoverUrl(webCard, 90 * 3);
      const [thumbnailUrl, thumbnail2xUrl, thumbnail3xUrl] = thumbnail
        ? await Promise.allSettled([
            fetch(thumbnail).then(res => res.arrayBuffer()),
            fetch(thumbnail2x!).then(res => res.arrayBuffer()),
            fetch(thumbnail3x!).then(res => res.arrayBuffer()),
          ])
        : [null, null, null];

      if (thumbnailUrl?.status === 'fulfilled') {
        thumbnails['thumbnail.png'] = Buffer.from(thumbnailUrl.value);
      }
      if (thumbnail2xUrl?.status === 'fulfilled') {
        thumbnails['thumbnail@2x.png'] = Buffer.from(thumbnail2xUrl.value);
      }
      if (thumbnail3xUrl?.status === 'fulfilled') {
        thumbnails['thumbnail@3x.png'] = Buffer.from(thumbnail3xUrl.value);
      }
    }

    let contactCard = profile.contactCard;

    if (!contactCard) {
      contactCard = await buildDefaultContactCard(webCard, profile.userId);
    }

    const [iconContent, icon2xContent, logoContent, logo2xContent] =
      await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_URL}${icon.src}`).then(res =>
          res.arrayBuffer(),
        ),
        fetch(`${process.env.NEXT_PUBLIC_URL}${icon2x.src}`).then(res =>
          res.arrayBuffer(),
        ),
        fetch(`${process.env.NEXT_PUBLIC_URL}${logo.src}`).then(res =>
          res.arrayBuffer(),
        ),
        fetch(`${process.env.NEXT_PUBLIC_URL}${logo2x.src}`).then(res =>
          res.arrayBuffer(),
        ),
      ]);

    const primary = webCard.cardColors?.primary;

    const backgroundColor = primary
      ? convertHexToRGBA(primary)
      : 'rgb(0, 0, 0)';

    const pass = new PKPass(
      {
        'icon.png': Buffer.from(iconContent),
        'icon@2x.png': Buffer.from(icon2xContent),
        'logo.png': Buffer.from(logoContent),
        'logo@2x.png': Buffer.from(logo2xContent),
        ...thumbnails,
      },
      {
        signerCert: SIGNER_CERT,
        signerKey: SIGNER_KEY,
        signerKeyPassphrase: SIGNER_KEY_PASSPHRASE,
        wwdr: Buffer.from(process.env.APPLE_PASS_WWDR ?? '', 'base64'),
      },
      {
        passTypeIdentifier: process.env.APPLE_PASS_IDENTIFIER ?? '',
        teamIdentifier: APPLE_TEAM_IDENTIFIER,
        organizationName: process.env.APPLE_ORGANIZATION_NAME ?? '',
        description: 'Contact Card',
        foregroundColor: convertHexToRGBA(getTextColor(backgroundColor)),
        backgroundColor,
        labelColor: convertHexToRGBA(getTextColor(backgroundColor)),
        suppressStripShine: false,
        serialNumber: contactCardAccessId ?? profile.id,
        webServiceURL: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/${locale}/wallet/apple/`,
        authenticationToken: await seal(
          key
            ? {
                contactCardAccessId,
                key,
              }
            : profile.id,
          process.env.APPLE_TOKEN_PASSWORD ?? '',
        ),
      },
    );

    if (contactCardAccessId && key) {
      pass.setBarcodes({
        message: buildUserUrlWithKey({
          userName: webCard?.userName ?? '',
          contactCardAccessId,
          key,
        }),
        format: 'PKBarcodeFormatQR',
      });
    } else {
      const { data, signature } = await serializeAndSignContactCard(
        webCard.userName ?? '',
        profile.id,
        webCard.id,
        contactCard,
        webCard.isMultiUser ? webCard.commonInformation : undefined,
      );

      pass.setBarcodes({
        message: buildUserUrlWithContactCard(
          webCard?.userName ?? '',
          data,
          signature,
        ),
        format: 'PKBarcodeFormatQR',
      });
    }

    pass.type = 'generic';

    pass.primaryFields.push({
      key: 'name',
      value: `${contactCard?.firstName ?? ''} ${
        contactCard?.lastName ?? ''
      }`.trim(),
      textAlignment: 'PKTextAlignmentLeft',
    });
    pass.secondaryFields.push({
      key: 'title',
      value: contactCard?.title ?? '',
      textAlignment: 'PKTextAlignmentLeft',
    });
    pass.secondaryFields.push({
      key: 'company',
      value: webCard.commonInformation?.company ?? contactCard?.company ?? '',
      textAlignment: 'PKTextAlignmentLeft',
    });

    return pass;
  }

  return null;
};
