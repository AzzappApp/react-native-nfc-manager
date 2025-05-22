import { Suspense, useCallback, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Platform, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useDebounce } from 'use-debounce';
import UserContactsList from '#components/Contact/UserContactsList';
import { useRouter, type NativeScreenProps } from '#components/NativeRouter';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import LoadingView from '#ui/LoadingView';
import SearchBarStatic from '#ui/SearchBarStatic';
import type { ContactsByDateRoute, ContactsByLocationRoute } from '#routes';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const ContactsFilteredListScreen = ({
  route: { params, route },
}: NativeScreenProps<ContactsByDateRoute | ContactsByLocationRoute>) => {
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [debounceSearch] = useDebounce(search, 500);

  const onChangeText = useCallback((text: string | undefined) => {
    setSearch(text || undefined);
  }, []);

  const router = useRouter();
  const onShowContact = useCallback(
    async (contactId: string) => {
      router.push({
        route: 'CONTACT_DETAILS',
        params: { contactId },
      });
    },
    [router],
  );

  const searchBarVisible = useSharedValue(1);
  const toggleSearchBar = useCallback(
    (show: boolean) => {
      searchBarVisible.set(withTiming(show ? 1 : 0, { duration: 350 }));
    },
    [searchBarVisible],
  );

  const previousScrollPosition = useRef(0);
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollPosition = event.nativeEvent.contentOffset.y;
      if (
        scrollPosition > SEARCHBAR_HEIGHT &&
        scrollPosition > previousScrollPosition.current
      ) {
        toggleSearchBar(false);
      } else if (
        previousScrollPosition.current < SEARCHBAR_HEIGHT ||
        previousScrollPosition.current - scrollPosition > 10
      ) {
        toggleSearchBar(true);
      }
      previousScrollPosition.current = scrollPosition;
    },
    [toggleSearchBar],
  );

  const isAndroid = Platform.OS === 'android';
  const searchBarContainerStyle = useAnimatedStyle(() => {
    return {
      height: SEARCHBAR_HEIGHT * (isAndroid ? 1 : searchBarVisible.value),
    };
  });

  const intl = useIntl();

  const location =
    route === 'CONTACTS_BY_LOCATION' ? params.location : undefined;
  const date = route === 'CONTACTS_BY_DATE' ? params.date : undefined;
  const orderBy = route === 'CONTACTS_BY_DATE' ? 'name' : 'date';

  const insets = useScreenInsets();

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Container style={[styles.container, { paddingTop: insets.top }]}>
        <ContactsByLocationHeader location={location} date={date} />
        <Animated.View
          style={[
            { height: SEARCHBAR_HEIGHT, overflow: 'hidden' },
            searchBarContainerStyle,
          ]}
        >
          <SearchBarStatic
            style={styles.search}
            value={search}
            placeholder={intl.formatMessage({
              defaultMessage: 'Search for name, company...',
              description: 'Search placeholder in ContactsScreen',
            })}
            onChangeText={onChangeText}
          />
        </Animated.View>
        <Suspense fallback={<LoadingView />}>
          <UserContactsList
            search={debounceSearch}
            location={location}
            date={date}
            orderBy={orderBy}
            onShowContact={onShowContact}
            fetchPolicy="store-and-network"
            onScroll={onScroll}
            contentContainerStyle={{ paddingBottom: insets.bottom }}
          />
        </Suspense>
      </Container>
    </KeyboardAvoidingView>
  );
};

export default ContactsFilteredListScreen;

const SEARCHBAR_HEIGHT = 56;

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: {
    marginHorizontal: 20,
    marginTop: 10,
  },
});

const ContactsByLocationHeader = ({
  location,
  date,
}: {
  location: string | null | undefined;
  date: string | null | undefined;
}) => {
  const intl = useIntl();
  const router = useRouter();
  const title = date
    ? intl.formatMessage(
        {
          defaultMessage: 'Contacts met the {date}',
          description: 'Contacts by date header',
        },
        { date: new Date(date).toLocaleDateString() },
      )
    : location
      ? intl.formatMessage(
          {
            defaultMessage: 'Received in {location}',
            description: 'Contacts by location header',
          },
          { location },
        )
      : intl.formatMessage({
          defaultMessage: 'Contacts without location',
          description: 'Contacts by location header for unknown location',
        });
  return (
    <Header
      middleElement={title}
      leftElement={
        <IconButton
          icon="arrow_left"
          onPress={router.back}
          iconSize={30}
          size={47}
          variant="icon"
        />
      }
      rightElement={<View style={{ width: 47 }} />}
    />
  );
};
