import { GraphQLError } from 'graphql';
import {
  updateWebCardProfiles,
  updateWebCard,
  transaction,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard } from '#externals';
import { webCardLoader } from '#loaders';
import { checkWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const saveCardColors: MutationResolvers['saveCardColors'] = async (
  _,
  { webCardId: gqlWebCardId, input: cardColors },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  await checkWebCardProfileEditorRight(webCardId);

  const updates = {
    cardColors,
    updatedAt: new Date(),
    lastCardUpdate: new Date(),
  };
  try {
    await transaction(async () => {
      await updateWebCard(webCardId, updates);
      await updateWebCardProfiles(
        webCardId,
        { lastContactCardUpdate: new Date() },
        undefined,
      );
    });
  } catch (e) {
    console.error(e);
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await webCardLoader.load(webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
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

export default saveCardColors;
