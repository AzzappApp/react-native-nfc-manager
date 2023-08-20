import { getLabel, idResolver } from './utils';
import type { CardStyleResolvers } from './__generated__/types';

export const CardStyle: CardStyleResolvers = {
  id: idResolver('Profile'),
  label: getLabel,
};
