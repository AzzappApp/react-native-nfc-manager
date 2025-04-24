import { and, eq } from 'drizzle-orm';
import { db } from '../database';
import { ContactCardAccessTable } from '../schema';

/**
 *
 * @param deviceId is the id of the device
 * @param profileId is the id of the profile
 * @returns found contact card access
 */
export const getActiveContactCardAccess = async (
  deviceId: string,
  profileId: string,
) => {
  return db()
    .select()
    .from(ContactCardAccessTable)
    .where(
      and(
        eq(ContactCardAccessTable.deviceId, deviceId),
        eq(ContactCardAccessTable.profileId, profileId),
        eq(ContactCardAccessTable.isRevoked, false),
      ),
    )
    .then(result => result.pop());
};

export const getContactCardAccessById = async (id: string) => {
  return db()
    .select()
    .from(ContactCardAccessTable)
    .where(eq(ContactCardAccessTable.id, id))
    .then(result => result.pop());
};

export const saveOrUpdateContactCardAccess = async (
  deviceId: string,
  profileId: string,
  signature: string,
) => {
  return db()
    .insert(ContactCardAccessTable)
    .values({
      deviceId,
      profileId,
      signature,
    })
    .onDuplicateKeyUpdate({
      set: {
        signature,
        createdAt: new Date(),
      },
    });
};

export const updateContactCardAccessLastRead = async (id: string) => {
  return db()
    .update(ContactCardAccessTable)
    .set({
      lastReadAt: new Date(),
    })
    .where(eq(ContactCardAccessTable.id, id));
};
