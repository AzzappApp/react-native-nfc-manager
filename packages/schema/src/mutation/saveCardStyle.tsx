import { GraphQLError } from 'graphql';
import { updateWebCard } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { invalidateWebCard } from '#externals';
import { webCardLoader } from '#loaders';
import { hasWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';

const saveCardStyle: MutationResolvers['saveCardStyle'] = async (
  _,
  { webCardId: gqlWebCardId, input: cardStyle },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  if (!(await hasWebCardProfileEditorRight(webCardId))) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }

  const updates = {
    cardStyle,
    updatedAt: new Date(),
    lastCardUpdate: new Date(),
  };
  try {
    await updateWebCard(webCardId, updates);
  } catch (e) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  const webCard = await webCardLoader.load(webCardId);

  if (!webCard) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  invalidateWebCard(webCard.userName);
  return {
    webCard: {
      ...webCard,
      ...updates,
    },
  };
};

export default saveCardStyle;
