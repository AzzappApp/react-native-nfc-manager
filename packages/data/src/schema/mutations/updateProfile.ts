import { GraphQLError } from 'graphql';
import { fromGlobalId } from 'graphql-relay';
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

  const { id: targetProfileId, type } = fromGlobalId(input.profileId);

  if (type !== 'Profile') {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (input.profileRole === 'owner')
    throw new GraphQLError(ERRORS.INVALID_REQUEST);

  const [author, target] = await Promise.all([
    loaders.Profile.load(profileId),
    loaders.Profile.load(targetProfileId),
  ]);

  if (!author || !target) throw new GraphQLError(ERRORS.INVALID_REQUEST);

  if (profileId !== targetProfileId || input.profileRole) {
    if (
      !author ||
      !target ||
      !isAdmin(author.profileRole) ||
      target.webCardId !== author.webCardId
    ) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }
  }

  const { profileRole, contactCard, avatarId } = input;

  await updateProfile(targetProfileId, {
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
