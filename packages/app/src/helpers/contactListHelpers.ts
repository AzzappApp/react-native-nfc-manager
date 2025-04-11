import * as Sentry from '@sentry/react-native';
import { ContactTypes } from 'expo-contacts';
import { File, Paths } from 'expo-file-system/next';
import { Platform } from 'react-native';
import { isDefined } from '@azzapp/shared/isDefined';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import { getLocalCachedMediaFile } from './mediaHelpers/remoteMediaCache';
import type { ContactsDetailScreenQuery$data } from '#relayArtifacts/ContactsDetailScreenQuery.graphql';
import type { ContactsScreenLists_contacts$data } from '#relayArtifacts/ContactsScreenLists_contacts.graphql';
import type {
  ContactAddressLabelType,
  ContactEmailLabelType,
  ContactType,
} from './contactTypes';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { Contact as ExpoContact, Date as ExpoDate } from 'expo-contacts';

export function prefixWithHttp(link: string): string;
export function prefixWithHttp(link: undefined): undefined;
export function prefixWithHttp(link: string | undefined): string | undefined;
export function prefixWithHttp(link?: string): string | undefined {
  if (!link || link.startsWith('http://') || link.startsWith('https://')) {
    return link;
  }
  return `https://${link}`;
}
export const buildExpoContact = async (
  contact: ContactType,
): Promise<ExpoContact> => {
  let birthday: ExpoDate | undefined = undefined;
  if (contact?.birthday) {
    const contactBirthday = new Date(contact.birthday);
    birthday = {
      label: 'birthday',
      year: contactBirthday.getFullYear(),
      month: contactBirthday.getMonth(),
      day: contactBirthday.getDate(),
    };
  }
  let avatar: File | undefined;
  try {
    const contactAvatar =
      contact?.avatar || contact?.logo || contact?.webCardPreview;
    if (contactAvatar && contactAvatar.id) {
      const existingFile = getLocalCachedMediaFile(contactAvatar.id, 'image');
      if (existingFile) {
        avatar = new File(existingFile);
      }

      if ((!avatar || !avatar.exists) && contactAvatar.uri) {
        avatar = new File(Paths.cache.uri + contactAvatar.id);
        if (!avatar.exists) {
          await File.downloadFileAsync(contactAvatar.uri, avatar);
        }
      }
    }
  } catch (e) {
    Sentry.captureException(e);
    console.error('download avatar failure', e);
  }
  const image = avatar?.uri ? { uri: avatar.uri } : undefined;
  return {
    contactType: ContactTypes.Person,
    firstName: contact.firstName || undefined,
    lastName: contact.lastName || undefined,
    company: contact.company || undefined,
    jobTitle: contact.title || undefined,
    name: formatDisplayName(contact.firstName, contact.lastName) || '',
    birthday,
    addresses: contact.addresses?.map(({ address, label }) => ({
      address,
      label,
    })),
    emails: contact.emails?.map(({ address, label }) => ({
      address,
      label,
    })),
    image,
    imageAvailable: !!image,
    urlAddresses: contact.urls?.map(addr => {
      return {
        label: 'default',
        url: prefixWithHttp(addr.url),
      };
    }),
    socialProfiles: contact.socials?.map(social => {
      return {
        ...social,
        url: prefixWithHttp(social.url),
      };
    }),
    phoneNumbers: contact.phoneNumbers?.map(number => {
      return {
        ...number,
        label:
          Platform.OS === 'android' && number.label === 'Fax'
            ? 'otherFax'
            : number.label,
      };
    }),
  };
};

export const stringToContactAddressLabelType = (
  str: string,
): ContactAddressLabelType => {
  switch (str.toLowerCase()) {
    case 'home':
      return 'Home';
    case 'main':
      return 'Main';
    case 'work':
      return 'Work';
    default:
      return 'Other'; // Fallback to 'Other'
  }
};
export const stringToContactEmailLabelType = (
  str: string,
): ContactEmailLabelType => {
  switch (str.toLowerCase()) {
    case 'home':
      return 'Home';
    case 'main':
      return 'Main';
    case 'work':
      return 'Work';
    default:
      return 'Other'; // Fallback to 'Other'
  }
};

export type ContactPhoneNumberLabelType =
  | 'Fax'
  | 'Home'
  | 'Main'
  | 'Mobile'
  | 'Other'
  | 'Work';
export const stringToContactPhoneNumberLabelType = (
  str: string,
): ContactPhoneNumberLabelType => {
  switch (str.toLowerCase()) {
    case 'home':
      return 'Home';
    case 'main':
      return 'Main';
    case 'work':
      return 'Work';
    case 'fax':
      return 'Fax';
    case 'mobile':
      return 'Mobile';
    default:
      return 'Other'; // Fallback to 'Other'
  }
};

type ContactSearchNode = NonNullable<
  NonNullable<
    NonNullable<
      ArrayItemType<
        ContactsScreenLists_contacts$data['searchContacts']['edges']
      >
    >
  >['node']
>;
export const buildContactTypeFromContactNode = (
  inputContact?:
    | ContactsDetailScreenQuery$data['contact']
    | ContactSearchNode
    | null,
): ContactType | null => {
  if (!inputContact) {
    return null;
  }
  const contact: ContactType = {
    id: inputContact.id,
    createdAt: inputContact.createdAt || new Date(),
    firstName: inputContact.firstName,
    lastName: inputContact.lastName,
    title: inputContact.title,
    socials: inputContact.socials?.map(social => ({
      label: social.label,
      url: social.url,
    })),
    phoneNumbers: inputContact.phoneNumbers
      ?.map(phone =>
        phone.number.length
          ? {
              label: stringToContactPhoneNumberLabelType(phone.label),
              number: phone.number,
            }
          : undefined,
      )
      .filter(isDefined),
    urls: inputContact.urls
      ?.map(url => (url.url.length ? { url: url.url } : undefined))
      .filter(isDefined),
    emails: inputContact.emails
      ?.map(email =>
        email.address.length
          ? {
              label: stringToContactEmailLabelType(email.label),
              address: email.address,
            }
          : undefined,
      )
      .filter(isDefined),
    addresses: inputContact.addresses
      ?.map(address =>
        address.address
          ? {
              label: stringToContactAddressLabelType(address.label),
              address: address.address,
            }
          : undefined,
      )
      .filter(isDefined),
    birthday: inputContact.birthday,
    meetingPlace: inputContact.meetingPlace,
    company: inputContact.company,
    avatar: inputContact.avatar,
    logo: inputContact.logo,
    profileId: inputContact.contactProfile?.id,

    // webcard specific fields
    // do not populate values if webcard is not published
    // no need to expose webCardIsPublished then
    webCardUserName: inputContact.contactProfile?.webCard?.cardIsPublished
      ? inputContact.contactProfile?.webCard?.userName
      : undefined,
    webCardId: inputContact.contactProfile?.webCard?.cardIsPublished
      ? inputContact.contactProfile?.webCard?.id
      : undefined,
    webCard: inputContact.contactProfile?.webCard?.cardIsPublished
      ? inputContact?.contactProfile?.webCard
      : undefined,
    webCardPreview:
      inputContact.contactProfile?.webCard?.cardIsPublished &&
      inputContact?.contactProfile?.webCard?.coverMedia?.webcardThumbnail
        ? {
            id: inputContact?.contactProfile?.webCard?.coverMedia?.id,
            uri: inputContact?.contactProfile?.webCard?.coverMedia
              ?.webcardThumbnail,
          }
        : undefined,
  };
  return contact;
};
