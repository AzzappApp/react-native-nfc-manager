import { requestPermissionsAsync } from 'expo-contacts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Alert, StyleSheet, View } from 'react-native';
import { colors, textStyles } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import { findLocalContact } from '#helpers/contactCardHelpers';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import ContactAvatar from './ContactAvatar';
import type { ContactsScreenLists_contacts$data } from '#relayArtifacts/ContactsScreenLists_contacts.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { Contact } from 'expo-contacts';
import type { MMKV } from 'react-native-mmkv';

type Props = {
  contact: ContactType;
  onRemoveContact: (contacts: string[]) => void;
  onInviteContact: (contact: ContactType, onHideInvitation: () => void) => void;
  onShowContact: (contact: ContactType) => void;
  storage: MMKV;
  localContacts: Contact[];
};

const ContactSearchByNameItem = ({
  contact,
  onRemoveContact,
  onInviteContact,
  onShowContact,
  storage,
  localContacts,
}: Props) => {
  const [showInvite, setShowInvite] = useState(false);
  const intl = useIntl();

  const onRemove = useCallback(() => {
    onRemoveContact([contact.id]);
  }, [contact.id, onRemoveContact]);

  useEffect(() => {
    const verifyInvitation = async () => {
      const { status } = await requestPermissionsAsync();

      if (status === 'granted') {
        const foundContact = await findLocalContact(
          storage,
          contact.phoneNumbers.map(({ number }) => number),
          contact.emails.map(({ address }) => address),
          localContacts,
          contact.contactProfile?.id,
        );
        setShowInvite(!foundContact);
      }
    };

    verifyInvitation();
  }, [
    contact.contactProfile,
    contact.emails,
    contact.phoneNumbers,
    localContacts,
    storage,
  ]);

  const onInvite = useCallback(() => {
    onInviteContact(contact, () => setShowInvite(false));
  }, [contact, onInviteContact]);

  const onShow = useCallback(() => {
    onShowContact(contact);
  }, [contact, onShowContact]);

  const onMore = useCallback(() => {
    Alert.alert(
      `${contact.firstName} ${contact.lastName}`,
      '',
      [
        {
          text: intl.formatMessage({
            defaultMessage: 'View Contact',
            description: 'ContactsScreen - More option alert - view',
          }),
          onPress: onShow,
        },
        // {
        //   text: intl.formatMessage({
        //     defaultMessage: 'Share Contact',
        //     description: 'ContactsScreen - More option alert - share',
        //   }),
        //   onPress: () => {
        //     // @TODO: how to share without a pre-generated URL?
        //   },
        // },
        {
          text: intl.formatMessage({
            defaultMessage: "Save to my phone's Contact",
            description: 'ContactsScreen - More option alert - save',
          }),
          onPress: onInvite,
        },
        {
          text: intl.formatMessage({
            defaultMessage: 'Remove contact',
            description: 'ContactsScreen - More option alert - remove',
          }),
          style: 'destructive',
          onPress: onRemove,
        },
        {
          text: intl.formatMessage({
            defaultMessage: 'Cancel',
            description: 'ContactsScreen - More option alert - cancel',
          }),
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  }, [contact.firstName, contact.lastName, intl, onInvite, onRemove, onShow]);

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

  return (
    <View key={contact.id} style={styles.contact}>
      <PressableNative onPress={onShow} style={styles.contactInfos}>
        {contact.contactProfile?.webCard?.cardIsPublished && !avatarSource ? (
          <CoverRenderer
            style={styles.webcard}
            width={35}
            webCard={contact.webCard}
          />
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
              {contact.firstName} {contact.lastName}
            </Text>
          )}
          {!contact.firstName &&
            !contact.lastName &&
            contact.contactProfile?.webCard?.userName && (
              <Text variant="large" numberOfLines={1}>
                {contact.firstName} {contact.lastName}
              </Text>
            )}
          {!contact.firstName &&
            !contact.lastName &&
            contact.contactProfile?.webCard?.userName && (
              <Text variant="large" numberOfLines={1}>
                {contact.firstName} {contact.lastName}
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
          </Text>
        </View>
      </PressableNative>
      <View style={styles.actions}>
        {showInvite && (
          <PressableNative onPress={onInvite}>
            <Icon icon="invite" />
          </PressableNative>
        )}

        <PressableNative onPress={onMore}>
          <Icon icon="more" />
        </PressableNative>
      </View>
    </View>
  );
};

type ContactType = NonNullable<
  NonNullable<
    NonNullable<
      ArrayItemType<
        ContactsScreenLists_contacts$data['searchContacts']['edges']
      >
    >
  >['node']
>;

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
  webcard: {
    columnGap: GAP,
  },
  infos: {
    justifyContent: 'center',
    flex: 1,
    rowGap: 5,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: GAP,
  },
});

export default ContactSearchByNameItem;
