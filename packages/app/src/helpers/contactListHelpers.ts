import * as Sentry from '@sentry/react-native';
import { File, Paths } from 'expo-file-system/next';
import { Platform } from 'react-native';
import { getLocalCachedMediaFile } from './mediaHelpers/remoteMediaCache';
import type { ContactDetailsModal_webCard$key } from '#relayArtifacts/ContactDetailsModal_webCard.graphql';
import type { ContactsScreenLists_contacts$data } from '#relayArtifacts/ContactsScreenLists_contacts.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { Contact, Image } from 'expo-contacts';

export const buildLocalContact = async (
  contact: Contact | ContactType,
): Promise<Contact> => {
  const personal = {
    addresses: contact.addresses?.map(address => {
      return 'address' in address
        ? {
            label: address.label,
            // note we need to duplicate this field of ios / android compatibility with expo-contacts
            street: address.address,
            address: address.address,
          }
        : address;
    }),
    emails: contact.emails?.map(email => {
      return 'address' in email
        ? {
            label: email.label,
            email: email.address,
          }
        : email;
    }),
    phoneNumbers: contact.phoneNumbers?.map(({ label, number }) => {
      return {
        label,
        number,
      };
    }),
    socialProfiles:
      'socials' in contact
        ? contact.socials?.map(({ label, url }) => ({ label, url }))
        : contact.socialProfiles,
    urlAddresses:
      'urls' in contact
        ? contact?.urls?.map(({ url }) => ({ label: '', url }))
        : contact?.urlAddresses,
  };

  let updatedBirthDay = undefined;
  if (contact.birthday) {
    // Warning contact.birthday can be a Date from expo-contacts
    // not a date from JS
    if (typeof contact.birthday === 'object') {
      updatedBirthDay = [contact.birthday];
    } else {
      const contactBirthday = new Date(contact.birthday);
      updatedBirthDay = [
        {
          label: 'birthday',
          year: contactBirthday.getFullYear(),
          month: contactBirthday.getMonth(),
          day: contactBirthday.getDate(),
        },
      ];
    }
  } else if ('dates' in contact) {
    updatedBirthDay = contact.dates;
  }

  let avatar: File | undefined;
  try {
    let contactAvatar = null;
    if ('avatar' in contact) {
      contactAvatar = contact?.avatar;
    }
    if ('contactProfile' in contact && contact.contactProfile?.avatar?.uri) {
      contactAvatar = contact.contactProfile?.avatar;
    }
    if (!contactAvatar && 'logo' in contact) {
      contactAvatar = contact?.logo;
    }
    if (contactAvatar) {
      const existingFile = getLocalCachedMediaFile(contactAvatar.id, 'image');
      if (existingFile) {
        avatar = new File(existingFile);
      }

      if (!avatar || !avatar.exists) {
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

  const image = avatar
    ? {
        // The downloaded avatar
        uri: avatar.uri,
      }
    : 'image' in contact && contact.image
      ? {
          // The local image
          uri: (contact.image as Image).uri,
          width: (contact.image as Image).width,
          height: (contact.image as Image).height,
        }
      : 'logo' in contact && contact.logo
        ? {
            uri: contact.logo.uri,
          }
        : undefined;

  return {
    ...contact,
    name: `${contact.firstName} ${contact.lastName}`,
    contactType: 'person' as const,
    jobTitle: 'title' in contact ? contact.title : contact.jobTitle,
    company: contact.company,
    addresses: personal.addresses,
    emails: personal.emails,
    phoneNumbers: personal.phoneNumbers,
    socialProfiles: personal.socialProfiles,
    urlAddresses: personal.urlAddresses,
    dates: updatedBirthDay,
    image,
    imageAvailable: !!avatar,
    birthday: undefined,
  };
};

export function prefixWithHttp(link: string): string;
export function prefixWithHttp(link: undefined): undefined;
export function prefixWithHttp(link: string | undefined): string | undefined;
export function prefixWithHttp(link?: string): string | undefined {
  if (!link || link.startsWith('http://') || link.startsWith('https://')) {
    return link;
  }
  return `https://${link}`;
}
export const reworkContactForDeviceInsert = (contact: Contact): Contact => {
  return {
    ...contact,
    urlAddresses: contact.urlAddresses?.map(addr => {
      return {
        ...addr,
        label: addr?.label ? addr?.label : 'default',
        url: prefixWithHttp(addr.url),
      };
    }),
    socialProfiles: contact.socialProfiles?.map(social => {
      return {
        ...social,
        url: prefixWithHttp(social.url),
      };
    }),
    phoneNumbers: contact.phoneNumbers?.map(number => {
      return {
        ...number,
        label:
          Platform.OS === 'android' && number.label === 'fax'
            ? 'otherFax'
            : number.label,
      };
    }),
  };
};

export type ContactType = NonNullable<
  NonNullable<
    NonNullable<
      ArrayItemType<
        ContactsScreenLists_contacts$data['searchContacts']['edges']
      >
    >
  >['node']
>;

export type ContactDetails = Contact & {
  createdAt: Date;
  profileId?: string;
  webCard?: ContactDetailsModal_webCard$key | null;
  meetingPlace?: {
    city: string | null;
    country: string | null;
    region: string | null;
    subregion: string | null;
  } | null;
};
