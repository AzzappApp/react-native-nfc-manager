import { connectionFromArray } from 'graphql-relay';
import { shuffle } from '@azzapp/shared/arrayHelpers';
import { getColorPaletteById, type Media } from '#domains';
import { idResolver } from './utils';
import type {
  CoverTemplateDataResolvers,
  CoverTemplateResolvers,
} from './__generated__/types';

export const CoverTemplate: CoverTemplateResolvers = {
  id: idResolver('CoverTemplate'),
  previewMedia: async ({ previewMediaId }, _, { mediaLoader }) =>
    mediaLoader.load(previewMediaId) as Promise<Media>,
  colorPalette: async ({ colorPaletteId }, _, { colorPaletteLoader }) =>
    (await colorPaletteLoader.load(colorPaletteId))!,
  colorPalettes: async (
    { colorPaletteId },
    { first, after },
    { auth, colorPaletteLoader, colorPalettesLoader },
  ) => {
    const mainColorPalette = await colorPaletteLoader.load(colorPaletteId);
    const colorPalettes = [
      mainColorPalette,
      ...shuffle(
        await colorPalettesLoader(),
        // stupid hack to make sure the color palettes are shuffled in the same way for a given user
        parseInt(auth.profileId ?? '' + colorPaletteId, 36),
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
