import { Suspense, useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Animated, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useDebounce } from 'use-debounce';
import ContactsByNameList from '#components/Contact/ContactsByNameList';
import { useRouter, type NativeScreenProps } from '#components/NativeRouter';
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

  const scrollAnimatedValue = useMemo(() => new Animated.Value(0), []);
  const scrollEvent = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollAnimatedValue } } }],
    { useNativeDriver: false },
  );
  const insets = useScreenInsets();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <Container style={[styles.container, { paddingTop: insets.top }]}>
        <ContactsByLocationHeader location={location} date={date} />
        <Animated.View
          style={{
            height: scrollAnimatedValue.interpolate({
              inputRange: [0, 66],
              outputRange: [66, 0],
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
            onChangeText={setSearch}
          />
        </Animated.View>
        <Suspense fallback={<LoadingView />}>
          <ContactsByNameList
            search={debounceSearch}
            location={location}
            date={date}
            onShowContact={onShowContact}
            fetchPolicy="store-and-network"
            renderScrollComponent={props => (
              <Animated.ScrollView {...props} onScroll={scrollEvent} />
            )}
            contentContainerStyle={{ paddingBottom: insets.bottom }}
          />
        </Suspense>
      </Container>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  search: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  container: { flex: 1 },
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
