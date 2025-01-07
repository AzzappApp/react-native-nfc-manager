import * as Sentry from '@sentry/react-native';
import { File, Paths } from 'expo-file-system/next';
import { Platform } from 'react-native';
import type { ContactsScreenLists_contacts$data } from '#relayArtifacts/ContactsScreenLists_contacts.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { Contact } from 'expo-contacts';

export const buildLocalContact = async (
  contact: ContactType,
): Promise<Contact> => {
  const personal = {
    addresses: contact.addresses.map(address => ({
      label: address.label,
      // note we need to duplicate this field of ios / android comaptibility with expo-contacts
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
    image: avatar
      ? {
          uri: avatar.uri,
        }
      : undefined,
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

type ContactType = NonNullable<
  NonNullable<
    NonNullable<
      ArrayItemType<
        ContactsScreenLists_contacts$data['searchContacts']['edges']
      >
    >
  >['node']
>;
