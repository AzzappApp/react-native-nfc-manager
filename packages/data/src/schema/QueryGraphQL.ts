import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import {
  getInterests,
  getProfileByUserName,
  getProfileCategories,
} from '#domains';
import { InterestGraphQL } from './commonsTypes';
import { nodeField, nodesField } from './NodeGraphQL';
import ProfileGraphQL, { ProfileCategoryGraphQL } from './ProfileGraphQL';
import UserGraphQL from './UserGraphQL';
import ViewerGraphQL from './ViewerGraphQL';
import type { Profile } from '#domains';
import type { GraphQLContext } from './GraphQLContext';
import type { User, Viewer } from '@azzapp/auth/viewer';

const QueryGraphQL = new GraphQLObjectType<unknown, GraphQLContext>({
  name: 'Query',
  description: 'GraphQL Schema Root Query object',
  fields: {
    viewer: {
      type: new GraphQLNonNull(ViewerGraphQL),
      resolve: (_root, _args, { auth: userInfos }): Viewer => userInfos,
    },
    currentUser: {
      description: 'User infos of the authenticated user',
      type: new GraphQLNonNull(UserGraphQL),
      resolve: (_root, _args, { auth: userInfos }): User => userInfos,
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
    profileCategories: {
      description: 'Return a list of profile categories',
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ProfileCategoryGraphQL)),
      ),
      resolve: async () => getProfileCategories(),
    },
    interests: {
      description: 'Return a list of interests',
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(InterestGraphQL)),
      ),
      resolve: async () => getInterests(),
    },
  },
});

export default QueryGraphQL;
