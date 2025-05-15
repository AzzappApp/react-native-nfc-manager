import { eq, ne, and, desc } from 'drizzle-orm';
import { db } from '../database';
import {
  ContactEnrichmentTable,
  type PublicProfile,
  type EnrichedContactFields,
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

export const getEnrichmentByContactId = async (contactId: string) => {
  return db()
    .select()
    .from(ContactEnrichmentTable)
    .where(
      and(
        eq(ContactEnrichmentTable.contactId, contactId),
        ne(ContactEnrichmentTable.approved, false),
      ),
    )
    .orderBy(desc(ContactEnrichmentTable.enrichedAt))
    .limit(1)
    .then(res => res[0]);
};
