import { PermissionStatus } from 'expo-contacts';
import { useCallback, useEffect, useState } from 'react';
import { AppState, StyleSheet } from 'react-native';
import { useRouter, type NativeScreenProps } from '#components/NativeRouter';
import { getLocalContactsMap } from '#helpers/getLocalContactsMap';
import useOnInviteContact from '#hooks/useOnInviteContact';
import { usePhonebookPermission } from '#hooks/usePhonebookPermission';
import SafeAreaView from '#ui/SafeAreaView';
import ContactDetailsBody from './ContactDetailsBody';
import type { ContactDetailsRoute } from '#routes';
import type { Contact } from 'expo-contacts';

type Props = NativeScreenProps<ContactDetailsRoute>;

const ContactDetailsScreen = ({ route }: Props) => {
  const contact = route.params;
  const router = useRouter();

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

  const onInviteContact = useOnInviteContact();

  const onInviteContactInner = useCallback(() => {
    onInviteContact(contactsPermissionStatus, contact, localContacts);
  }, [contact, contactsPermissionStatus, localContacts, onInviteContact]);

  return (
    <SafeAreaView style={styles.container}>
      <ContactDetailsBody
        details={contact}
        onClose={router.back}
        onSave={onInviteContactInner}
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
