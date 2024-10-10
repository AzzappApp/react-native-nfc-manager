import {
  addContactAsync,
  Fields,
  getContactByIdAsync,
  getContactsAsync,
  presentFormAsync,
  requestPermissionsAsync,
  updateContactAsync,
} from 'expo-contacts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Platform, View } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import Toast from 'react-native-toast-message';
import {
  graphql,
  useMutation,
  usePaginationFragment,
  usePreloadedQuery,
} from 'react-relay';
import { useDebounce } from 'use-debounce';
import { colors } from '#theme';
import { useOnFocus, useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import useAuthState from '#hooks/useAuthState';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import RoundedMenuComponent from '#ui/RoundedMenuComponent';
import SafeAreaView from '#ui/SafeAreaView';
import SearchBarStatic from '#ui/SearchBarStatic';
import Text from '#ui/Text';
import ContactsScreenSearchByDate from './ContactsScreenSearchByDate';
import ContactsScreenSearchByName from './ContactsScreenSearchByName';
import type { ContactsScreen_contacts$data } from '#relayArtifacts/ContactsScreen_contacts.graphql';
import type { ContactsScreenQuery } from '#relayArtifacts/ContactsScreenQuery.graphql';
import type { ContactsScreenRemoveContactMutation } from '#relayArtifacts/ContactsScreenRemoveContactMutation.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { Contact } from 'expo-contacts';
import type { PreloadedQuery } from 'react-relay';

export const storage = new MMKV({
  id: 'contacts',
});

const contactsScreenQuery = graphql`
  query ContactsScreenQuery($profileId: ID!) {
    profile: node(id: $profileId) {
      ... on Profile {
        nbContacts
        ...ContactsScreen_contacts
      }
    }
  }
`;

const ContactsScreen = ({
  preloadedQuery,
}: {
  preloadedQuery: PreloadedQuery<ContactsScreenQuery>;
}) => {
  const { profile } = usePreloadedQuery(contactsScreenQuery, preloadedQuery);

  const router = useRouter();
  const onClose = useCallback(() => {
    router.back();
  }, [router]);

  const styles = useStyleSheet(stylesheet);

  const [searchBy, setSearchBy] = useState('name');
  const [search, setSearch] = useState('');
  const [debounceSearch] = useDebounce(search, 500);

  const intl = useIntl();
  const [localContacts, setLocalContacts] = useState<Contact[]>([]);

  const [refreshing, setRefreshing] = useState(false);
  const { data, loadNext, hasNext, isLoadingNext, refetch } =
    usePaginationFragment(
      graphql`
        fragment ContactsScreen_contacts on Profile
        @refetchable(queryName: "ContactsScreenListQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 10 }
          name: { type: String, defaultValue: "" }
          orderBy: { type: SearchContactOrderBy, defaultValue: name }
        ) {
          searchContacts(
            after: $after
            first: $first
            name: $name
            orderBy: $orderBy
          ) @connection(key: "Profile_searchContacts") {
            __id
            edges {
              node {
                id
                firstName
                lastName
                company
                createdAt
                deviceIds
                emails {
                  label
                  address
                }
                phoneNumbers {
                  label
                  number
                }
                contactProfile {
                  id
                  webCard {
                    ...CoverRenderer_webCard
                  }
                }
                webCard {
                  ...CoverRenderer_webCard
                }
              }
            }
          }
        }
      `,
      profile,
    );

  const contacts = useMemo(() => {
    return (
      (data as ContactsScreen_contacts$data)?.searchContacts?.edges
        ?.map(edge => edge?.node)
        .filter(contact => !!contact) ?? []
    );
  }, [data]);

  const onRefresh = useCallback(() => {
    if (!isLoadingNext) {
      setRefreshing(true);
      refetch(
        { name: debounceSearch, orderBy: searchBy },
        { fetchPolicy: 'store-and-network' },
      );
      setRefreshing(false);
    }
  }, [isLoadingNext, refetch, debounceSearch, searchBy]);

  // This code is used to refresh the screen when we come back to it.
  // After a contact exchange, this screen shall be refreshed to ensure the new contact is well displayed
  // Or not.
  // In some case, the new contact shall be displayed, and during search for exemple we cannot infer if the new contact shall be displayed
  // The safest way to implement it is to refresh the screen.
  useOnFocus(onRefresh);

  const onEndReached = useCallback(() => {
    if (hasNext && !isLoadingNext) {
      loadNext(50);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  useEffect(() => {
    refetch(
      { name: debounceSearch || undefined, orderBy: searchBy },
      { fetchPolicy: 'store-and-network' },
    );
  }, [debounceSearch, refetch, searchBy]);

  const { profileInfos } = useAuthState();

  const [commitRemoveContact] =
    useMutation<ContactsScreenRemoveContactMutation>(graphql`
      mutation ContactsScreenRemoveContactMutation(
        $profileId: ID!
        $input: RemoveContactsInput!
      ) {
        removeContacts(profileId: $profileId, input: $input) {
          removedContactIds
        }
      }
    `);

  const onRemoveContacts = (contactIds: string[]) => {
    commitRemoveContact({
      variables: {
        profileId: profileInfos!.profileId,
        input: {
          contactIds,
        },
      },
      updater: (store, response) => {
        if (response?.removeContacts) {
          response.removeContacts.removedContactIds.forEach(
            removedContactId => {
              store.delete(removedContactId);
            },
          );
          const profile = store.get(profileInfos!.profileId);
          const nbContacts = profile?.getValue('nbContacts');

          if (typeof nbContacts === 'number') {
            profile?.setValue(
              nbContacts - response.removeContacts.removedContactIds.length,
              'nbContacts',
            );
          }
        }
      },
    });
  };

  const onInviteContact = useCallback(
    async (contact: ContactType, onHideInvitation: () => void) => {
      const contactToAdd = {
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
      };

      try {
        let messageToast = '';
        const { status } = await requestPermissionsAsync();
        if (status === 'granted') {
          let foundContact: Contact | undefined = undefined;
          if (storage.contains(contact.contactProfile!.id)) {
            const internalId = storage.getString(contact.contactProfile!.id);
            if (internalId) {
              foundContact = await getContactByIdAsync(internalId);
            } else {
              const contactsByDeviceId = await Promise.all(
                contact.deviceIds.map(deviceId =>
                  getContactByIdAsync(deviceId),
                ),
              );

              foundContact = contactsByDeviceId.find(
                contactByDeviceId => !!contactByDeviceId,
              );
            }
          }

          if (foundContact) {
            if (Platform.OS === 'ios') {
              await updateContactAsync({
                ...contactToAdd,
                id: foundContact.id,
              });
            } else {
              await presentFormAsync(foundContact.id, contactToAdd);
            }
            messageToast = intl.formatMessage({
              defaultMessage: 'The contact was updated successfully.',
              description:
                'Toast message when a contact is updated successfully',
            });
          } else {
            const resultId = await addContactAsync(contactToAdd);
            storage.set(contact.contactProfile!.id, resultId);
            messageToast = intl.formatMessage({
              defaultMessage: 'The contact was created successfully.',
              description:
                'Toast message when a contact is created successfully',
            });
          }

          onHideInvitation();

          Toast.show({
            type: 'success',
            text1: messageToast,
          });
        }
      } catch (e) {
        console.error(e);
      }
    },
    [intl],
  );

  useEffect(() => {
    const getLocalContacts = async () => {
      const { data } = await getContactsAsync({
        fields: [Fields.Emails, Fields.PhoneNumbers, Fields.ID],
      });
      setLocalContacts(data);
    };

    getLocalContacts();
  }, []);

  return (
    <Container style={[styles.container]}>
      <SafeAreaView
        style={styles.container}
        edges={{ bottom: 'off', top: 'additive' }}
      >
        <Header
          middleElement={
            <Text variant="large">
              <FormattedMessage
                description="ContactsScreen - Title"
                defaultMessage="{contacts, plural,
                =0 {# Contacts}
                =1 {# Contact}
                other {# Contacts}
        }"
                values={{ contacts: profile?.nbContacts ?? 0 }}
              />
            </Text>
          }
          leftElement={
            <PressableNative onPress={onClose}>
              <Icon icon="close" />
            </PressableNative>
          }
        />
        <View style={styles.menu}>
          <RoundedMenuComponent
            selected={searchBy === 'date'}
            label={'Date'}
            id={'date'}
            onSelect={() => setSearchBy('date')}
          />
          <RoundedMenuComponent
            selected={searchBy === 'name'}
            label={'Name'}
            id={'name'}
            onSelect={() => setSearchBy('name')}
          />
          {/* <RoundedMenuComponent
            selected={searchBy === 'location'}
            label={'Location'}
            id={'location'}
            onSelect={() => setSearchBy('location')}
          /> */}
        </View>
        <SearchBarStatic
          style={styles.search}
          value={search}
          placeholder={intl.formatMessage({
            defaultMessage: 'Search for name, company...',
            description: 'Search placeholder in ContactsScreen',
          })}
          onChangeText={e => setSearch(e ?? '')}
        />
        {profile && searchBy === 'name' && (
          <ContactsScreenSearchByName
            contacts={contacts}
            onEndReached={onEndReached}
            onRefresh={onRefresh}
            refreshing={refreshing}
            onRemoveContacts={onRemoveContacts}
            onInviteContact={onInviteContact}
            storage={storage}
            localContacts={localContacts}
          />
        )}
        {profile && searchBy === 'date' && (
          <ContactsScreenSearchByDate
            contacts={contacts}
            onEndReached={onEndReached}
            onRefresh={onRefresh}
            refreshing={refreshing}
            onRemoveContacts={onRemoveContacts}
            onInviteContact={onInviteContact}
            storage={storage}
            localContacts={localContacts}
          />
        )}
      </SafeAreaView>
    </Container>
  );
};

const stylesheet = createStyleSheet(theme => ({
  container: {
    flex: 1,
  },
  menu: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  search: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  section: {
    margin: 20,
  },
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
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: theme === 'light' ? colors.grey50 : colors.grey900,
  },
  initial: {
    marginVertical: 20,
  },
  webcard: {
    marginRight: 15,
  },
  infos: {
    justifyContent: 'center',
    width: '75%',
  },
  actions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 15,
  },
}));

type ContactType = NonNullable<
  NonNullable<
    NonNullable<
      ArrayItemType<ContactsScreen_contacts$data['searchContacts']['edges']>
    >
  >['node']
>;

export default relayScreen(ContactsScreen, {
  query: contactsScreenQuery,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId ?? '',
  }),
});
