import { eq } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { isAdmin } from '@azzapp/shared/profileHelpers';
import { ProfileTable, db, updateWebCard } from '#domains';
import type { WebCard } from '#domains';
import type { MutationResolvers } from '#schema/__generated__/types';

const saveCommonInformation: MutationResolvers['saveCommonInformation'] =
  async (_, { input: data }, { auth, loaders }) => {
    const { profileId, userId } = auth;
    if (!profileId || !userId) {
      throw new GraphQLError(ERRORS.UNAUTHORIZED);
    }

    const profile = await loaders.Profile.load(profileId);
    if (!profile || !isAdmin(profile.profileRole)) {
      throw new GraphQLError(ERRORS.INVALID_REQUEST);
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
