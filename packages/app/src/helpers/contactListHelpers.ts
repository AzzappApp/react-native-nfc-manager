import * as FileSystem from 'expo-file-system';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import type { ContactsScreenLists_contacts$data } from '#relayArtifacts/ContactsScreenLists_contacts.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { Contact } from 'expo-contacts';

export const buildLocalContact = async (
  contact: ContactType,
): Promise<Contact> => {
  const commonInformation = contact.contactProfile?.webCard?.commonInformation;

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
  if (contact.contactProfile?.webCard?.userName) {
    personal.urlAddresses.push({
      label: '',
      url: buildUserUrl(contact.contactProfile?.webCard?.userName),
    });
  }
  const common = {
    addresses: commonInformation?.addresses ?? [],
    company: commonInformation?.company ?? undefined,
    emails:
      commonInformation?.emails?.map(({ label, address }) => ({
        label,
        email: address,
      })) ?? [],
    phoneNumbers: commonInformation?.phoneNumbers ?? [],
    socialProfiles: commonInformation?.socials ?? [],
    urlAddresses:
      commonInformation?.urls?.map(({ address }) => ({
        label: '',
        url: address,
      })) ?? [],
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

  const avatarURI = contact.contactProfile?.avatar?.uri;
  const avatar = avatarURI
    ? await FileSystem.downloadAsync(
        avatarURI,
        FileSystem.cacheDirectory + 'avatar',
      )
    : null;

  return {
    ...contact,
    name: `${contact.firstName} ${contact.lastName}`,
    contactType: 'person' as const,
    jobTitle: contact.title,
    company: common.company || contact.company,
    addresses: common.addresses.concat(personal.addresses),
    emails: common.emails.concat(personal.emails),
    phoneNumbers: common.phoneNumbers.concat(personal.phoneNumbers),
    socialProfiles: common.socialProfiles.concat(personal.socialProfiles),
    urlAddresses: common.urlAddresses.concat(personal.urlAddresses),
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
