/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import { getMediaInfoByPublicIds } from '@azzapp/shared/cloudinaryHelpers';
import { createMedia, type Media } from '#domains';
import type { CardCoverResolvers } from './__generated__/types';

export const CardCover: CardCoverResolvers = {
  media: async (cardCover, _, { mediaLoader }) => {
    //TODO: remove this safety net when we have a better way to handle media and find the cause of media not in database
    if ((await mediaLoader.load(cardCover.mediaId)) === null) {
      await restoreMedia(cardCover.mediaId);
      mediaLoader.clear(cardCover.mediaId);
    }
    return mediaLoader.load(cardCover.mediaId) as Promise<Media>;
  },
  sourceMedia: async (cardCover, _, { mediaLoader }) => {
    //TODO: remove this safety net when we have a better way to handle media and find the cause of media not in database
    if ((await mediaLoader.load(cardCover.sourceMediaId)) === null) {
      await restoreMedia(cardCover.sourceMediaId);
      mediaLoader.clear(cardCover.sourceMediaId);
    }
    return mediaLoader.load(cardCover.sourceMediaId) as Promise<Media>;
  },
  maskMedia: (cardCover, _, { mediaLoader }) =>
    cardCover.maskMediaId ? mediaLoader.load(cardCover.maskMediaId) : null,
  textPreviewMedia: (cardCover, _, { mediaLoader }) =>
    cardCover.textPreviewMediaId
      ? mediaLoader.load(cardCover.textPreviewMediaId)
      : null,
  background: ({ backgroundId }, _, { staticMediaLoader }) => {
    return backgroundId ? staticMediaLoader.load(backgroundId) : null;
  },
  foreground: ({ foregroundId }, _, { staticMediaLoader }) => {
    return foregroundId ? staticMediaLoader.load(foregroundId) : null;
  },
};

const restoreMedia = async (mediaId: string) => {
  const [found] = await getMediaInfoByPublicIds([
    { publicId: mediaId, kind: 'image' },
    { publicId: mediaId, kind: 'video' },
  ]);
  if (found) {
    await createMedia({
      id: mediaId,
      width: found.width,
      height: found.height,
      kind: found.resource_type,
    });
  }
};
