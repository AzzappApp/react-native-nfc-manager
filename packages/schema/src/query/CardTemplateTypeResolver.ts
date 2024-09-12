import { webCardCategoryLoader } from '#loaders';
import { labelResolver } from '#helpers/localeHelpers';
import { idResolver } from '#helpers/relayIdHelpers';
import type { CardTemplateTypeResolvers } from '#/__generated__/types';

export const CardTemplateType: CardTemplateTypeResolvers = {
  id: idResolver('CardTemplateType'),
  label: labelResolver,
  webCardCategory: async ({ webCardCategoryId }) => {
    if (!webCardCategoryId) {
      return null;
    }
    return webCardCategoryLoader.load(webCardCategoryId);
  },
};
