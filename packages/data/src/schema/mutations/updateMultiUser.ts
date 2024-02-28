import { and, eq, ne } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { ProfileTable, db, updateWebCard } from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { WebCard } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const updateMultiUser: MutationResolvers['updateMultiUser'] = async (
  _,
  { webCardId: gqlWebCardId, input: { isMultiUser } },
  { loaders },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

  const updates: Partial<WebCard> = {
    isMultiUser,
  };

  try {
    await db.transaction(async trx => {
      await updateWebCard(webCardId, updates, trx);
      if (!isMultiUser) {
        await trx
          .delete(ProfileTable)
          .where(
            and(
              eq(ProfileTable.webCardId, webCardId),
              ne(ProfileTable.profileRole, 'owner'),
            ),
          );
      }
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
  const webCard = await loaders.WebCard.load(webCardId);
  if (!webCard) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return {
    webCard,
  };
};

export default updateMultiUser;
