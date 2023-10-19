import { json2csv, csv2json } from 'csv42';

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

type ParsedContactCard = [
  string,
  string,
  string,
  string,
  string,
  Array<[string, string]>,
  Array<[string, string]>,
  Array<[string, string]>,
  Array<[string, string]>,
  string | undefined,
  string[],
];

/**
 * Serializes a contact card to a string
 */
export const serializeContactCard = (
  username: string,
  profileId: string,
  card: ContactCard | null,
) => {
  const urls: Array<[string, string]> = [['azzapp', buildUserUrl(username)]];
  if (card?.urls)
    urls.push(
      ...card.urls
        .filter(url => url.selected)
        .map(({ address }) => ['', address] as [string, string]),
    );

  const serializedContactCard: ParsedContactCard = [
    profileId,
    card?.firstName ?? '',
    card?.lastName ?? '',
    card?.company ?? '',
    card?.title ?? '',
    card?.phoneNumbers
      ?.filter(p => p.selected)
      .map(({ label, number }) => [label, number]) ?? [],
    card?.emails
      ?.filter(e => e.selected)
      .map(({ label, address }) => [label, address]) ?? [],
    urls,
    card?.addresses
      ?.filter(address => address.selected)
      .map(({ label, address }) => [label, address]) ?? [],
    card?.birthday?.selected ? card?.birthday.birthday : undefined,
    card?.socials
      ?.filter(social => social.selected)
      .map(social => social.social) ?? [],
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
    ],
  ] = Object.values(data[0]);

  return {
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
  };
};
