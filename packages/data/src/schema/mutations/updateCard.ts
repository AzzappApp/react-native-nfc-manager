import { getProfileId } from '@azzapp/auth/viewer';
import ERRORS from '@azzapp/shared/errors';
import { updateCard as updateCardDb } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const updateCard: MutationResolvers['updateCard'] = async (
  _,
  { input: { backgroundColor } },
  { auth, cardByProfileLoader },
) => {
  const profileId = getProfileId(auth);
  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const card = await cardByProfileLoader.load(profileId);
  if (!card) {
    throw new Error(ERRORS.INVALID_REQUEST);
  }

  try {
    await updateCardDb(card.id, {
      backgroundColor,
    });
    return {
      card: {
        ...card,
        backgroundColor: backgroundColor ?? null,
      },
    };
  } catch {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export default updateCard;
