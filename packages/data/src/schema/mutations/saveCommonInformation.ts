import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin } from '@azzapp/shared/profileHelpers';
import {
  ProfileTable,
  db,
  getUserProfileWithWebCardId,
  updateWebCard,
} from '#domains';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { WebCard } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const saveCommonInformation: MutationResolvers['saveCommonInformation'] =
  async (
    _,
    { input: { webCardId: gqlWebCardId, ...data } },
    { auth, loaders },
  ) => {
    const { userId } = auth;
    const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
    const profile =
      userId && (await getUserProfileWithWebCardId(userId, webCardId));

    if (!profile || !isAdmin(profile.profileRole)) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const updates: Partial<WebCard> = {
      commonInformation: data,
    };
    try {
      await db.transaction(async trx => {
        await updateWebCard(profile.webCardId, updates, trx);

        trx
          .update(ProfileTable)
          .set({
            lastContactCardUpdate: new Date(),
          })
          .where(eq(ProfileTable.webCardId, profile.webCardId));
      });
    } catch (e) {
      console.error(e);
      throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
    }

    const webCard = await loaders.WebCard.load(profile.webCardId);

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
