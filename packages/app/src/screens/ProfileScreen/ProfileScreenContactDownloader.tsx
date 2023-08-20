import {
  getContactByIdAsync,
  updateContactAsync,
  presentFormAsync,
  addContactAsync,
  requestPermissionsAsync,
} from 'expo-contacts';
import { fromGlobalId } from 'graphql-relay';
import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Alert, Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { parseContactCard } from '@azzapp/shared/contactCardHelpers';
import type { Contact } from 'expo-contacts';

export const storage = new MMKV({
  id: 'contacts',
});

type ProfileScreenContactDownloaderProps = {
  contactData: string | null | undefined;
  profile:
    | {
        readonly id: string;
        readonly userName?: string;
      }
    | null
    | undefined;
};

const ProfileScreenContactDownloader = ({
  contactData,
  profile,
}: ProfileScreenContactDownloaderProps) => {
  const intl = useIntl();
  useEffect(() => {
    if (contactData && profile) {
      if (contactData.startsWith(fromGlobalId(profile.id).id)) {
        const contact = buildContact(contactData);
        Alert.alert(
          intl.formatMessage(
            {
              defaultMessage: 'Add {name} to contacts?',
              description: 'Alert title when adding a profile to contacts',
            },
            {
              name: `${profile.userName}`,
            },
          ),
          intl.formatMessage(
            {
              defaultMessage: 'Add {name} to the contacts list of your phone',
              description: 'Alert message when adding a profile to contacts',
            },
            {
              name: `${contact.firstName} ${contact.lastName}`,
            },
          ),
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'OK',
              onPress: async () => {
                try {
                  const { status } = await requestPermissionsAsync();
                  if (status === 'granted') {
                    let foundContact: Contact | undefined = undefined;
                    if (contact.id && storage.contains(contact.id)) {
                      const internalId = storage.getString(contact.id);
                      if (internalId) {
                        foundContact = await getContactByIdAsync(internalId);
                      }
                    }

                    if (foundContact) {
                      if (Platform.OS === 'ios') {
                        await updateContactAsync({
                          ...contact,
                          id: foundContact.id,
                        });
                      } else {
                        await presentFormAsync(foundContact.id, contact);
                      }
                    } else {
                      const resultId = await addContactAsync(contact);
                      if (contact.id) {
                        storage.set(contact.id, resultId);
                      }
                    }
                  }
                } catch (e) {
                  console.error(e);
                }
              },
            },
          ],
        );
      }
    }
  }, [intl, contactData, profile]);

  return null;
};

export default ProfileScreenContactDownloader;

const buildContact = (contactCardData: string) => {
  const {
    profileId,
    firstName,
    lastName,
    company,
    title,
    phones,
    emails,
    urls,
  } = parseContactCard(contactCardData);

  const contact: Contact = {
    id: profileId,
    contactType: 'person',
    firstName: firstName ?? '',
    lastName: lastName ?? '',
    name: `${firstName ?? ''} ${lastName ?? ''}`,
    company: company ?? '',
    jobTitle: title ?? '',
    phoneNumbers: phones.map(phone => ({
      label: phone.label,
      number: phone.number,
      isPrimary: phone.label === 'Main',
      id: `${profileId}-${phone.number}`,
    })),
    emails: emails.map(email => ({
      label: email.label,
      email: email.email,
      isPrimary: email.label === 'Main',
      id: `${profileId}-${email.email}`,
    })),
    urlAddresses: urls.map(url => ({
      label: url.label,
      url: url.url,
      id: `${profileId}-${url.url}`,
    })),
  };

  return contact;
};
