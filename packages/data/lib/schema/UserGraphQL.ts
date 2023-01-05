import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {
  connectionDefinitions,
  connectionFromArraySlice,
  cursorToOffset,
  forwardConnectionArgs,
  globalIdField,
} from 'graphql-relay';
import {
  getUsersPosts,
  getUsersPostsCount,
  isUserFollowings,
} from '../domains';
import NodeGraphQL from './NodeGraphQL';
import { PostConnectionGraphQL } from './PostGraphQL';
import UserCardGraphQL from './UserCardGraphQL';
import type { User, Post } from '../domains';
import type { GraphQLContext } from './GraphQLContext';
import type { ConnectionArguments, Connection } from 'graphql-relay';

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
      resolve: (user, _, { cardByUserLoader }) =>
        cardByUserLoader.load(user.id),
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
          await getUsersPosts(user.id, first, offset),
          { after, first },
          {
            sliceStart: offset,
            arrayLength: await getUsersPostsCount(user.id),
          },
        );
      },
    },
    isFollowing: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve(
        user,
        _,
        { userInfos: { userId, isAnonymous } },
      ): Promise<boolean> | boolean {
        if (isAnonymous || !userId) {
          return false;
        }
        return isUserFollowings(userId, user.id);
      },
    },
  }),
});

export const { connectionType: UserConnectionGraphQL } = connectionDefinitions({
  nodeType: UserGraphQL,
});

export default UserGraphQL;
