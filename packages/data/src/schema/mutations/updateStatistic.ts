import { sql, eq } from 'drizzle-orm';
import { fromGlobalId } from 'graphql-relay';
import ERRORS from '@azzapp/shared/errors';
import { ProfileTable, db, updateStatistics } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const updateWebcardViews: MutationResolvers['updateWebcardViews'] = async (
  _,
  { input: { id } },
  { auth },
) => {
  const { profileId } = auth;

  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const { id: targetId, type } = fromGlobalId(id);
  if (type !== 'Profile') {
    throw new Error(ERRORS.INVALID_REQUEST);
  }
  try {
    if (targetId !== profileId) {
      await db.transaction(async trx => {
        await updateStatistics(targetId, 'webcardViews', true, trx);
        await trx
          .update(ProfileTable)
          .set({
            nbWebcardViews: sql`${ProfileTable.nbWebcardViews} + 1`,
          })
          .where(eq(ProfileTable.id, targetId));
      });
    }

    return true;
  } catch (error) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

const updateContactcardScans: MutationResolvers['updateContactcardScans'] =
  async (_, { input: { id } }, { auth }) => {
    const { profileId } = auth;

    if (!profileId) {
      throw new Error(ERRORS.UNAUTORIZED);
    }

    const { id: targetId, type } = fromGlobalId(id);

    if (type !== 'Profile') {
      throw new Error(ERRORS.INVALID_REQUEST);
    }
    try {
      if (targetId !== profileId) {
        await updateStatistics(targetId, 'contactcardScans', true);
      }

      return true;
    } catch (error) {
      throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
    }
  };

const updateLikes: MutationResolvers['updateLikes'] = async (
  _,
  { input: { id } },
  { auth },
) => {
  const { profileId } = auth;

  if (!profileId) {
    throw new Error(ERRORS.UNAUTORIZED);
  }

  const { id: targetId, type } = fromGlobalId(id);

  if (type !== 'Profile') {
    throw new Error(ERRORS.INVALID_REQUEST);
  }
  try {
    if (targetId !== profileId) {
      await updateStatistics(targetId, 'likes', true);
    }

    return true;
  } catch (error) {
    throw new Error(ERRORS.INTERNAL_SERVER_ERROR);
  }
};

export { updateWebcardViews, updateContactcardScans, updateLikes };
