import * as Sentry from '@sentry/react-native';
import {
  addContactAsync,
  PermissionStatus as ContactPermissionStatus,
} from 'expo-contacts';
import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import Toast from 'react-native-toast-message';
import { buildExpoContact } from '#helpers/contactListHelpers';
import { usePermissionContext } from '#helpers/PermissionContext';
import { usePhonebookPermission } from './usePhonebookPermission';
import type { ContactType } from '#helpers/contactTypes';

const useOnInviteContact = () => {
  const intl = useIntl();

  const { contactPermission } = usePermissionContext();

  const { requestPhonebookPermissionAndRedirectToSettingsAsync } =
    usePhonebookPermission();

  const onInviteContact = useCallback(
    async (contacts: ContactType | ContactType[]) => {
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
