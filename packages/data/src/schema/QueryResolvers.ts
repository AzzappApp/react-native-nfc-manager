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
  userNameAvailable: async (_, { userName }) => {
    const profile = await getWebCardByUserName(userName);
    const redirection = await getRedirectWebCardByUserName(userName);
    if (redirection.length === 0 && !profile) {
      return true;
    }
    return false;
  },
};
