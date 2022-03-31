import { GraphQLID, GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
import { getUserById } from '../domains/User';
import { getUserCardById } from '../domains/UserCard';
import NodeGraphQL from './NodeGraphQL';
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
        // We might store temporary viewer in database later ???
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
      resolve: (_, { id: gqlId }) => {
        const { id, type } = fromGlobalId(gqlId);
        if (type === 'User') {
          return getUserById(id);
        } else if (type === 'UserCard') {
          const [userId, cardId] = JSON.parse(id);
          return getUserCardById(userId, cardId);
        }
      },
    },
    // TODO
    // nodes: {
    //   description: 'Fetches objects given their IDs',
    //   type: new GraphQLNonNull(new GraphQLList(NodeGraphQL)),
    //   args: {
    //     ids: {
    //       type: new GraphQLNonNull(
    //         new GraphQLList(new GraphQLNonNull(GraphQLID)),
    //       ),
    //       description: 'The IDs of objects',
    //     },
    //   },
    // },
  },
});

export default QueryGraphQL;
