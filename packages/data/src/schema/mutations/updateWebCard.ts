/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isEditor } from '@azzapp/shared/profileHelpers';
import { updateWebCard, type Profile, type WebCard } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';
import type { GraphQLContext } from '../GraphQLContext';

const updateWebCardMutation: MutationResolvers['updateWebCard'] = async (
  _,
  args,
  { auth, loaders }: GraphQLContext,
) => {
  const { profileId, userId } = auth;
  if (!profileId || !userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  let profile: Profile | null;
  try {
    profile = await loaders.Profile.load(profileId);
  } catch (e) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
  if (!profile || !isEditor(profile.profileRole)) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const { ...profileUpdates } = args.input;

  const partialWebCard: Partial<
    Omit<WebCard, 'createdAt' | 'id' | 'updatedAt' | 'webCardKind'>
  > = {
    ...profileUpdates,
  };

  try {
    await updateWebCard(profile.webCardId, partialWebCard);

    const webCard = await loaders.WebCard.load(profile.webCardId);

    if (!webCard) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    return {
      webCard: { ...webCard, ...partialWebCard },
    };
  } catch (error) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default updateWebCardMutation;
