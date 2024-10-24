import { getCoverTemplateTagsByIds } from '@azzapp/data';
import { getCloudinaryAssetURL } from '@azzapp/shared/imagesHelpers';
import { colorPaletteLoader, coverTemplateTypeLoader } from '#loaders';
import { idResolver } from '#helpers/relayIdHelpers';
import type { CoverTemplateResolvers } from '#/__generated__/types';

export const CoverTemplate: CoverTemplateResolvers = {
  id: idResolver('CoverTemplate'),
  tags: ({ tags }) =>
    getCoverTemplateTagsByIds(tags).then(tags => tags.filter(tag => !!tag)),
  type: async ({ typeId }) => {
    return coverTemplateTypeLoader.load(typeId);
  },
  data: async ({ params }) => params,
  preview: async ({ previewId, previewPositionPercentage }) => {
    return {
      media: previewId,
      assetKind: 'coverPreview',
      previewPositionPercentage,
    };
  },
  lottie: async ({ lottieId }) => getCloudinaryAssetURL(lottieId, 'raw'),
  colorPalette: async ({ colorPaletteId }) => {
    return colorPaletteId ? colorPaletteLoader.load(colorPaletteId) : null;
  },
};
