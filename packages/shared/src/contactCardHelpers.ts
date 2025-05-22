import { csv2json } from 'csv42';
import type { SocialLinkId } from './socialLinkHelpers';
import type { VCardAdditionnalData } from './vCardHelpers';

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
    label: SocialLinkId;
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
    label: SocialLinkId;
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

export const parseContactCardWithAdditionalData = (
  contactCardData: string,
  additionalData?: VCardAdditionnalData,
): ContactCard => {
  const data = csv2json<{
    [key: string]: ParsedContactCard;
  }>(contactCardData, { header: false });

  const [
    [
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _profileId,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _webCardId,
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
    firstName: firstName || null,
    lastName: lastName || null,
    company: company || null,
    title: title || null,
    phoneNumbers: phoneNumbers
      ? phoneNumbers.map(([label, number]) => ({
          label,
          number,
        }))
      : null,
    emails: emails
      ? emails.map(([label, address]) => ({
          label,
          address,
        }))
      : null,
    addresses: addresses
      ? addresses.map(([label, address]) => ({
          label,
          address,
        }))
      : null,
    birthday: birthday
      ? {
          birthday,
        }
      : null,
    // Merge additional data
    urls: additionalData?.urls || null,
    socials: additionalData?.socials || null,
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

export const buildVCardFileName = (
  webCardUserName: string,
  contact?: {
    firstName?: string | null;
    lastName?: string | null;
    company?: string | null;
  },
): string => {
  let vCardFileName = [
    webCardUserName,
    contact?.firstName?.trim() || '',
    contact?.lastName?.trim() || '',
    contact?.company?.trim() || '',
  ]
    .filter(Boolean)
    .join('-');

  if (!vCardFileName) {
    vCardFileName = 'azzapp-contact';
  }

  return `${vCardFileName}.vcf`;
};

export const formatContactInitial = (
  firstName?: string | null,
  lastName?: string | null,
): string => {
  const firstInitial = firstName?.[0] || '';
  const lastInitial = lastName?.[0] || '';
  return `${firstInitial}${lastInitial}`;
};
