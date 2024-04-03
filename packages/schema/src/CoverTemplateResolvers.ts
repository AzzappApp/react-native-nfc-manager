import { connectionFromArray } from 'graphql-relay';
import { getColorPalettes } from '@azzapp/data';
import { shuffle } from '@azzapp/shared/arrayHelpers';
import { idResolver } from './utils';
import type {
  CoverTemplateDataResolvers,
  CoverTemplateResolvers,
} from './__generated__/types';

export const CoverTemplate: CoverTemplateResolvers = {
  id: idResolver('CoverTemplate'),
  previewMedia: ({ previewMediaId }) => ({
    media: previewMediaId,
    assetKind: 'cover',
  }),
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
        auth.userId ?? '' + colorPaletteId,
      ),
    ];
    return connectionFromArray(colorPalettes, { first, after });
  },
};

export const CoverTemplateData: CoverTemplateDataResolvers = {
  background: ({ backgroundId }) =>
    backgroundId
      ? {
          staticMedia: backgroundId,
          assetKind: 'cover',
        }
      : null,
  foreground: ({ foregroundId }) =>
    foregroundId
      ? {
          staticMedia: foregroundId,
          assetKind: 'cover',
        }
      : null,
};
