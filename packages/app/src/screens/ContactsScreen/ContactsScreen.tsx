import {
  addContactAsync,
  getContactByIdAsync,
  presentFormAsync,
  requestPermissionsAsync,
  updateContactAsync,
} from 'expo-contacts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Alert, Platform, SectionList, View } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import Toast from 'react-native-toast-message';
import {
  graphql,
  useMutation,
  usePaginationFragment,
  usePreloadedQuery,
} from 'react-relay';
import { useDebounce } from 'use-debounce';
import { colors, textStyles } from '#theme';
import CoverRenderer from '#components/CoverRenderer';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import useAuthState from '#hooks/useAuthState';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import RoundedMenuComponent from '#ui/RoundedMenuComponent';
import SafeAreaView from '#ui/SafeAreaView';
import SearchBarStatic from '#ui/SearchBarStatic';
import Text from '#ui/Text';
import type { ContactsScreen_contacts$data } from '#relayArtifacts/ContactsScreen_contacts.graphql';
import type { ContactsScreenQuery } from '#relayArtifacts/ContactsScreenQuery.graphql';
import type { ContactsScreenRemoveContactMutation } from '#relayArtifacts/ContactsScreenRemoveContactMutation.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { Contact } from 'expo-contacts';
import type { SectionListData, SectionListRenderItemInfo } from 'react-native';
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
        ) {
          searchContacts(after: $after, first: $first, name: $name)
            @connection(key: "Profile_searchContacts") {
            __id
            edges {
              node {
                id
                firstName
                lastName
                company
                createdAt
                contactProfile {
                  id
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

  const sections = useMemo(() => {
    const contacts =
      (data as ContactsScreen_contacts$data)?.searchContacts?.edges
        ?.map(edge => edge?.node)
        .filter(contact => !!contact) ?? [];

    return contacts?.reduce(
      (accumulator, contact) => {
        const initial = contact.firstName[0] ?? '';

        const existingSection = accumulator.find(
          section => section.initial === initial,
        );

        if (!existingSection) {
          accumulator.push({ initial, data: [contact] });
        } else {
          existingSection.data.push(contact);
        }

        return accumulator;
      },
      [] as Array<{ initial: string; data: ContactType[] }>,
    );
  }, [data]);

  const onRefresh = useCallback(() => {
    if (!isLoadingNext) {
      setRefreshing(true);
      refetch({ name: debounceSearch }, { fetchPolicy: 'store-and-network' });
      setRefreshing(false);
    }
  }, [debounceSearch, isLoadingNext, refetch]);

  const onEndReached = useCallback(() => {
    if (hasNext && !isLoadingNext) {
      loadNext(50);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  useEffect(() => {
    refetch(
      { name: debounceSearch || undefined },
      { fetchPolicy: 'store-and-network' },
    );
  }, [debounceSearch, refetch]);

  const { bottom } = useScreenInsets();

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
        <SectionList
          accessibilityRole="list"
          sections={sections}
          keyExtractor={sectionKeyExtractor}
          renderItem={RenderListItem}
          renderSectionHeader={RenderHeaderSection}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={[styles.section, { paddingBottom: bottom }]}
          ItemSeparatorComponent={RenderItemSeparator}
          onEndReachedThreshold={0.5}
          keyboardShouldPersistTaps="always"
        />
      </SafeAreaView>
    </Container>
  );
};

const RenderItemSeparator = () => {
  const styles = useStyleSheet(stylesheet);
  return <View style={styles.separator} />;
};

const RenderListItem = ({
  item: contact,
}: SectionListRenderItemInfo<
  ContactType,
  { initial: string; data: ContactType[] }
>) => {
  const styles = useStyleSheet(stylesheet);
  const [showInvite, setShowInvite] = useState(false);
  const intl = useIntl();

  useEffect(() => {
    const verifyInvitation = async () => {
      const { status } = await requestPermissionsAsync();

      if (status === 'granted') {
        if (storage.contains(contact.contactProfile!.id)) {
          const internalId = storage.getString(contact.contactProfile!.id);
          if (internalId) {
            return;
          }
        }

        setShowInvite(true);
      }
    };

    verifyInvitation();
  }, [contact.contactProfile]);

  const onShow = useCallback(async () => {
    const { status } = await requestPermissionsAsync();

    const contactToShow = {
      ...contact,
      contactType: 'person' as const,
      name: `${contact.firstName} ${contact.lastName}`,
    };

    if (status === 'granted') {
      let foundContact: Contact | undefined = undefined;
      if (storage.contains(contact.contactProfile!.id)) {
        const internalId = storage.getString(contact.contactProfile!.id);
        if (internalId) {
          foundContact = await getContactByIdAsync(internalId);
        }
      }

      if (foundContact) {
        await presentFormAsync(foundContact.id, contactToShow);
      } else {
        await presentFormAsync(null, contactToShow);
      }
    }
  }, [contact]);

  const onInvite = useCallback(async () => {
    const contactToAdd = {
      ...contact,
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
            description: 'Toast message when a contact is updated successfully',
          });
        } else {
          const resultId = await addContactAsync(contactToAdd);
          storage.set(contact.contactProfile!.id, resultId);
          messageToast = intl.formatMessage({
            defaultMessage: 'The contact was created successfully.',
            description: 'Toast message when a contact is created successfully',
          });
        }

        setShowInvite(false);

        Toast.show({
          type: 'success',
          text1: messageToast,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, [contact, intl]);

  const { profileInfos } = useAuthState();

  const [commitRemove] = useMutation<ContactsScreenRemoveContactMutation>(
    graphql`
      mutation ContactsScreenRemoveContactMutation(
        $profileId: ID!
        $input: RemoveContactInput!
      ) {
        removeContact(profileId: $profileId, input: $input) {
          removedContactId
        }
      }
    `,
  );

  const onRemove = useCallback(async () => {
    commitRemove({
      variables: {
        profileId: profileInfos!.profileId,
        input: {
          profileId: contact.contactProfile!.id,
        },
      },
      updater: (store, response) => {
        if (response?.removeContact) {
          store.delete(response.removeContact.removedContactId);
        }
      },
    });
  }, [commitRemove, contact.contactProfile, profileInfos]);

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
        onPress: onRemove,
      },
      {
        text: intl.formatMessage({
          defaultMessage: 'Cancel',
          description: 'ContactsScreen - More option alert - cancel',
        }),
        style: 'cancel',
      },
    ]);
  }, [contact.firstName, contact.lastName, intl, onInvite, onRemove, onShow]);

  return (
    <View key={contact.id} style={styles.contact}>
      <CoverRenderer
        style={styles.webcard}
        width={35}
        webCard={contact.webCard}
      />
      <View style={styles.infos}>
        <Text variant="large">
          {contact.firstName} {contact.lastName}
        </Text>
        {contact.company && (
          <Text style={styles.company}>{contact.company}</Text>
        )}
        <Text style={(textStyles.small, styles.date)}>
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
const RenderHeaderSection = ({
  section: { initial },
}: {
  section: SectionListData<
    ContactType,
    { initial: string; data: ContactType[] }
  >;
}) => {
  return <Text style={{ marginVertical: 20 }}>{initial}</Text>;
};

const sectionKeyExtractor = (item: { id: string }) => {
  return item.id;
};

type ContactType = NonNullable<
  NonNullable<
    NonNullable<
      ArrayItemType<ContactsScreen_contacts$data['searchContacts']['edges']>
    >
  >['node']
>;

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
  },
  actions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 15,
  },
}));

export default relayScreen(ContactsScreen, {
  query: contactsScreenQuery,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId ?? '',
  }),
});
