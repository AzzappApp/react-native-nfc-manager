import { GraphQLError } from 'graphql';
import { updateFCMToken } from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionInfos } from '#GraphQLContext';
import type { MutationResolvers } from '#/__generated__/types';

const saveFCMToken: MutationResolvers['saveFCMToken'] = async (
  _,
  { input: { deviceId, deviceType, fcmToken, deviceOS } },
) => {
  const { userId } = getSessionInfos();
  if (!userId) throw new GraphQLError(ERRORS.UNAUTHORIZED);

  await updateFCMToken(deviceId, userId, deviceType, deviceOS, fcmToken);

  return true;
};

export default saveFCMToken;
