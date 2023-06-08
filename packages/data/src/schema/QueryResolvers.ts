import {
  getInterests,
  getProfileByUserName,
  getProfileCategories,
} from '#domains';
import { fetchNode } from './NodeResolvers';
import type { QueryResolvers } from './__generated__/types';

export const Query: QueryResolvers = {
  viewer: () => ({}),
  currentUser: () => ({}),
  node: (_, { id }, context) => {
    return fetchNode(id, context);
  },
  nodes: (_, { ids }, context) => {
    return Promise.all(ids.map(id => fetchNode(id, context)));
  },
  profile: async (_, { userName }) => {
    return getProfileByUserName(userName);
  },
  profileCategories: async () => getProfileCategories(),
  interests: async () => getInterests(),
};
