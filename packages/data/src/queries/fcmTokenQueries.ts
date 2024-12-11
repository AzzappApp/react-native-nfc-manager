import { and, eq, ne } from 'drizzle-orm';
import { db } from '../database';
import { FCMTokenTable } from '../schema';

export const updateFCMToken = async (
  userId: string,
  deviceId: string,
  deviceType: string,
  deviceOS: string,
  fcmToken: string,
) => {
  const onDuplicateSet = {
    set: {
      deviceType,
      fcmToken,
      deviceOS,
      updatedAt: new Date(),
    },
  };

  await db()
    .insert(FCMTokenTable)
    .values({
      userId,
      deviceId,
      deviceType,
      fcmToken,
      deviceOS,
      updatedAt: new Date(),
    })
    .onDuplicateKeyUpdate(onDuplicateSet);
};

export const getFcmTokensForUserId = async (userId: string) => {
  return db()
    .select()
    .from(FCMTokenTable)
    .where(eq(FCMTokenTable.userId, userId));
};

export const deleteFCMToken = async (deviceId: string, userId: string) => {
  await db()
    .delete(FCMTokenTable)
    .where(
      and(
        eq(FCMTokenTable.deviceId, deviceId),
        eq(FCMTokenTable.userId, userId),
      ),
    );
};

/*
 * Remove all FCM tokens for a device except the current user's token
 */
export const clearTokenForDeviceExceptUser = async (
  userId: string,
  deviceId: string,
) => {
  await db()
    .delete(FCMTokenTable)
    .where(
      and(
        eq(FCMTokenTable.deviceId, deviceId),
        ne(FCMTokenTable.userId, userId),
      ),
    );
};
