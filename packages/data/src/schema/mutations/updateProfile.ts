/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';

import ERRORS from '@azzapp/shared/errors';

import { updateProfile } from '#domains/profiles';
import ProfileGraphQL from '../ProfileGraphQL';
import { ProfileKind } from './commonsTypes';
import type { Profile, ProfileKind as ProfileKindType } from '#domains';
import type { GraphQLContext } from '../GraphQLContext';

type UpdateProfileInput = {
  firstName?: string;
  lastName?: string;
  profileKind?: ProfileKindType;
  companyName?: string;
  companyActivityId?: string;
  isReady?: boolean;
  colorPalette?: string[];
};

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
      type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
    },
  },
  outputFields: {
    profile: {
      type: ProfileGraphQL,
    },
  },
  mutateAndGetPayload: async (
    updates: UpdateProfileInput,
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

    const { colorPalette, ...profileUpdates } = updates;

    try {
      const resultProfile = await updateProfile(
        profile.id,
        colorPalette
          ? {
              ...profileUpdates,
              colorPalette: colorPalette.join(','),
            }
          : profileUpdates,
      );
      return { profile: { ...profile, ...resultProfile } };
    } catch (error) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
  },
});

export default updateProfileMutation;
