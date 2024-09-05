import { GraphQLError } from 'graphql';
import {
  removeWebCardNonOwnerProfiles,
  transaction,
  updateWebCard,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard } from '#externals';
import {
  activeSubscriptionsForWebCardLoader,
  webCardLoader,
  webCardOwnerLoader,
} from '#loaders';
import { hasWebCardOwnerProfile } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { WebCard } from '@azzapp/data';

const updateMultiUser: MutationResolvers['updateMultiUser'] = async (
  _,
  { webCardId: gqlWebCardId, input: { isMultiUser } },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  if (!(await hasWebCardOwnerProfile(webCardId))) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const updates: Partial<WebCard> = {
    isMultiUser,
  };

  if (isMultiUser) {
    const owner = await webCardOwnerLoader.load(webCardId);
    const subscription = owner
      ? await activeSubscriptionsForWebCardLoader.load({
          userId: owner?.id ?? '',
          webCardId,
        })
      : null;

    if (!subscription) {
      throw new GraphQLError(ERRORS.SUBSCRIPTION_REQUIRED);
    }
  }

  try {
    await transaction(async () => {
      await updateWebCard(webCardId, updates);
      if (!isMultiUser) {
        await removeWebCardNonOwnerProfiles(webCardId);
      }
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
  const webCard = await webCardLoader.load(webCardId);
  if (!webCard) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  invalidateWebCard(webCard.userName);

  return {
    webCard,
  };
};

export default updateMultiUser;
