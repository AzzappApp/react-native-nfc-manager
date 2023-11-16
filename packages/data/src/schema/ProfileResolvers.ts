import { connectionFromArraySlice, cursorToOffset } from 'graphql-relay';
import {
  getCompanyActivitiesByProfileCategory,
  getCompanyActivityById,
  getProfileCategoryById,
  getProfilesPosts,
  isFollowing,
  getCardModules,
  getLastStatisticsFor,
  getLikedPosts,
} from '#domains';
import {
  connectionFromDateSortedItems,
  cursorToDate,
} from '#helpers/connectionsHelpers';
import { getLabel, idResolver } from './utils';
import type {
  CompanyActivityResolvers,
  ProfileCategoryResolvers,
  ProfileResolvers,
} from './__generated__/types';

export const Profile: ProfileResolvers = {
  id: idResolver('Profile'),
  profileCategory: async (profile, _) => {
    return profile.profileCategoryId
      ? getProfileCategoryById(profile.profileCategoryId)
      : null;
  },
  companyActivity: async (profile, _) => {
    return profile.companyActivityId
      ? getCompanyActivityById(profile.companyActivityId)
      : null;
  },
  cardCover: async (profile, _, { auth }) => {
    if (!profile.cardIsPublished && auth.userId !== profile.userId) {
      return null;
    }
    if (!profile.coverData) {
      return null;
    }
    return profile;
  },
  cardModules: async (profile, _, { auth }) => {
    const isCurrentProfile = auth.profileId === profile.id;
    if (!profile.cardIsPublished && !isCurrentProfile) {
      return [];
    }
    const modules = await getCardModules(profile.id, isCurrentProfile);
    return modules;
  },
  contactCard: async (profile, _, { auth }) => {
    const isCurrentUser = auth.userId === profile.userId;
    if (!isCurrentUser) {
      return null;
    }
    return profile;
  },
  isFollowing: async (profile, _, { auth }) => {
    return auth.profileId ? isFollowing(auth.profileId, profile.id) : false;
  },
  posts: async (profile, args) => {
    // TODO we should use a bookmark instead of offset, perhaps by using createdAt as a bookmark
    let { after, first } = args;
    after = after ?? null;
    first = first ?? 100;

    const offset = after ? cursorToOffset(after) : 0;
    return connectionFromArraySlice(
      await getProfilesPosts(profile.id, first, offset),
      { after, first },
      {
        sliceStart: offset,
        arrayLength: profile.nbPosts,
      },
    );
  },
  statsSummary: async profile => {
    //get data for the last 30 day
    const result = await getLastStatisticsFor(profile.id, 30);
    return result;
  },
  likedPosts: async (profile, args) => {
    const limit = args.first ?? 100;
    const offset = args.after ? cursorToDate(args.after) : null;
    const posts = await getLikedPosts(profile.id, limit + 1, offset);
    const sizedPosts = posts.slice(0, limit);
    return connectionFromDateSortedItems(sizedPosts, {
      getDate: post => post.createdAt,
      hasNextPage: posts.length > limit,
      hasPreviousPage: offset !== null,
    });
  },
};

export const ProfileCategory: ProfileCategoryResolvers = {
  id: idResolver('ProfileCategory'),
  label: getLabel,
  medias: profileCategory => profileCategory.medias,
  companyActivities: async (profileCategory, _) => {
    return getCompanyActivitiesByProfileCategory(profileCategory.id);
  },
};

export const CompanyActivity: CompanyActivityResolvers = {
  id: idResolver('CompanyActivity'),
  label: getLabel,
};
