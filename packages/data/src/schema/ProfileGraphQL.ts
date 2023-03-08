import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
} from 'graphql';
import {
  connectionDefinitions,
  connectionFromArraySlice,
  cursorToOffset,
  forwardConnectionArgs,
  globalIdField,
} from 'graphql-relay';
import { getProfilesPosts, getProfilesPostsCount, isFollowing } from '#domains';
import CardGraphQL from './CardGraphQL';
import { ProfileKind } from './mutations/commonsTypes';
import NodeGraphQL from './NodeGraphQL';
import { PostConnectionGraphQL } from './PostGraphQL';
import type { Profile, Post } from '#domains';
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
    companyActivityId: {
      type: GraphQLString,
    },
    isReady: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    profileKind: {
      type: ProfileKind,
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
      resolve(profile, _, { auth: userInfos }): Promise<boolean> | boolean {
        if (userInfos.isAnonymous) {
          return false;
        }
        return isFollowing(userInfos.profileId, profile.id);
      },
    },
  }),
});

export const { connectionType: ProfileConnectionGraphQL } =
  connectionDefinitions({ nodeType: ProfileGraphQL });

export default ProfileGraphQL;
