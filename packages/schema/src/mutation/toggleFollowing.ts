import { GraphQLError } from 'graphql';
import { follows, unfollows, isFollowing } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { webCardLoader } from '#loaders';
import {
  checkWebCardHasCover,
  checkWebCardProfileEditorRight,
} from '#helpers/permissionsHelpers';
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
  await checkWebCardHasCover(webCardId);

  const targetId = fromGlobalIdWithType(gqlTargetWebCardId, 'WebCard');

  let target: WebCard | null;
  try {
    target = await webCardLoader.load(targetId);
  } catch {
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

      let following = await isFollowing(webCardId, targetId);
      let attempt = 1;
      while (!following && attempt < 20) {
        await new Promise(resolve => {
          setTimeout(resolve, 50);
        });
        following = await isFollowing(webCardId, targetId);
        attempt++;
      }
    } else {
      await unfollows(webCardId, targetId);
      let following = await isFollowing(webCardId, targetId);
      let attempt = 1;
      while (following && attempt < 20) {
        await new Promise(resolve => {
          setTimeout(resolve, 50);
        });
        following = await isFollowing(webCardId, targetId);
        attempt++;
      }
    }
  } catch {
    throw new GraphQLError(ERRORS.INTERNAL_SERVER_ERROR);
  }

  return { webCard: target };
};

export default toggleFollowing;
