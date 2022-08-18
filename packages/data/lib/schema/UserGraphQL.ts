import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {
  connectionArgs,
  connectionDefinitions,
  connectionFromArray,
  forwardConnectionArgs,
  globalIdField,
} from 'graphql-relay';
import {
  getUserFollowersIds,
  getUserFollowingIds,
  isFollowing,
} from '../domains/Followers';
import { getUserPosts } from '../domains/Post';
import { getUsersByIds } from '../domains/User';
import { getUserMainUserCard } from '../domains/UserCard';
import {
  emptyConnection,
  forwardConnectionFromBookmarkedListResult,
} from '../helpers/graphqlHelpers';
import NodeGraphQL from './NodeGraphQL';
import { PostConnectionGraphQL } from './PostGraphQL';
import UserCardGraphQL from './UserCardGraphQL';
import type { User } from '../domains/User';
import type { GraphQLContext } from './GraphQLContext';
import type { ConnectionArguments } from 'graphql-relay';

const UserGraphQL: GraphQLObjectType = new GraphQLObjectType<
  User,
  GraphQLContext
>({
  name: 'User',
  description: 'Represent an Azzapp User',
  interfaces: [NodeGraphQL],
  fields: () => ({
    id: globalIdField('User'),
    firstName: {
      type: GraphQLString,
    },
    lastName: {
      type: GraphQLString,
    },
    userName: {
      type: new GraphQLNonNull(GraphQLString),
    },
    card: {
      type: UserCardGraphQL,
      resolve: user => getUserMainUserCard(user.id),
    },
    posts: {
      type: PostConnectionGraphQL,
      args: forwardConnectionArgs,
      async resolve(user, args: ConnectionArguments) {
        const limit = args.first ?? 10;
        const result = await getUserPosts(user.id, limit, args.after);
        if (result) {
          return forwardConnectionFromBookmarkedListResult(limit, result);
        }
        return emptyConnection;
      },
    },
    isFollowing: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve(user, _, { userId, isAnonymous }) {
        if (isAnonymous || !userId) {
          return false;
        }
        return isFollowing(userId, user.id);
      },
    },
    followers: {
      type: UserConnectionGraphQL,
      args: connectionArgs,
      async resolve(user, args: ConnectionArguments) {
        const followersIds = await getUserFollowersIds(user.id);
        const followers = await getUsersByIds(followersIds);
        const map = new Map<string, User>();
        followers?.forEach(user => map.set(user.id, user));
        return connectionFromArray(
          followersIds.map(id => map.get(id)),
          args,
        );
      },
    },
    following: {
      type: UserConnectionGraphQL,
      args: connectionArgs,
      async resolve(user, args: ConnectionArguments) {
        const followingIds = await getUserFollowingIds(user.id);
        const followings = await getUsersByIds(followingIds);
        const map = new Map<string, User>();
        followings?.forEach(user => map.set(user.id, user));
        return connectionFromArray(
          followingIds.map(id => map.get(id)),
          args,
        );
      },
    },
  }),
});

export const { connectionType: UserConnectionGraphQL } = connectionDefinitions({
  nodeType: UserGraphQL,
});

export default UserGraphQL;
