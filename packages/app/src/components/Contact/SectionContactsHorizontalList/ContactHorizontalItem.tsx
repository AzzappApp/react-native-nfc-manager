import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import WhatsappButton from '#components/Contact/WhatsappButton';
import CoverRenderer from '#components/CoverRenderer';
import useImageFromContact from '#hooks/useImageFromContact';
import PressableNative from '#ui/PressableNative';
import ContactAvatar from '../ContactAvatar';
import type { ContactType } from '#helpers/contactTypes';
import type { ContactActionProps } from '#screens/ContactsScreen/ContactsScreenLists';

type Props = {
  contact: ContactType;
  onShowContact: (contact: ContactType) => void;
  showContactAction: (arg: ContactActionProps | undefined) => void;
};

const ContactHorizontalItem = ({
  contact,
  onShowContact,
  showContactAction,
}: Props) => {
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
    if (contact.webCardUserName) {
      return [contact.webCardUserName, '', contact.webCardUserName];
    }
    return ['', '', ''];
  }, [contact.webCardUserName, contact.firstName, contact.lastName]);

  const onMore = useCallback(() => {
    showContactAction({
      contact,
    });
  }, [contact, showContactAction]);

  const avatarSource = useImageFromContact(contact);

  return (
    <View style={styles.profile}>
      <PressableNative onPress={onShow} onLongPress={onMore}>
        {!avatarSource && contact.webCard ? (
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
        phoneNumbers={contact?.phoneNumbers}
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
