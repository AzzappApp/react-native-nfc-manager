import ERRORS from '@azzapp/shared/lib/errors';

import { GraphQLBoolean, GraphQLString } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';

import { db } from '../../domains';
import UserGraphQL from '../UserGraphQL';
import { UserTypeGraphQL } from './commonsTypes';
import type { User } from '../../domains';
import type { GraphQLContext } from '../GraphQLContext';

const updateUser = mutationWithClientMutationId({
  name: 'UpdateUser',
  inputFields: {
    firstName: {
      type: GraphQLString,
    },
    lastName: {
      type: GraphQLString,
    },
    userType: {
      type: UserTypeGraphQL,
    },
    companyName: {
      type: GraphQLString,
    },
    companyActivityId: {
      type: GraphQLString,
    },
    isReady: {
      type: GraphQLBoolean,
    },
  },
  outputFields: {
    user: {
      type: UserGraphQL,
    },
  },
  mutateAndGetPayload: async (
    updates: Omit<Partial<User>, 'id'>,
    { userInfos: { userId, isAnonymous }, userLoader }: GraphQLContext,
  ) => {
    if (!userId || isAnonymous) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    let user: User | null;
    try {
      user = await userLoader.load(userId);
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    if (!user) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    try {
      const result = await db
        .updateTable('User')
        .where('id', '=', user.id)
        .set(updates)
        .execute();
      if (result.length > 0) {
        return true;
      } else {
        throw new Error(ERRORS.USER_NOT_FOUND);
      }
    } catch {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
  },
});

export default updateUser;
