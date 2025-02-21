import { GraphQLError } from 'graphql';
import {
  getWebCardById,
  getWebCardCountProfile,
  removeWebCardNonOwnerProfiles,
  transaction,
  updateWebCard,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard } from '#externals';
import { getSessionInfos } from '#GraphQLContext';
import { checkWebCardOwnerProfile } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import { validateCurrentSubscription } from '#helpers/subscriptionHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { WebCard } from '@azzapp/data';

const updateMultiUser: MutationResolvers['updateMultiUser'] = async (
  _,
  { webCardId: gqlWebCardId, input: { isMultiUser } },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  await checkWebCardOwnerProfile(webCardId);
  const updates: Partial<WebCard> = {
    isMultiUser,
  };

  if (isMultiUser) {
    //we first need to heck if this is an IAP subscription and enough seats
    await validateCurrentSubscription(
      getSessionInfos().userId ?? '', //we know that the user is the owner
      await getWebCardCountProfile(webCardId),
    );
  }

  try {
    if (isMultiUser) {
      await updateWebCard(webCardId, updates);
    } else {
      await transaction(async () => {
        await updateWebCard(webCardId, updates);
        await removeWebCardNonOwnerProfiles(webCardId);
      });
    }
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
  const webCard = await getWebCardById(webCardId);
  if (!webCard) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
  if (webCard.userName) {
    invalidateWebCard(webCard.userName);
  }
  return {
    webCard,
  };
};

export default updateMultiUser;
