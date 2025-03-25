import {
  and,
  eq,
  like,
  or,
  type InferInsertModel,
  count,
  desc,
  inArray,
  sql,
} from 'drizzle-orm';
import { db, transaction } from '../database';
import { ContactTable, ProfileTable, UserTable, WebCardTable } from '../schema';
import { incrementShareBacksTotal } from './profileQueries';
import { incrementShareBacks } from './profileStatisticQueries';
import type { Contact, NewContact, Profile } from '../schema';

export type ContactRow = InferInsertModel<typeof ContactTable>;

export const getContactsByUser = async (
  userId: string,
  profileIds: string[],
) => {
  const res = await db()
    .select({ id: ContactTable.id, profileId: ContactTable.contactProfileId })
    .from(ContactTable)
    .innerJoin(
      ProfileTable,
      and(
        inArray(ContactTable.contactProfileId, profileIds),
        eq(ProfileTable.id, ContactTable.ownerProfileId),
      ),
    )
    .innerJoin(UserTable, eq(UserTable.id, ProfileTable.userId))
    .where(eq(UserTable.id, userId));

  return res;
};

export const getContactByProfiles = (profiles: {
  owner: string;
  contact: string;
}): Promise<Contact | null> => {
  return db()
    .select()
    .from(ContactTable)
    .where(
      and(
        eq(ContactTable.ownerProfileId, profiles.owner),
        eq(ContactTable.contactProfileId, profiles.contact),
      ),
    )
    .then(rows => rows[0] ?? null);
};

export const getWebcardsFromContactIds = (
  contactIds: string[],
): Promise<string[]> => {
  return db()
    .select({ id: WebCardTable.id })
    .from(WebCardTable)
    .innerJoin(ProfileTable, eq(WebCardTable.id, ProfileTable.webCardId))
    .innerJoin(ContactTable, eq(ContactTable.ownerProfileId, ProfileTable.id))
    .where(inArray(ContactTable.id, contactIds))
    .then(rows => rows.map(({ id }) => id));
};

/**
 * return a list of MediaIds linked to the contact (logoIds and avatarIds)
 *
 * @param contactIds a list of contacts ids
 * @returns a list of MediaIds
 */
export const getWebcardsMediaFromContactIds = (
  contactIds: string[],
): Promise<string[]> => {
  return db()
    .select({ logo: ContactTable.logoId, avatar: ContactTable.avatarId })
    .from(WebCardTable)
    .innerJoin(ProfileTable, eq(WebCardTable.id, ProfileTable.webCardId))
    .innerJoin(ContactTable, eq(ContactTable.ownerProfileId, ProfileTable.id))
    .where(inArray(ContactTable.id, contactIds))
    .then(rows => {
      return rows.reduce((acc, { logo, avatar }) => {
        if (logo) acc.push(logo);
        if (avatar) acc.push(avatar);
        return acc;
      }, [] as string[]);
    });
};

export const getContactCountPerOwner = async (profileIds: string[]) => {
  const res = await db()
    .select({
      ownerProfileId: ContactTable.ownerProfileId,
      count: count(),
    })
    .from(ContactTable)
    .where(
      and(
        inArray(ContactTable.ownerProfileId, profileIds),
        eq(ContactTable.deleted, false),
      ),
    )
    .groupBy(ContactTable.ownerProfileId);

  return res;
};

export const createContact = async (newContact: ContactRow) => {
  return db()
    .insert(ContactTable)
    .values(newContact)
    .$returningId()
    .then(res => res[0].id);
};

export const updateContact = async (
  id: string,
  values: Partial<Omit<Contact, 'id'>>,
) => {
  await db().update(ContactTable).set(values).where(eq(ContactTable.id, id));
};

/**
 * Save a shareBack
 *
 * @param newShareBack - The shareBack data to save
 */
export const saveShareBack = async (
  profileId: string,
  newContact: NewContact,
) => {
  const value: ContactRow = {
    ...newContact,
    addresses: newContact.addresses ?? [],
    ownerProfileId: profileId,
    type: 'shareback',
  };

  await transaction(async () => {
    await db().insert(ContactTable).values(value);
    await incrementShareBacksTotal(profileId);
    await incrementShareBacks(profileId, true);
  });
};

export const searchContacts = async (
  {
    limit,
    offset,
    ownerProfileId,
    name,
    orderBy,
  }: {
    limit: number;
    offset?: number;
    ownerProfileId: string;
    name?: string;
    orderBy: 'date' | 'location' | 'name';
  },
  withDeleted = false,
): Promise<Contact[]> => {
  const locationExpr = sql`
  COALESCE(
    NULLIF(JSON_UNQUOTE(meetingPlace->'$.city'), ''),
    NULLIF(JSON_UNQUOTE(meetingPlace->'$.subregion'), ''),
    NULLIF(JSON_UNQUOTE(meetingPlace->'$.region'), ''),
    NULLIF(JSON_UNQUOTE(meetingPlace->'$.country'), ''),
    ''
  )
`;

  const orders =
    orderBy === 'name'
      ? [ContactTable.firstName, ContactTable.lastName]
      : orderBy === 'location'
        ? [desc(locationExpr)]
        : [desc(ContactTable.createdAt)];

  const contacts = await db()
    .select()
    .from(ContactTable)
    .where(
      and(
        eq(ContactTable.ownerProfileId, ownerProfileId),
        withDeleted ? undefined : eq(ContactTable.deleted, false),
        name
          ? or(
              like(ContactTable.firstName, `%${name}%`),
              like(ContactTable.lastName, `%${name}%`),
              like(ContactTable.company, `%${name}%`),
            )
          : undefined,
        orderBy === 'location'
          ? sql`
        COALESCE(
          NULLIF(JSON_UNQUOTE(meetingPlace->'$.city'), ''),
          NULLIF(JSON_UNQUOTE(meetingPlace->'$.subregion'), ''),
          NULLIF(JSON_UNQUOTE(meetingPlace->'$.region'), ''),
          NULLIF(JSON_UNQUOTE(meetingPlace->'$.country'), '')
        ) IS NOT NULL
      `
          : undefined,
      ),
    )
    .orderBy(...orders)
    .limit(limit)
    .offset(offset ?? 0);

  return contacts;
};

export const searchContactsByWebcardId = async ({
  limit,
  offset,
  webcardId,
  search,
  ownerProfileId,
  withDeleted,
}: {
  webcardId: string;
  limit: number;
  search: string | null;
  offset?: number;
  ownerProfileId?: string | null;
  withDeleted?: boolean | null;
}): Promise<{ count: number; contacts: Contact[] }> => {
  const [counter, result] = await Promise.all([
    db()
      .select({ count: count() })
      .from(ContactTable)
      .innerJoin(ProfileTable, eq(ContactTable.ownerProfileId, ProfileTable.id))
      .innerJoin(WebCardTable, eq(ProfileTable.webCardId, WebCardTable.id))
      .where(
        and(
          eq(WebCardTable.id, webcardId),
          (ownerProfileId && eq(ContactTable.ownerProfileId, ownerProfileId)) ||
            undefined,
          (!withDeleted && eq(ContactTable.deleted, false)) || undefined,
          search
            ? or(
                like(ContactTable.firstName, `%${search}%`),
                like(ContactTable.lastName, `%${search}%`),
                like(ContactTable.company, `%${search}%`),
              )
            : undefined,
        ),
      ),
    db()
      .select({ contact: ContactTable })
      .from(ContactTable)
      .innerJoin(ProfileTable, eq(ContactTable.ownerProfileId, ProfileTable.id))
      .innerJoin(WebCardTable, eq(ProfileTable.webCardId, WebCardTable.id))
      .where(
        and(
          eq(WebCardTable.id, webcardId),
          (ownerProfileId && eq(ContactTable.ownerProfileId, ownerProfileId)) ||
            undefined,
          (!withDeleted && eq(ContactTable.deleted, false)) || undefined,
          search
            ? or(
                like(ContactTable.firstName, `%${search}%`),
                like(ContactTable.lastName, `%${search}%`),
                like(ContactTable.company, `%${search}%`),
              )
            : undefined,
        ),
      )
      .orderBy(ContactTable.firstName, ContactTable.lastName)
      .limit(limit)
      .offset(offset ?? 0),
  ]);

  return {
    count: counter[0].count,
    contacts: result.map(({ contact }) => contact),
  };
};

export const getAllOwnerProfilesByWebcardId = async (
  webcardId: string,
  withDeleted: boolean = false,
  ownerProfileId?: string | null,
): Promise<Profile[]> => {
  const result = await db()
    .selectDistinct({ ownerProfile: ProfileTable })
    .from(ContactTable)
    .innerJoin(ProfileTable, eq(ContactTable.ownerProfileId, ProfileTable.id))
    .where(
      and(
        ownerProfileId
          ? eq(ContactTable.ownerProfileId, ownerProfileId)
          : undefined,
        eq(ProfileTable.webCardId, webcardId),
        withDeleted ? undefined : eq(ContactTable.deleted, false),
      ),
    );

  return result.map(({ ownerProfile }) => ownerProfile);
};

export const getContactCountWithWebcardId = (
  webcardId: string,
  withDeleted: boolean = false,
  ownerProfileId?: string | null,
): Promise<number> => {
  return db()
    .select({ count: count() })
    .from(ContactTable)
    .innerJoin(ProfileTable, eq(ContactTable.ownerProfileId, ProfileTable.id))
    .innerJoin(WebCardTable, eq(ProfileTable.webCardId, WebCardTable.id))
    .where(
      and(
        ownerProfileId
          ? eq(ContactTable.ownerProfileId, ownerProfileId)
          : undefined,
        eq(WebCardTable.id, webcardId),
        eq(ContactTable.deleted, withDeleted),
      ),
    )

    .then(res => res[0].count || 0);
};

export const removeContacts = async (
  ownerProfileId: string,
  contactIds: string[],
) => {
  return db()
    .update(ContactTable)
    .set({
      deleted: true,
      deletedAt: new Date(),
    })
    .where(
      and(
        eq(ContactTable.ownerProfileId, ownerProfileId),
        inArray(ContactTable.id, contactIds),
      ),
    );
};

export const refreshContactsLastView = async (ownerProfileId: string) => {
  return db()
    .update(ProfileTable)
    .set({
      lastContactViewAt: new Date(),
    })
    .where(eq(ProfileTable.id, ownerProfileId));
};

export const removeContactsbyIds = async (contactIds: string[]) => {
  return db()
    .update(ContactTable)
    .set({
      deleted: true,
      deletedAt: new Date(),
    })
    .where(inArray(ContactTable.id, contactIds));
};
