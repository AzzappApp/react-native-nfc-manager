import * as Sentry from '@sentry/react-native';
import {
  addContactAsync,
  PermissionStatus as ContactPermissionStatus,
} from 'expo-contacts';
import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import Toast from 'react-native-toast-message';
import { graphql, readInlineData } from 'relay-runtime';
import { buildExpoContact } from '#helpers/contactHelpers';
import { usePermissionContext } from '#helpers/PermissionContext';
import { usePhoneContactBookPermission } from '#hooks/usePhoneContactBookPermission';
import type { useOnInviteContactDataQuery_contact$key } from '#relayArtifacts/useOnInviteContactDataQuery_contact.graphql';

export const inviteContactFragment_contact = graphql`
  fragment useOnInviteContactDataQuery_contact on Contact
  @argumentDefinitions(
    pixelRatio: { type: "Float!", provider: "CappedPixelRatio.relayprovider" }
    screenWidth: { type: "Float!", provider: "ScreenWidth.relayprovider" }
  )
  @inline {
    id
    firstName
    lastName
    title
    company
    note
    phoneNumbers {
      number
      label
    }
    emails {
      label
      address
    }
    urls {
      url
    }
    addresses {
      label
      address
    }
    birthday
    meetingDate
    socials {
      url
      label
    }
    avatar {
      uri: uri(width: 112, pixelRatio: $pixelRatio, format: png)
      id
    }
    logo {
      uri: uri(width: 180, pixelRatio: $pixelRatio, format: png)
      id
    }
    note
    contactProfile {
      id
      webCard {
        id
        cardIsPublished
        userName
        hasCover
        coverMedia {
          id
          ... on MediaVideo {
            webCardPreview: thumbnail(
              width: $screenWidth
              pixelRatio: $pixelRatio
            )
          }
          ... on MediaImage {
            webCardPreview: uri(width: $screenWidth, pixelRatio: $pixelRatio)
          }
        }
      }
    }
    enrichment {
      fields {
        title
        company
        phoneNumbers {
          label
          number
        }
        emails {
          address
          label
        }
        urls {
          url
        }
        addresses {
          address
          label
        }
        birthday
        socials {
          label
          url
        }
        avatar {
          uri: uri(width: 112, pixelRatio: $pixelRatio, format: png)
          id
        }
        logo {
          uri: uri(width: 180, pixelRatio: $pixelRatio, format: png)
          id
        }
      }
    }
  }
`;

const useOnInviteContact = () => {
  const intl = useIntl();

  const { contactPermission } = usePermissionContext();

  const {
    requestPhoneContactBookPermissionAndRedirectToSettingsAsync:
      requestPhonebookPermissionAndRedirectToSettingsAsync,
  } = usePhoneContactBookPermission();

  const onInviteContact = useCallback(
    async (contactsData?: useOnInviteContactDataQuery_contact$key | null) => {
      const contacts = readInlineData(
        inviteContactFragment_contact,
        contactsData,
      );
      try {
        const { status } =
          contactPermission !== 'granted'
            ? await requestPhonebookPermissionAndRedirectToSettingsAsync()
            : { status: ContactPermissionStatus.GRANTED };

        if (status === ContactPermissionStatus.GRANTED) {
          const innerContacts = Array.isArray(contacts) ? contacts : [contacts];
          let hasFailed = false;
          await Promise.all(
            innerContacts.map(async contact => {
              const contactToAdd = await buildExpoContact(contact);
              await addContactAsync(contactToAdd).catch(e => {
                hasFailed = true;
                Sentry.captureException(e);
                return '';
              });
            }),
          );
          if (hasFailed) {
            Toast.show({
              type: 'error',
              text1: intl.formatMessage({
                defaultMessage: 'Create contact failed.',
                description: 'Toast for creating new contact failed',
              }),
            });
          } else {
            Toast.show({
              type: 'success',
              text1: intl.formatMessage(
                {
                  defaultMessage: `{contacts, plural,
                    =1 {The contact was saved successfully}
                    other {The contacts were saved successfully}
            }`,
                  description:
                    'Toast message when contacts were invited successfully',
                },
                { contacts: innerContacts.length },
              ),
            });
          }
        } else {
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'Permission denied.',
              description:
                'Toast message when permission to access contacts was denied (impossible to add contact on phone)',
            }),
          });
        }
      } catch (e) {
        console.error(e);
        Sentry.captureException(e);
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Failure to add contact.',
            description:
              'Toast message when a contact is create or updated failed for unknown reason',
          }),
        });
      }
    },
    [
      contactPermission,
      intl,
      requestPhonebookPermissionAndRedirectToSettingsAsync,
    ],
  );
  return onInviteContact;
};

export default useOnInviteContact;
