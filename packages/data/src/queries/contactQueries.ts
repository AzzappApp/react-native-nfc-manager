import {
  and,
  eq,
  like,
  or,
  type InferInsertModel,
  count,
  desc,
  inArray,
} from 'drizzle-orm';
import { db, transaction } from '../database';
import { ContactTable, ProfileTable, UserTable, WebCardTable } from '../schema';
import { incrementShareBacksTotal } from './profileQueries';
import { incrementShareBacks } from './profileStatisticQueries';
import type { Contact, Profile } from '../schema';

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

export const getContactCount = (profileId: string): Promise<number> => {
  return db()
    .select({ count: count() })
    .from(ContactTable)
    .where(
      and(
        eq(ContactTable.ownerProfileId, profileId),
        eq(ContactTable.deleted, false),
      ),
    )
    .then(res => res[0].count || 0);
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

export type NewSharedContact = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  title: string;
};
/**
 * Save a shareBack
 *
 * @param newShareBack - The shareBack data to save
 */
export const saveShareBack = async (
  profileId: string,
  newContact: NewSharedContact,
) => {
  const value: ContactRow = {
    firstName: newContact.firstName,
    lastName: newContact.lastName,
    ownerProfileId: profileId,
    phoneNumbers: [{ label: 'Home', number: newContact.phone }],
    emails: [{ label: 'Main', address: newContact.email }],
    addresses: [],
    company: newContact.company,
    title: newContact.title,
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
    orderBy: 'date' | 'name';
  },
  withDeleted = false,
): Promise<Contact[]> => {
  const orders =
    orderBy === 'name'
      ? [ContactTable.firstName, ContactTable.lastName]
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
            )
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

export const removeContactsbyIds = async (contactIds: string[]) => {
  return db()
    .update(ContactTable)
    .set({
      deleted: true,
      deletedAt: new Date(),
    })
    .where(inArray(ContactTable.id, contactIds));
};
