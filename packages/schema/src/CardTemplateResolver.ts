import { getLabel, idResolver } from './utils';
import type { CardTemplateResolvers } from './__generated__/types';
import type { CardStyle } from '@azzapp/data';

export const CardTemplate: CardTemplateResolvers = {
  id: idResolver('CardTemplate'),
  cardStyle: async ({ cardStyleId }, _, { loaders }) =>
    loaders.CardStyle.load(cardStyleId) as Promise<CardStyle>,
  label: getLabel,
  cardTemplateType: async ({ cardTemplateTypeId }, _, { loaders }) => {
    if (!cardTemplateTypeId) {
      return null;
    }
    return loaders.CardTemplateType.load(cardTemplateTypeId);
  },
  previewMedia: async ({ previewMediaId }) =>
    previewMediaId
      ? {
          media: previewMediaId,
          assetKind: 'module',
        }
      : null,
  modules: template =>
    template.modules.map((module, index) => ({
      id: template.id + index,
      visible: true,
      ...module,
    })) as any,
};
