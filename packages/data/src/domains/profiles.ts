import { createId } from '@paralleldrive/cuid2';
import { sql } from 'kysely';
import ERRORS from '@azzapp/shared/errors';
import db from './db';
import { getEntitiesByIds, sqlCountToNumber } from './generic';
import type { Profile } from '@prisma/client';

/**
 * Retrieves a list of profiles by their ids.
 * @param ids - The ids of the profiles to retrieve
 * @returns A list of profiles, where the order of the profiles matches the order of the ids
 */
export const getProfilesByIds = (
  ids: readonly string[],
): Promise<Array<Profile | null>> => getEntitiesByIds('Profile', ids);

/**
 * Retrieves a list of associated to an user
 * @param id - The id of the user
 * @returns The list of profiles associated to the user
 */
export const getUserProfiles = (userId: string): Promise<Profile[]> =>
  db
    .selectFrom('Profile')
    .selectAll()
    .where('userId', '=', userId)
    .orderBy('userName')
    .execute();

/**
 * Retrieves a profile by their profilename
 *
 * @param profileName - The profilename of the profile to retrieve
 * @returns - The profile if found, otherwise null
 */
export const getProfileByUserName = async (
  profileName: string,
): Promise<Profile | null> => {
  const profile = await db
    .selectFrom('Profile')
    .selectAll()
    .where('userName', '=', profileName)
    .executeTakeFirst();

  return profile ?? null;
};

/**
 * Retrieves all profiles with a card
 * @param limit - The maximum number of profiles to retrieve
 * @param offset - The number of profiles to skip
 * @param excludedProfilesIds - The ids of the profiles to exclude from the result
 * @returns A list of profiles
 */
export const getAllProfilesWithCard = async (
  limit: number,
  offset: number,
  excludedProfilesIds: string[] | null | undefined,
): Promise<Profile[]> => {
  let query = db
    .selectFrom('Profile')
    .selectAll()
    .whereExists(
      sql`(select Card.id from Card where Profile.id = Card.profileId)`,
    );

  if (excludedProfilesIds?.length) {
    query = query.where('Profile.id', 'not in', excludedProfilesIds);
  }

  return query.limit(limit).offset(offset).execute();
};

/**
 * Retrieves the number of profiles with a card
 *
 * @returns The number of profiles with a card
 */
export const getAllProfilesWithCardCount = async (): Promise<number> =>
  db
    .selectFrom('Profile')
    .select(db.fn.count('id').as('nbProfiles'))
    .whereExists(
      sql`(select Card.id from Card where Profile.id = Card.profileId)`,
    )
    .executeTakeFirstOrThrow()
    .then(({ nbProfiles }) => sqlCountToNumber(nbProfiles));

/**
 * Retrieve the list of profiles a profile is following
 * @param profileId - The id of the profile
 * @returns A list of users
 */
export const getFollowedProfiles = async (
  profileId: string,
): Promise<Profile[]> =>
  db
    .selectFrom('Profile')
    .selectAll()
    .innerJoin('Follow', 'Profile.id', 'Follow.followingId')
    .whereExists(
      sql`(select Card.id from Card where Profile.id = Card.profileId)`,
    )
    .where('Follow.followerId', '=', profileId)
    .execute();

/**
 * Retrieve the number of profiles a profile is following
 * @param profileId - The id of the profile
 * @returns the number of profiles a profile is following
 */
export const getFollowedProfilesCount = async (
  profileId: string,
): Promise<number> =>
  db
    .selectFrom('Profile')
    .select(db.fn.countAll<number>().as('count'))
    .innerJoin('Follow', 'Profile.id', 'Follow.followingId')
    .where('Follow.followerId', '=', profileId)
    .executeTakeFirstOrThrow()
    .then(({ count }) => count);

/**
 * Retrieve the number of profiles a profile is being followed
 * @param profileId - The id of the profile
 * @returns the number of profiles a profile is being followed
 */
export const getFollowerProfilesCount = async (
  profileId: string,
): Promise<number> =>
  db
    .selectFrom('Profile')
    .select(db.fn.countAll<number>().as('count'))
    .innerJoin('Follow', 'Profile.id', 'Follow.followerId')
    .where('Follow.followingId', '=', profileId)
    .executeTakeFirstOrThrow()
    .then(({ count }) => count);

/**
 * Create a new profile
 * @param data - The profiles fields, excluding the id
 * @returns The newly created profile
 */
export const createProfile = async (
  data: Omit<Profile, 'createdAt' | 'id' | 'updatedAt'>,
): Promise<Profile> => {
  const profile = {
    id: createId(),
    updatedAt: new Date(),
    ...data,
  };
  await db.insertInto('Profile').values(profile).execute();
  return { ...profile, createdAt: new Date() };
};

export const updateProfile = async (
  profileId: string,
  data: Partial<Omit<Profile, 'createdAt' | 'id' | 'updatedAt'>>,
): Promise<Partial<Profile>> => {
  const profile = {
    updatedAt: new Date(),
    ...data,
  };
  const result = await db
    .updateTable('Profile')
    .set(profile)
    .where('id', '=', profileId)
    .execute();
  if (result.length > 0) {
    return profile;
  } else {
    throw new Error(ERRORS.USER_NOT_FOUND);
  }
};
