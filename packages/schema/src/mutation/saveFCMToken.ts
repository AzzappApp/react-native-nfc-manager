import { GraphQLError } from 'graphql';
import {
  clearTokenForDeviceExceptUser,
  transaction,
  updateFCMToken,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionInfos } from '#GraphQLContext';
import type { MutationResolvers } from '#/__generated__/types';

const saveFCMToken: MutationResolvers['saveFCMToken'] = async (
  _,
  { input: { deviceId, deviceType, fcmToken, deviceOS } },
) => {
  const { userId } = getSessionInfos();
  if (!userId) throw new GraphQLError(ERRORS.UNAUTHORIZED);
  await transaction(async () => {
    //this remove the old token for the device associated to other userId
    await clearTokenForDeviceExceptUser(userId, deviceId);
    await updateFCMToken(userId, deviceId, deviceType, deviceOS, fcmToken);
  });

  return true;
};

export default saveFCMToken;
