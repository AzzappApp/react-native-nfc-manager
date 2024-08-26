import { labelResolver } from '#helpers/localeHelpers';
import { idResolver } from '#helpers/relayIdHelpers';
import type { CardStyleResolvers } from '#/__generated__/types';

export const CardStyle: CardStyleResolvers = {
  id: idResolver('CardStyle'),
  label: labelResolver,
};
