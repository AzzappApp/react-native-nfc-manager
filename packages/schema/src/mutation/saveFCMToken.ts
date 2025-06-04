import { GraphQLError } from 'graphql';
import {
  clearTokenForDeviceExceptUser,
  transaction,
  updateFCMToken,
} from '@azzapp/data';
import ERRORS from '@azzapp/shared/errors';
import { getSessionUser } from '#GraphQLContext';
import type { MutationResolvers } from '#/__generated__/types';

const saveFCMToken: MutationResolvers['saveFCMToken'] = async (
  _,
  { input: { deviceId, deviceType, fcmToken, deviceOS } },
) => {
  const user = await getSessionUser();
  if (!user) {
    throw new GraphQLError(ERRORS.UNAUTHORIZED);
  }
  await transaction(async () => {
    //this remove the old token for the device associated to other userId
    await clearTokenForDeviceExceptUser(user.id, deviceId);
    await updateFCMToken(user.id, deviceId, deviceType, deviceOS, fcmToken);
  });

  return true;
};

export default saveFCMToken;
