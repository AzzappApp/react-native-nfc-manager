import { PKPass } from 'passkit-generator';
import {
  getMediasByIds,
  buildDefaultContactCard,
  getProfileWithWebCardById,
} from '@azzapp/data/domains';
import { getTextColor } from '@azzapp/shared/colorsHelpers';
import { seal } from '@azzapp/shared/crypto';
import serializeAndSignContactCard from '@azzapp/shared/serializeAndSignContactCard';
import { buildUserUrlWithContactCard } from '@azzapp/shared/urlHelpers';
import icon from '@azzapp/web/public/pass/ICON_PADDING_15.png';
import icon2x from '@azzapp/web/public/pass/ICON_PADDING_15@2x.png';
import logo from '@azzapp/web/public/pass/LOGO_PADDING_0-40.png';
import logo2x from '@azzapp/web/public/pass/LOGO_PADDING_0-40@2x.png';
import { convertHexToRGBA } from '../color';

const getCoverUrl = (userName: string, size: number) =>
  `${process.env.NEXT_PUBLIC_URL}api/cover/${userName}?width=${size}&height=${size}&keepAspectRatio=left_pad`;

export const buildApplePass = async (profileId: string, locale: string) => {
  const res = await getProfileWithWebCardById(profileId);
  if (res) {
    const [media] = res.WebCard.coverData?.mediaId
      ? await getMediasByIds([res.WebCard.coverData?.mediaId])
      : [];

    const thumbnails: Record<string, Buffer> = {};

    if (media) {
      const [thumbnailUrl, thumbnail2xUrl, thumbnail3xUrl] =
        await Promise.allSettled([
          fetch(getCoverUrl(res.WebCard.userName, 90)).then(res =>
            res.arrayBuffer(),
          ),
          fetch(getCoverUrl(res.WebCard.userName, 90 * 2)).then(res =>
            res.arrayBuffer(),
          ),
          fetch(getCoverUrl(res.WebCard.userName, 90 * 3)).then(res =>
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

    let contactCard = res.Profile.contactCard;

    if (!contactCard) {
      contactCard = await buildDefaultContactCard(
        res.WebCard,
        res.Profile.userId,
      );
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

    const primary = res.WebCard.cardColors?.primary;

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
        foregroundColor: convertHexToRGBA(getTextColor(backgroundColor)),
        backgroundColor,
        labelColor: convertHexToRGBA(getTextColor(backgroundColor)),
        suppressStripShine: false,
        serialNumber: profileId,
        webServiceURL: `${process.env.NEXT_PUBLIC_URL}api/${locale}/wallet/apple/`,
        authenticationToken: await seal(
          profileId,
          process.env.APPLE_TOKEN_PASSWORD ?? '',
        ),
      },
    );

    if (contactCard) {
      const { data, signature } = await serializeAndSignContactCard(
        res.WebCard.userName,
        profileId,
        res.WebCard.id,
        contactCard,
        res.WebCard.commonInformation,
      );

      pass.setBarcodes({
        message: buildUserUrlWithContactCard(
          res.WebCard?.userName ?? '',
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
