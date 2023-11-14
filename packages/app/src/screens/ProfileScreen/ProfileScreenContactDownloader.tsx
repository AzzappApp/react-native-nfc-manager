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
      const contact = buildContact(contactData);
      if (contact.id === fromGlobalId(profile.id).id) {
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
    phoneNumbers,
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
    phoneNumbers: phoneNumbers.map(phone => ({
      label: phone[0],
      number: phone[1],
      isPrimary: phone[0] === 'Main',
      id: `${profileId}-${phone[1]}`,
    })),
    emails: emails.map(email => ({
      label: email[0],
      email: email[1],
      isPrimary: email[0] === 'Main',
      id: `${profileId}-${email[1]}`,
    })),
    urlAddresses: urls.map(url => ({
      label: url[0],
      url: url[1],
      id: `${profileId}-${url[1]}`,
    })),
  };

  return contact;
};
