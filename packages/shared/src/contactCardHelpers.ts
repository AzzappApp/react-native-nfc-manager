import { buildUserUrl } from './urlHelpers';

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
    selected: boolean;
  }> | null;
  emails?: Array<{
    label: string;
    address: string;
    selected: boolean;
  }> | null;
  urls?: Array<{
    address: string;
    selected: boolean;
  }> | null;
  addresses?: Array<{
    label: string;
    address: string;
    selected: boolean;
  }> | null;
  birthdays?: Array<{
    birthday: string;
    selected: boolean;
  }> | null;
  socials?: Array<{
    social: string;
    selected: boolean;
  }> | null;
};

/**
 * Serializes a contact card to a string
 */
export const serializeContactCard = (
  username: string,
  profileId: string,
  card: ContactCard | null,
) => {
  const serializedContactCard = [
    profileId,
    card?.firstName ?? '',
    card?.lastName ?? '',
    card?.company ?? '',
    card?.title ?? '',
    card?.phoneNumbers
      ?.filter(p => p.selected)
      .map(p => `${p.label},${p.number}`)
      .join(';') ?? '',
    card?.emails
      ?.filter(e => e.selected)
      .map(e => `${e.label},${e.address}`)
      .join(';') ?? '',
    `azzapp,${buildUserUrl(username)}`,
  ].join('|');

  return serializedContactCard;
};

/**
 * Parses a contact card from a string
 * @param contactCardData
 * @returns the parsed contact card
 */
export const parseContactCard = (contactCardData: string) => {
  const [
    profileId,
    firstName,
    lastName,
    company,
    title,
    phoneNumbers,
    emails,
    urls,
  ] = contactCardData.split('|');

  return {
    profileId: profileId || '',
    firstName: firstName || '',
    lastName: lastName || '',
    company: company || '',
    title: title || '',
    phones:
      phoneNumbers?.split(';').map(phone => {
        const [label, number] = phone.split(',');
        return {
          label,
          number,
        };
      }) ?? [],
    emails:
      emails?.split(';').map(email => {
        const [label, address] = email.split(',');
        return {
          label,
          email: address,
        };
      }) ?? [],
    urls:
      urls?.split(';').map(url => {
        const [label, address] = url.split(',');
        return {
          label,
          url: address,
        };
      }) ?? [],
  };
};
