import {
  Fields,
  getContactsAsync as expoGetContactsAsync,
} from 'expo-contacts';
import { SOCIAL_NETWORK_LINKS } from '@azzapp/shared/socialLinkHelpers';
import type {
  Contact,
  ContactQuery,
  ContactResponse,
  SocialProfile,
} from 'expo-contacts';

export const getLocalContactsMap = async () => {
  const { data } = await expoGetContactsAsync({
    fields: [Fields.Emails, Fields.PhoneNumbers, Fields.ID],
  });
  return data;
};

const sanitizeSocialProfileUrl = (url?: string) => {
  if (!url) return url;
  url = url.replace(/^x-apple:/, '');
  return url;
};

const sanitizeSocialProfileLabel = (
  socialProfile: SocialProfile,
): string | undefined => {
  const label = (socialProfile.label || socialProfile.localizedProfile)
    ?.trim()
    .toLowerCase();
  const socialNetwork = SOCIAL_NETWORK_LINKS.find(social => {
    if (label && label === social.label.toLowerCase()) {
      return true;
    }
    if (socialProfile.url?.includes(social.mask)) {
      return true;
    }
    return false;
  });
  if (socialNetwork) {
    return socialNetwork?.label;
  } else {
    return label;
  }
};

export const sanitizeContact = (contact: Contact): Contact => {
  return {
    ...contact,
    socialProfiles: contact.socialProfiles?.map(
      (socialProfile: SocialProfile) =>
        ({
          ...socialProfile,
          url: sanitizeSocialProfileUrl(socialProfile.url),
          label: sanitizeSocialProfileLabel(socialProfile),
        }) as SocialProfile,
    ),
  };
};

export const sanitizeContacts = (contacts: Contact[]): Contact[] => {
  return contacts.map(contact => sanitizeContact(contact));
};

export const getContactsAsync = async (
  contactQuery?: ContactQuery,
): Promise<ContactResponse> => {
  const contacts = await expoGetContactsAsync(contactQuery);
  return { ...contacts, data: sanitizeContacts(contacts.data) };
};
