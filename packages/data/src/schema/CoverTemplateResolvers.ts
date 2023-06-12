import { idResolver } from './utils';
import type {
  CardCoverTemplateResolvers,
  CoverTemplateResolvers,
} from './__generated__/types';

export const CoverTemplate: CoverTemplateResolvers = {
  id: idResolver('CoverTemplate'),
  previewMedia: async ({ previewMediaId }, _, { mediaLoader }) => {
    if (previewMediaId) {
      return mediaLoader.load(previewMediaId);
    }
    return null;
  },
  colorPalette: ({ colorPalette }) => {
    return colorPalette ? colorPalette.split(',') : null;
  },
  tags: ({ tags }) => {
    return tags?.split(',') ?? [];
  },
};

export const CardCoverTemplate: CardCoverTemplateResolvers = {
  background: ({ backgroundId }, _, { staticMediaLoader }) => {
    return backgroundId ? staticMediaLoader.load(backgroundId) : null;
  },
  foreground: ({ foregroundId }, _, { staticMediaLoader }) => {
    return foregroundId ? staticMediaLoader.load(foregroundId) : null;
  },
  sourceMedia: ({ sourceMediaId }, _, { mediaLoader }) => {
    if (sourceMediaId) {
      return mediaLoader.load(sourceMediaId);
    }
    return null;
  },
};
