import { and, eq } from 'drizzle-orm';
import { db } from '../database';
import {
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

export const getPushTokens = async (serial: string) =>
  db()
    .selectDistinct({
      pushToken: PassRegistrationTable.pushToken,
    })
    .from(PassRegistrationTable)
    .where(eq(PassRegistrationTable.serial, serial))
    .then(res => res.map(r => r.pushToken));

export const getPushTokensFromWebCardId = async (webCardId: string) =>
  db()
    .selectDistinct({ pushToken: PassRegistrationTable.pushToken })
    .from(PassRegistrationTable)
    .innerJoin(ProfileTable, eq(ProfileTable.id, PassRegistrationTable.serial))
    .where(eq(ProfileTable.webCardId, webCardId))
    .then(res => res.map(r => r.pushToken));

export const deletePushToken = async (pushToken: string) =>
  db()
    .delete(PassRegistrationTable)
    .where(eq(PassRegistrationTable.pushToken, pushToken));
