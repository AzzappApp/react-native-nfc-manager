import {
  getImageURLForSize,
  getVideoThumbnailURL,
  getVideoUrlForSize,
} from '@azzapp/shared/imagesHelpers';
import type {
  MediaImageResolvers,
  MediaResolvers,
  MediaVideoResolvers,
  StaticMediaResolvers,
} from './__generated__/types';

export const Media: MediaResolvers = {
  __resolveType: ({ kind }) => {
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

export const MediaVideo: MediaVideoResolvers = {
  uri: async ({ id }, { width, height, pixelRatio }) => {
    return getVideoUrlForSize(id, width, height, pixelRatio);
  },
  thumbnail: async ({ id }, { width, height, pixelRatio }) => {
    return getVideoThumbnailURL(id, width, height, pixelRatio);
  },
  aspectRatio: ({ width, height }) => {
    return (width ?? 1) / (height ?? 1);
  },
};

export const MediaImage: MediaImageResolvers = {
  aspectRatio: ({ width, height }) => {
    return width / height;
  },
  uri: async ({ id }, { width, height, pixelRatio }) => {
    return getImageURLForSize(id, width, height, pixelRatio);
  },
};

export const StaticMedia: StaticMediaResolvers = {
  uri: ({ id }, { width, pixelRatio }) =>
    getImageURLForSize(id, width, undefined, pixelRatio),
};
