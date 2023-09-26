import { getLabel, idResolver } from './utils';
import type { CardTemplateTypeResolvers } from './__generated__/types';

export const CardTemplateType: CardTemplateTypeResolvers = {
  id: idResolver('CardTemplateType'),
  label: getLabel,
  profileCategory: async ({ profileCategoryId }, _, { loaders }) => {
    if (!profileCategoryId) {
      return null;
    }
    return loaders.ProfileCategory.load(profileCategoryId);
  },
};
