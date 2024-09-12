import { GraphQLError } from 'graphql';
import { follows, unfollows } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { webCardLoader } from '#loaders';
import { checkWebCardProfileEditorRight } from '#helpers/permissionsHelpers';
import fromGlobalIdWithType from '#helpers/relayIdHelpers';
import type { MutationResolvers } from '#/__generated__/types';
import type { WebCard } from '@azzapp/data';

const toggleFollowing: MutationResolvers['toggleFollowing'] = async (
  _,
  {
    webCardId: gqlWebCardId,
    input: { targetWebCardId: gqlTargetWebCardId, follow },
  },
) => {
  const webCardId = fromGlobalIdWithType(gqlWebCardId, 'WebCard');
  await checkWebCardProfileEditorRight(webCardId);

  const targetId = fromGlobalIdWithType(gqlTargetWebCardId, 'WebCard');

  let target: WebCard | null;
  try {
    target = await webCardLoader.load(targetId);
  } catch (e) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }
  if (!target) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }
  if (webCardId === targetId) {
    throw new GraphQLError(ERRORS.INVALID_REQUEST);
  }

  try {
    if (follow) {
      await follows(webCardId, targetId);
    } else {
      await unfollows(webCardId, targetId);
    }
  } catch (e) {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { webCard: target };
};

export default toggleFollowing;
