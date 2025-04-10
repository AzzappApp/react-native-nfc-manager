import { PermissionStatus as ContactPermissionStatus } from 'expo-contacts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import WhatsappButton from '#components/Contact/WhatsappButton';
import CoverRenderer from '#components/CoverRenderer';
import { findLocalContact } from '#helpers/contactHelpers';
import useImageFromContact from '#hooks/useImageFromContact';
import PressableNative from '#ui/PressableNative';
import ContactAvatar from '../ContactAvatar';
import type { ContactType } from '#helpers/contactListHelpers';
import type { ContactActionProps } from '#screens/ContactsScreen/ContactsScreenLists';
import type { Contact } from 'expo-contacts';

type Props = {
  contact: ContactType;
  onShowContact: (contact: ContactType) => void;
  localContacts: Contact[];
  contactsPermissionStatus: ContactPermissionStatus;
  showContactAction: (arg: ContactActionProps | undefined) => void;
};

const ContactHorizontalItem = ({
  contact,
  onShowContact,
  localContacts,
  contactsPermissionStatus,
  showContactAction,
}: Props) => {
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    const verifyInvitation = async () => {
      if (contactsPermissionStatus === ContactPermissionStatus.GRANTED) {
        const foundContact = await findLocalContact(
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
  ]);

  const onShow = useCallback(() => {
    onShowContact(contact);
  }, [contact, onShowContact]);

  const [firstname, lastname, name] = useMemo(() => {
    if (contact.firstName || contact.lastName) {
      return [
        contact.firstName,
        contact.lastName,
        `${contact?.firstName ?? ''} ${contact?.lastName ?? ''}`.trim(),
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

  const onMore = useCallback(() => {
    showContactAction({
      contact,
      showInvite,
      hideInvitation: () => {
        setShowInvite(false);
      },
    });
  }, [contact, showContactAction, showInvite]);

  const avatarSource = useImageFromContact(contact);

  return (
    <View style={styles.profile}>
      <PressableNative onPress={onShow} onLongPress={onMore}>
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
      <WhatsappButton
        phoneNumber={contact?.phoneNumbers}
        style={styles.invite}
      />
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
});

export default ContactHorizontalItem;
