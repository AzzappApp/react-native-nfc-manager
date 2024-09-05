import { idResolver } from '#helpers/relayIdHelpers';
import type { ColorPaletteResolvers } from '#/__generated__/types';

export const ColorPalette: ColorPaletteResolvers = {
  id: idResolver('ColorPalette'),
};
