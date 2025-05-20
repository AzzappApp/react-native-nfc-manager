import {
  and,
  eq,
  like,
  or,
  count,
  desc,
  inArray,
  sql,
  gte,
  lte,
  gt,
} from 'drizzle-orm';
import { db, transaction } from '../database';
import {
  ContactEnrichmentTable,
  ContactTable,
  ProfileTable,
  UserTable,
  WebCardTable,
} from '../schema';
import { incrementShareBacksTotal } from './profileQueries';
import { incrementShareBacks } from './profileStatisticQueries';
import type { Contact, NewContact, Profile } from '../schema';
import type { InferInsertModel, SQL } from 'drizzle-orm';

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
    filterBy,
  }: {
    limit: number;
    offset?: number;
    ownerProfileId: string;
    name?: string;
    orderBy: 'date' | 'location' | 'name';
    filterBy?: {
      value: string;
      type: 'location';
    } | null;
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
      ? [
          sql`COALESCE(       
            NULLIF(${ContactTable.lastName}, ''),
            NULLIF(${ContactTable.firstName}, ''),    
            NULLIF(${ContactTable.company}, ''),
            ''
          )`,
        ]
      : orderBy === 'location'
        ? [desc(locationExpr), desc(ContactTable.meetingDate)]
        : [desc(ContactTable.meetingDate)];

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
        filterBy
          ? sql`
       COALESCE(
         NULLIF(JSON_UNQUOTE(meetingPlace->'$.city'), ''),
         NULLIF(JSON_UNQUOTE(meetingPlace->'$.subregion'), ''),
         NULLIF(JSON_UNQUOTE(meetingPlace->'$.region'), ''),
         NULLIF(JSON_UNQUOTE(meetingPlace->'$.country'), '')
       ) = ${filterBy.value}`
          : undefined,
      ),
    )
    .orderBy(...orders)
    .limit(limit)
    .offset(offset ?? 0);

  return contacts;
};

/**
 * Return the number of contacts for all the profiles of a user
 *
 * @param userId  - The user's ID
 * @returns  The number of contacts for all the profiles of the user
 */
export const getUserContactsCount = async (userId: string): Promise<number> => {
  const res = await db()
    .select({ count: count() })
    .from(ContactTable)
    .innerJoin(ProfileTable, eq(ContactTable.ownerProfileId, ProfileTable.id))
    .where(
      and(eq(ProfileTable.userId, userId), eq(ContactTable.deleted, false)),
    )
    .then(rows => rows[0].count);
  return res;
};

const SEPARATOR = '\u0001';
/**
 * Get a user's profiles contacts
 * @param userId - The user's ID
 * @param orderBy - The order by field ('date' or 'name')
 * @param search - The search term to filter contacts by name
 * @param after - The cursor for pagination
 * @param limit - The maximum number of contacts to return
 * @returns An object containing the contacts and a boolean indicating if there are more contacts to fetch
 */
export const getUserContacts = async (
  userId: string,
  orderBy: 'date' | 'name',
  search?: string | null,
  location?: string | null,
  date?: Date | null,
  after?: string | null,
  limit = 50,
): Promise<{
  contactsWithCursor: Array<{
    contact: Contact;
    cursor: string;
  }>;
  hasMore: boolean;
}> => {
  // Cursor handling
  let afterClause: SQL | undefined = undefined;
  if (after) {
    const [
      afterLastName,
      afterFirstName,
      afterCompany,
      afterUserName,
      afterId,
    ] = after.split(SEPARATOR);
    if (afterId) {
      afterClause = sql`
        (
          COALESCE(${ContactTable.lastName}, ''), 
          COALESCE(${ContactTable.firstName}, ''), 
          COALESCE(${ContactTable.company}, ''), 
          COALESCE(${WebCardTable.userName}, ''), 
          ${ContactTable.id}
        ) > (
          ${afterLastName}, 
          ${afterFirstName}, 
          ${afterCompany}, 
          ${afterUserName}, 
          ${afterId}
        )
      `;
    }
  }

  // Build WHERE clause dynamically

  // Query the DB
  const data = await db()
    .select({
      Contact: ContactTable,
      WebCard: WebCardTable,
      cursorOrder: sql`COALESCE(       
        NULLIF(${ContactTable.lastName}, ''),
        NULLIF(${ContactTable.firstName}, ''),    
        NULLIF(${ContactTable.company}, ''),
        NULLIF(${WebCardTable.userName}, ''),
        ''
      )`.as('cursorOrder'),
    })
    .from(ContactTable)
    .innerJoin(ProfileTable, eq(ContactTable.ownerProfileId, ProfileTable.id))
    .leftJoin(WebCardTable, eq(ProfileTable.webCardId, WebCardTable.id))
    .where(
      and(
        eq(ProfileTable.userId, userId),
        eq(ContactTable.deleted, false),
        afterClause,
        search
          ? or(
              like(ContactTable.firstName, `%${search}%`),
              like(ContactTable.lastName, `%${search}%`),
              like(ContactTable.company, `%${search}%`),
              like(WebCardTable.userName, `%${search}%`),
            )
          : undefined,
        location
          ? eq(
              sql<string>`COALESCE(
                NULLIF(JSON_UNQUOTE(meetingPlace->'$.city'), ''),
                NULLIF(JSON_UNQUOTE(meetingPlace->'$.subregion'), ''),
                NULLIF(JSON_UNQUOTE(meetingPlace->'$.region'), ''),
                NULLIF(JSON_UNQUOTE(meetingPlace->'$.country'), ''),
                '\uFFFF' -- No location should be at the end
              )`,
              location,
            )
          : undefined,
        date
          ? eq(
              sql<string>`DATE(${ContactTable.meetingDate})`,
              sql<string>`DATE(${date})`,
            )
          : undefined,
      ),
    )
    .orderBy(
      ...[
        orderBy === 'date' ? desc(ContactTable.meetingDate) : undefined,
        sql`COALESCE(       
        NULLIF(${ContactTable.lastName}, ''),
        NULLIF(${ContactTable.firstName}, ''),    
        NULLIF(${ContactTable.company}, ''),
        NULLIF(${WebCardTable.userName}, ''),
        ''
      )`,
        sql`COALESCE(       
        NULLIF(${ContactTable.firstName}, ''),    
        NULLIF(${ContactTable.company}, ''),
        NULLIF(${WebCardTable.userName}, ''),
        ''
      )`,
        sql`COALESCE(       
        NULLIF(${ContactTable.company}, ''),
        NULLIF(${WebCardTable.userName}, ''),
        ''
      )`,
        sql`COALESCE(${WebCardTable.userName}, '')`,
        ContactTable.id,
      ].filter(val => val !== undefined),
    )
    .limit(limit + 1); // fetch one extra to check for hasMore

  const contactsWithCursor = data
    .slice(0, limit)
    .map(({ Contact: contact, WebCard: webCard }) => ({
      contact,
      cursor: [
        contact.lastName ?? '',
        contact.firstName ?? '',
        contact.company ?? '',
        webCard?.userName ?? '',
        contact.id,
      ].join(SEPARATOR),
    }));

  return {
    contactsWithCursor,
    hasMore: data.length > limit,
  };
};

/**
 * Get a user's profiles contacts grouped by meeting date
 *
 * @param userId - The user's ID
 * @param search - The search term to filter contacts by name
 * @param nbContactsByDate - The number of contacts to display per location
 * @param after - The cursor for pagination
 * @param limit - The maximum number of contacts to return
 * @returns An object containing the contacts grouped by date and a boolean indicating if there are more contacts to fetch
 */
export const getUserContactsGroupedByDate = async (
  userId: string,
  search?: string | null,
  nbContactsByDate = 5,
  after?: Date | null,
  limit = 50,
): Promise<{
  dates: Array<{
    date: Date;
    nbContacts: number;
    contacts: Contact[];
  }>;
  hasMore: boolean;
}> => {
  const whereConditions = [
    eq(ProfileTable.userId, userId),
    eq(ContactTable.deleted, false),
    search
      ? or(
          like(ContactTable.firstName, `%${search}%`),
          like(ContactTable.lastName, `%${search}%`),
          like(ContactTable.company, `%${search}%`),
        )
      : undefined,
  ].filter(Boolean);

  const dates = (
    await db()
      .selectDistinct({
        date: sql<string>`DATE(meetingDate)`.as('date'),
      })
      .from(ContactTable)
      .innerJoin(ProfileTable, eq(ContactTable.ownerProfileId, ProfileTable.id))
      .where(
        and(
          ...whereConditions,
          after ? sql`${ContactTable.meetingDate} < ${after}` : undefined,
        ),
      )
      .orderBy(sql`date DESC`)
      .limit(limit + 1)
  ).map(date => new Date(date.date));

  const hasMore = dates.length > limit;
  if (hasMore) {
    dates.pop();
  }

  let firstDate = dates.at(0) ?? null;
  firstDate = firstDate ? new Date(firstDate) : null;
  firstDate?.setHours(23, 59, 59, 999);
  const lastDate = dates.at(-1) ?? null;

  const data =
    firstDate && lastDate
      ? await db()
          .select()
          .from(ContactTable)
          .innerJoin(
            ProfileTable,
            eq(ContactTable.ownerProfileId, ProfileTable.id),
          )
          .where(
            and(
              ...whereConditions,
              gte(ContactTable.meetingDate, lastDate),
              lte(ContactTable.meetingDate, firstDate),
            ),
          )
      : [];
  const dateMap = new Map<string, Contact[]>();
  for (const { Contact: contact } of data) {
    const dateKey = contact.meetingDate.toISOString().split('T')[0];
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, []);
    }
    dateMap.get(dateKey)?.push(contact);
  }

  return {
    dates: dates.map(date => {
      const contacts = dateMap.get(date.toISOString().split('T')[0]) ?? [];
      return {
        date,
        nbContacts: contacts.length,
        contacts: contacts.splice(0, nbContactsByDate),
      };
    }),
    hasMore,
  };
};

/**
 * Get a user's profiles contacts grouped by meeting location
 *
 * @param userId - The user's ID
 * @param search - The search term to filter contacts by name
 * @param nbContactsByLocations - The number of contacts to display per location
 * @param after - The cursor for pagination
 * @param limit - The maximum number of contacts to return
 * @returns An object containing the contacts grouped by date and a boolean indicating if there are more contacts to fetch
 */
export const getUserContactsGroupedByLocation = async (
  userId: string,
  search?: string | null,
  nbContactsByLocations = 5,
  after?: string | null,
  limit = 50,
): Promise<{
  locations: Array<{
    location: string | null;
    nbContacts: number;
    contacts: Contact[];
  }>;
  hasMore: boolean;
}> => {
  const locationExpr = sql<string>`COALESCE(
    NULLIF(JSON_UNQUOTE(meetingPlace->'$.city'), ''),
    NULLIF(JSON_UNQUOTE(meetingPlace->'$.subregion'), ''),
    NULLIF(JSON_UNQUOTE(meetingPlace->'$.region'), ''),
    NULLIF(JSON_UNQUOTE(meetingPlace->'$.country'), ''),
    '\uFFFF' -- No location should be at the end
  )`;

  const whereConditions = [
    eq(ProfileTable.userId, userId),
    eq(ContactTable.deleted, false),
    search
      ? or(
          like(ContactTable.firstName, `%${search}%`),
          like(ContactTable.lastName, `%${search}%`),
          like(ContactTable.company, `%${search}%`),
        )
      : undefined,
  ].filter(Boolean);

  const locations = (
    await db()
      .selectDistinct({
        locationStr: locationExpr.as('locationStr'),
      })
      .from(ContactTable)
      .innerJoin(ProfileTable, eq(ContactTable.ownerProfileId, ProfileTable.id))
      .where(
        and(...whereConditions, after ? gt(locationExpr, after) : undefined),
      )
      .orderBy(sql<string>`locationStr`)
      .limit(limit + 1)
  ).map(({ locationStr }) => (locationStr === '\uFFFF' ? null : locationStr));

  const hasMore = locations.length > limit;
  if (hasMore) {
    locations.pop();
  }

  const data = locations.length
    ? await db()
        .select()
        .from(ContactTable)
        .innerJoin(
          ProfileTable,
          eq(ContactTable.ownerProfileId, ProfileTable.id),
        )
        .where(
          and(
            ...whereConditions,
            inArray(
              locationExpr,
              locations.map(location => location ?? '\uFFFF'),
            ),
          ),
        )
        .orderBy(desc(ContactTable.meetingDate))
    : [];

  const locationMap = new Map<string | null, Contact[]>();
  for (const { Contact: contact } of data) {
    const locationKey =
      [
        contact.meetingPlace?.city || null,
        contact.meetingPlace?.subregion || null,
        contact.meetingPlace?.region || null,
        contact.meetingPlace?.country || null,
      ]
        .filter(Boolean)
        .at(0) ?? null;
    if (!locationMap.has(locationKey)) {
      locationMap.set(locationKey, []);
    }
    locationMap.get(locationKey)?.push(contact);
  }

  return {
    locations: locations.map(location => {
      const contacts = locationMap.get(location) ?? [];
      return {
        location,
        nbContacts: contacts.length,
        contacts: contacts.splice(0, nbContactsByLocations),
      };
    }),
    hasMore,
  };
};

export const searchProfileContactByLocation = async (
  ownerProfileId: string,
  search?: string | null,
  after?: Date | null,
  limit = 50,
): Promise<{
  dates: Array<{
    date: Date;
    contacts: Contact[];
  }>;
  hasMore: boolean;
}> => {
  const whereConditions = [
    eq(ContactTable.ownerProfileId, ownerProfileId),
    eq(ContactTable.deleted, false),
    search
      ? or(
          like(ContactTable.firstName, `%${search}%`),
          like(ContactTable.lastName, `%${search}%`),
          like(ContactTable.company, `%${search}%`),
        )
      : undefined,
  ].filter(Boolean);

  const dates = (
    await db()
      .selectDistinct({
        date: sql<string>`DATE(meetingDate)`.as('date'),
      })
      .from(ContactTable)
      .where(
        and(
          ...whereConditions,
          after ? sql`${ContactTable.meetingDate} < ${after}` : undefined,
        ),
      )
      .orderBy(sql`date DESC`)
      .limit(limit + 1)
  ).map(date => new Date(date.date));

  const hasMore = dates.length > limit;
  if (hasMore) {
    dates.pop();
  }

  const firstDate = dates.at(0) ?? null;
  firstDate?.setHours(23, 59, 59, 999);
  const lastDate = dates.at(-1) ?? null;

  const contacts =
    firstDate && lastDate
      ? await db()
          .select()
          .from(ContactTable)
          .where(
            and(
              ...whereConditions,
              gte(ContactTable.meetingDate, lastDate),
              lte(ContactTable.meetingDate, firstDate),
            ),
          )
      : [];
  const dateMap = new Map<string, Contact[]>();
  for (const contact of contacts) {
    const dateKey = contact.meetingDate.toISOString().split('T')[0];
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, []);
    }
    dateMap.get(dateKey)?.push(contact);
  }

  return {
    dates: dates.map(date => ({
      date,
      contacts: dateMap.get(date.toISOString().split('T')[0]) ?? [],
    })),
    hasMore,
  };
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

export const removeContacts = async (contactIds: string[]) => {
  return db()
    .update(ContactTable)
    .set({
      deleted: true,
      deletedAt: new Date(),
    })
    .where(and(inArray(ContactTable.id, contactIds)));
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

export const getContactById = async (contactId: string) => {
  const res = await db()
    .select()
    .from(ContactTable)
    .where(eq(ContactTable.id, contactId))
    .then(rows => rows[0] ?? null);

  return res;
};

export const getProfileByContactEnrichmentId = async (
  enrichmentId: string,
): Promise<Profile | null> => {
  const res = await db()
    .select({ profile: ProfileTable })
    .from(ContactEnrichmentTable)
    .innerJoin(
      ContactTable,
      eq(ContactTable.id, ContactEnrichmentTable.contactId),
    )
    .innerJoin(ProfileTable, eq(ContactTable.ownerProfileId, ProfileTable.id))
    .where(eq(ContactEnrichmentTable.id, enrichmentId))
    .then(rows => rows[0]?.profile ?? null);

  return res;
};
