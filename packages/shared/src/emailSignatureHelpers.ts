import { csv2json, json2csv } from 'csv42';
import type { ContactCard, CommonInformation } from './contactCardHelpers';

export type ParsedEmailSignature = [
  string,
  string,
  string,
  string,
  string,
  string,
  string[],
  string[],
  string | undefined,
  string | undefined,
];

export const serializeEmailSignature = (
  profileId: string,
  webCardId: string,
  card: ContactCard | null,
  commonInformation: CommonInformation | null | undefined,
  avatarUrl: string | null,
) => {
  const serializedEmailSignature: ParsedEmailSignature = [
    profileId,
    webCardId,
    card?.firstName ?? '',
    card?.lastName ?? '',
    (commonInformation?.company || card?.company) ?? '',
    card?.title ?? '',
    (commonInformation?.emails ?? [])
      .concat(card?.emails ?? [])
      .map(({ address }) => address),
    (commonInformation?.phoneNumbers ?? [])
      .concat(card?.phoneNumbers ?? [])
      .map(({ number }) => number),
    avatarUrl ?? undefined,
    new Date().toISOString(),
  ];

  return json2csv([serializedEmailSignature], { header: false });
};
export type EmailSignatureParsed = {
  profileId: string;
  webCardId: string;
  firstName: string | undefined;
  lastName: string | undefined;
  company: string | undefined;
  title: string | undefined;
  emails: string[] | null;
  phoneNumbers: string[] | null;
  createdAt: string | undefined;
  avatar: string | undefined;
};
/**
 * Parses a contact data from a string
 * @param contactData
 * @returns the parsed contact card
 */
export const parseEmailSignature = (
  emailSignature: string,
): EmailSignatureParsed => {
  const data = csv2json<{
    [key: string]: ParsedEmailSignature;
  }>(emailSignature, { header: false });

  const [
    [
      profileId,
      webCardId,
      firstName,
      lastName,
      company,
      title,
      emails,
      phoneNumbers,
      avatar,
      createdAt,
    ],
  ] = Object.values(data[0]);

  return {
    profileId,
    webCardId,
    firstName,
    lastName,
    company,
    title,
    emails: emails && emails.length > 0 ? emails : [],
    phoneNumbers: phoneNumbers && phoneNumbers.length > 0 ? phoneNumbers : [],
    avatar,
    createdAt,
  };
};
