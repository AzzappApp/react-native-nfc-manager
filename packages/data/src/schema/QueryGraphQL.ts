import {
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import { getUserById, getUserByUserName } from '../domains/User';
import { getUserCardById } from '../domains/UserCard';
import NodeGraphQL from './NodeGraphQL';
import UserGraphQL from './UserGraphQL';
import ViewerGraphQL from './ViewerGraphQL';
import type { Viewer } from '../domains/Viewer';
import type { GraphQLContext } from './GraphQLContext';

const QueryGraphQL = new GraphQLObjectType<unknown, GraphQLContext>({
  name: 'Query',
  description: 'GraphQL Schema Root Query object',
  fields: {
    viewer: {
      type: new GraphQLNonNull(ViewerGraphQL),
      resolve: (_root, _args, context): Viewer => {
        // TODO We might store anonymous viewer in database later ???
        return {
          userId: context.userId,
          isAnonymous: context.isAnonymous,
        };
      },
    },
    node: {
      description: 'Fetches an object given its ID',
      type: NodeGraphQL,
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLID),
          description: 'The ID of an object',
        },
      },
      resolve: (_, { id: gqlId }) => fetchNode(gqlId),
    },
    nodes: {
      description: 'Fetches objects given their IDs',
      type: new GraphQLNonNull(new GraphQLList(NodeGraphQL)),
      args: {
        ids: {
          type: new GraphQLNonNull(
            new GraphQLList(new GraphQLNonNull(GraphQLID)),
          ),
          description: 'The IDs of objects',
        },
      },
      // TODO implement with batch ?
      resolve: (_, { ids: gqlIds }: { ids: string[] }) =>
        Promise.all(gqlIds.map(fetchNode)),
    },
    user: {
      description: 'Fetches an user given its user name',
      type: UserGraphQL,
      args: {
        userName: {
          type: new GraphQLNonNull(GraphQLString),
          description: 'The user name of the user',
        },
      },
      resolve: (_, { userName }: { userName: string }) =>
        getUserByUserName(userName),
    },
  },
});

export default QueryGraphQL;

const fetchNode = (gqlId: string) => {
  const { id, type } = fromGlobalId(gqlId);
  if (type === 'User') {
    return getUserById(id);
  } else if (type === 'UserCard') {
    const [userId, cardId] = JSON.parse(id);
    return getUserCardById(userId, cardId);
  }
};
