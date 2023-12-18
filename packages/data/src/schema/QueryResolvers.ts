import {
  getRedirectWebCardByUserName,
  getWebCardByUserName,
  getWebCardCategories,
  getWebCardByUserNameWithRedirection,
} from '#domains';
import { fetchNode } from './NodeResolvers';
import type { QueryResolvers } from './__generated__/types';

export const Query: QueryResolvers = {
  viewer: () => ({}),
  currentUser: async (_, _args, { auth, loaders }) => {
    const found = auth.userId ? await loaders.User.load(auth.userId) : null;

    if (!found) {
      throw null;
    }

    return found;
  },
  node: (_, { id }, context) => {
    return fetchNode(id, context);
  },
  nodes: (_, { ids }, context) => {
    return Promise.all(ids.map(id => fetchNode(id, context)));
  },
  webCardCategories: async () => getWebCardCategories(),
  webCard: async (_, { userName }) => {
    return getWebCardByUserNameWithRedirection(userName);
  },
  webCardParameters: async () => {
    //use a single source of truth for settings. Those settings can also be dependant on vip/premium status
    return {
      userNameChangeFrequencyDay: USERNAME_CHANGE_FREQUENCY_DAY,
    };
  },
  userNameAvailable: async (_, { userName }) => {
    const profile = await getWebCardByUserName(userName);
    const redirection = await getRedirectWebCardByUserName(userName);
    if (redirection.length === 0 && !profile) {
      return true;
    }
    return false;
  },
};

const USERNAME_CHANGE_FREQUENCY_DAY = parseInt(
  process.env.USERNAME_CHANGE_FREQUENCY_DAY ?? '30',
  10,
);
