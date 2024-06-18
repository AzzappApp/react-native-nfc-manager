import { getCoverTemplateTagsIn } from '@azzapp/data';
import { getCoverTemplatePreviewsByCoverTemplateId } from '@azzapp/data/coverTemplatePreview';
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
  previews: async ({ id }) => {
    return getCoverTemplatePreviewsByCoverTemplateId(id);
  },
  lottie: async ({ lottieId }) =>
    lottieId ? getCloudinaryAssetURL(lottieId, 'raw') : null,
};
