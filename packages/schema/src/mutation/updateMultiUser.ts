import { GraphQLError } from 'graphql';
import {
  getWebCardCountProfile,
  removeWebCardNonOwnerProfiles,
  transaction,
  updateWebCard,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard } from '#externals';
import { webCardLoader, webCardOwnerLoader } from '#loaders';
import { checkWebCardOwnerProfile } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import {
  updateMonthlySubscription,
  validateCurrentSubscription,
} from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { WebCard } from '@azzapp/data';

const updateMultiUser: MutationResolvers['updateMultiUser'] = async (
  _,
  { webCardId: gqlWebCardId, input: { isMultiUser } },
  context,
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  await checkWebCardOwnerProfile(webCardId);
  const updates: Partial<WebCard> = {
    isMultiUser,
  };

  const owner = await webCardOwnerLoader.load(webCardId);

  if (!owner) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await webCardLoader.load(webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  if (isMultiUser) {
    await validateCurrentSubscription(
      owner.id,
      {
        webCardIsPublished: webCard.cardIsPublished,
        action: 'UPDATE_MULTI_USER',
        addedSeats: await getWebCardCountProfile(webCardId),
      },
      context.apiEndpoint,
    );
  }

  try {
    await transaction(async () => {
      await updateWebCard(webCardId, updates);
      if (!isMultiUser) {
        await transaction(async () => {
          await removeWebCardNonOwnerProfiles(webCardId);
          await updateMonthlySubscription(owner.id, context.apiEndpoint);
        });
      }
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  if (!webCard) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
  if (webCard.userName) {
    invalidateWebCard(webCard.userName);
  }
  return {
    webCard: {
      ...webCard,
      ...updates,
    },
  };
};

export default updateMultiUser;
