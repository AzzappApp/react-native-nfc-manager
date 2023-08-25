import { like } from 'drizzle-orm';
import { connectionFromArray } from 'graphql-relay';
import { shuffle } from '@azzapp/shared/arrayHelpers';
import {
  getFollowerProfiles,
  getFollowingsPosts,
  db,
  getStaticMediasByUsage,
  ProfileTable,
  PostTable,
  getFollowingsProfiles,
  getRecommendedProfiles,
  getCoverTemplates,
  getCardTemplates,
} from '#domains';
import { getCardStyles } from '#domains/cardStyles';
import { getMediaSuggestions } from '#domains/mediasSuggestion';
import {
  cursorToDate,
  connectionFromDateSortedItems,
  emptyConnection,
} from '#helpers/connectionsHelpers';
import type { ViewerResolvers } from './__generated__/types';

export const Viewer: ViewerResolvers = {
  profile: async (_root, _, { auth, profileLoader }) => {
    const profileId = auth.profileId;
    if (!profileId) {
      return null;
    }
    return profileLoader.load(profileId);
  },
  followings: async (_root, args, { auth }) => {
    const profileId = auth.profileId;

    if (!profileId) {
      return connectionFromArray([], args);
    }
    const first = args.first ?? 50;
    const offset = args.after ? cursorToDate(args.after) : null;

    const followingsProfiles = await getFollowingsProfiles(profileId, {
      limit: first + 1,
      after: offset,
      userName: args.userName,
    });

    const sizedProfile = followingsProfiles.slice(0, first);
    return connectionFromDateSortedItems(
      sizedProfile.map(p => ({
        ...p.Profile,
        followCreatedAt: p.followCreatedAt,
      })),
      {
        getDate: user => user.followCreatedAt,
        // approximations that should be good enough, and avoid a query
        hasNextPage: followingsProfiles.length > first,
        hasPreviousPage: offset !== null,
      },
    );
  },
  followers: async (_root, args, { auth }) => {
    const profileId = auth.profileId;
    if (!profileId) {
      return connectionFromArray([], args);
    }

    const first = args.first ?? 50;
    const offset = args.after ? cursorToDate(args.after) : null;

    const followersProfiles = await getFollowerProfiles(profileId, {
      limit: first + 1,
      after: offset,
      userName: args.userName,
    });

    return connectionFromDateSortedItems(
      followersProfiles.map(p => ({
        ...p.Profile,
        followCreatedAt: p.followCreatedAt,
      })),
      {
        getDate: post => post.followCreatedAt,
        // approximations that should be good enough, and avoid a query
        hasNextPage: followersProfiles.length > first,
        hasPreviousPage: offset !== null,
      },
    );
  },
  followingsPosts: async (_root, args, { auth }) => {
    const profileId = auth.profileId;
    if (!profileId) {
      return connectionFromArray([], args);
    }

    const first = args.first ?? 100;
    const offset = args.after ? cursorToDate(args.after) : null;

    const posts = await getFollowingsPosts(profileId, first, offset);

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
    return connectionFromArray(await db.select().from(PostTable), args);
  },
  recommendedProfiles: async (_, args, { auth }) => {
    const { profileId, userId } = auth;
    if (!profileId || !userId) {
      return connectionFromArray([], args);
    }
    // TODO dummy implementation just to test frontend
    return connectionFromArray(
      await getRecommendedProfiles(profileId, userId),
      args,
    );
  },
  searchPosts: async (_, args) => {
    // TODO dummy implementation just to test frontend
    return connectionFromArray(
      await db
        .select()
        .from(PostTable)
        .where(like(PostTable.content, `%${args.search}%`)),
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
  coverTemplates: async (
    _,
    { kind, after, first },
    { auth: { profileId }, profileLoader },
  ) => {
    const profile = profileId ? await profileLoader.load(profileId) : null;
    if (!profile) {
      return emptyConnection;
    }
    const limit = first ?? 100;
    const templates = await getCoverTemplates(
      profile.profileKind,
      kind,
      profile.id,
      after,
      first ?? 100,
    );

    return {
      edges: templates.map(template => ({
        node: template,
        cursor: template.cursor,
      })),
      pageInfo: {
        hasNextPage: templates.length > limit,
        hasPreviousPage: false,
        startCursor: templates[0]?.cursor,
        endCursor: templates[templates.length - 1]?.cursor,
      },
    };
  },
  cardTemplates: async (_, { after, first }, { auth: { profileId } }) => {
    if (!profileId) {
      return emptyConnection;
    }
    const limit = first ?? 100;
    const cardTemplates = await getCardTemplates(profileId, after, limit);

    return {
      edges: cardTemplates.map(cardTemplate => ({
        node: cardTemplate,
        cursor: cardTemplate.cursor,
      })),
      pageInfo: {
        hasNextPage: cardTemplates.length > limit,
        hasPreviousPage: false,
        startCursor: cardTemplates[0]?.cursor,
        endCursor: cardTemplates[cardTemplates.length - 1]?.cursor,
      },
    };
  },
  cardStyles: async (_, { after, first }, { auth: { profileId } }) => {
    if (!profileId) {
      return emptyConnection;
    }
    const limit = first ?? 100;
    const cardStyles = await getCardStyles(profileId, after, limit);

    return {
      edges: cardStyles.map(style => ({
        node: style,
        cursor: style.cursor,
      })),
      pageInfo: {
        hasNextPage: cardStyles.length > limit,
        hasPreviousPage: false,
        startCursor: cardStyles[0]?.cursor,
        endCursor: cardStyles[cardStyles.length - 1]?.cursor,
      },
    };
  },
  colorPalettes: async (
    _,
    { after, first },
    { auth: { profileId }, colorPalettesLoader },
  ) => {
    if (!profileId) {
      return emptyConnection;
    }
    first = first ?? 100;
    const colorPalettes = shuffle(
      await colorPalettesLoader(),
      parseInt(profileId, 36),
    );

    return connectionFromArray(colorPalettes, {
      after,
      first,
    });
  },
  suggestedMedias: async (
    _,
    { after, first },
    { auth: { profileId }, profileLoader, mediaLoader },
  ) => {
    const profile = profileId ? await profileLoader.load(profileId) : null;
    if (!profile) {
      return emptyConnection;
    }
    const limit = first ?? 100;
    const suggestions = await getMediaSuggestions(
      profile.id,
      profile.profileCategoryId,
      profile.companyActivityId,
      after,
      first ?? 100,
    );

    // resolvers doesn't understand the type of Media, so we need to cast it
    const edges: any[] = await Promise.all(
      suggestions.map(async ({ mediaId, cursor }) => ({
        node: await mediaLoader.load(mediaId),
        cursor,
      })),
    );

    return {
      edges,
      pageInfo: {
        hasNextPage: suggestions.length > limit,
        hasPreviousPage: false,
        startCursor: suggestions[0]?.cursor,
        endCursor: suggestions[suggestions.length - 1]?.cursor,
      },
    };
  },
};
