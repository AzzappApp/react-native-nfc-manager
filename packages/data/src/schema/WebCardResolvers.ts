import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { connectionFromArraySlice, cursorToOffset } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin } from '@azzapp/shared/profileHelpers';
import {
  getCompanyActivitiesByWebCardCategory,
  getCompanyActivityById,
  getWebCardCategoryById,
  getProfilesPosts,
  isFollowing,
  getCardModules,
  getLastWebCardStatisticsFor,
  getLikedPosts,
  getOwner,
  getFollowerProfiles,
  getFollowingsWebCard,
  getFollowingsPosts,
  db,
  ProfileTable,
} from '#domains';
import {
  connectionFromDateSortedItems,
  cursorToDate,
} from '#helpers/connectionsHelpers';
import { getLabel, idResolver } from './utils';
import type {
  CompanyActivityResolvers,
  WebCardCategoryResolvers,
  WebCardResolvers,
} from './__generated__/types';

export const WebCard: WebCardResolvers = {
  id: idResolver('WebCard'),
  webCardCategory: async (webCard, _) => {
    return webCard.webCardCategoryId
      ? getWebCardCategoryById(webCard.webCardCategoryId)
      : null;
  },
  companyActivity: async (webCard, _) => {
    return webCard.companyActivityId
      ? getCompanyActivityById(webCard.companyActivityId)
      : null;
  },
  cardCover: async (webCard, _) => {
    if (!webCard.coverData) {
      return null;
    }
    return webCard;
  },
  cardModules: async (webCard, _, { auth, loaders }) => {
    const profile = auth.profileId
      ? await loaders.Profile.load(auth.profileId)
      : null;
    const isCurrentProfile = profile?.webCardId === webCard.id;
    if (!webCard.cardIsPublished && !isCurrentProfile) {
      return [];
    }
    const modules = await getCardModules(webCard.id, isCurrentProfile);
    return modules;
  },
  isFollowing: async (webCard, _, { auth, loaders }) => {
    const profile = auth.profileId
      ? await loaders.Profile.load(auth.profileId)
      : null;

    return profile?.webCardId
      ? isFollowing(profile.webCardId, webCard.id)
      : false;
  },
  posts: async (webCard, args) => {
    // TODO we should use a bookmark instead of offset, perhaps by using createdAt as a bookmark
    let { after, first } = args;
    after = after ?? null;
    first = first ?? 100;

    const offset = after ? cursorToOffset(after) : 0;
    return connectionFromArraySlice(
      await getProfilesPosts(webCard.id, first, offset),
      { after, first },
      {
        sliceStart: offset,
        arrayLength: webCard.nbPosts,
      },
    );
  },
  statsSummary: async webCard => {
    //get data for the last 30 day
    const result = await getLastWebCardStatisticsFor(webCard.id, 30);
    return result;
  },
  likedPosts: async (webCard, args) => {
    const limit = args.first ?? 100;
    const offset = args.after ? cursorToDate(args.after) : null;
    const posts = await getLikedPosts(webCard.id, limit + 1, offset);
    const sizedPosts = posts.slice(0, limit);
    return connectionFromDateSortedItems(sizedPosts, {
      getDate: post => post.createdAt,
      hasNextPage: posts.length > limit,
      hasPreviousPage: offset !== null,
    });
  },
  owner: async webCard => getOwner(webCard.id),
  followers: async (webCard, args) => {
    const first = args.first ?? 50;
    const offset = args.after ? cursorToDate(args.after) : null;

    const followersProfiles = await getFollowerProfiles(webCard.id, {
      limit: first + 1,
      after: offset,
      userName: args.userName,
    });

    return connectionFromDateSortedItems(
      followersProfiles.map(p => ({
        ...p.UserProfile,
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
  followings: async (webCard, args) => {
    const first = args.first ?? 50;
    const offset = args.after ? cursorToDate(args.after) : null;

    const followingsWebCard = await getFollowingsWebCard(webCard.id, {
      limit: first + 1,
      after: offset,
      userName: args.userName,
    });

    const sizedProfile = followingsWebCard.slice(0, first);
    return connectionFromDateSortedItems(
      sizedProfile.map(p => ({
        ...p.UserProfile,
        ...p.Profile,
        followCreatedAt: p.followCreatedAt,
      })),
      {
        getDate: follow => follow.followCreatedAt,
        // approximations that should be good enough, and avoid a query
        hasNextPage: followingsWebCard.length > first,
        hasPreviousPage: offset !== null,
      },
    );
  },
  followingsPosts: async (webCard, args) => {
    const limit = args.first ?? 100;
    const offset = args.after ? cursorToDate(args.after) : null;

    const posts = await getFollowingsPosts(webCard.id, limit + 1, offset);

    return connectionFromDateSortedItems(posts.slice(0, limit), {
      getDate: post => post.createdAt,
      // approximations that should be good enough, and avoid a query
      hasNextPage: posts.length > limit,
      hasPreviousPage: offset !== null,
    });
  },
  profiles: async (webCard, _, { auth }) => {
    const { profileId } = auth;

    if (!profileId) throw new GraphQLError(ERRORS.UNAUTHORIZED);

    const profiles = await db
      .select()
      .from(ProfileTable)
      .where(eq(ProfileTable.webCardId, webCard.id));

    const currentProfile = profiles.find(profile => profile.id === profileId);

    if (!currentProfile || !isAdmin(currentProfile.profileRole)) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    return profiles;
  },
};

export const WebCardCategory: WebCardCategoryResolvers = {
  id: idResolver('WebCardCategory'),
  label: getLabel,
  medias: webCardCategory => webCardCategory.medias,
  companyActivities: async (webCardCategory, _) => {
    return getCompanyActivitiesByWebCardCategory(webCardCategory.id);
  },
};

export const CompanyActivity: CompanyActivityResolvers = {
  id: idResolver('CompanyActivity'),
  label: getLabel,
};
