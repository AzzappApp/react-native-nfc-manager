import {
  getCloudinaryAssetURL,
  type UrLForSizeParam,
} from '@azzapp/service/mediaServices/imageHelpers';
import { MODULE_IMAGES_SIZES } from '@azzapp/shared/cardModuleHelpers';
import {
  CONTACT_CARD_AVATAR_SIZES,
  CONTACT_CARD_LOGO_SIZES,
} from '@azzapp/shared/contactCardHelpers';
import {
  COVER_ASSET_SIZES,
  DEFAULT_VIDEO_PERCENTAGE_THUMBNAIL,
} from '@azzapp/shared/coverHelpers';
import {
  POST_IMAGES_SIZES,
  POST_VIDEO_SIZES,
} from '@azzapp/shared/postHelpers';
import type { MediaResolverBaseType } from '#query/MediaResolvers';

export const getPercentagePreview = (media: MediaResolverBaseType) => {
  if (typeof media === 'object' && 'previewPositionPercentage' in media) {
    return (
      media.previewPositionPercentage ?? DEFAULT_VIDEO_PERCENTAGE_THUMBNAIL
    );
  }
  return undefined;
};

export const getAssetKind = (media: MediaResolverBaseType) => {
  if (typeof media === 'object' && 'assetKind' in media) {
    return media.assetKind;
  }
  return null;
};

export const uriResolver =
  (kind: 'image' | 'video', uriGenerator: (prop: UrLForSizeParam) => string) =>
  (
    media: MediaResolverBaseType,
    {
      width,
      height,
      radius,
      pixelRatio,
      raw,
      format,
    }: {
      width?: number | null;
      height?: number | null;
      radius?: number | null;
      pixelRatio?: number | null;
      raw?: boolean | null;
      format?: string | null;
    },
  ) => {
    const assetKind = getAssetKind(media);
    const previewPositionPercentage = getPercentagePreview(media);
    media = getDeferredMedia(media);
    const id = typeof media === 'string' ? media : media.id;
    if (raw) {
      return getCloudinaryAssetURL(id, kind);
    }

    let pregeneratedSizes;
    switch (assetKind) {
      case 'cover':
      case 'rawCover':
      case 'coverPreview':
        pregeneratedSizes = COVER_ASSET_SIZES;
        break;
      case 'module':
        pregeneratedSizes = MODULE_IMAGES_SIZES;
        break;
      case 'avatar':
        pregeneratedSizes = CONTACT_CARD_AVATAR_SIZES;
        break;
      case 'post':
        pregeneratedSizes =
          kind === 'image' ? POST_IMAGES_SIZES : POST_VIDEO_SIZES;
        break;
      case 'logo':
        pregeneratedSizes = CONTACT_CARD_LOGO_SIZES;
        break;
      default:
        pregeneratedSizes = null;
    }

    return uriGenerator({
      id,
      width,
      height,
      radius,
      pixelRatio,
      pregeneratedSizes,
      previewPositionPercentage,
      format,
    });
  };

export const getDeferredMedia = (media: MediaResolverBaseType) => {
  if (typeof media === 'object' && 'assetKind' in media) {
    return media.media;
  }
  return media;
};
