import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin } from '@azzapp/shared/profileHelpers';
import { updateProfile } from '#domains';
import type { GraphQLContext } from '#index';
import type { MutationResolvers } from '#schema/__generated__/types';

const updateProfileMutation: MutationResolvers['updateProfile'] = async (
  _,
  { input },
  { auth, loaders }: GraphQLContext,
) => {
  const { profileId, userId } = auth;

  if (!profileId || !userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  if (input.profileRole === 'owner')
    throw new GraphQLError(ERRORS.INVALID_REQUEST);

  const [author, target] = await Promise.all([
    loaders.Profile.load(profileId),
    loaders.Profile.load(input.profileId),
  ]);

  if (!author || !target) throw new GraphQLError(ERRORS.INVALID_REQUEST);

  if (profileId !== input.profileId || input.profileRole) {
    if (
      !author ||
      !target ||
      !isAdmin(author.profileRole) ||
      target.webCardId !== author.webCardId
    ) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }
  }

  const {
    profileId: profileIdToUpdate,
    profileRole,
    contactCard,
    avatarId,
  } = input;

  await updateProfile(profileIdToUpdate, {
    profileRole: profileRole ?? undefined,
    contactCard: {
      ...contactCard,
      birthday: contactCard?.birthday ?? undefined,
    },
    avatarId,
  });

  const profile = { ...target };
  if (profileRole) Object.assign(profile, { profileRole });
  if (avatarId) Object.assign(profile, { avatarId });
  if (contactCard) Object.assign(profile, { contactCard });

  return {
    profile,
  };
};

export default updateProfileMutation;
