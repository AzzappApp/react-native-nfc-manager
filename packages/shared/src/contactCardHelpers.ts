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
  birthday?: {
    birthday: string;
    selected: boolean;
  };
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
  const urls = [`azzapp,${buildUserUrl(username)}`];
  if (card?.urls)
    urls.push(
      ...card.urls.filter(url => url.selected).map(url => `,${url.address}`),
    );

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
    urls.join(';'),
    card?.addresses
      ?.filter(address => address.selected)
      .map(address => `${address.label},${address.address}`)
      .join(';'),
    card?.birthday?.selected ? card?.birthday.birthday : undefined,
    card?.socials
      ?.filter(social => social.selected)
      .map(social => social.social)
      .join(';'),
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
    addresses,
    birthday,
    socials,
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
    adresses:
      addresses?.split(';').map(addr => {
        const [label, address] = addr.split(',');
        return {
          label,
          address,
        };
      }) ?? [],
    birthday,
    socials: socials?.split(';'),
  };
};
