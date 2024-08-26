import {
  getRedirectWebCardByUserName,
  getWebCardByUserName,
  getWebCardCategories,
  getWebCardByUserNameWithRedirection,
  deleteRedirection,
} from '@azzapp/data';
import { getSessionInfos } from '#GraphQLContext';
import { userLoader } from '#loaders';
import { fetchNode } from './NodeResolvers';
import type { QueryResolvers } from '#/__generated__/types';

export const Query: QueryResolvers = {
  currentUser: async _root => {
    const { userId } = getSessionInfos();
    if (!userId) {
      return null;
    }
    return userLoader.load(userId);
  },

  node: (_, { id }) => fetchNode(id),
  nodes: (_, { ids }) => Promise.all(ids.map(id => fetchNode(id))),

  webCardCategories: async () => getWebCardCategories(),

  webCardParameters: () => ({
    //use a single source of truth for settings. Those settings can also be dependant on vip/premium status
    userNameChangeFrequencyDay: USERNAME_CHANGE_FREQUENCY_DAY,
  }),

  webCard: async (_, { userName }) =>
    getWebCardByUserNameWithRedirection(userName),

  userNameAvailable: async (_, { userName }) => {
    const profile = await getWebCardByUserName(userName);
    const redirection = await getRedirectWebCardByUserName(userName);
    if (redirection.length === 0 && !profile) {
      return true;
    } else if (redirection.length > 0 && !profile) {
      //check if redirection is passed
      const currentRedirection = redirection[0];
      if (currentRedirection.expiresAt < new Date()) {
        await deleteRedirection(redirection[0].fromUserName);
        return true;
      }
    }
    return false;
  },
};

const USERNAME_CHANGE_FREQUENCY_DAY = parseInt(
  process.env.USERNAME_CHANGE_FREQUENCY_DAY ?? '1',
  10,
);
