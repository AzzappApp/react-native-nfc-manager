import { GraphQLError } from 'graphql';
import { deleteFCMToken as deleteFCMTokenDb } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionInfos } from '#GraphQLContext';
import type { MutationResolvers } from '#/__generated__/types';

const deleteFCMToken: MutationResolvers['deleteFCMToken'] = async (
  _,
  { input: { deviceId } },
) => {
  const { userId } = getSessionInfos();
  if (!userId) throw new GraphQLError(ERRORS.UNAUTHORIZED);
  await deleteFCMTokenDb(deviceId, userId);
  return true;
};

export default deleteFCMToken;
