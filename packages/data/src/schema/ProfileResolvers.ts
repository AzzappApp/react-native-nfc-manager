import { connectionFromArraySlice, cursorToOffset } from 'graphql-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  getCompanyActivitiesByProfileCategory,
  getCompanyActivityById,
  getFollowingsCount,
  getFollowerProfilesCount,
  getProfileCategoryById,
  getProfilesPosts,
  getProfilesPostsCount,
  isFollowing,
  getCardModules,
} from '#domains';
import { generateFakeInsightsData } from '#helpers/fakerHelper';
import { getLabel, idResolver } from './utils';
import type { Media } from '#domains';
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
    if (!profile.coverData || !profile.coverTitle) {
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
  nbPosts: async (profile, _) => {
    return getProfilesPostsCount(profile.id);
  },
  nbFollowings: async (profile, _) => {
    return getFollowingsCount(profile.id);
  },
  nbFollowers: async (profile, _) => {
    return getFollowerProfilesCount(profile.id);
  },
  nbLikes: () => {
    //TODO: I don't know if it is releavant or how we will handlez counter (sql count or value maintain)
    // for the purpose of developing the ui of new homescreen , i will return an fake value
    return Math.floor(Math.random() * 10000);
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
        arrayLength: await getProfilesPostsCount(profile.id),
      },
    );
  },
  statsSummary: async () => {
    return generateFakeInsightsData(30);
  },
};

export const ProfileCategory: ProfileCategoryResolvers = {
  id: idResolver('ProfileCategory'),
  label: getLabel,
  medias: async (profileCategory, _, { mediaLoader }) => {
    return convertToNonNullArray(
      (await mediaLoader.loadMany(profileCategory.medias)).filter(
        m => !(m instanceof Error),
      ) as Media[],
    );
  },
  companyActivities: async (profileCategory, _) => {
    return getCompanyActivitiesByProfileCategory(profileCategory.id);
  },
};

export const CompanyActivity: CompanyActivityResolvers = {
  id: idResolver('CompanyActivity'),
  label: getLabel,
};
