import { connectionFromArraySlice, cursorToOffset } from 'graphql-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import {
  getCompanyActivities,
  getCompanyActivityById,
  getFollowedProfilesCount,
  getFollowerProfilesCount,
  getProfileCategoryById,
  getProfilesPosts,
  getProfilesPostsCount,
  isFollowing,
} from '#domains';
import { buildDefaultContactCard, getContactCard } from '#domains/contactCards';
import { getLabel, idResolver } from './utils';
import type { Media } from '#domains';
import type {
  CompanyActivityResolvers,
  ProfileCategoryResolvers,
  ProfileResolvers,
} from './__generated__/types';

export const Profile: ProfileResolvers = {
  id: idResolver('Profile'),
  companyActivity: async (profile, _) => {
    return profile.companyActivityId
      ? getCompanyActivityById(profile.companyActivityId)
      : null;
  },
  profileCategory: async (profile, _) => {
    return profile.profileCategoryId
      ? getProfileCategoryById(profile.profileCategoryId)
      : null;
  },
  colorPalette: ({ colorPalette }) => {
    return colorPalette ? colorPalette.split(',') : null;
  },
  card: async (profile, _, { cardByProfileLoader }) => {
    return cardByProfileLoader.load(profile.id);
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
  isFollowing: async (profile, _, { auth }) => {
    return auth.profileId ? isFollowing(auth.profileId, profile.id) : false;
  },
  isViewer: async (profile, _, { auth }) => {
    return auth.profileId === profile.id;
  },
  nbPosts: async (profile, _) => {
    return getProfilesPostsCount(profile.id);
  },
  nbFollowedProfiles: async (profile, _) => {
    return getFollowedProfilesCount(profile.id);
  },
  nbFollowersProfiles: async (profile, _) => {
    return getFollowerProfilesCount(profile.id);
  },
  public: async (profile, _) => {
    return !!profile.public;
  },
  contactCard: async (profile, _, { userLoader }) => {
    const contactCard = await getContactCard(profile.id);

    if (contactCard) {
      return contactCard;
    } else {
      //build default contact card based on user data
      const user = await userLoader.load(profile.userId);

      return buildDefaultContactCard(profile, user);
    }
  },
};

export const ProfileCategory: ProfileCategoryResolvers = {
  id: idResolver('ProfileCategory'),
  label: getLabel,
  medias: async (profileCategory, _, { mediaLoader }) => {
    return convertToNonNullArray(
      (await mediaLoader.loadMany(profileCategory.medias as string[])).filter(
        m => !(m instanceof Error),
      ) as Media[],
    );
  },
  companyActivities: async (profileCategory, _) => {
    return getCompanyActivities(profileCategory.id);
  },
};

export const CompanyActivity: CompanyActivityResolvers = {
  id: idResolver('CompanyActivity'),
  label: getLabel,
};
