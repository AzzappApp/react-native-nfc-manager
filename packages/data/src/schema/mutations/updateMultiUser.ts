import { and, eq, ne } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isOwner } from '@azzapp/shared/profileHelpers';
import {
  ProfileTable,
  db,
  getUserProfileWithWebCardId,
  updateWebCard,
} from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { WebCard } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const updateMultiUser: MutationResolvers['updateMultiUser'] = async (
  _,
  { input: { webCardId: gqlWebCardId, isMultiUser } },
  { auth, loaders },
) => {
  const { userId } = auth;
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  const profile =
    userId && (await getUserProfileWithWebCardId(userId, webCardId));

  if (!profile || !isOwner(profile.profileRole)) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const updates: Partial<WebCard> = {
    isMultiUser,
  };

  try {
    await db.transaction(async trx => {
      await updateWebCard(profile.webCardId, updates, trx);
      if (!isMultiUser) {
        await trx
          .delete(ProfileTable)
          .where(
            and(
              eq(ProfileTable.webCardId, profile.webCardId),
              ne(ProfileTable.profileRole, 'owner'),
            ),
          );
      }
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
  const webCard = await loaders.WebCard.load(profile.webCardId);
  if (!webCard) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return {
    webCard,
  };
};

export default updateMultiUser;
