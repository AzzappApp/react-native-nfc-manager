import { eq, or, and, desc, isNull } from 'drizzle-orm';
import { db } from '../database';
import {
  ContactEnrichmentTable,
  type PublicProfile,
  type EnrichedContactFields,
  type ContactEnrichment,
} from '../schema';

export const saveContactEnrichment = async (data: {
  contactId: string;
  fields: EnrichedContactFields;
  publicProfile?: PublicProfile;
  trace: Record<string, string>;
}) => {
  return db()
    .insert(ContactEnrichmentTable)
    .values(data)
    .$returningId()
    .then(res => res[0].id);
};

export const updateContactEnrichment = async (
  contactEnrichmentId: string,
  data: Partial<ContactEnrichment>,
) => {
  return db()
    .update(ContactEnrichmentTable)
    .set(data)
    .where(eq(ContactEnrichmentTable.id, contactEnrichmentId));
};

export const getContactEnrichmentByContactId = async (contactId: string) => {
  return db()
    .select()
    .from(ContactEnrichmentTable)
    .where(
      and(
        eq(ContactEnrichmentTable.contactId, contactId),
        or(
          isNull(ContactEnrichmentTable.approved),
          eq(ContactEnrichmentTable.approved, true),
        ),
      ),
    )
    .orderBy(desc(ContactEnrichmentTable.enrichedAt))
    .limit(1)
    .then(res => res[0]);
};

export const getContactEnrichmentById = async (id: string) => {
  return db()
    .select()
    .from(ContactEnrichmentTable)
    .where(eq(ContactEnrichmentTable.id, id))
    .then(res => res[0]);
};
