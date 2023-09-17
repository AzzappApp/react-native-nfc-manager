/* eslint-disable @typescript-eslint/ban-ts-comment */
import ERRORS from '@azzapp/shared/errors';
import { updateProfile } from '#domains/profiles';
import type { Profile } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';
import type { GraphQLContext } from '../GraphQLContext';

const updateProfileMutation: MutationResolvers['updateProfile'] = async (
  _,
  args,
  { auth, loaders }: GraphQLContext,
) => {
  const { profileId } = auth;
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  let profile: Profile | null;
  try {
    profile = await loaders.Profile.load(profileId);
  } catch (e) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
  if (!profile) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const { ...profileUpdates } = args.input;

  const partialProfile: Partial<
    Omit<Profile, 'createdAt' | 'id' | 'profileKind' | 'updatedAt'>
  > = {
    ...profileUpdates,
  };

  try {
    await updateProfile(profile.id, partialProfile);
    return {
      profile: { ...profile, ...partialProfile },
    };
  } catch (error) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default updateProfileMutation;
