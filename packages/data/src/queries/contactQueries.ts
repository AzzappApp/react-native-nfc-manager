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
import { ContactTable } from '../schema';
import { incrementShareBacksTotal } from './profileQueries';
import { incrementShareBacks } from './profileStatisticQueries';
import type { Contact } from '../schema';

export type ContactRow = InferInsertModel<typeof ContactTable>;

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
    deviceIds: [],
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
): Promise<{ count: number; contacts: Contact[] }> => {
  const orders =
    orderBy === 'name'
      ? [ContactTable.firstName, ContactTable.lastName]
      : [desc(ContactTable.createdAt)];

  const [counter, contacts] = await Promise.all([
    db()
      .select({ count: count() })
      .from(ContactTable)
      .where(
        and(
          eq(ContactTable.ownerProfileId, ownerProfileId),
          name
            ? or(
                like(ContactTable.firstName, `%${name}%`),
                like(ContactTable.lastName, `%${name}%`),
              )
            : undefined,
        ),
      ),
    db()
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
      .offset(offset ?? 0),
  ]);

  return {
    count: counter[0].count,
    contacts,
  };
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
