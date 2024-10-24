import * as Sentry from '@sentry/react-native';
import {
  addContactAsync,
  PermissionStatus,
  updateContactAsync,
} from 'expo-contacts';
import { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { AppState, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { useRouter, type NativeScreenProps } from '#components/NativeRouter';
import { findLocalContact } from '#helpers/contactCardHelpers';
import { reworkContactForDeviceInsert } from '#helpers/contactListHelpers';
import { getLocalContactsMap } from '#helpers/getLocalContactsMap';
import { usePhonebookPermission } from '#hooks/usePhonebookPermission';
import { storage } from '#screens/ContactsScreen/ContactsScreen';
import SafeAreaView from '#ui/SafeAreaView';
import ContactDetailsBody from './ContactDetailsBody';
import type { ContactDetailsRoute } from '#routes';
import type { Contact } from 'expo-contacts';

type Props = NativeScreenProps<ContactDetailsRoute>;

const ContactDetailsScreen = ({ route }: Props) => {
  const contact = route.params;
  const router = useRouter();
  const intl = useIntl();

  const [localContacts, setLocalContacts] = useState<Contact[]>();
  const [contactsPermissionStatus, setContactsPermissionStatus] = useState(
    PermissionStatus.UNDETERMINED,
  );

  const { requestPhonebookPermissionAndRedirectToSettingsAsync } =
    usePhonebookPermission();

  // will setup the permission for this screen at first opening
  useEffect(() => {
    if (contactsPermissionStatus === PermissionStatus.UNDETERMINED) {
      const updatePermission = async () => {
        const { status } =
          await requestPhonebookPermissionAndRedirectToSettingsAsync();
        setContactsPermissionStatus(status);
      };
      updatePermission();
    }
  }, [
    contactsPermissionStatus,
    requestPhonebookPermissionAndRedirectToSettingsAsync,
  ]);

  // refresh loca contact map
  const refreshLocalContacts = useCallback(async () => {
    if (contactsPermissionStatus === PermissionStatus.GRANTED) {
      setLocalContacts(await getLocalContactsMap());
    } else if (contactsPermissionStatus === PermissionStatus.DENIED) {
      setLocalContacts([]);
    } // else wait for permission update
  }, [contactsPermissionStatus]);

  useEffect(() => {
    refreshLocalContacts();
  }, [refreshLocalContacts]);

  // ensure we refresh contacts oon resume
  useEffect(() => {
    if (contactsPermissionStatus === PermissionStatus.GRANTED) {
      const subscription = AppState.addEventListener('change', state => {
        if (state === 'active') {
          refreshLocalContacts();
        }
      });
      return () => {
        subscription.remove();
      };
    }
  }, [contactsPermissionStatus, refreshLocalContacts]);

  const onInviteContact = useCallback(async () => {
    try {
      let messageToast = '';
      if (
        contactsPermissionStatus === PermissionStatus.GRANTED &&
        localContacts
      ) {
        const phoneNumbers =
          contact.phoneNumbers
            ?.filter(({ number }) => !!number)
            .map(({ number }) => number) ?? [];

        const emails =
          contact.emails
            ?.filter(({ email }) => !!email)
            .map(({ email }) => email) ?? [];

        const foundContact = await findLocalContact(
          storage,
          phoneNumbers as string[],
          emails as string[],
          localContacts,
          contact.profileId,
        );

        if (foundContact) {
          const contactToAddReworked = reworkContactForDeviceInsert({
            ...contact,
            id: foundContact.id,
          });

          await updateContactAsync(contactToAddReworked);
          messageToast = intl.formatMessage({
            defaultMessage: 'The contact was updated successfully.',
            description: 'Toast message when a contact is updated successfully',
          });
        } else {
          const contactToAddReworked = reworkContactForDeviceInsert(contact);
          const resultId = await addContactAsync(contactToAddReworked).catch(
            e => {
              Sentry.captureException(e);
              return '';
            },
          );
          if (contact.profileId) {
            storage.set(contact.profileId, resultId);
          }
          messageToast = intl.formatMessage({
            defaultMessage: 'The contact was created successfully.',
            description: 'Toast message when a contact is created successfully',
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
  }, [contact, contactsPermissionStatus, intl, localContacts]);

  return (
    <SafeAreaView
      style={styles.container}
      edges={{ bottom: 'off', top: 'additive' }}
    >
      <ContactDetailsBody
        details={contact}
        onClose={router.back}
        onSave={onInviteContact}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ContactDetailsScreen;
