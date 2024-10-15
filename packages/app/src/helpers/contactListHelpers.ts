import * as FileSystem from 'expo-file-system';
import type { ContactsScreenLists_contacts$data } from '#relayArtifacts/ContactsScreenLists_contacts.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { Contact } from 'expo-contacts';

export const buildLocalContact = async (
  contact: ContactType,
): Promise<Contact> => {
  const commonInformation = contact.contactProfile?.webCard?.commonInformation;

  const personal = {
    addresses: [...contact.addresses],
    emails: contact.emails.map(({ label, address }) => ({
      label,
      email: address,
    })),
    phoneNumbers: contact.phoneNumbers.map(({ label, number }) => ({
      label,
      number,
    })),
    socialProfiles:
      contact.contactProfile?.contactCard?.socials
        ?.filter(social => !!social.selected)
        .map(({ label, url }) => ({ label, url })) ?? [],
    urlAddresses:
      contact.contactProfile?.contactCard?.urls
        ?.filter(url => !!url.selected)
        .map(({ address }) => ({ label: '', url: address })) ?? [],
  };

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
    image: avatar
      ? {
          uri: avatar.uri,
        }
      : undefined,
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
