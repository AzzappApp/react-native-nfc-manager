import { connectionFromArray } from 'graphql-relay';
import { shuffle } from '@azzapp/shared/arrayHelpers';
import { getColorPalettes } from '#domains';
import { idResolver } from './utils';
import type {
  CoverTemplateDataResolvers,
  CoverTemplateResolvers,
} from './__generated__/types';

export const CoverTemplate: CoverTemplateResolvers = {
  id: idResolver('CoverTemplate'),
  previewMedia: ({ previewMediaId }) => previewMediaId,
  colorPalette: async ({ colorPaletteId }, _, { loaders }) =>
    (await loaders.ColorPalette.load(colorPaletteId))!,
  colorPalettes: async (
    { colorPaletteId },
    { first, after },
    { auth, loaders, sessionMemoized },
  ) => {
    const mainColorPalette = await loaders.ColorPalette.load(colorPaletteId);
    const colorPalettes = [
      mainColorPalette,
      ...shuffle(
        await sessionMemoized(getColorPalettes),
        auth.profileId ?? '' + colorPaletteId,
      ),
    ];
    return connectionFromArray(colorPalettes, { first, after });
  },
};

export const CoverTemplateData: CoverTemplateDataResolvers = {
  background: ({ backgroundId }) => backgroundId ?? null,
  foreground: ({ foregroundId }) => foregroundId ?? null,
};
