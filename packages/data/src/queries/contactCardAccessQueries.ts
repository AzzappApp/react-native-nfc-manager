import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../database';
import { ContactCardAccessTable, ProfileTable, UserTable } from '../schema';

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

/**
 *
 * @param deviceId is the id of the device
 * @param profileId is the id of the profile
 * @returns found contact card access
 */
export const getActiveContactCardAccesses = async (
  keys: Array<{ deviceId: string; profileId: string }>,
) => {
  if (keys.length === 0) {
    return [];
  }

  const deviceIds = [...new Set(keys.map(key => key.deviceId))];
  const profileIds = [...new Set(keys.map(key => key.profileId))];

  return db()
    .select()
    .from(ContactCardAccessTable)
    .where(
      and(
        inArray(ContactCardAccessTable.deviceId, deviceIds),
        inArray(ContactCardAccessTable.profileId, profileIds),
        eq(ContactCardAccessTable.isRevoked, false),
      ),
    );
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
  const inserted = await db()
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
    })
    .$returningId();

  // If the insert was successful without conflict, it will return the id of the inserted
  if (inserted.length > 0 && inserted[0]?.id) {
    return inserted[0].id;
  }

  // If there was a conflict, we need to fetch the existing id
  const existing = await db()
    .select({ id: ContactCardAccessTable.id })
    .from(ContactCardAccessTable)
    .where(
      and(
        eq(ContactCardAccessTable.deviceId, deviceId),
        eq(ContactCardAccessTable.profileId, profileId),
      ),
    )
    .limit(1);

  return existing[0].id;
};

export const updateContactCardAccessLastRead = async (id: string) => {
  return db()
    .update(ContactCardAccessTable)
    .set({
      lastReadAt: new Date(),
    })
    .where(eq(ContactCardAccessTable.id, id));
};

export const updateContactCardAccessHasGooglePass = async (
  contactCardAccessId: string,
  hasGooglePass: boolean,
) => {
  await db()
    .update(ContactCardAccessTable)
    .set({ hasGooglePass })
    .where(eq(ContactCardAccessTable.id, contactCardAccessId));
};

export const getContactCardAccessForProfile = async (profileId: string) => {
  return db()
    .select({ contact: ContactCardAccessTable })
    .from(ContactCardAccessTable)
    .innerJoin(
      ProfileTable,
      eq(ProfileTable.id, ContactCardAccessTable.profileId),
    )
    .where(
      and(
        eq(ContactCardAccessTable.profileId, profileId),
        eq(ContactCardAccessTable.isRevoked, false),
      ),
    )
    .then(result => result.map(r => r.contact));
};

export const getContactCardAccessWithHasGooglePass = async (
  webCardId: string,
) => {
  return db()
    .select({
      contactCardAccessId: ContactCardAccessTable.id,
      userLocale: UserTable.locale,
    })
    .from(ContactCardAccessTable)
    .innerJoin(
      ProfileTable,
      eq(ProfileTable.id, ContactCardAccessTable.profileId),
    )
    .innerJoin(UserTable, eq(UserTable.id, ProfileTable.userId))
    .where(
      and(
        eq(ProfileTable.webCardId, webCardId),
        eq(ContactCardAccessTable.hasGooglePass, true),
        eq(ContactCardAccessTable.isRevoked, false),
      ),
    );
};
