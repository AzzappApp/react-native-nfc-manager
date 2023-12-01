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
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';
import type { Contact } from 'expo-contacts';

export const storage = new MMKV({
  id: 'contacts',
});

type WebCardScreenContactDownloaderProps = {
  userName?: string;
  contactData: string | null | undefined;
  additionalContactData?: Pick<ContactCard, 'socials' | 'urls'>;
  webCard:
    | {
        readonly id: string;
        readonly userName?: string;
      }
    | null
    | undefined;
};

const WebCardScreenContactDownloader = ({
  contactData,
  additionalContactData,
  webCard,
}: WebCardScreenContactDownloaderProps) => {
  const intl = useIntl();
  useEffect(() => {
    if (contactData && webCard) {
      const { contact, webCardId } = buildContact(
        contactData,
        additionalContactData,
        webCard.userName,
      );
      if (webCardId === fromGlobalId(webCard.id).id) {
        Alert.alert(
          intl.formatMessage(
            {
              defaultMessage: 'Add {name} to contacts?',
              description: 'Alert title when adding a profile to contacts',
            },
            {
              name: `${webCard.userName}`,
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
  }, [intl, contactData, webCard, additionalContactData]);

  return null;
};

export default WebCardScreenContactDownloader;

const buildContact = (
  contactCardData: string,
  additionalContactData: WebCardScreenContactDownloaderProps['additionalContactData'],
  userName?: string,
) => {
  const {
    profileId,
    webCardId,
    firstName,
    lastName,
    company,
    title,
    phoneNumbers,
    emails,
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
    socialProfiles:
      additionalContactData?.socials?.map(social => ({
        label: social.label,
        url: social.url,
        id: `${profileId}-${social.label}`,
      })) ?? [],
    urlAddresses: (userName
      ? [
          {
            label: 'azzapp',
            url: buildUserUrl(userName),
            id: `${profileId}-azzapp`,
          },
        ]
      : []
    ).concat(
      additionalContactData?.urls?.map(url => ({
        label: '',
        url: url.address,
        id: `${profileId}-${url.address}`,
      })) ?? [],
    ),
  };

  return { contact, webCardId };
};
