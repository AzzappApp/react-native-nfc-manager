import { GraphQLError } from 'graphql';
import { deleteFCMToken as deleteFCMTokenDb } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionUser } from '#GraphQLContext';
import type { MutationResolvers } from '#/__generated__/types';

const deleteFCMToken: MutationResolvers['deleteFCMToken'] = async (
  _,
  { input: { deviceId } },
) => {
  const user = await getSessionUser();
  if (!user) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  await deleteFCMTokenDb(deviceId, user.id);
  return true;
};

export default deleteFCMToken;
