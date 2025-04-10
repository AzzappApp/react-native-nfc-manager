import { PermissionStatus as ContactPermissionStatus } from 'expo-contacts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import { colors, textStyles } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import {
  findLocalContact,
  getFriendlyNameFromLocation,
} from '#helpers/contactHelpers';
import useImageFromContact from '#hooks/useImageFromContact';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import ContactAvatar from '../ContactAvatar';
import WhatsappButton from '../WhatsappButton';
import type { ContactType } from '#helpers/contactListHelpers';
import type { ContactActionProps } from '#screens/ContactsScreen/ContactsScreenLists';
import type { Contact } from 'expo-contacts';

type Props = {
  contact: ContactType;
  onShowContact: (contact: ContactType) => void;
  localContacts: Contact[];
  contactsPermissionStatus: ContactPermissionStatus;
  showContactAction: (arg?: ContactActionProps) => void;
};

const COVER_WIDTH = 35;

const ContactSearchByNameItem = ({
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
    contact.contactProfile?.id,
    contact.emails,
    contact.phoneNumbers,
    contactsPermissionStatus,
    localContacts,
  ]);

  const onShow = useCallback(() => {
    onShowContact(contact);
  }, [contact, onShowContact]);

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

  const location = getFriendlyNameFromLocation(contact.meetingPlace);
  return (
    <View key={contact.id} style={styles.contact}>
      <PressableNative
        onPress={onShow}
        onLongPress={onMore}
        style={styles.contactInfos}
      >
        {contact.contactProfile?.webCard?.cardIsPublished && !avatarSource ? (
          <View style={styles.cover}>
            <CoverRenderer
              style={styles.webcard}
              width={COVER_WIDTH}
              webCard={contact.webCard}
              large
            />
          </View>
        ) : (
          <ContactAvatar
            style={styles.webcard}
            firstName={firstname}
            lastName={lastname}
            name={name}
            company={contact.company}
            small
            avatar={avatarSource}
          />
        )}
        <View style={styles.infos}>
          {(contact.firstName || contact.lastName) && (
            <Text variant="large" numberOfLines={1}>
              {`${contact?.firstName ?? ''} ${contact?.lastName ?? ''}`.trim()}
            </Text>
          )}
          {!contact.firstName &&
            !contact.lastName &&
            contact.contactProfile?.webCard?.userName && (
              <Text variant="large" numberOfLines={1}>
                {contact.contactProfile.webCard.userName}
              </Text>
            )}
          {contact.company && <Text numberOfLines={1}>{contact.company}</Text>}
          <Text style={(textStyles.small, styles.date)} numberOfLines={1}>
            {new Date(contact.createdAt).toLocaleDateString()}
            {location ? ` - ${location}` : ''}
          </Text>
        </View>
      </PressableNative>
      <View style={styles.actions}>
        <WhatsappButton phoneNumber={contact?.phoneNumbers} />
        <PressableNative onPress={onMore}>
          <Icon icon="more" />
        </PressableNative>
      </View>
    </View>
  );
};

const GAP = 15;

const styles = StyleSheet.create({
  contact: {
    marginVertical: 20,
    flexDirection: 'row',
    columnGap: GAP,
  },
  contactInfos: {
    flexDirection: 'row',
    flex: 1,
    columnGap: GAP,
  },
  date: {
    color: colors.grey400,
  },
  cover: {
    width: COVER_WIDTH,
    borderRadius: 4,
    overflow: 'hidden',
  },
  webcard: {
    columnGap: GAP,
  },
  infos: {
    justifyContent: 'center',
    flex: 1,
    rowGap: 5,
    height: COVER_WIDTH / COVER_RATIO,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: GAP,
  },
});

export default ContactSearchByNameItem;
