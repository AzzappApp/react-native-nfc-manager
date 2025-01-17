import * as Sentry from '@sentry/react-native';
import {
  updateContactAsync,
  addContactAsync,
  PermissionStatus as ContactPermissionStatus,
} from 'expo-contacts';
import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import Toast from 'react-native-toast-message';
import { isDefined } from '@azzapp/shared/isDefined';
import { emitContactAdded } from '#helpers/addContactHelper';
import { contactStorage, findLocalContact } from '#helpers/contactCardHelpers';
import {
  buildLocalContact,
  reworkContactForDeviceInsert,
} from '#helpers/contactListHelpers';
import type { ContactDetails, ContactType } from '#helpers/contactListHelpers';
import type { Contact } from 'expo-contacts';

const useOnInviteContact = ({ onEnd }: { onEnd?: () => void } = {}) => {
  const intl = useIntl();
  const onInviteContact = useCallback(
    async (
      contactsPermissionStatus: ContactPermissionStatus,
      contacts: ContactDetails | ContactType | ContactType[],
      localContacts?: Contact[],
      onHideInvitation?: () => void,
    ) => {
      try {
        const innerContacts = Array.isArray(contacts) ? contacts : [contacts];
        if (
          contactsPermissionStatus === ContactPermissionStatus.GRANTED &&
          localContacts
        ) {
          const contactsToCreate: Array<{
            contact: Contact;
            profileId?: string;
          }> = [];
          const contactsToUpdate: Contact[] = [];
          let foundContact;
          await Promise.all(
            innerContacts.map(async contact => {
              const isContactDetail = 'contactProfile' in contact;

              const contactToAdd: Contact = await buildLocalContact(contact);
              const profileId = isContactDetail
                ? contact.contactProfile?.id
                : contact.profileId;

              foundContact = await findLocalContact(
                contact.phoneNumbers
                  ?.map(({ number }) => number)
                  .filter(isDefined) || [],
                isContactDetail
                  ? contact.emails?.map(({ address }) => address)
                  : contact.emails
                      ?.map(({ email }) => email)
                      .filter(isDefined) || [],
                localContacts,
                profileId,
              );

              if (foundContact) {
                contactsToUpdate.push({
                  ...contactToAdd,
                  id: foundContact.id,
                });
              } else {
                contactsToCreate.push({
                  contact: contactToAdd,
                  profileId,
                });
              }
            }),
          );

          await Promise.all([
            ...contactsToCreate.map(async contactToCreate => {
              const contact = reworkContactForDeviceInsert(
                contactToCreate.contact,
              );

              const resultId = await addContactAsync(contact).catch(e => {
                Sentry.captureException(e);
                return '';
              });
              if (contactToCreate.profileId) {
                contactStorage.set(contactToCreate.profileId, resultId);
              }
            }),
            ...contactsToUpdate.map(contactToUpdate => {
              const contact = reworkContactForDeviceInsert(contactToUpdate);
              return updateContactAsync(contact);
            }),
          ]);

          onEnd?.();
          onHideInvitation?.();

          emitContactAdded();
          if (innerContacts.length > 1) {
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
          } else {
            Toast.show({
              type: 'success',
              text1: foundContact
                ? intl.formatMessage({
                    defaultMessage: 'The contact was updated successfully.',
                    description:
                      'Toast message when a contact is updated successfully',
                  })
                : intl.formatMessage({
                    defaultMessage: 'The contact was created successfully.',
                    description:
                      'Toast message when a contact is created successfully',
                  }),
            });
          }
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
    [intl, onEnd],
  );
  return onInviteContact;
};

export default useOnInviteContact;
