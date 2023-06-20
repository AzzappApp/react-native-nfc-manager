import { like } from 'drizzle-orm';
import {
  connectionFromArray,
  connectionFromArraySlice,
  cursorToOffset,
} from 'graphql-relay';
import {
  getFollowedProfilesCount,
  getAllProfilesWithCard,
  getAllProfilesWithCardCount,
  getFollowedProfiles,
  getFollowerProfiles,
  getFollowedProfilesPostsCount,
  getFollowedProfilesPosts,
  getAllPosts,
  db,
  getStaticMediasByUsage,
  getCoverTemplates,
  getCoverTemplatesSuggestion,
  ProfileTable,
  post,
} from '#domains';
import {
  cursorToDate,
  connectionFromDateSortedItems,
} from '#helpers/connectionsHelpers';
import type { CoverTemplate } from '#domains';
import type { ViewerResolvers } from './__generated__/types';

export const Viewer: ViewerResolvers = {
  profile: async (_root, _, { auth, profileLoader }) => {
    const profileId = auth.profileId;

    if (!profileId) {
      return null;
    }

    return profileLoader.load(profileId);
  },
  suggestedProfiles: async (_root, args, { auth }) => {
    const profileId = auth.profileId;

    if (!profileId || (await getFollowedProfilesCount(profileId)) > 0) {
      return connectionFromArray([], args);
    }
    // TODO if we don't have any followed users, returns a list of recommended users ?
    const { after, first } = args;
    const limit = first ?? 100;
    const offset = after ? cursorToOffset(after) : 0;
    return connectionFromArraySlice(
      await getAllProfilesWithCard(limit, offset, [profileId]),
      args,
      {
        sliceStart: offset,
        arrayLength: await getAllProfilesWithCardCount(),
      },
    );
  },
  followedProfiles: async (_root, args, { auth }) => {
    const profileId = auth.profileId;
    if (!profileId) {
      return connectionFromArray([], args);
    }
    // TODO should we use pagination in database query?
    const followedProfiles = await getFollowedProfiles(profileId);

    return connectionFromArray(followedProfiles, args);
  },
  followers: async (_root, args, { auth }) => {
    const profileId = auth.profileId;
    if (!profileId) {
      return connectionFromArray([], args);
    }

    const first = args.first ?? 100;
    const offset = args.after ? cursorToDate(args.after) : null;

    const followersProfiles = await getFollowerProfiles(
      profileId,
      first,
      offset,
    );

    return connectionFromDateSortedItems(
      followersProfiles.map(p => ({
        ...p.Profile,
        followCreatedAt: p.followCreatedAt,
      })),
      {
        getDate: post => post.followCreatedAt,
        // approximations that should be good enough, and avoid a query
        hasNextPage: followersProfiles.length > 0,
        hasPreviousPage: offset !== null,
      },
    );
  },
  followedProfilesPosts: async (_root, args, { auth }) => {
    const profileId = auth.profileId;
    if (!profileId) {
      return connectionFromArray([], args);
    }
    const nbPosts = await getFollowedProfilesPostsCount(profileId);

    const first = args.first ?? 100;
    const offset = args.after ? cursorToDate(args.after) : null;

    const posts = nbPosts
      ? await getFollowedProfilesPosts(profileId, first, offset)
      : // TODO instead of returning all posts, we should return a list of recommanded posts
        await getAllPosts(first, offset);

    return connectionFromDateSortedItems(posts, {
      getDate: post => post.createdAt,
      // approximations that should be good enough, and avoid a query
      hasNextPage: posts.length > 0,
      hasPreviousPage: offset !== null,
    });
  },
  trendingProfiles: async (_, args) => {
    // TODO dummy implementation just to test frontend
    return connectionFromArray(await db.select().from(ProfileTable), args);
  },
  trendingPosts: async (_, args) => {
    // TODO dummy implementation just to test frontend
    return connectionFromArray(await db.select().from(post), args);
  },
  recommendedProfiles: async (_, args) => {
    // TODO dummy implementation just to test frontend
    return connectionFromArray(await db.select().from(ProfileTable), args);
  },
  searchPosts: async (_, args) => {
    // TODO dummy implementation just to test frontend
    return connectionFromArray(
      await db
        .select()
        .from(post)
        .where(like(post.content, `%${args.search}%`)),
      args,
    );
  },
  searchProfiles: async (_, args) => {
    // TODO dummy implementation just to test frontend
    return connectionFromArray(
      await db
        .select()
        .from(ProfileTable)
        .where(like(ProfileTable.userName, `%${args.search}%`)),
      args,
    );
  },
  coverBackgrounds: async () => getStaticMediasByUsage('coverBackground'),
  coverForegrounds: async () => getStaticMediasByUsage('coverForeground'),
  moduleBackgrounds: async () => getStaticMediasByUsage('moduleBackground'),
  coverTemplates: async () => {
    return getCoverTemplates();
  },
  coverTemplatesByCategory: async (
    _,
    { segmented },
    { auth, profileLoader, cardLoader },
  ) => {
    const profileId = auth.profileId;
    if (!profileId) {
      return [];
    }
    const profile = await profileLoader.load(profileId);

    let determinedSegmented = segmented;
    if (segmented == null) {
      // we need to determine which segmented value to use in order to  avoid to mulitple subsequent calls from client while loading the page
      const card = await cardLoader.load(profileId);
      if (card?.coverId == null) {
        determinedSegmented = profile?.profileKind === 'personal';
      }
    }

    const templates = await getCoverTemplates(determinedSegmented);

    const categories: Array<{ templates: CoverTemplate[]; category: string }> =
      [];
    // TODO refactor this, this is a mess, we should not use the en label as a group by ...
    templates.forEach(template => {
      const category = template.category?.en;

      if (category) {
        // find object in categories array with category name === category
        const existingCategory = categories.find(
          categoryItem => categoryItem.category === category,
        );

        if (existingCategory) {
          existingCategory.templates.push(template);
        } else {
          categories.push({
            category,
            templates: [template],
          });
        }
      }
    });
    return categories;
  },
  coverTemplatesSuggestion: async (_, __, { auth, profileLoader }) => {
    const profileId = auth.profileId;
    if (!profileId) {
      return [];
    }
    const profile = await profileLoader.load(profileId);
    if (profile?.profileKind !== 'business') return [];
    return getCoverTemplatesSuggestion(profile.companyActivityId!);
  },
};
