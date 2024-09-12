import { cardStyleLoader, cardTemplateTypeLoader } from '#loaders';
import { labelResolver } from '#helpers/localeHelpers';
import { idResolver } from '#helpers/relayIdHelpers';
import type { CardTemplateResolvers } from '#/__generated__/types';
import type { CardStyle } from '@azzapp/data';

export const CardTemplate: CardTemplateResolvers = {
  id: idResolver('CardTemplate'),
  cardStyle: async ({ cardStyleId }) =>
    cardStyleLoader.load(cardStyleId) as Promise<CardStyle>,
  label: labelResolver,
  cardTemplateType: async ({ cardTemplateTypeId }) => {
    if (!cardTemplateTypeId) {
      return null;
    }
    return cardTemplateTypeLoader.load(cardTemplateTypeId);
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
