import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Animated, View } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';
import {
  graphql,
  useFragment,
  useMutation,
  usePreloadedQuery,
} from 'react-relay';
import { useDebounce } from 'use-debounce';
import { shadow } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { getAuthState } from '#helpers/authStore';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import useBoolean from '#hooks/useBoolean';
import useKeyboardHeight from '#hooks/useKeyboardHeight';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button, { BUTTON_HEIGHT } from '#ui/Button';
import Container from '#ui/Container';
import Header from '#ui/Header';
import Icon from '#ui/Icon';
import IconButton from '#ui/IconButton';
import LoadingView from '#ui/LoadingView';
import RoundedMenuComponent from '#ui/RoundedMenuComponent';
import SearchBarStatic from '#ui/SearchBarStatic';
import TabView from '#ui/TabView';
import Text from '#ui/Text';
import ContactsByDateList from '../../components/Contact/ContactsByDateList';
import ContactsByLocationList from '../../components/Contact/ContactsByLocationList';
import UserContactsList from '../../components/Contact/UserContactsList';
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

  const onShowContact = useCallback(
    async (contactId: string) => {
      router.push({
        route: 'CONTACT_DETAILS',
        params: { contactId },
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

  const { height: screenHeight } = useScreenDimensions();
  const insets = useScreenInsets();

  const { progress: keyboardProgress } = useReanimatedKeyboardAnimation();
  const keyboardHeight = useKeyboardHeight();
  const footHeight = 20 + BUTTON_HEIGHT + insets.bottom;
  const contentHeight = useAnimatedStyle(() => {
    return {
      height:
        screenHeight -
        keyboardHeight.value -
        (1 - keyboardProgress.value) * footHeight,
    };
  });

  const scrollByDateAnimatedValue = useMemo(() => new Animated.Value(0), []);
  const scrollByDateEvent = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollByDateAnimatedValue } } }],
    { useNativeDriver: false },
  );

  const scrollByNameAnimatedValue = useMemo(() => new Animated.Value(0), []);
  const scrollByNameEvent = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollByNameAnimatedValue } } }],
    { useNativeDriver: false },
  );
  const scrollByLocationAnimatedValue = useMemo(
    () => new Animated.Value(0),
    [],
  );
  const scrollByLocationEvent = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollByLocationAnimatedValue } } }],
    { useNativeDriver: false },
  );

  const scrollAnimatedValue = useMemo(() => {
    if (currentTab === 'date') {
      return scrollByDateAnimatedValue;
    }
    if (currentTab === 'name') {
      return scrollByNameAnimatedValue;
    }
    return scrollByLocationAnimatedValue;
  }, [
    currentTab,
    scrollByDateAnimatedValue,
    scrollByLocationAnimatedValue,
    scrollByNameAnimatedValue,
  ]);

  return (
    <>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <Reanimated.View
            style={[{ height: screenHeight - footHeight }, contentHeight]}
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
                rightElement={<View style={{ width: 24 }} />}
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
                  style={styles.menuLeft}
                />
                <RoundedMenuComponent
                  selected={currentTab === 'name'}
                  label={intl.formatMessage({
                    defaultMessage: 'Name',
                    description: 'Name selector label in ContactsScreen',
                  })}
                  id="name"
                  onSelect={() => setCurrentTab('name')}
                  style={styles.menuMiddle}
                />
                <RoundedMenuComponent
                  selected={currentTab === 'location'}
                  label={intl.formatMessage({
                    defaultMessage: 'Location',
                    description: 'Location selector label in ContactsScreen',
                  })}
                  id="location"
                  onSelect={() => setCurrentTab('location')}
                  style={styles.menuRight}
                />
              </View>
              <Animated.View
                style={{
                  height: scrollAnimatedValue.interpolate({
                    inputRange: [0, 56],
                    outputRange: [56, 0],
                    extrapolate: 'clamp',
                  }),
                  overflow: 'hidden',
                }}
              >
                <SearchBarStatic
                  style={styles.search}
                  value={search}
                  placeholder={intl.formatMessage({
                    defaultMessage: 'Search for name, company...',
                    description: 'Search placeholder in ContactsScreen',
                  })}
                  onChangeText={e => setSearch(e ?? '')}
                />
              </Animated.View>
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
                          renderScrollComponent={props => (
                            <Animated.ScrollView
                              {...props}
                              onScroll={scrollByDateEvent}
                            />
                          )}
                        />
                      </Suspense>
                    ),
                  },
                  {
                    id: 'name',
                    element: (
                      <Suspense fallback={<LoadingView />}>
                        <UserContactsList
                          search={debounceSearch}
                          location={undefined}
                          date={undefined}
                          onShowContact={onShowContact}
                          renderScrollComponent={props => (
                            <Animated.ScrollView
                              {...props}
                              onScroll={scrollByNameEvent}
                            />
                          )}
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
                          renderScrollComponent={props => (
                            <Animated.ScrollView
                              {...props}
                              onScroll={scrollByLocationEvent}
                            />
                          )}
                        />
                      </Suspense>
                    ),
                  },
                ]}
              />
            </Container>
          </Reanimated.View>
        </View>
        <Container style={[styles.footer, { paddingBottom: insets.bottom }]}>
          <Button
            label={
              <FormattedMessage
                description="ContactsScreen - Create contact button"
                defaultMessage="Add a new Contact"
              />
            }
            onPress={openNewContactMenu}
          />
        </Container>
      </View>
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
          style={styles.addManuallyButton}
          label={
            <FormattedMessage
              description="ContactsScreen - Scan a Card, Badge, email signature Add New Contact Menu"
              defaultMessage="Scan a Card, Badge, email signature..."
            />
          }
          leftElement={<Icon icon="scan" />}
          textStyle={styles.addManuallyButtonLabel}
          onPress={onCreateWithScanner}
        />
        <Button
          variant="secondary"
          style={styles.addManuallyButton}
          label={
            <FormattedMessage
              description="ContactsScreen - Add manually button label in Add New Contact Menu"
              defaultMessage="Add manually"
            />
          }
          leftElement={<Icon icon="edit" />}
          textStyle={styles.addManuallyButtonLabel}
          onPress={onCreateContact}
        />
      </BottomSheetModal>
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
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  menuLeft: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  menuMiddle: {
    flex: 1,
    borderRadius: 0,
  },
  menuRight: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 0,
  },
  search: {
    marginHorizontal: 20,
  },
  addNewContactMenu: {
    padding: 20,
  },
  addNewContactMenuTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  addManuallyButton: {
    borderWidth: 0,
  },
  addManuallyButtonLabel: {
    flex: 1,
    paddingLeft: 20,
  },
  content: {
    flex: 1,
  },
  footer: [
    {
      padding: 20,
      justifyContent: 'center',
    },
    shadow({ appearance, direction: 'top' }),
  ],
}));
