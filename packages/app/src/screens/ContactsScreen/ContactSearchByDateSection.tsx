import {
  addContactAsync,
  updateContactAsync,
  PermissionStatus as ContactPermissionStatus,
} from 'expo-contacts';
import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Alert, FlatList, Platform, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { colors } from '#theme';
import { findLocalContact } from '#helpers/contactCardHelpers';
import {
  buildLocalContact,
  reworkContactForDeviceInsert,
} from '#helpers/contactListHelpers';
import { keyExtractor } from '#helpers/idHelpers';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import ContactSearchByDateItem from './ContactSearchByDateItem';
import type { ContactsScreenLists_contacts$data } from '#relayArtifacts/ContactsScreenLists_contacts.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { Contact } from 'expo-contacts';
import type { AlertButton, ListRenderItemInfo } from 'react-native';
import type { MMKV } from 'react-native-mmkv';

type Props = {
  title: string;
  data: ContactType[];
  onRemoveContacts: (contacts: string[]) => void;
  storage: MMKV;
  localContacts: Contact[];
  onInviteContact: (contact: ContactType, onHideInvitation: () => void) => void;
  onShowContact: (contact: ContactType) => void;
  contactsPermissionStatus: ContactPermissionStatus;
};

const ContactSearchByDateSection = ({
  title,
  data,
  onRemoveContacts,
  storage,
  localContacts,
  onInviteContact,
  onShowContact,
  contactsPermissionStatus,
}: Props) => {
  const intl = useIntl();
  const [invited, setInvited] = useState(false);

  const onInvite = useCallback(async () => {
    try {
      if (contactsPermissionStatus === ContactPermissionStatus.GRANTED) {
        const contactsToCreate: Array<{
          contact: Contact;
          profileId?: string;
        }> = [];
        const contactsToUpdate: Contact[] = [];

        await Promise.all(
          data.map(async contact => {
            const contactToAdd: Contact = await buildLocalContact(contact);

            const foundContact = await findLocalContact(
              storage,
              contact.phoneNumbers.map(({ number }) => number),
              contact.emails.map(({ address }) => address),
              localContacts,
              contact.contactProfile?.id,
            );

            if (foundContact) {
              contactsToUpdate.push({
                ...contactToAdd,
                id: foundContact.id,
              });
            } else {
              contactsToCreate.push({
                contact: contactToAdd,
                profileId: contact.contactProfile?.id,
              });
            }
          }),
        );

        await Promise.all([
          ...contactsToCreate.map(async contactToCreate => {
            const contact = reworkContactForDeviceInsert(
              contactToCreate.contact,
            );

            const resultId = await addContactAsync(contact);
            if (contactToCreate.profileId) {
              storage.set(contactToCreate.profileId, resultId);
            }
          }),
          ...contactsToUpdate.map(contactToUpdate => {
            const contact = reworkContactForDeviceInsert(contactToUpdate);
            return updateContactAsync(contact);
          }),
        ]);

        setInvited(true);
        Toast.show({
          type: 'success',
          text1: intl.formatMessage({
            defaultMessage: 'The contacts were invited successfully.',
            description:
              'Toast message when contacts were invited successfully',
          }),
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, [contactsPermissionStatus, data, intl, localContacts, storage]);

  const onRemove = () => {
    onRemoveContacts(data.map(({ id }) => id));
  };

  const onMore = () => {
    const options: AlertButton[] = [
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
        text: intl.formatMessage(
          {
            defaultMessage: `{contacts, plural,
                =1 {Remove contact}
                other {Remove contacts}}`,
            description: 'ContactsScreen - More option alert - remove',
          },
          { contacts: data.length },
        ),
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
    ];

    if (Platform.OS === 'ios') {
      options.unshift({
        text: intl.formatMessage({
          defaultMessage: "Save to my phone's Contacts",
          description: 'ContactsScreen - More option alert - save',
        }),
        onPress: onInvite,
      });
    }

    Alert.alert(
      intl.formatMessage(
        {
          defaultMessage: `{contacts, plural,
                =1 {# contact}
                other {# contacts}}`,
          description: 'ContactsScreenSearchByDate - Title for onMore alert',
        },
        { contacts: data.length },
      ),
      '',
      options,
    );
  };

  const RenderProfile = useCallback(
    ({ item }: ListRenderItemInfo<ContactType>) => {
      return (
        <ContactSearchByDateItem
          contact={item}
          onInviteContact={onHideInvitation => {
            onInviteContact(item, onHideInvitation);
          }}
          onShowContact={onShowContact}
          storage={storage}
          localContacts={localContacts}
          invited={invited}
          contactsPermissionStatus={contactsPermissionStatus}
        />
      );
    },
    [
      invited,
      localContacts,
      onInviteContact,
      onShowContact,
      storage,
      contactsPermissionStatus,
    ],
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionTitle}>
        <View>
          <Text variant="large">{title}</Text>
          <Text variant="small" style={styles.count}>
            <FormattedMessage
              defaultMessage="{contacts, plural,
              =0 {# Contacts}
              =1 {# Contact}
              other {# Contacts}
      }"
              description="ContactsScreenSearchByDate - Contacts counter under section by date"
              values={{ contacts: data.length }}
            />
          </Text>
        </View>
        <PressableNative onPress={onMore}>
          <Icon icon="more" />
        </PressableNative>
      </View>

      <FlatList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={RenderProfile}
        horizontal
        contentContainerStyle={styles.profiles}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        nestedScrollEnabled
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    color: colors.grey400,
    marginTop: 5,
  },
  profiles: {
    paddingLeft: 20,
    marginTop: 15,
    gap: 5,
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

export default ContactSearchByDateSection;
