import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../database';
import {
  ContactCardAccessTable,
  PassRegistrationTable,
  ProfileTable,
  type PassRegistration,
} from '../schema';

/**
 * Register a device for a pass
 * @param values are the values of the pass
 */
export const addPassRegistration = async (values: PassRegistration) => {
  await db()
    .insert(PassRegistrationTable)
    .values(values)
    .onDuplicateKeyUpdate({
      set: { createdAt: new Date(), pushToken: values.pushToken }, // update the createdAt field
    });
};

/**
 *
 * @param deviceIdentifier is the identifier of the device
 * @param passTypeIdentifier is the identifier of the pass
 * @param serial is the serial of the pass
 */
export const deletePassRegistration = async (
  deviceIdentifier: string,
  passTypeIdentifier: string,
  serial: string,
) => {
  await db()
    .delete(PassRegistrationTable)
    .where(
      and(
        eq(PassRegistrationTable.deviceIdentifier, deviceIdentifier),
        eq(PassRegistrationTable.passTypeIdentifier, passTypeIdentifier),
        eq(PassRegistrationTable.serial, serial),
      ),
    );
};

export const getSerialsForDevice = async (
  deviceIdentifier: string,
  passTypeIdentifier: string,
) => {
  return db()
    .select({
      serial: PassRegistrationTable.serial,
    })
    .from(PassRegistrationTable)
    .where(
      and(
        eq(PassRegistrationTable.deviceIdentifier, deviceIdentifier),
        eq(PassRegistrationTable.passTypeIdentifier, passTypeIdentifier),
      ),
    );
};

/**
 *
 * @param deviceIdentifier is the identifier of the device
 * @param passTypeIdentifier is the identifier of the pass
 * @param serial is the serial of the pass
 * @returns found pass registration
 */
export const getPassRegistration = async (
  deviceIdentifier: string,
  passTypeIdentifier: string,
  serial: string,
) => {
  return db()
    .select()
    .from(PassRegistrationTable)
    .where(
      and(
        eq(PassRegistrationTable.deviceIdentifier, deviceIdentifier),
        eq(PassRegistrationTable.passTypeIdentifier, passTypeIdentifier),
        eq(PassRegistrationTable.serial, serial),
      ),
    )
    .then(res => res[0]);
};

export const getPushTokens = async (serial: string[]) =>
  db()
    .selectDistinct({
      pushToken: PassRegistrationTable.pushToken,
    })
    .from(PassRegistrationTable)
    .where(inArray(PassRegistrationTable.serial, serial))
    .then(res => res.map(r => r.pushToken));

export const getPushTokensFromWebCardId = async (webCardId: string) => {
  const [tokensFromProfile, tokensFromContactCardAccess] = await Promise.all([
    db()
      .selectDistinct({ pushToken: PassRegistrationTable.pushToken })
      .from(PassRegistrationTable)
      .innerJoin(
        ProfileTable,
        eq(ProfileTable.id, PassRegistrationTable.serial),
      )
      .where(eq(ProfileTable.webCardId, webCardId)), // legacy passes
    db()
      .selectDistinct({ pushToken: PassRegistrationTable.pushToken })
      .from(PassRegistrationTable)
      .innerJoin(
        ContactCardAccessTable,
        eq(ContactCardAccessTable.profileId, PassRegistrationTable.serial),
      )
      .innerJoin(
        ProfileTable,
        eq(ProfileTable.id, ContactCardAccessTable.profileId),
      )
      .where(
        and(
          eq(ProfileTable.webCardId, webCardId),
          eq(ContactCardAccessTable.isRevoked, false),
        ),
      ),
  ]);

  return [...tokensFromProfile, ...tokensFromContactCardAccess].map(
    d => d.pushToken,
  );
};

export const deletePushToken = async (pushToken: string) =>
  db()
    .delete(PassRegistrationTable)
    .where(eq(PassRegistrationTable.pushToken, pushToken));
