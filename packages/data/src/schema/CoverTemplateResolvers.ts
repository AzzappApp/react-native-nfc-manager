import { connectionFromArray } from 'graphql-relay';
import { getColorPaletteById, getColorPalettes, type Media } from '#domains';
import { idResolver } from './utils';
import type {
  CoverTemplateDataResolvers,
  CoverTemplateResolvers,
} from './__generated__/types';

export const CoverTemplate: CoverTemplateResolvers = {
  id: idResolver('CoverTemplate'),
  previewMedia: async ({ previewMediaId }, _, { mediaLoader }) =>
    mediaLoader.load(previewMediaId) as Promise<Media>,
  colorPalette: async ({ colorPaletteId }) =>
    getColorPaletteById(colorPaletteId),
  colorPalettes: async ({ colorPaletteId }, { first, after }, { auth }) => {
    const mainColorPalette = await getColorPaletteById(colorPaletteId);
    const colorPalettes = [
      mainColorPalette,
      ...(await getColorPalettes(auth.profileId ?? '' + colorPaletteId)).filter(
        ({ id }) => id !== colorPaletteId,
      ),
    ];
    return connectionFromArray(colorPalettes, { first, after });
  },
};

export const CoverTemplateData: CoverTemplateDataResolvers = {
  background: ({ backgroundId }, _, { staticMediaLoader }) => {
    return backgroundId ? staticMediaLoader.load(backgroundId) : null;
  },
  foreground: ({ foregroundId }, _, { staticMediaLoader }) => {
    return foregroundId ? staticMediaLoader.load(foregroundId) : null;
  },
};
