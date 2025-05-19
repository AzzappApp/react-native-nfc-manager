import { Suspense, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import {
  graphql,
  useFragment,
  useMutation,
  usePreloadedQuery,
} from 'react-relay';
import { useDebounce } from 'use-debounce';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { getAuthState } from '#helpers/authStore';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import useBoolean from '#hooks/useBoolean';
import useKeyboardHeight from '#hooks/useKeyboardHeight';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import LoadingView from '#ui/LoadingView';
import RoundedMenuComponent from '#ui/RoundedMenuComponent';
import SearchBarStatic from '#ui/SearchBarStatic';
import TabView from '#ui/TabView';
import Text from '#ui/Text';
import ContactActionModal from './ContactActionModal';
import ContactsByDateList from './ContactsByDateList';
import ContactsByLocationList from './ContactsByLocationList';
import ContactsByNameList from './ContactsByNameList';
import type { ContactType } from '#helpers/contactTypes';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ContactsScreenListsMutationUpdateContactsLastViewMutation } from '#relayArtifacts/ContactsScreenListsMutationUpdateContactsLastViewMutation.graphql';
import type { ContactsScreenQuery } from '#relayArtifacts/ContactsScreenQuery.graphql';
import type { ContactsScreenTitle_user$key } from '#relayArtifacts/ContactsScreenTitle_user.graphql';
import type { ContactsRoute } from '#routes';

const contactsScreenQuery = graphql`
  query ContactsScreenQuery {
    currentUser {
      ...ContactsScreenTitle_user
    }
    ...ContactsByDateList_root
  }
`;

const ContactsScreen = ({
  preloadedQuery,
}: RelayScreenProps<ContactsRoute, ContactsScreenQuery>) => {
  const router = useRouter();
  const data = usePreloadedQuery(contactsScreenQuery, preloadedQuery);
  const { currentUser } = data;

  const styles = useStyleSheet(stylesheet);

  const [currentTab, setCurrentTab] = useState<'date' | 'location' | 'name'>(
    'date',
  );
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [debounceSearch] = useDebounce(search, 500);
  const [isAddNewContactMenuOpen, openNewContactMenu, closeNewContactMenu] =
    useBoolean();

  const [commitContactsLastView] =
    useMutation<ContactsScreenListsMutationUpdateContactsLastViewMutation>(
      graphql`
        mutation ContactsScreenListsMutationUpdateContactsLastViewMutation(
          $profileId: ID!
        ) {
          updateContactsLastView(profileId: $profileId)
        }
      `,
    );

  useEffect(() => {
    const profileId = getAuthState().profileInfos?.profileId;
    if (!profileId) {
      return;
    }
    commitContactsLastView({
      variables: {
        profileId,
      },
    });
  }, [commitContactsLastView]);

  const [contactActionData, setContactActionData] = useState<
    ContactType | ContactType[] | undefined
  >();

  const onShowContact = useCallback(
    async (contact: ContactType) => {
      router.push({
        route: 'CONTACT_DETAILS',
        params: {
          contactId: contact.id,
          profileId: contact.profileId,
          webCardId: contact.webCardId,
        },
      });
    },
    [router],
  );

  const onCreateWithScanner = useCallback(() => {
    closeNewContactMenu();
    router.push({
      route: 'CONTACT_CREATE',
      params: { showCardScanner: true },
    });
  }, [closeNewContactMenu, router]);

  const onCreateContact = useCallback(() => {
    closeNewContactMenu();
    router.push({
      route: 'CONTACT_CREATE',
      params: { showCardScanner: false },
    });
  }, [closeNewContactMenu, router]);

  const intl = useIntl();

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  const { height: screenHeight, width: screenWidth } = useScreenDimensions();
  const insets = useScreenInsets();
  const keyboardHeight = useKeyboardHeight();
  const contentHeight = useAnimatedStyle(() => {
    return {
      height: screenHeight - keyboardHeight.value,
      width: screenWidth,
    };
  });

  return (
    <>
      <Animated.View
        style={[{ height: screenHeight, width: screenWidth }, contentHeight]}
      >
        <Container style={[styles.container, { paddingTop: insets.top }]}>
          <Header
            leftElement={
              <IconButton icon="close" onPress={onBack} variant="icon" />
            }
            middleElement={
              <Suspense
                fallback={
                  <Text variant="large" style={styles.title}>
                    <FormattedMessage
                      defaultMessage="Contacts"
                      description="ContactsScreen - Default title"
                    />
                  </Text>
                }
              >
                <ContactScreenTitle user={currentUser} />
              </Suspense>
            }
          />
          <View style={styles.menu}>
            <RoundedMenuComponent
              selected={currentTab === 'date'}
              label={intl.formatMessage({
                defaultMessage: 'Date',
                description: 'Date selector label in ContactsScreen',
              })}
              id="date"
              onSelect={() => setCurrentTab('date')}
            />
            <RoundedMenuComponent
              selected={currentTab === 'name'}
              label={intl.formatMessage({
                defaultMessage: 'Name',
                description: 'Name selector label in ContactsScreen',
              })}
              id="name"
              onSelect={() => setCurrentTab('name')}
            />
            <RoundedMenuComponent
              selected={currentTab === 'location'}
              label={intl.formatMessage({
                defaultMessage: 'Location',
                description: 'Location selector label in ContactsScreen',
              })}
              id="location"
              onSelect={() => setCurrentTab('location')}
            />
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
          <Button
            style={styles.createButton}
            label={
              <FormattedMessage
                description="ContactsScreen - Create contact button"
                defaultMessage="Add a new Contact"
              />
            }
            onPress={openNewContactMenu}
          />
          <TabView
            currentTab={currentTab}
            style={styles.content}
            tabs={[
              {
                id: 'date',
                element: (
                  <Suspense fallback={<LoadingView />}>
                    <ContactsByDateList
                      queryRef={data}
                      search={debounceSearch}
                      onShowContact={onShowContact}
                      showContactAction={setContactActionData}
                      contentContainerStyle={{ paddingBottom: insets.bottom }}
                    />
                  </Suspense>
                ),
              },
              {
                id: 'name',
                element: (
                  <Suspense fallback={<LoadingView />}>
                    <ContactsByNameList
                      search={debounceSearch}
                      location={undefined}
                      date={undefined}
                      onShowContact={onShowContact}
                      showContactAction={setContactActionData}
                      contentContainerStyle={{ paddingBottom: insets.bottom }}
                    />
                  </Suspense>
                ),
              },
              {
                id: 'location',
                element: (
                  <Suspense fallback={<LoadingView />}>
                    <ContactsByLocationList
                      search={debounceSearch}
                      onShowContact={onShowContact}
                      showContactAction={setContactActionData}
                      contentContainerStyle={{ paddingBottom: insets.bottom }}
                    />
                  </Suspense>
                ),
              },
            ]}
          />
        </Container>
      </Animated.View>
      <BottomSheetModal
        visible={isAddNewContactMenuOpen}
        onDismiss={closeNewContactMenu}
        style={styles.addNewContactMenu}
      >
        <Text variant="large" style={styles.addNewContactMenuTitle}>
          <FormattedMessage
            description="ContactsScreen - Title in Add New Contact Menu"
            defaultMessage="Add a new contact"
          />
        </Text>
        <Button
          variant="secondary"
          style={styles.addManualyButton}
          label={
            <FormattedMessage
              description="ContactsScreen - Scan a Card, Badge, email signature Add New Contact Menu"
              defaultMessage="Scan a Card, Badge, email signature..."
            />
          }
          leftElement={<Icon icon="scan" />}
          textStyle={styles.addManualyButtonLabel}
          onPress={onCreateWithScanner}
        />
        <Button
          variant="secondary"
          style={styles.addManualyButton}
          label={
            <FormattedMessage
              description="ContactsScreen - Add manually button label in Add New Contact Menu"
              defaultMessage="Add manually"
            />
          }
          leftElement={<Icon icon="edit" />}
          textStyle={styles.addManualyButtonLabel}
          onPress={onCreateContact}
        />
      </BottomSheetModal>
      <ContactActionModal
        data={contactActionData}
        close={() => setContactActionData(undefined)}
        onShow={onShowContact}
      />
    </>
  );
};

export default relayScreen(ContactsScreen, {
  query: contactsScreenQuery,
  profileBound: false,
  getScreenOptions: () => ({
    stackAnimation: 'slide_from_bottom',
  }),
});

const ContactScreenTitle = ({
  user: userKey,
}: {
  user: ContactsScreenTitle_user$key | null;
}) => {
  const styles = useStyleSheet(stylesheet);
  const user = useFragment(
    graphql`
      fragment ContactsScreenTitle_user on User {
        id
        nbContacts
      }
    `,
    userKey,
  );

  return (
    <Text variant="large" style={styles.title}>
      <FormattedMessage
        defaultMessage="{contacts, plural,=0 {# contacts received}=1 {# contact received}other {# contacts received}}"
        description="ContactsScreen - Title"
        values={{ contacts: user?.nbContacts ?? 0 }}
      />
    </Text>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  container: {
    flex: 1,
  },
  title: {
    textAlign: 'center',
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
  createButton: {
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
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey900,
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
  addNewContactMenu: {
    padding: 20,
  },
  addNewContactMenuTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  addManualyButton: {
    borderWidth: 0,
  },
  addManualyButtonLabel: {
    flex: 1,
    paddingLeft: 20,
  },
  content: {
    flex: 1,
  },
}));
