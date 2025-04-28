import { json2csv, csv2json } from 'csv42';

/**
 * A contact card
 */
export type CommonInformation = {
  company?: string | null;
  phoneNumbers?: Array<{
    label: string;
    number: string;
  }> | null;
  emails?: Array<{
    label: string;
    address: string;
  }> | null;
  urls?: Array<{
    address: string;
  }> | null;
  addresses?: Array<{
    label: string;
    address: string;
  }> | null;
  socials?: Array<{
    url: string;
    label: string;
  }> | null;
};

/**
 * A contact card
 */
export type ContactCard = {
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  title?: string | null;
  phoneNumbers?: Array<{
    label: string;
    number: string;
  }> | null;
  emails?: Array<{
    label: string;
    address: string;
  }> | null;
  urls?: Array<{
    address: string;
  }> | null;
  addresses?: Array<{
    label: string;
    address: string;
  }> | null;
  birthday?: {
    birthday: string;
  } | null;
  socials?: Array<{
    url: string;
    label: string;
  }> | null;
};

type ParsedContactCard = [
  string,
  string,
  string,
  string,
  string,
  string,
  Array<[string, string]>,
  Array<[string, string]>,
  Array<[string, string]>,
  string | undefined,
];

/**
 * Serializes a contact card to a string
 */
export const serializeContactCard = (
  profileId: string,
  webCardId: string,
  card: ContactCard | null,
  commonInformation?: CommonInformation | null,
) => {
  const serializedContactCard: ParsedContactCard = [
    profileId,
    webCardId,
    card?.firstName ?? '',
    card?.lastName ?? '',
    (commonInformation?.company || card?.company) ?? '',
    card?.title ?? '',
    (commonInformation?.phoneNumbers ?? [])
      .concat(card?.phoneNumbers ?? [])
      .map(({ label, number }) => [label, number]),
    (commonInformation?.emails ?? [])
      .concat(card?.emails ?? [])
      .map(({ label, address }) => [label, address]),
    (commonInformation?.addresses ?? [])
      .concat(card?.addresses ?? [])
      .map(({ label, address }) => [label, address]),
    card?.birthday?.birthday,
  ];

  return json2csv([serializedContactCard], { header: false });
};

/**
 * Parses a contact card from a string
 * @param contactCardData
 * @returns the parsed contact card
 */
export const parseContactCard = (contactCardData: string) => {
  const data = csv2json<{
    [key: string]: ParsedContactCard;
  }>(contactCardData, { header: false });

  const [
    [
      profileId,
      webCardId,
      firstName,
      lastName,
      company,
      title,
      phoneNumbers,
      emails,
      addresses,
      birthday,
    ],
  ] = Object.values(data[0]);

  return {
    profileId,
    webCardId,
    firstName,
    lastName,
    company,
    title,
    phoneNumbers,
    emails,
    addresses,
    birthday,
  };
};

export const AVATAR_MAX_WIDTH = 2048;
export const LOGO_MAX_WIDTH = 2048;

export const CONTACT_CARD_AVATAR_SIZES = [112, 224, 448];

export const CONTACT_CARD_LOGO_SIZES = [180, 360, 720];

export const displayName = (
  contact: {
    firstName?: string | null;
    lastName?: string | null;
    company?: string | null;
  },
  webCard: { userName?: string | null } | null,
) => {
  if (contact.firstName || contact.lastName) {
    return `${contact.firstName ?? ''}  ${contact.lastName ?? ''}`.trim();
  }

  if (contact.company) {
    return contact.company;
  }
  return webCard?.userName ?? '';
};
