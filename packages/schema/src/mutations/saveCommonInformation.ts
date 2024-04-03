import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { ProfileTable, db, updateWebCard } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { WebCard } from '@azzapp/data';

const saveCommonInformation: MutationResolvers['saveCommonInformation'] =
  async (_, { webCardId: gqlWebCardId, input: data }, { loaders }) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

    const updates: Partial<WebCard> = {
      commonInformation: data,
    };
    try {
      await db.transaction(async trx => {
        await updateWebCard(webCardId, updates, trx);

        trx
          .update(ProfileTable)
          .set({
            lastContactCardUpdate: new Date(),
          })
          .where(eq(ProfileTable.webCardId, webCardId));
      });
    } catch (e) {
      console.error(e);
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }

    const webCard = await loaders.WebCard.load(webCardId);

    if (!webCard) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    return {
      webCard: {
        ...webCard,
        ...updates,
      },
    };
  };

export default saveCommonInformation;
