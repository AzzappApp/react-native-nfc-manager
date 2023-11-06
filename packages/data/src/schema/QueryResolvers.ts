import { eq, sql } from 'drizzle-orm';
import {
  WebCardTable,
  db,
  getWebCardByUserName,
  getWebCardCategories,
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
  isUserNameUsed: async (_, { userName }) => {
    const count = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(WebCardTable)
      .where(eq(WebCardTable.userName, userName));

    return count[0].count > 0;
  },
  webCard: async (_, { userName }) => {
    const webCard = await getWebCardByUserName(userName);
    if (webCard?.cardIsPublished) {
      return webCard;
    }
    return null;
  },
};
