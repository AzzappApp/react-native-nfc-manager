import { MODULE_IMAGES_SIZES } from '@azzapp/shared/cardModuleHelpers';
import { CONTACTCARD_ASSET_SIZES } from '@azzapp/shared/contactCardHelpers';
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
  Extension,
  MediaImageResolvers,
  MediaResolvers,
  MediaVideoResolvers,
  StaticMediaResolvers,
} from './__generated__/types';
import type { GraphQLContext } from './GraphQLContext';
import type {
  StaticMedia as StaticMediaModel,
  Media as MediaModel,
} from '@azzapp/data';
import type DataLoader from 'dataloader';

export type DeferredMedia = MediaModel | string;

export type MediaWithAssetKind = {
  media: DeferredMedia;
  assetKind:
    | 'contactCard'
    | 'cover'
    | 'coverSource'
    | 'logo'
    | 'module'
    | 'post';
};

export type MediaResolverBaseType = DeferredMedia | MediaWithAssetKind;

const getDeferredMedia = (media: MediaResolverBaseType) => {
  if (typeof media === 'object' && 'assetKind' in media) {
    return media.media;
  }
  return media;
};

const getActualMedia = async (
  media: MediaResolverBaseType,
  loader: DataLoader<string, MediaModel | null>,
) => {
  media = getDeferredMedia(media);
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
    media = getDeferredMedia(media);
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
      streaming = false,
      extension,
    }: {
      width?: number | null;
      height?: number | null;
      pixelRatio?: number | null;
      raw?: boolean | null;
      streaming?: boolean | null;
      extension?: Extension | null;
    },
  ) => {
    const assetKind = getAssetKind(media);
    media = getDeferredMedia(media);
    const id = decodeMediaId(typeof media === 'string' ? media : media.id);
    if (assetKind === 'coverSource' || raw) {
      return getCloudinaryAssetURL(
        id,
        kind,
        kind === 'video' ? 'mp4' : kind === 'image' ? 'webp' : undefined,
      );
    }
    const pregeneratedSizes =
      assetKind === 'cover'
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
    return uriGenerator(
      id,
      width,
      height,
      pixelRatio,
      pregeneratedSizes,
      extension,
      // @ts-expect-error streaming is not in the getImageURLForSize signature
      streaming,
    );
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

export type StaticMediaResolverBaseType = {
  staticMedia: StaticMediaModel | string;
  assetKind: 'cover' | 'module';
};

const getActualStaticMedia = async (
  staticMedia: StaticMediaResolverBaseType,
  loader: DataLoader<string, StaticMediaModel | null>,
) => {
  const actualMedia = staticMedia.staticMedia;
  if (typeof actualMedia === 'string') {
    const dbMedia = await loader.load(actualMedia);
    if (!dbMedia) {
      console.warn(`StaticMedia ${actualMedia} not found`);
    }
    return dbMedia;
  } else {
    return actualMedia;
  }
};

const getStaticMediaId = (staticMedia: StaticMediaResolverBaseType) => {
  return typeof staticMedia.staticMedia === 'string'
    ? staticMedia.staticMedia
    : staticMedia.staticMedia.id;
};

const getStaticMediaKind = (staticMedia: StaticMediaResolverBaseType) => {
  const id = getStaticMediaId(staticMedia);
  if (id.startsWith('s:')) {
    return 'svg';
  } else if (id.startsWith('l:')) {
    return 'lottie';
  }
  return 'png';
};

export const StaticMedia: StaticMediaResolvers = {
  id: getStaticMediaId,
  kind: getStaticMediaKind,
  uri: (staticMedia, { width, pixelRatio }) => {
    const cloudinaryId = decodeMediaId(getStaticMediaId(staticMedia));
    const kind = getStaticMediaKind(staticMedia);
    if (kind === 'png') {
      return getImageURLForSize(
        cloudinaryId,
        width,
        undefined,
        pixelRatio,
        staticMedia.assetKind === 'cover'
          ? COVER_ASSET_SIZES
          : MODULE_IMAGES_SIZES,
        'png',
      );
    } else if (kind === 'svg') {
      return getCloudinaryAssetURL(cloudinaryId, 'image', 'svg');
    } else {
      return getCloudinaryAssetURL(cloudinaryId, 'raw');
    }
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
