import { MODULE_IMAGES_SIZES } from '@azzapp/shared/cardModuleHelpers';
import { COVER_ASSET_SIZES } from '@azzapp/shared/coverHelpers';
import {
  decodeMediaId,
  getCloudinaryAssetURL,
  getImageURLForSize,
  getVideoThumbnailURL,
  getVideoUrlForSize,
} from '@azzapp/shared/imagesHelpers';
import {
  POST_IMAGES_SIZES,
  POST_VIDEO_SIZES,
} from '@azzapp/shared/postHelpers';
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

export type MediaWithAssetKind = {
  media: DefferedMedia;
  assetKind: 'cover' | 'coverSource' | 'module' | 'post';
};

export type MediaResolverBaseType = DefferedMedia | MediaWithAssetKind;

const getDefferedMedia = (media: MediaResolverBaseType) => {
  if (typeof media === 'object' && 'assetKind' in media) {
    return media.media;
  }
  return media;
};

const getActualMedia = async (
  media: MediaResolverBaseType,
  loader: DataLoader<string, MediaModel | null>,
) => {
  media = getDefferedMedia(media);
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

const getAssetKind = (media: MediaResolverBaseType) => {
  if (typeof media === 'object' && 'assetKind' in media) {
    return media.assetKind;
  }
  return null;
};

const MediaResolversBase = {
  id: (media: MediaResolverBaseType) => {
    media = getDefferedMedia(media);
    return typeof media === 'string' ? media : media.id;
  },
  aspectRatio: async (
    media: MediaResolverBaseType,
    _: any,
    { loaders }: GraphQLContext,
  ) => {
    const actualMedia = await getActualMedia(media, loaders.Media);
    return (actualMedia?.width ?? 1) / (actualMedia?.height ?? 1);
  },
  height: async (
    media: MediaResolverBaseType,
    _: any,
    { loaders }: GraphQLContext,
  ) => {
    const actualMedia = await getActualMedia(media, loaders.Media);
    return actualMedia?.height ?? 0;
  },
  width: async (
    media: MediaResolverBaseType,
    _: any,
    { loaders }: GraphQLContext,
  ) => {
    const actualMedia = await getActualMedia(media, loaders.Media);
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
    }: {
      width?: number | null;
      height?: number | null;
      pixelRatio?: number | null;
      raw?: boolean | null;
    },
  ) => {
    const assetKind = getAssetKind(media);
    media = getDefferedMedia(media);
    const id = decodeMediaId(typeof media === 'string' ? media : media.id);
    if (assetKind === 'coverSource' || raw) {
      return getCloudinaryAssetURL(id, kind);
    }
    const pregeneratedSizes =
      assetKind === 'cover'
        ? COVER_ASSET_SIZES
        : assetKind === 'module'
        ? MODULE_IMAGES_SIZES
        : assetKind === 'post'
        ? kind === 'image'
          ? POST_IMAGES_SIZES
          : POST_VIDEO_SIZES
        : null;
    return uriGenerator(id, width, height, pixelRatio, pregeneratedSizes);
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

export type DefferedStaticMedia = StaticMediaModel | string;

export type StaticMediaWithAssetKind = {
  staticMedia: DefferedStaticMedia;
  assetKind: 'cover' | 'module';
};

export type StaticMediaResolverBaseType =
  | DefferedStaticMedia
  | StaticMediaWithAssetKind;

const getActualStaticMedia = async (
  staticMedia: StaticMediaResolverBaseType,
  loader: DataLoader<string, StaticMediaModel | null>,
) => {
  if (typeof staticMedia === 'object' && 'assetKind' in staticMedia) {
    staticMedia = staticMedia.staticMedia;
  }
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

const getStaticMediaId = (staticMedia: DefferedStaticMedia) =>
  typeof staticMedia === 'string' ? staticMedia : staticMedia.id;

export const StaticMedia: StaticMediaResolvers = {
  id: staticMedia => {
    if (typeof staticMedia === 'object' && 'assetKind' in staticMedia) {
      staticMedia = staticMedia.staticMedia;
    }
    return getStaticMediaId(staticMedia);
  },
  uri: (staticMedia, { width, pixelRatio }) => {
    let id: string;
    let assetKind: 'cover' | 'module' | null;
    if (typeof staticMedia === 'object' && 'assetKind' in staticMedia) {
      id = getStaticMediaId(staticMedia.staticMedia);
      assetKind = staticMedia.assetKind;
    } else {
      id = getStaticMediaId(staticMedia);
      assetKind = null;
    }
    id = decodeMediaId(id);
    if (assetKind === 'cover') {
      return getImageURLForSize(
        id,
        width,
        undefined,
        pixelRatio,
        COVER_ASSET_SIZES,
      );
    }
    return getCloudinaryAssetURL(id, 'image');
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
