import type { Media } from '#domains';
import type { CardCoverResolvers } from './__generated__/types';

export const CardCover: CardCoverResolvers = {
  media: (cardCover, _, { mediaLoader }) =>
    mediaLoader.load(cardCover.mediaId) as Promise<Media>,
  sourceMedia: (cardCover, _, { mediaLoader }) =>
    mediaLoader.load(cardCover.sourceMediaId) as Promise<Media>,
  maskMedia: (cardCover, _, { mediaLoader }) =>
    cardCover.maskMediaId ? mediaLoader.load(cardCover.maskMediaId) : null,
  textPreviewMedia: (cardCover, _, { mediaLoader }) =>
    mediaLoader.load(cardCover.textPreviewMediaId) as Promise<Media>,
  background: ({ backgroundId }, _, { staticMediaLoader }) => {
    return backgroundId ? staticMediaLoader.load(backgroundId) : null;
  },
  foreground: ({ foregroundId }, _, { staticMediaLoader }) => {
    return foregroundId ? staticMediaLoader.load(foregroundId) : null;
  },
};
