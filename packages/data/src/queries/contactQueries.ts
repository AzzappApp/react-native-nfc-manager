import { and, eq, type InferInsertModel } from 'drizzle-orm';
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
