/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GraphQLBoolean, GraphQLString } from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';

import ERRORS from '@azzapp/shared/errors';

import { updateProfile } from '#domains/profiles';
import ProfileGraphQL from '../ProfileGraphQL';
import { ProfileKind } from './commonsTypes';
import type { Profile } from '#domains';
import type { GraphQLContext } from '../GraphQLContext';

const updateProfileMutation = mutationWithClientMutationId({
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
    colorPalette: {
      type: GraphQLString,
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
      const resultProfile = await updateProfile(profile.id, updates);
      return { profile: { ...profile, ...resultProfile } };
    } catch (error) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
  },
});

export default updateProfileMutation;
