import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { getUserProfiles, getUsersByIds } from '#domains';
import ProfileGraphQL from './ProfileGraphQL';
import type { Profile } from '#domains';
import type { GraphQLContext } from './GraphQLContext';
import type { User } from '@azzapp/auth/viewer';

const UserGraphQL = new GraphQLObjectType<User, GraphQLContext>({
  name: 'User',
  description: 'Represent an Application User',
  fields: () => ({
    email: {
      description: 'Returns the email of the user',
      type: GraphQLString,
      resolve: async (user): Promise<string | null> => {
        if (user.isAnonymous) {
          return null;
        }

        const userId = user.userId;
        const [dbUser] = await getUsersByIds([userId]);

        return dbUser?.email ?? null;
      },
    },
    phoneNumber: {
      description: 'Returns the phone number of the user',
      type: GraphQLString,
      resolve: async (user): Promise<string | null> => {
        if (user.isAnonymous) {
          return null;
        }

        const userId = user.userId;
        const [dbUser] = await getUsersByIds([userId]);

        return dbUser?.phoneNumber ?? null;
      },
    },
    profiles: {
      description: 'Returns a list of Profiles of the user',
      type: new GraphQLList(new GraphQLNonNull(ProfileGraphQL)),
      resolve: async (user: User): Promise<Profile[] | null> => {
        if (user.isAnonymous) {
          return null;
        }

        return getUserProfiles(user.userId);
      },
    },
  }),
});

export default UserGraphQL;
