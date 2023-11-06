import { json2csv, csv2json } from 'csv42';

import { buildUserUrl } from './urlHelpers';

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
    selected?: boolean | null;
  }> | null;
  emails?: Array<{
    label: string;
    address: string;
    selected?: boolean | null;
  }> | null;
  urls?: Array<{
    address: string;
    selected?: boolean | null;
  }> | null;
  addresses?: Array<{
    label: string;
    address: string;
    selected?: boolean | null;
  }> | null;
  birthday?: {
    birthday: string;
    selected?: boolean | null;
  };
  socials?: Array<{
    url: string;
    label: string;
    selected?: boolean | null;
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
  Array<[string, string]>,
  string | undefined,
  Array<[string, string]>,
];

/**
 * Serializes a contact card to a string
 */
export const serializeContactCard = (
  username: string,
  profileId: string,
  webCardId: string,
  card: ContactCard | null,
  commonInformation?: CommonInformation | null,
) => {
  const urls: Array<[string, string]> = [['azzapp', buildUserUrl(username)]];
  if (card?.urls) {
    urls.push(
      ...(commonInformation?.urls ?? [])
        .concat(card.urls.filter(url => url.selected) ?? [])
        .map(({ address }) => ['', address] as [string, string]),
    );
  }

  const serializedContactCard: ParsedContactCard = [
    profileId,
    webCardId,
    card?.firstName ?? '',
    card?.lastName ?? '',
    commonInformation?.company ?? card?.company ?? '',
    card?.title ?? '',
    (commonInformation?.phoneNumbers ?? [])
      .concat(card?.phoneNumbers?.filter(p => p.selected) ?? [])
      .map(({ label, number }) => [label, number]),
    (commonInformation?.emails ?? [])
      .concat(card?.emails?.filter(e => e.selected) ?? [])
      .map(({ label, address }) => [label, address]),
    urls,
    (commonInformation?.addresses ?? [])
      .concat(card?.addresses?.filter(address => address.selected) ?? [])
      .map(({ label, address }) => [label, address]),
    card?.birthday?.selected ? card?.birthday.birthday : undefined,
    (commonInformation?.socials ?? [])
      .concat(card?.socials?.filter(social => social.selected) ?? [])
      .map(({ label, url }) => [label, url]),
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
      urls,
      addresses,
      birthday,
      socials,
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
    urls,
    addresses,
    birthday,
    socials,
  };
};

export const AVATAR_MAX_WIDTH = 2048;

export const CONTACTCARD_ASSET_SIZES = [112];
