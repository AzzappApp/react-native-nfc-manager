import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import {
  ProfileTable,
  checkMedias,
  db,
  referencesMedias,
  updateWebCard,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { WebCard } from '@azzapp/data';

const saveCommonInformation: MutationResolvers['saveCommonInformation'] =
  async (
    _,
    { webCardId: gqlWebCardId, input: { logoId, ...data } },
    { loaders },
  ) => {
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');

    const webCard = await loaders.WebCard.load(webCardId);

    if (!webCard) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
    }

    const updates: Partial<WebCard> = {
      commonInformation: data,
      logoId,
    };
    try {
      if (logoId) {
        await checkMedias([logoId]);
      }
      await db.transaction(async trx => {
        await updateWebCard(webCardId, updates, trx);

        trx
          .update(ProfileTable)
          .set({
            lastContactCardUpdate: new Date(),
          })
          .where(eq(ProfileTable.webCardId, webCardId));

        await referencesMedias(logoId ? [logoId] : [], [webCard.logoId], trx);
      });
    } catch (e) {
      console.error(e);
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }

    return {
      webCard: {
        ...webCard,
        ...updates,
      },
    };
  };

export default saveCommonInformation;
