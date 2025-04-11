import {
  getImageURLForSize,
  getVideoThumbnailURL,
  getVideoUrlForSize,
} from '@azzapp/shared/imagesHelpers';

import { mediaLoader } from '#loaders';
import { getDeferredMedia, uriResolver } from '#helpers/mediaHelpers';
import type {
  MediaImageResolvers,
  MediaResolvers,
  MediaVideoResolvers,
} from '#/__generated__/types';
import type { Media as MediaModel } from '@azzapp/data';

export type DeferredMedia = MediaModel | string;

export type MediaWithAssetKind =
  | {
      media: DeferredMedia;
      assetKind: 'banner' | 'contactCard' | 'logo' | 'module' | 'post';
    }
  | {
      media: DeferredMedia;
      previewPositionPercentage?: number | null;
      assetKind: 'cover' | 'coverPreview' | 'rawCover';
    };

export type MediaResolverBaseType = DeferredMedia | MediaWithAssetKind;

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

export const MediaImage: MediaImageResolvers = {
  uri: uriResolver('image', getImageURLForSize),
  ...MediaResolversBase,
};

export const MediaVideo: MediaVideoResolvers = {
  uri: uriResolver('video', getVideoUrlForSize),
  thumbnail: uriResolver('image', getVideoThumbnailURL),
  ...MediaResolversBase,
};
