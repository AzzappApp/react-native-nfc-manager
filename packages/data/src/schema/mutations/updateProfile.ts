/* eslint-disable @typescript-eslint/ban-ts-comment */
import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import { updateProfile } from '#domains/profiles';
import type { Profile } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';
import type { GraphQLContext } from '../GraphQLContext';

const updateProfileMutation: MutationResolvers['updateProfile'] = async (
  _,
  args,
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

  const { colorPalette, interests, ...profileUpdates } = args.input;

  const partialProfile: Partial<
    Omit<Profile, 'createdAt' | 'id' | 'profileKind' | 'updatedAt'>
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
    return {
      profile: { ...profile, ...resultProfile },
    };
  } catch (error) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default updateProfileMutation;
