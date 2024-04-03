import { getLabel, idResolver } from './utils';
import type { CardTemplateTypeResolvers } from './__generated__/types';

export const CardTemplateType: CardTemplateTypeResolvers = {
  id: idResolver('CardTemplateType'),
  label: getLabel,
  webCardCategory: async ({ webCardCategoryId }, _, { loaders }) => {
    if (!webCardCategoryId) {
      return null;
    }
    return loaders.WebCardCategory.load(webCardCategoryId);
  },
};
