import { getLabel, idResolver } from './utils';
import type { CardStyle } from '#domains';
import type { CardTemplateResolvers } from './__generated__/types';

export const CardTemplate: CardTemplateResolvers = {
  id: idResolver('CardTemplate'),
  cardStyle: async ({ cardStyleId }, _, { loaders }) =>
    loaders.CardStyle.load(cardStyleId) as Promise<CardStyle>,
  label: getLabel,
};
