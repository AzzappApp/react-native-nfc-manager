/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { mutationWithClientMutationId } from 'graphql-relay';
import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import { updateProfile } from '#domains/profiles';
import { ProfileKindGraphQL } from '../commonsTypes';
import ProfileGraphQL from '../ProfileGraphQL';
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
  interests?: string[];
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
      type: ProfileKindGraphQL,
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
    interests: {
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
    const profileId = getProfileId(auth);
    if (!profileId) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    let profile: Profile | null;
    try {
      profile = await profileLoader.load(profileId);
    } catch (e) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
    if (!profile) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    const { colorPalette, interests, ...profileUpdates } = updates;

    const partialProfile: Partial<
      Omit<Profile, 'createdAt' | 'id' | 'updatedAt'>
    > = {
      ...profileUpdates,
    };
    if (colorPalette) {
      partialProfile.colorPalette = colorPalette.join(',');
    }
    if (interests) {
      partialProfile.interests = interests.join(',');
    }

    try {
      const resultProfile = await updateProfile(profile.id, partialProfile);
      return { profile: { ...profile, ...resultProfile } };
    } catch (error) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
  },
});

export default updateProfileMutation;
