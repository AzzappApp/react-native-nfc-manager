import { and, eq, ne } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { ProfileTable, db, updateWebCard } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { WebCard } from '@azzapp/data';

const updateMultiUser: MutationResolvers['updateMultiUser'] = async (
  _,
  { webCardId: gqlWebCardId, input: { isMultiUser } },
  { loaders },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

  const updates: Partial<WebCard> = {
    isMultiUser,
  };

  if (isMultiUser) {
    const owner = await loaders.webCardOwners.load(webCardId);
    const subscription = owner
      ? await loaders.activeSubscriptionsForWebCardLoader.load({
          userId: owner?.id ?? '',
          webCardId,
        })
      : null;

    if (!subscription) {
      throw new GraphQLError(ERRORS.SUBSCRIPTION_REQUIRED);
    }
  }

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
