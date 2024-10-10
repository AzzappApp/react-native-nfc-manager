import { presentFormAsync, requestPermissionsAsync } from 'expo-contacts';
import { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Alert, StyleSheet, View } from 'react-native';
import { colors, textStyles } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import { findLocalContact } from '#helpers/contactCardHelpers';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { ContactsScreen_contacts$data } from '#relayArtifacts/ContactsScreen_contacts.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { Contact } from 'expo-contacts';
import type { MMKV } from 'react-native-mmkv';

type Props = {
  contact: ContactType;
  onRemoveContact: () => void;
  onInviteContact: (onHideInvitation: () => void) => void;
  storage: MMKV;
  localContacts: Contact[];
};

const ContactSearchByNameItem = ({
  contact,
  onRemoveContact,
  onInviteContact,
  storage,
  localContacts,
}: Props) => {
  const [showInvite, setShowInvite] = useState(false);
  const intl = useIntl();

  useEffect(() => {
    const verifyInvitation = async () => {
      const { status } = await requestPermissionsAsync();

      if (status === 'granted') {
        const foundContact = await findLocalContact(
          storage,
          contact.emails.map(({ address }) => address),
          contact.phoneNumbers.map(({ number }) => number),
          contact.deviceIds as string[],
          localContacts,
          contact.contactProfile?.id,
        );

        if (foundContact) {
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

  const onShow = useCallback(async () => {
    const { status } = await requestPermissionsAsync();

    const socialProfiles =
      contact.contactProfile?.contactCard?.socials
        ?.filter(social => !!social.selected)
        .map(({ label, url }) => ({ label, url })) ?? [];

    const urlAddresses =
      contact.contactProfile?.contactCard?.urls
        ?.filter(url => !!url.selected)
        .map(({ address }) => ({ label: '', url: address })) ?? [];

    const contactToShow = {
      ...contact,
      emails: contact.emails.map(({ label, address }) => ({
        label,
        email: address,
      })),
      phoneNumbers: contact.phoneNumbers.map(({ label, number }) => ({
        label,
        number,
      })),
      contactType: 'person' as const,
      name: `${contact.firstName} ${contact.lastName}`,
      socialProfiles,
      urlAddresses,
    };

    if (status === 'granted') {
      const foundContact = await findLocalContact(
        storage,
        contact.emails.map(({ address }) => address),
        contact.phoneNumbers.map(({ number }) => number),
        contact.deviceIds as string[],
        localContacts,
        contact.contactProfile?.id,
      );

      if (foundContact) {
        await presentFormAsync(foundContact.id, contactToShow, {
          allowsActions: false,
          allowsEditing: false,
        });
      } else {
        await presentFormAsync(null, contactToShow);
      }
    }
  }, [contact, localContacts, storage]);

  const onMore = useCallback(() => {
    Alert.alert(`${contact.firstName} ${contact.lastName}`, '', [
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
        onPress: onRemoveContact,
      },
      {
        text: intl.formatMessage({
          defaultMessage: 'Cancel',
          description: 'ContactsScreen - More option alert - cancel',
        }),
        style: 'cancel',
      },
    ]);
  }, [
    contact.firstName,
    contact.lastName,
    intl,
    onInvite,
    onRemoveContact,
    onShow,
  ]);

  return (
    <View key={contact.id} style={styles.contact}>
      <CoverRenderer
        style={styles.webcard}
        width={35}
        webCard={contact.webCard}
      />
      <View style={styles.infos}>
        {(contact.firstName || contact.lastName) && (
          <Text variant="large" numberOfLines={1}>
            {contact.firstName} {contact.lastName}
          </Text>
        )}
        {contact.company && (
          <Text style={styles.company} numberOfLines={1}>
            {contact.company}
          </Text>
        )}
        <Text style={(textStyles.small, styles.date)} numberOfLines={1}>
          {new Date(contact.createdAt).toLocaleDateString()}
        </Text>
      </View>
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
      ArrayItemType<ContactsScreen_contacts$data['searchContacts']['edges']>
    >
  >['node']
>;

const styles = StyleSheet.create({
  contact: {
    marginVertical: 20,
    flexDirection: 'row',
  },
  date: {
    color: colors.grey400,
    marginTop: 5,
  },
  company: {
    marginTop: 5,
  },
  webcard: {
    marginRight: 15,
  },
  infos: {
    justifyContent: 'center',
  },
  actions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 15,
  },
});

export default ContactSearchByNameItem;
