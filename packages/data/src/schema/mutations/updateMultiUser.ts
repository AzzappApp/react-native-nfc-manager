import { and, eq, ne } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import ERRORS from '@azzapp/shared/errors';
import { ProfileTable, db, updateWebCard } from '#domains';
import type { WebCard } from '#domains';
import type { GraphQLContext } from '#index';
import type { MutationResolvers } from '#schema/__generated__/types';

const updateMultiUser: MutationResolvers['updateMultiUser'] = async (
  _,
  { isMultiUser },
  { auth, loaders }: GraphQLContext,
) => {
  const { profileId, userId } = auth;

  if (!profileId || !userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const profile = await loaders.Profile.load(profileId);

  if (!profile || profile.profileRole !== 'owner') {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const updates: Partial<WebCard> = {
    isMultiUser,
  };

  try {
    await db.transaction(async trx => {
      console.log('coucoup');
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
  console.log({ webCard });
  if (!webCard) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return {
    webCard,
  };
};

export default updateMultiUser;
