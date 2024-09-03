import * as Sentry from '@sentry/react-native';
import {
  getContactByIdAsync,
  updateContactAsync,
  presentFormAsync,
  addContactAsync,
  requestPermissionsAsync,
} from 'expo-contacts';
import * as FileSystem from 'expo-file-system';
import { fromGlobalId } from 'graphql-relay';
import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Alert, Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import Toast from 'react-native-toast-message';
import { parseContactCard } from '@azzapp/shared/contactCardHelpers';
import { buildUserUrl } from '@azzapp/shared/urlHelpers';
import type { CommonInformation } from '@azzapp/shared/contactCardHelpers';
import type { Contact, Image } from 'expo-contacts';

export const storage = new MMKV({
  id: 'contacts',
});

type WebCardScreenContactDownloaderProps = {
  userName?: string;
  contactData: string | null | undefined;
  additionalContactData?: Pick<CommonInformation, 'socials' | 'urls'> & {
    avatarUrl?: string;
  };
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
    (async () => {
      if (contactData && webCard) {
        const { contact, webCardId } = await buildContact(
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
                name: `${
                  `${contact.firstName ?? ''}  ${
                    contact.lastName ?? ''
                  }`.trim() ||
                  contact.company ||
                  webCard.userName
                }`,
              },
            ),
            intl.formatMessage(
              {
                defaultMessage: 'Add {name} to the contacts list of your phone',
                description: 'Alert message when adding a profile to contacts',
              },
              {
                name: `${
                  `${contact.firstName ?? ''}  ${
                    contact.lastName ?? ''
                  }`.trim() ||
                  contact.company ||
                  webCard.userName
                }`,
              },
            ),
            [
              {
                text: 'OK',
                onPress: async () => {
                  try {
                    let messageToast = '';
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
                        messageToast = intl.formatMessage({
                          defaultMessage:
                            'The contact was updated successfully.',
                          description:
                            'Toast message when a contact is updated successfully',
                        });
                      } else {
                        const resultId = await addContactAsync(contact);
                        if (contact.id) {
                          storage.set(contact.id, resultId);
                        }
                        messageToast = intl.formatMessage({
                          defaultMessage:
                            'The contact was created successfully.',
                          description:
                            'Toast message when a contact is created successfully',
                        });
                      }

                      Toast.show({
                        type: 'success',
                        text1: messageToast,
                      });
                    }
                  } catch (e) {
                    console.error(e);
                  }
                },
              },
              {
                text: intl.formatMessage({
                  defaultMessage: 'View Contact',
                  description: 'Button to view the contact',
                }),
                onPress: async () => {
                  if (Platform.OS === 'android') {
                    const readContactPermission =
                      await requestPermissionsAsync();
                    if (readContactPermission.status !== 'granted') {
                      Toast.show({
                        type: 'error',
                        text1: intl.formatMessage({
                          defaultMessage:
                            'You have to grant the permission to view the contact',
                          description:
                            'WebCard screen - Error message when trying to view a contact',
                        }),
                      });
                      return;
                    }
                  }

                  await presentFormAsync(null, contact, {
                    isNew: true,
                  });
                },
              },
              { text: 'Cancel', style: 'cancel' },
            ],
          );
        }
      }
    })();
  }, [intl, contactData, webCard, additionalContactData]);

  return null;
};

export default WebCardScreenContactDownloader;

const buildContact = async (
  contactCardData: string,
  additionalContactData: WebCardScreenContactDownloaderProps['additionalContactData'],
  userName?: string,
) => {
  const {
    profileId,
    webCardId,
    firstName,
    addresses,
    lastName,
    company,
    title,
    phoneNumbers,
    emails,
    birthday,
  } = parseContactCard(contactCardData);

  let image: Image | undefined = undefined;

  if (additionalContactData?.avatarUrl) {
    try {
      const avatar = await FileSystem.downloadAsync(
        additionalContactData.avatarUrl,
        FileSystem.cacheDirectory + 'avatar',
      );
      if (avatar.status >= 200 && avatar.status < 300) {
        image = {
          width: 720,
          height: 720,
          uri: avatar.uri,
        };
      }
    } catch (e) {
      Sentry.captureException(e);
    }
  }

  const birthdayDate = birthday ? new Date(birthday) : undefined;

  const contact: Contact = {
    id: profileId,
    contactType: 'person',
    firstName: firstName ?? '',
    lastName: lastName ?? '',
    name: `${firstName ?? ''} ${lastName ?? ''}`,
    company: company ?? '',
    jobTitle: title ?? '',
    addresses: addresses.map(address => ({
      label: address[0],
      street: address[1],
      isPrimary: address[0] === 'Main',
      id: `${profileId}-${address[1]}`,
    })),
    phoneNumbers: phoneNumbers.map(phone => ({
      label:
        Platform.OS === 'android' && phone[0] !== 'Main'
          ? phone[0] === 'Fax'
            ? 'workFax'
            : phone[0].toLowerCase()
          : phone[0],
      number: phone[1],
      isPrimary: phone[0] === 'Main',
      id: `${profileId}-${phone[1]}`,
    })),
    emails: emails.map(email => ({
      label:
        Platform.OS === 'android' && email[0] !== 'Main'
          ? email[0].toLowerCase()
          : email[0],
      email: email[1],
      isPrimary: email[0] === 'Main',
      id: `${profileId}-${email[1]}`,
    })),
    dates: birthdayDate
      ? [
          {
            label: 'birthday',
            year: birthdayDate?.getFullYear(),
            month: birthdayDate?.getMonth(),
            day: birthdayDate?.getDate(),
            id: `${profileId}-birthday`,
          },
        ]
      : [],
    socialProfiles:
      additionalContactData?.socials?.map(social => ({
        label: social.label,
        url: social.url,
        id: `${profileId}-${social.label}`,
        service: social.label,
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
    image,
  };

  return { contact, webCardId };
};
