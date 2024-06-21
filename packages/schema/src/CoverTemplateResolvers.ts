import { getCoverTemplateTagsIn } from '@azzapp/data';
import { getCloudinaryAssetURL } from '@azzapp/shared/imagesHelpers';
import { idResolver } from './utils';
import type { CoverTemplateResolvers } from './__generated__/types';

export const CoverTemplate: CoverTemplateResolvers = {
  id: idResolver('CoverTemplate'),
  tags: ({ tags }) => {
    return getCoverTemplateTagsIn(tags);
  },
  type: async ({ type }, _, { loaders }) => {
    return loaders.CoverTemplateType.load(type);
  },
  preview: async ({ previewId }) => {
    return {
      media: previewId,
      assetKind: 'coverPreview',
    };
  },
  lottie: async ({ lottieId }) => getCloudinaryAssetURL(lottieId, 'raw'),
};
