import { getContactByIdAsync, requestPermissionsAsync } from 'expo-contacts';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import type { ContactsScreen_contacts$data } from '#relayArtifacts/ContactsScreen_contacts.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { Contact } from 'expo-contacts';
import type { MMKV } from 'react-native-mmkv';

type Props = {
  contact: ContactType;
  storage: MMKV;
  onInviteContact: (onHideInvitation: () => void) => void;
  localContacts: Contact[];
};

const ContactSearchByDateItem = ({
  contact,
  storage,
  onInviteContact,
  localContacts,
}: Props) => {
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    const verifyInvitation = async () => {
      const { status } = await requestPermissionsAsync();

      if (status === 'granted') {
        if (storage.contains(contact.contactProfile!.id)) {
          const internalId = storage.getString(contact.contactProfile!.id);
          if (internalId) {
            return;
          }

          const contactsByDeviceId = await Promise.all(
            contact.deviceIds.map(deviceId => getContactByIdAsync(deviceId)),
          );

          const foundContact = contactsByDeviceId.find(
            contactByDeviceId => !!contactByDeviceId,
          );

          if (foundContact) {
            return;
          }
        }

        const localContact = localContacts.find(localContact => {
          const hasCommonPhoneNumber = localContact.phoneNumbers?.find(
            phoneNumber =>
              contact.phoneNumbers.some(ph => ph.number === phoneNumber.number),
          );

          const hasCommonEmails = localContact.emails?.find(email =>
            contact.emails.some(em => em.address === email.email),
          );

          return hasCommonPhoneNumber || hasCommonEmails;
        });

        if (localContact) {
          return;
        }

        setShowInvite(true);
      }
    };

    verifyInvitation();
  }, [
    contact.contactProfile,
    contact.deviceIds,
    contact.emails,
    contact.phoneNumbers,
    localContacts,
    storage,
  ]);

  const onInvite = useCallback(() => {
    onInviteContact(() => setShowInvite(false));
  }, [onInviteContact]);

  return (
    <View style={styles.profile}>
      <CoverRenderer width={80} webCard={contact.webCard} />
      {showInvite && (
        <PressableNative style={styles.invite} onPress={onInvite}>
          <Icon icon="invite" style={styles.icon} size={17} />
        </PressableNative>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  profile: {
    position: 'relative',
    marginBottom: 30,
  },
  invite: {
    position: 'absolute',
    top: 5,
    right: 5,
    borderColor: '#FFFFFF66',
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 27,
    backgroundColor: '#0000004D',
    width: 31,
    height: 31,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    tintColor: colors.white,
  },
});

type ContactType = NonNullable<
  NonNullable<
    NonNullable<
      ArrayItemType<ContactsScreen_contacts$data['searchContacts']['edges']>
    >
  >['node']
>;

export default ContactSearchByDateItem;
