import { Suspense, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Animated, StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';
import { useDebounce } from 'use-debounce';
import UserContactsList from '#components/Contact/UserContactsList';
import { useRouter, type NativeScreenProps } from '#components/NativeRouter';
import AnimatedScrollView from '#components/ui/AnimatedScrollView';
import useKeyboardHeight from '#hooks/useKeyboardHeight';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import LoadingView from '#ui/LoadingView';
import SearchBarStatic from '#ui/SearchBarStatic';
import type { ContactsByDateRoute, ContactsByLocationRoute } from '#routes';

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

  const intl = useIntl();

  const location =
    route === 'CONTACTS_BY_LOCATION' ? params.location : undefined;
  const date = route === 'CONTACTS_BY_DATE' ? params.date : undefined;
  const orderBy = route === 'CONTACTS_BY_DATE' ? 'name' : 'date';

  const { height: screenHeight } = useScreenDimensions();

  const keyboardHeight = useKeyboardHeight();
  const contentHeight = useAnimatedStyle(() => {
    return {
      height: screenHeight - keyboardHeight.value + SEARCHBAR_HEIGHT,
    };
  });

  const scrollAnimatedValue = useMemo(() => new Animated.Value(0), []);
  const insets = useScreenInsets();

  return (
    <Reanimated.View
      style={[{ height: screenHeight + SEARCHBAR_HEIGHT }, contentHeight]}
    >
      <Container style={[styles.container, { paddingTop: insets.top }]}>
        <ContactsByLocationHeader location={location} date={date} />
        <View style={styles.contentContainer}>
          <Animated.View
            style={{
              flex: 1,
              transform: [
                {
                  translateY: scrollAnimatedValue.interpolate({
                    inputRange: [0, SEARCHBAR_HEIGHT],
                    outputRange: [0, -SEARCHBAR_HEIGHT],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            }}
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
            <Suspense fallback={<LoadingView />}>
              <UserContactsList
                search={debounceSearch}
                location={location}
                date={date}
                orderBy={orderBy}
                onShowContact={onShowContact}
                fetchPolicy="store-and-network"
                renderScrollComponent={props => (
                  <AnimatedScrollView
                    {...props}
                    scrollAnimatedValue={scrollAnimatedValue}
                  />
                )}
                contentContainerStyle={{ paddingBottom: insets.bottom }}
              />
            </Suspense>
          </Animated.View>
        </View>
      </Container>
    </Reanimated.View>
  );
};

const SEARCHBAR_HEIGHT = 56;

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    flex: 1,
    overflow: 'hidden',
  },
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

export default ContactsFilteredListScreen;
