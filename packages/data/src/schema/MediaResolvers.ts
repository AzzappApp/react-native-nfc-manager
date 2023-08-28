import {
  getImageURLForSize,
  getVideoThumbnailURL,
  getVideoUrlForSize,
} from '@azzapp/shared/imagesHelpers';
import type {
  StaticMedia as StaticMediaModel,
  Media as MediaModel,
} from '#domains';
import type {
  MediaImageResolvers,
  MediaResolvers,
  MediaVideoResolvers,
  StaticMediaResolvers,
} from './__generated__/types';
import type { GraphQLContext } from './GraphQLContext';
import type DataLoader from 'dataloader';

export type DefferedMedia = MediaModel | string;

export const Media: MediaResolvers = {
  __resolveType: media => {
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

const getActualMedia = async (
  media: DefferedMedia,
  loader: DataLoader<string, MediaModel | null>,
) => {
  if (typeof media === 'string') {
    const dbMedia = await loader.load(media);
    if (!dbMedia) {
      console.warn(`Media ${media} not found`);
    }
    return dbMedia;
  } else {
    return media;
  }
};

const MediaResolversBase = {
  id: (media: DefferedMedia) => (typeof media === 'string' ? media : media.id),
  aspectRatio: async (
    media: DefferedMedia,
    _: any,
    { loaders }: GraphQLContext,
  ) => {
    const actualMedia = await getActualMedia(media, loaders.Media);
    return (actualMedia?.width ?? 1) / (actualMedia?.height ?? 1);
  },
  height: async (media: DefferedMedia, _: any, { loaders }: GraphQLContext) => {
    const actualMedia = await getActualMedia(media, loaders.Media);
    return actualMedia?.height ?? 0;
  },
  width: async (media: DefferedMedia, _: any, { loaders }: GraphQLContext) => {
    const actualMedia = await getActualMedia(media, loaders.Media);
    return actualMedia?.width ?? 0;
  },
};

export const MediaVideo: MediaVideoResolvers = {
  uri: async (media, { width, height, pixelRatio }) => {
    const id = typeof media === 'string' ? media : media.id;
    return getVideoUrlForSize(id, width, height, pixelRatio);
  },
  thumbnail: async (media, { width, height, pixelRatio }) => {
    const id = typeof media === 'string' ? media : media.id;
    return getVideoThumbnailURL(id, width, height, pixelRatio);
  },
  ...MediaResolversBase,
};

export const MediaImage: MediaImageResolvers = {
  uri: async (media, { width, height, pixelRatio }) => {
    const id = typeof media === 'string' ? media : media.id;
    return getImageURLForSize(id, width, height, pixelRatio);
  },
  ...MediaResolversBase,
};

export type DefferedStaticMedia = StaticMediaModel | string;

const getActualStaticMedia = async (
  staticMedia: DefferedStaticMedia,
  loader: DataLoader<string, StaticMediaModel | null>,
) => {
  if (typeof staticMedia === 'string') {
    const dbMedia = await loader.load(staticMedia);
    if (!dbMedia) {
      console.warn(`StaticMedia ${staticMedia} not found`);
    }
    return dbMedia;
  } else {
    return staticMedia;
  }
};

export const StaticMedia: StaticMediaResolvers = {
  id: staticMedia =>
    typeof staticMedia === 'string' ? staticMedia : staticMedia.id,
  uri: (staticMedia, { width, pixelRatio }) => {
    const id = typeof staticMedia === 'string' ? staticMedia : staticMedia.id;
    return getImageURLForSize(id, width, undefined, pixelRatio);
  },
  resizeMode: async (staticMedia, _, { loaders }) =>
    getActualStaticMedia(staticMedia, loaders.StaticMedia).then(
      staticMedia => staticMedia?.resizeMode ?? 'cover',
    ),
  usage: async (staticMedia, _, { loaders }) =>
    getActualStaticMedia(staticMedia, loaders.StaticMedia).then(
      staticMedia => staticMedia?.usage ?? 'moduleBackground',
    ),
};
