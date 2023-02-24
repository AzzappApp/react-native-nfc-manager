import { GraphQLBoolean, GraphQLString } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/lib/errors';

import { db } from '../../domains';
import ProfileGraphQL from '../ProfileGraphQL';
import { ProfileKind } from './commonsTypes';
import type { Profile } from '../../domains';
import type { GraphQLContext } from '../GraphQLContext';

const updateProfile = mutationWithClientMutationId({
  name: 'UpdateProfile',
  inputFields: {
    firstName: {
      type: GraphQLString,
    },
    lastName: {
      type: GraphQLString,
    },
    profileKind: {
      type: ProfileKind,
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
    profile: {
      type: ProfileGraphQL,
    },
  },
  mutateAndGetPayload: async (
    updates: Omit<Partial<Profile>, 'id'>,
    { auth, profileLoader }: GraphQLContext,
  ) => {
    if (auth.isAnonymous) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    let profile: Profile | null;
    try {
      profile = await profileLoader.load(auth.profileId);
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    if (!profile) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    try {
      const result = await db
        .updateTable('Profile')
        .where('id', '=', profile.id)
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

export default updateProfile;
