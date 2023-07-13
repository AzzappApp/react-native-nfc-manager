import { eq, type InferModel } from 'drizzle-orm';
import {
  varchar,
  customType,
  mysqlTable,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- see https://github.com/drizzle-team/drizzle-orm/issues/656
  MySqlTableWithColumns as _unused,
  datetime,
} from 'drizzle-orm/mysql-core';
import db, {
  DEFAULT_DATETIME_PRECISION,
  DEFAULT_DATETIME_VALUE,
  DEFAULT_VARCHAR_LENGTH,
} from './db';
import { customTinyInt } from './generic';
import type { Profile } from './profiles';
import type { User } from './users';

type phoneNumber = {
  number: string;
  label: string;
  selected: boolean;
};

type email = {
  address: string;
  label: string;
  selected: boolean;
};

export const ContactCardTable = mysqlTable('ContactCard', {
  firstName: varchar('firstName', { length: DEFAULT_VARCHAR_LENGTH }),
  lastName: varchar('lastName', { length: DEFAULT_VARCHAR_LENGTH }),
  title: varchar('title', { length: DEFAULT_VARCHAR_LENGTH }),
  company: varchar('company', { length: DEFAULT_VARCHAR_LENGTH }),
  emails: customType<{
    data: email[] | null;
  }>({
    toDriver: value => JSON.stringify(value),
    fromDriver: value => value as email[] | null,
    dataType: () => 'json',
  })('emails'),
  phoneNumbers: customType<{ data: phoneNumber[] | null }>({
    toDriver: value => JSON.stringify(value),
    fromDriver: value => value as phoneNumber[] | null,
    dataType: () => 'json',
  })('phoneNumbers'),
  profileId: varchar('profileId', {
    length: DEFAULT_VARCHAR_LENGTH,
  })
    .primaryKey()
    .notNull(),
  public: customTinyInt('public').default(false),
  isDisplayedOnWebCard: customTinyInt('isDisplayedOnWebCard').default(false),
  backgroundStyle: customType<{ data: { backgroundColor?: string } }>({
    toDriver: value => JSON.stringify(value),
    fromDriver: value => value as { backgroundColor?: string },
    dataType: () => 'json',
  })('backgroundStyle').default({
    backgroundColor: '#000000',
  }),
  updatedAt: datetime('updatedAt', {
    mode: 'date',
    fsp: DEFAULT_DATETIME_PRECISION,
  })
    .default(DEFAULT_DATETIME_VALUE)
    .notNull(),
});

export type ContactCard = InferModel<typeof ContactCardTable>;
export type NewContactCard = InferModel<typeof ContactCardTable, 'insert'>;

/**
 * Insert a new contact card.
 * @param contactCard is the contact card to create
 * @returns insert result
 */
export const createContactCard = async (contactCard: NewContactCard) => {
  return db.insert(ContactCardTable).values(contactCard);
};

export const updateContactCard = async (contactCard: ContactCard) => {
  return db
    .update(ContactCardTable)
    .set(contactCard)
    .where(eq(ContactCardTable.profileId, contactCard.profileId));
};

/**
 * Get associated contact card for a profile.
 * @param profileId is the id of the profile
 * @returns found contact card or null
 */
export const getContactCard = async (profileId: string) => {
  return db
    .select()
    .from(ContactCardTable)
    .where(eq(ContactCardTable.profileId, profileId))
    .then(res => res.pop() ?? null);
};

export const buildDefaultContactCard = (
  profile: Profile,
  user?: User | null,
) => {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    company: profile.companyName,
    profileId: profile.id,
    title: null,
    emails: user?.email
      ? [
          {
            address: user.email,
            label: 'Home',
            selected: true,
          },
        ]
      : null,
    phoneNumbers: user?.phoneNumber
      ? [
          {
            number: user.phoneNumber,
            label: 'Home',
            selected: true,
          },
        ]
      : null,
    public: false,
    isDisplayedOnWebCard: false,
    backgroundStyle: {
      backgroundColor: '#000000',
    },
    updatedAt: profile.updatedAt,
  };
};
