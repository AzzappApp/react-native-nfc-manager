import { GraphQLError } from 'graphql';
import {
  db,
  deleteWebCard,
  getActiveWebCardSubscription,
  removeProfileById,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

type Mutation = MutationResolvers['quitWebCard'];

const quitWebCard: Mutation = async (
  _,
  params,
  { loaders, auth, cardUsernamesToRevalidate },
) => {
  const webCardId = fromGlobalIdWithType(params.webCardId, 'WebCard');

  if (!auth.userId) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const profile = await loaders.profileByWebCardIdAndUserId.load({
    webCardId,
    userId: auth.userId,
  });

  const webCard = await loaders.WebCard.load(webCardId);

  if (!profile) {
    throw new GraphQLError(ERRORS.PROFILE_DONT_EXISTS);
  }

  if (profile?.profileRole === 'owner') {
    const subscription = await getActiveWebCardSubscription(
      auth.userId,
      profile.webCardId,
    );

    if (subscription) {
      throw new GraphQLError(ERRORS.SUBSCRIPTION_IS_ACTIVE);
    }

    await db.transaction(async trx => {
      await deleteWebCard(profile.webCardId, auth.userId ?? '', trx);
    });

    if (webCard) {
      cardUsernamesToRevalidate.add(webCard.userName);
    }
  } else {
    await removeProfileById(profile.id);
  }

  return {
    webCardId: params.webCardId,
  };
};

export default quitWebCard;
