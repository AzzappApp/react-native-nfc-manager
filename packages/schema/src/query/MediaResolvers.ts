import { MODULE_IMAGES_SIZES } from '@azzapp/shared/cardModuleHelpers';
import { CONTACTCARD_ASSET_SIZES } from '@azzapp/shared/contactCardHelpers';
import { COVER_ASSET_SIZES } from '@azzapp/shared/coverHelpers';
import {
  getCloudinaryAssetURL,
  getImageURLForSize,
  getVideoThumbnailURL,
  getVideoUrlForSize,
} from '@azzapp/shared/imagesHelpers';
import {
  POST_IMAGES_SIZES,
  POST_VIDEO_SIZES,
} from '@azzapp/shared/postHelpers';
import { mediaLoader } from '#loaders';
import type {
  MediaImageResolvers,
  MediaResolvers,
  MediaVideoResolvers,
} from '#/__generated__/types';
import type { Media as MediaModel } from '@azzapp/data';

export type DeferredMedia = MediaModel | string;

export type MediaWithAssetKind = {
  media: DeferredMedia;
  assetKind:
    | 'contactCard'
    | 'cover'
    | 'coverPreview'
    | 'logo'
    | 'module'
    | 'post'
    | 'rawCover';
};

export type MediaResolverBaseType = DeferredMedia | MediaWithAssetKind;

const getDeferredMedia = (media: MediaResolverBaseType) => {
  if (typeof media === 'object' && 'assetKind' in media) {
    return media.media;
  }
  return media;
};

const getActualMedia = async (media: MediaResolverBaseType) => {
  media = getDeferredMedia(media);
  if (typeof media === 'string') {
    const dbMedia = await mediaLoader.load(media);
    if (!dbMedia) {
      console.warn(`Media ${media} not found`);
    }
    return dbMedia;
  } else {
    return media;
  }
};

const getAssetKind = (media: MediaResolverBaseType) => {
  if (typeof media === 'object' && 'assetKind' in media) {
    return media.assetKind;
  }
  return null;
};

const MediaResolversBase = {
  id: (media: MediaResolverBaseType) => {
    media = getDeferredMedia(media);
    return typeof media === 'string' ? media : media.id;
  },
  aspectRatio: async (media: MediaResolverBaseType, _: any) => {
    const actualMedia = await getActualMedia(media);
    return (actualMedia?.width ?? 1) / (actualMedia?.height ?? 1);
  },
  height: async (media: MediaResolverBaseType, _: any) => {
    const actualMedia = await getActualMedia(media);
    return actualMedia?.height ?? 0;
  },
  width: async (media: MediaResolverBaseType, _: any) => {
    const actualMedia = await getActualMedia(media);
    return actualMedia?.width ?? 0;
  },
};

export const Media: MediaResolvers = {
  __resolveType: media => {
    if (typeof media === 'object' && 'assetKind' in media) {
      media = media.media;
    }
    let kind: 'image' | 'video' | null = null;
    if (typeof media === 'string') {
      kind = media.startsWith('v') ? 'video' : 'image';
    } else {
      kind = media.kind;
    }
    switch (kind) {
      case 'image':
        return 'MediaImage';
      case 'video':
        return 'MediaVideo';
      default:
        return null;
    }
  },
};

const uriResolver =
  (kind: 'image' | 'video', uriGenerator: typeof getImageURLForSize) =>
  (
    media: MediaResolverBaseType,
    {
      width,
      height,
      pixelRatio,
      raw,
      videoDurationPercentage,
    }: {
      width?: number | null;
      height?: number | null;
      pixelRatio?: number | null;
      raw?: boolean | null;
      videoDurationPercentage?: number | null;
    },
  ) => {
    const assetKind = getAssetKind(media);
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
      videoDurationPercentage,
    });
  };

export const MediaImage: MediaImageResolvers = {
  uri: uriResolver('image', getImageURLForSize),
  ...MediaResolversBase,
};

export const MediaVideo: MediaVideoResolvers = {
  uri: uriResolver('video', getVideoUrlForSize),
  thumbnail: uriResolver('image', getVideoThumbnailURL),
  ...MediaResolversBase,
};
