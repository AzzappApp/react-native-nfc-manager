import { PermissionStatus as ContactPermissionStatus } from 'expo-contacts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import { findLocalContact } from '#helpers/contactCardHelpers';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import ContactAvatar from './ContactAvatar';
import WhatsappButton from './WhatsappButton';
import type { ContactsScreenLists_contacts$data } from '#relayArtifacts/ContactsScreenLists_contacts.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { Contact } from 'expo-contacts';
import type { MMKV } from 'react-native-mmkv';

type Props = {
  contact: ContactType;
  storage: MMKV;
  onInviteContact: (onHideInvitation: () => void) => void;
  onShowContact: (contact: ContactType) => void;
  localContacts: Contact[];
  invited: boolean;
  contactsPermissionStatus: ContactPermissionStatus;
};

const ContactSearchByDateItem = ({
  contact,
  storage,
  onInviteContact,
  onShowContact,
  localContacts,
  invited,
  contactsPermissionStatus,
}: Props) => {
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    const verifyInvitation = async () => {
      if (contactsPermissionStatus === ContactPermissionStatus.GRANTED) {
        const foundContact = await findLocalContact(
          storage,
          contact.phoneNumbers?.map(({ number }) => number) ?? [],
          contact.emails?.map(({ address }) => address) ?? [],
          localContacts,
          contact.contactProfile?.id,
        );
        setShowInvite(!foundContact);
      }
    };

    verifyInvitation();
  }, [
    contactsPermissionStatus,
    contact.contactProfile,
    contact.emails,
    contact.phoneNumbers,
    localContacts,
    storage,
  ]);

  const onInvite = useCallback(() => {
    onInviteContact(() => setShowInvite(false));
  }, [onInviteContact]);

  const onShow = useCallback(() => {
    onShowContact(contact);
  }, [contact, onShowContact]);

  const [firstname, lastname, name] = useMemo(() => {
    if (contact.firstName || contact.lastName) {
      return [
        contact.firstName,
        contact.lastName,
        `${contact.firstName} ${contact.lastName}`,
      ];
    }

    if (contact.contactProfile?.webCard?.userName) {
      return [
        contact.contactProfile.webCard.userName,
        '',
        contact.contactProfile.webCard.userName,
      ];
    }

    return ['', '', ''];
  }, [
    contact.contactProfile?.webCard?.userName,
    contact.firstName,
    contact.lastName,
  ]);

  const avatarSource = useMemo(() => {
    if (contact.contactProfile?.avatar?.uri) {
      return {
        uri: contact.contactProfile.avatar.uri,
        mediaId: contact.contactProfile.avatar.id ?? '',
        requestedSize: 26,
      };
    }
    return null;
  }, [contact.contactProfile?.avatar?.id, contact.contactProfile?.avatar?.uri]);

  return (
    <View style={styles.profile}>
      <PressableNative onPress={onShow}>
        {contact.contactProfile?.webCard?.cardIsPublished && !avatarSource ? (
          <CoverRenderer width={80} webCard={contact.webCard} />
        ) : (
          <ContactAvatar
            firstName={firstname}
            lastName={lastname}
            name={name}
            company={contact.company}
            avatar={avatarSource}
          />
        )}
      </PressableNative>
      {showInvite && !invited && (
        <PressableNative style={styles.invite} onPress={onInvite}>
          <Icon icon="invite" style={styles.icon} size={17} />
        </PressableNative>
      )}
      {!showInvite && !invited && (
        <WhatsappButton
          phoneNumber={contact?.phoneNumbers?.[0]?.number}
          style={styles.invite}
        />
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
      ArrayItemType<
        ContactsScreenLists_contacts$data['searchContacts']['edges']
      >
    >
  >['node']
>;

export default ContactSearchByDateItem;
