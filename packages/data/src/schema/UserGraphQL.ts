import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import {
  connectionDefinitions,
  forwardConnectionArgs,
  globalIdField,
} from 'graphql-relay';
import { getUserPosts } from '../domains/Post';
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
  }),
});

export const { connectionType: UserConnectionGraphQL } = connectionDefinitions({
  nodeType: UserGraphQL,
});

export default UserGraphQL;
