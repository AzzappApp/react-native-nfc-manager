import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { getUserByUserName } from '../domains';
import { nodeField, nodesField } from './NodeGraphQL';
import UserGraphQL from './UserGraphQL';
import ViewerGraphQL from './ViewerGraphQL';
import type { User, Viewer } from '../domains';
import type { GraphQLContext } from './GraphQLContext';

const QueryGraphQL = new GraphQLObjectType<unknown, GraphQLContext>({
  name: 'Query',
  description: 'GraphQL Schema Root Query object',
  fields: {
    viewer: {
      type: new GraphQLNonNull(ViewerGraphQL),
      resolve: (_root, _args, { userInfos }): Viewer => userInfos,
    },
    node: nodeField,
    nodes: nodesField,
    user: {
      description: 'Fetches an user given its user name',
      type: UserGraphQL,
      args: {
        userName: {
          type: new GraphQLNonNull(GraphQLString),
          description: 'The user name of the user',
        },
      },
      resolve: async (
        _,
        { userName }: { userName: string },
      ): Promise<User | null> => getUserByUserName(userName),
    },
  },
});

export default QueryGraphQL;
