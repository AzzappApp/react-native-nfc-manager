import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLInt,
} from 'graphql';
import {
  connectionDefinitions,
  connectionFromArraySlice,
  cursorToOffset,
  forwardConnectionArgs,
  globalIdField,
} from 'graphql-relay';
import { getProfileId } from '@azzapp/auth/viewer';
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
import localizedLabelResolver from '#helpers/localizationHelper';
import CardGraphQL from './CardGraphQL';
import { MediaImageGraphQL } from './MediaGraphQL';
import { ProfileKind } from './mutations/commonsTypes';
import NodeGraphQL from './NodeGraphQL';
import { PostConnectionGraphQL } from './PostGraphQL';
import type { Profile, Post, ProfileCategory, CompanyActivity } from '#domains';
import type { GraphQLContext } from './GraphQLContext';
import type { ConnectionArguments, Connection } from 'graphql-relay';

const ProfileGraphQL: GraphQLObjectType = new GraphQLObjectType<
  Profile,
  GraphQLContext
>({
  name: 'Profile',
  description: 'Represent an Azzapp Profile',
  interfaces: [NodeGraphQL],
  fields: () => ({
    id: globalIdField('Profile'),
    userName: {
      type: new GraphQLNonNull(GraphQLString),
    },
    firstName: {
      type: GraphQLString,
    },
    lastName: {
      type: GraphQLString,
    },
    companyName: {
      type: GraphQLString,
    },
    companyActivity: {
      type: CompanyActivityGraphQL,
      resolve(profile) {
        return profile.companyActivityId
          ? getCompanyActivityById(profile.companyActivityId)
          : null;
      },
    },
    profileKind: {
      type: ProfileKind,
    },
    profileCategory: {
      type: ProfileCategoryGraphQL,
      resolve(profile) {
        return profile.profileCategoryId
          ? getProfileCategoryById(profile.profileCategoryId)
          : null;
      },
    },
    card: {
      type: CardGraphQL,
      resolve: (profile, _, { cardByProfileLoader }) =>
        cardByProfileLoader.load(profile.id),
    },
    colorPalette: {
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
      resolve({ colorPalette }) {
        return colorPalette ? colorPalette.split(',') : null;
      },
    },
    posts: {
      type: PostConnectionGraphQL,
      args: forwardConnectionArgs,
      async resolve(
        user,
        args: ConnectionArguments,
      ): Promise<Connection<Post>> {
        // TODO we should use a bookmark instead of offset, perhaps by using postDate as a bookmark
        let { after, first } = args;
        after = after ?? null;
        first = first ?? 100;

        const offset = after ? cursorToOffset(after) : 0;

        return connectionFromArraySlice(
          await getProfilesPosts(user.id, first, offset),
          { after, first },
          {
            sliceStart: offset,
            arrayLength: await getProfilesPostsCount(user.id),
          },
        );
      },
    },
    isFollowing: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve(profile, _, { auth }): Promise<boolean> | boolean {
        const profileId = getProfileId(auth);
        if (!profileId) {
          return false;
        }
        return isFollowing(profileId, profile.id);
      },
    },
    nbPosts: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve(profile): Promise<number> {
        return getProfilesPostsCount(profile.id);
      },
    },
    nbFollowedProfiles: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve(profile): Promise<number> {
        return getFollowedProfilesCount(profile.id);
      },
    },
    nbFollowersProfiles: {
      type: new GraphQLNonNull(GraphQLInt),
      resolve(profile): Promise<number> {
        return getFollowerProfilesCount(profile.id);
      },
    },
  }),
});

export const { connectionType: ProfileConnectionGraphQL } =
  connectionDefinitions({ nodeType: ProfileGraphQL });

export const ProfileCategoryGraphQL = new GraphQLObjectType<
  ProfileCategory,
  GraphQLContext
>({
  name: 'ProfileCategory',
  description: 'Represent a Profile Category',
  interfaces: [NodeGraphQL],
  fields: () => ({
    id: globalIdField('ProfileCategory'),
    profileKind: { type: new GraphQLNonNull(ProfileKind) },
    label: {
      type: GraphQLString,
      resolve: localizedLabelResolver('labels'),
    },
    medias: {
      type: new GraphQLList(new GraphQLNonNull(MediaImageGraphQL)),
      resolve: async (profileCategory, _, { mediaLoader }) =>
        convertToNonNullArray(
          await mediaLoader.loadMany(profileCategory.medias as string[]),
        ),
    },
    companyActivities: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(CompanyActivityGraphQL)),
      ),
      resolve(profileCategory): Promise<CompanyActivity[]> {
        return getCompanyActivities(profileCategory.id);
      },
    },
  }),
});

export const CompanyActivityGraphQL = new GraphQLObjectType<
  CompanyActivity,
  GraphQLContext
>({
  name: 'CompanyActivity',
  description: 'Represent a Company Activity',
  interfaces: [NodeGraphQL],
  fields: () => ({
    id: globalIdField('CompanyActivity'),
    label: {
      type: GraphQLString,
      resolve: localizedLabelResolver('labels'),
    },
  }),
});

export default ProfileGraphQL;
