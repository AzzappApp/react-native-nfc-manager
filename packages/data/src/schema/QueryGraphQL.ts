import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { getProfileByUserName } from '#domains';
import { nodeField, nodesField } from './NodeGraphQL';
import ProfileGraphQL from './ProfileGraphQL';
import ViewerGraphQL from './ViewerGraphQL';
import type { Profile } from '#domains';
import type { GraphQLContext } from './GraphQLContext';
import type { Viewer } from '@azzapp/auth/viewer';

const QueryGraphQL = new GraphQLObjectType<unknown, GraphQLContext>({
  name: 'Query',
  description: 'GraphQL Schema Root Query object',
  fields: {
    viewer: {
      type: new GraphQLNonNull(ViewerGraphQL),
      resolve: (_root, _args, { auth: userInfos }): Viewer => userInfos,
    },
    node: nodeField,
    nodes: nodesField,
    profile: {
      description: 'Fetches a profile given its user name',
      type: ProfileGraphQL,
      args: {
        userName: {
          type: new GraphQLNonNull(GraphQLString),
          description: 'The user name of the profile',
        },
      },
      resolve: async (
        _,
        { userName }: { userName: string },
      ): Promise<Profile | null> => getProfileByUserName(userName),
    },
  },
});

export default QueryGraphQL;
