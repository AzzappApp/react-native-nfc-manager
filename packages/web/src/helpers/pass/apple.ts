import { PKPass } from 'passkit-generator';
import {
  getProfilesByIds,
  getMediasByIds,
  buildDefaultContactCard,
} from '@azzapp/data/domains';
import { serializeAndSignContactCard } from '@azzapp/shared/contactCardSignHelpers';
import { seal } from '@azzapp/shared/crypto';
import {
  getImageURLForSize,
  getVideoThumbnailURL,
} from '@azzapp/shared/imagesHelpers';
import { buildUserUrlWithContactCard } from '@azzapp/shared/urlHelpers';
import logo from '@azzapp/web/public/pass/logo.png';
import logo2x from '@azzapp/web/public/pass/logo@2x.png';
import { convertHexToRGBA } from '../color';

export const buildApplePass = async (profileId: string, locale: string) => {
  const [profile] = await getProfilesByIds([profileId]);
  if (profile) {
    const [media] = profile.coverData?.mediaId
      ? await getMediasByIds([profile.coverData?.mediaId])
      : [];

    const thumbnails: Record<string, Buffer> = {};

    if (media) {
      const [thumbnailUrl, thumbnail2xUrl, thumbnail3xUrl] =
        media?.kind === 'video'
          ? await Promise.allSettled([
              fetch(getVideoThumbnailURL(media.id, 90)).then(res =>
                res.arrayBuffer(),
              ),
              fetch(getVideoThumbnailURL(media.id, 90 * 2)).then(res =>
                res.arrayBuffer(),
              ),
              fetch(getVideoThumbnailURL(media.id, 90 * 3)).then(res =>
                res.arrayBuffer(),
              ),
            ])
          : await Promise.allSettled([
              fetch(getImageURLForSize(media.id, 90)).then(res =>
                res.arrayBuffer(),
              ),
              fetch(getImageURLForSize(media.id, 90 * 2)).then(res =>
                res.arrayBuffer(),
              ),
              fetch(getImageURLForSize(media.id, 90 * 3)).then(res =>
                res.arrayBuffer(),
              ),
            ]);

      if (thumbnailUrl.status === 'fulfilled') {
        thumbnails['thumbnail.png'] = Buffer.from(thumbnailUrl.value);
      }
      if (thumbnail2xUrl.status === 'fulfilled') {
        thumbnails['thumbnail@2x.png'] = Buffer.from(thumbnail2xUrl.value);
      }
      if (thumbnail3xUrl.status === 'fulfilled') {
        thumbnails['thumbnail@3x.png'] = Buffer.from(thumbnail3xUrl.value);
      }
    }

    let contactCard = profile.contactCard;

    if (!contactCard && profile) {
      contactCard = await buildDefaultContactCard(profile);
    }

    const [logoContent, logo2xContent] = await Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_URL}${logo.src}`.replace('//', '/'),
      ).then(res => res.arrayBuffer()),
      fetch(
        `${process.env.NEXT_PUBLIC_URL}${logo2x.src}`.replace('//', '/'),
      ).then(res => res.arrayBuffer()),
    ]);

    const primary = profile.cardColors?.primary;
    const pass = new PKPass(
      {
        'icon.png': Buffer.from(logoContent),
        'icon@2x.png': Buffer.from(logo2xContent),
        'logo.png': Buffer.from(logoContent),
        'logo@2x.png': Buffer.from(logo2xContent),
        ...thumbnails,
      },
      {
        signerCert: Buffer.from(
          process.env.APPLE_PASS_SIGNER_CERT ?? '',
          'base64',
        ),
        signerKey: Buffer.from(
          process.env.APPLE_PASS_SIGNER_KEY ?? '',
          'base64',
        ),
        signerKeyPassphrase: process.env.APPLE_PASS_SIGNER_KEY_PASSPHRASE,
        wwdr: Buffer.from(process.env.APPLE_PASS_WWDR ?? '', 'base64'),
      },
      {
        passTypeIdentifier: process.env.APPLE_PASS_IDENTIFIER ?? '',
        teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER ?? '',
        organizationName: process.env.APPLE_ORGANIZATION_NAME ?? '',
        description: 'Contact Card',
        foregroundColor: 'rgb(255, 255, 255)',
        backgroundColor: primary ? convertHexToRGBA(primary) : 'rgb(0, 0, 0)',
        labelColor: 'rgb(255, 255, 255)',
        logoText: 'azzapp',
        suppressStripShine: false,
        serialNumber: profile?.id,
        webServiceURL: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/${locale}/wallet/apple/`,
        authenticationToken: await seal(
          profileId,
          process.env.APPLE_TOKEN_PASSWORD ?? '',
        ),
      },
    );

    if (contactCard && profile) {
      const { data, signature } = await serializeAndSignContactCard(
        profile.id,
        profile.userName,
        contactCard,
      );

      pass.setBarcodes({
        message: buildUserUrlWithContactCard(
          profile?.userName ?? '',
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
      value: contactCard?.company ?? '',
      textAlignment: 'PKTextAlignmentLeft',
    });

    return pass;
  }

  return null;
};
