import { MODULE_IMAGES_SIZES } from '@azzapp/shared/cardModuleHelpers';
import { CONTACTCARD_ASSET_SIZES } from '@azzapp/shared/contactCardHelpers';
import { COVER_ASSET_SIZES } from '@azzapp/shared/coverHelpers';
import {
  DEFAULT_VIDEO_PERCENTAGE_THUMBNAIL,
  getCloudinaryAssetURL,
} from '@azzapp/shared/imagesHelpers';
import {
  POST_IMAGES_SIZES,
  POST_VIDEO_SIZES,
} from '@azzapp/shared/postHelpers';
import type { MediaResolverBaseType } from '#query/MediaResolvers';
import type { UrLForSizeParam } from '@azzapp/shared/imagesHelpers';

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
      pixelRatio,
      raw,
    }: {
      width?: number | null;
      height?: number | null;
      pixelRatio?: number | null;
      raw?: boolean | null;
    },
  ) => {
    const assetKind = getAssetKind(media);
    const previewPositionPercentage = getPercentagePreview(media);
    media = getDeferredMedia(media);
    const id = typeof media === 'string' ? media : media.id;
    if (raw) {
      return getCloudinaryAssetURL(id, kind);
    }
    const pregeneratedSizes =
      assetKind === 'cover' || assetKind === 'rawCover'
        ? COVER_ASSET_SIZES
        : assetKind === 'module'
          ? MODULE_IMAGES_SIZES
          : assetKind === 'contactCard'
            ? CONTACTCARD_ASSET_SIZES
            : assetKind === 'post'
              ? kind === 'image'
                ? POST_IMAGES_SIZES
                : POST_VIDEO_SIZES
              : null;
    return uriGenerator({
      id,
      width,
      height,
      pixelRatio,
      pregeneratedSizes,
      previewPositionPercentage,
    });
  };

export const getDeferredMedia = (media: MediaResolverBaseType) => {
  if (typeof media === 'object' && 'assetKind' in media) {
    return media.media;
  }
  return media;
};
