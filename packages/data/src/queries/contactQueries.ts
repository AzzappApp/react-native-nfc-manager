import { and, eq, like, or, type InferInsertModel, count } from 'drizzle-orm';
import { db } from '../database';
import { ContactTable } from '../schema';
import type { Contact } from '../schema';

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
    .where(eq(ContactTable.ownerProfileId, profileId))
    .then(res => res[0].count || 0);
};

export const createContact = async (
  newContact: InferInsertModel<typeof ContactTable>,
) => {
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

export const searchContacts = async (
  {
    limit,
    offset,
    ownerProfileId,
    name,
  }: {
    limit: number;
    offset?: number;
    ownerProfileId: string;
    name?: string;
  },
  withDeleted = false,
): Promise<{ count: number; contacts: Contact[] }> => {
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
      .orderBy(ContactTable.firstName, ContactTable.lastName)
      .limit(limit)
      .offset(offset ?? 0),
  ]);

  return {
    count: counter[0].count,
    contacts,
  };
};

export const removeContact = async ({
  owner,
  contact,
}: {
  owner: string;
  contact: string;
}) => {
  return db()
    .update(ContactTable)
    .set({
      deleted: true,
      deletedAt: new Date(),
    })
    .where(
      and(
        eq(ContactTable.ownerProfileId, owner),
        eq(ContactTable.contactProfileId, contact),
      ),
    );
};
