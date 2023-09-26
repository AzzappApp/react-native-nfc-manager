import { desc, like } from 'drizzle-orm';
import { connectionFromArray } from 'graphql-relay';
import { shuffle } from '@azzapp/shared/arrayHelpers';
import { simpleHash } from '@azzapp/shared/stringHelpers';
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
  getColorPalettes,
  getCardTemplateTypes,
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
  profile: async (_root, _, { auth, loaders }) => {
    const profileId = auth.profileId;
    if (!profileId) {
      return null;
    }
    return loaders.Profile.load(profileId);
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

    const limit = args.first ?? 100;
    const offset = args.after ? cursorToDate(args.after) : null;

    const posts = await getFollowingsPosts(profileId, limit + 1, offset);

    return connectionFromDateSortedItems(posts.slice(0, limit), {
      getDate: post => post.createdAt,
      // approximations that should be good enough, and avoid a query
      hasNextPage: posts.length > limit,
      hasPreviousPage: offset !== null,
    });
  },
  trendingProfiles: async (_, args) => {
    // TODO dummy implementation just to test frontend
    return connectionFromArray(
      await db
        .select()
        .from(ProfileTable)
        .orderBy(desc(ProfileTable.createdAt)),
      args,
    );
  },
  trendingPosts: async (_, args) => {
    // TODO dummy implementation just to test frontend
    return connectionFromArray(
      await db.select().from(PostTable).orderBy(desc(PostTable.createdAt)),
      args,
    );
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
  coverBackgrounds: async () =>
    getStaticMediasByUsage('coverBackground').then(medias =>
      medias.map(media => ({
        staticMedia: media,
        assetKind: 'cover',
      })),
    ),
  coverForegrounds: async () =>
    getStaticMediasByUsage('coverForeground').then(medias =>
      medias.map(media => ({
        staticMedia: media,
        assetKind: 'cover',
      })),
    ),
  moduleBackgrounds: async () => getStaticMediasByUsage('moduleBackground'),
  coverTemplates: async (
    _,
    { kind, after, first },
    { auth: { profileId }, loaders },
  ) => {
    const profile = profileId ? await loaders.Profile.load(profileId) : null;
    if (!profile) {
      return emptyConnection;
    }
    const limit = first ?? 100;
    const templates = await getCoverTemplates(
      profile.profileKind,
      kind,
      profile.id,
      after,
      limit + 1,
    );
    const sizedTemplate = templates.slice(0, limit);
    return {
      edges: sizedTemplate.map(template => ({
        node: template,
        cursor: template.cursor,
      })),
      pageInfo: {
        hasNextPage: templates.length > limit,
        hasPreviousPage: false,
        startCursor: templates[0]?.cursor,
        endCursor: sizedTemplate[sizedTemplate.length - 1].cursor,
      },
    };
  },
  cardTemplates: async (
    _,
    { cardTemplateTypeId, after, first },
    { auth: { profileId }, loaders },
  ) => {
    const profile = profileId ? await loaders.Profile.load(profileId) : null;
    if (!profile) {
      return emptyConnection;
    }
    let typeId = cardTemplateTypeId;
    if (cardTemplateTypeId == null) {
      if (profile.companyActivityId) {
        const compActivity = await loaders.CompanyActivity.load(
          profile.companyActivityId,
        );
        if (compActivity) {
          typeId = compActivity.cardTemplateTypeId;
        }
      }
    }
    if (typeId == null) {
      if (profile.profileCategoryId) {
        const profileCategory = await loaders.ProfileCategory.load(
          profile.profileCategoryId,
        );
        if (profileCategory) {
          typeId = profileCategory.cardTemplateTypeId;
        }
      }
    }
    const limit = first ?? 20;
    const cardTemplates = await getCardTemplates(
      profile.profileKind,
      typeId,
      profile.id,
      after,
      limit + 1,
    );
    if (cardTemplates.length > 0) {
      const sizedCardtemplate = cardTemplates.slice(0, limit);
      return {
        edges: sizedCardtemplate.map(cardTemplate => ({
          node: cardTemplate,
          cursor: cardTemplate.cursor,
        })),
        pageInfo: {
          hasNextPage: cardTemplates.length > limit,
          hasPreviousPage: false,
          startCursor: cardTemplates[0]?.cursor,
          endCursor: sizedCardtemplate[sizedCardtemplate.length - 1].cursor,
        },
      };
    }
    return emptyConnection;
  },
  cardTemplateTypes: async () => getCardTemplateTypes(),
  cardStyles: async (_, { after, first }, { auth: { profileId } }) => {
    if (!profileId) {
      return emptyConnection;
    }
    const limit = first ?? 100;
    const cardStyles = await getCardStyles(profileId, after, limit + 1);
    const sizedCardStyles = cardStyles.slice(0, limit);
    return {
      edges: sizedCardStyles.map(style => ({
        node: style,
        cursor: style.cursor,
      })),
      pageInfo: {
        hasNextPage: cardStyles.length > limit,
        hasPreviousPage: false,
        startCursor: cardStyles[0]?.cursor,
        endCursor: cardStyles[sizedCardStyles.length - 1].cursor,
      },
    };
  },
  colorPalettes: async (
    _,
    { after, first },
    { auth: { profileId }, sessionMemoized },
  ) => {
    if (!profileId) {
      return emptyConnection;
    }
    first = first ?? 100;
    const colorPalettes = shuffle(
      await sessionMemoized(getColorPalettes),
      simpleHash(profileId),
    );

    return connectionFromArray(colorPalettes, {
      after,
      first,
    });
  },
  suggestedMedias: async (
    _,
    { after, first },
    { auth: { profileId }, loaders },
  ) => {
    const profile = profileId ? await loaders.Profile.load(profileId) : null;
    if (
      !profile ||
      profile.profileKind !== 'business' ||
      profile.profileCategoryId == null //profile category Id is mandatory on busness profile
    ) {
      return emptyConnection;
    }

    const limit = first ?? 100;
    const suggestions = await getMediaSuggestions(
      profile.id,
      profile.profileCategoryId,
      profile.companyActivityId,
      after,
      (first ?? 100) + 1,
    );
    const sizedSuggestion = suggestions.slice(0, limit);
    const edges = sizedSuggestion.map(({ mediaId, cursor }) => ({
      node: mediaId,
      cursor,
    })) as any[];

    return {
      edges,
      pageInfo: {
        hasNextPage: suggestions.length > limit,
        hasPreviousPage: false,
        startCursor: suggestions[0]?.cursor,
        endCursor: sizedSuggestion[sizedSuggestion.length - 1]?.cursor,
      },
    };
  },
};
