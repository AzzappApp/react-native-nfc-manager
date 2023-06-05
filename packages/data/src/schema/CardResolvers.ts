import { getProfileId } from '@azzapp/auth/viewer';
import { getCardModules } from '#domains';
import { idResolver } from './utils';
import type { CardResolvers } from './__generated__/types';

export const Card: CardResolvers = {
  id: idResolver('Card'),
  user: async (card, _, { profileLoader }) =>
    (await profileLoader.load(card.profileId))!,
  cover: async (card, _, { coverLoader }) =>
    (await coverLoader.load(card.coverId))!,
  modules: async ({ id, profileId }, _, { auth }) => {
    const modules = await getCardModules(id, profileId === getProfileId(auth));
    return modules.map(module =>
      typeof module.data === 'object' ? { ...module.data, ...module } : module,
    );
  },
};
