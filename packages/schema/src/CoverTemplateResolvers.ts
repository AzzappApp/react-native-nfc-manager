import { getCoverTemplateTagsByIds } from '@azzapp/data';
import { getCloudinaryAssetURL } from '@azzapp/shared/imagesHelpers';
import { idResolver } from './utils';
import type { CoverTemplateResolvers } from './__generated__/types';

export const CoverTemplate: CoverTemplateResolvers = {
  id: idResolver('CoverTemplate'),
  tags: ({ tags }) =>
    getCoverTemplateTagsByIds(tags).then(tags => tags.filter(tag => !!tag)),
  type: async ({ typeId }, _, { loaders }) => {
    return loaders.CoverTemplateType.load(typeId);
  },
  data: async ({ params }) => params,
  preview: async ({ previewId }) => {
    return {
      media: previewId,
      assetKind: 'coverPreview',
    };
  },
  lottie: async ({ lottieId }) => getCloudinaryAssetURL(lottieId, 'raw'),
  colorPalette: async ({ colorPaletteId }, _, { loaders }) => {
    return colorPaletteId ? loaders.ColorPalette.load(colorPaletteId) : null;
  },
};
