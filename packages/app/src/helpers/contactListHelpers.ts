import * as Sentry from '@sentry/react-native';
import { File, Paths } from 'expo-file-system/next';
import { Platform } from 'react-native';
import type { ContactDetailsModal_webCard$key } from '#relayArtifacts/ContactDetailsModal_webCard.graphql';
import type { ContactsScreenLists_contacts$data } from '#relayArtifacts/ContactsScreenLists_contacts.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { Contact, Image } from 'expo-contacts';

export const buildLocalContact = async (
  contact: Contact | ContactType,
): Promise<Contact> => {
  if (!('createdAt' in contact)) {
    return contact;
  }
  const personal = {
    addresses: contact.addresses.map(address => ({
      label: address.label,
      // note we need to duplicate this field of ios / android compatibility with expo-contacts
      street: address.address,
      address: address.address,
    })),
    emails: contact.emails.map(({ label, address }) => ({
      label,
      email: address,
    })),
    phoneNumbers: contact.phoneNumbers.map(({ label, number }) => ({
      label,
      number,
    })),
    socialProfiles:
      contact.socials?.map(({ label, url }) => ({ label, url })) ?? [],
    urlAddresses: contact?.urls?.map(({ url }) => ({ label: '', url })) ?? [],
  };

  let updatedBirthDay = undefined;
  if (contact.birthday) {
    const birthday = new Date(contact.birthday);
    updatedBirthDay = [
      {
        label: 'birthday',
        year: birthday?.getFullYear(),
        month: birthday?.getMonth(),
        day: birthday?.getDate(),
      },
    ];
  }

  let avatar = null;
  try {
    if (contact.contactProfile?.avatar?.uri) {
      const file = new File(
        Paths.cache.uri + contact.contactProfile?.avatar.id,
      );
      avatar = file.exists
        ? file
        : await File.downloadFileAsync(
            contact.contactProfile?.avatar?.uri,
            file,
          );
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
      : undefined;

  return {
    ...contact,
    name: `${contact.firstName} ${contact.lastName}`,
    contactType: 'person' as const,
    jobTitle: contact.title,
    company: contact.company,
    addresses: personal.addresses,
    emails: personal.emails,
    phoneNumbers: personal.phoneNumbers,
    socialProfiles: personal.socialProfiles,
    urlAddresses: personal.urlAddresses,
    dates: updatedBirthDay || undefined,
    image,
    imageAvailable: !!avatar,
    birthday: undefined,
  };
};

const prefixWithHttp = (link?: string): string | undefined => {
  if (!link || link.includes('://')) {
    return link;
  }
  return `https://${link}`;
};

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
};
