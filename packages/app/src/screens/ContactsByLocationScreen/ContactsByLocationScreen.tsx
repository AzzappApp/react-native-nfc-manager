import { Suspense, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { useRouter, type NativeScreenProps } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import useScreenInsets from '#hooks/useScreenInsets';
import ContactsScreenLists from '#screens/ContactsScreen/ContactsScreenLists';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import LoadingView from '#ui/LoadingView';
import SearchBarStatic from '#ui/SearchBarStatic';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ContactsByLocationScreenQuery } from '#relayArtifacts/ContactsByLocationScreenQuery.graphql';
import type { ContactByLocationRoute } from '#routes';

const ContactsByLocationScreen = ({
  preloadedQuery,
  route,
}: RelayScreenProps<ContactByLocationRoute, ContactsByLocationScreenQuery>) => {
  const { profile } = usePreloadedQuery(
    contactsByLocationScreenQuery,
    preloadedQuery,
  );

  const [search, setSearch] = useState<string | undefined>(undefined);
  const [debounceSearch] = useDebounce(search, 500);

  const intl = useIntl();

  const { top } = useScreenInsets();

  return (
    <Container style={[styles.container, { paddingTop: top }]}>
      <ContactsByLocationHeader location={route.params.location} />
      <SearchBarStatic
        style={styles.search}
        value={search}
        placeholder={intl.formatMessage({
          defaultMessage: 'Search for name, company...',
          description: 'Search placeholder in ContactsScreen',
        })}
        onChangeText={setSearch}
      />
      {profile ? (
        <Suspense fallback={<LoadingView />}>
          <ContactsScreenLists
            search={debounceSearch}
            searchBy="date"
            filterBy={route.params.location}
            profile={profile}
          />
        </Suspense>
      ) : null}
    </Container>
  );
};

const styles = StyleSheet.create({
  search: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  container: { flex: 1 },
});

const contactsByLocationScreenQuery = graphql`
  query ContactsByLocationScreenQuery($profileId: ID!) {
    profile: node(id: $profileId) {
      ... on Profile {
        id
        ...ContactsScreenLists_contacts
      }
    }
  }
`;

const ContactsByLocationScreenFallback = ({
  route,
}: NativeScreenProps<ContactByLocationRoute>) => {
  const { top } = useScreenInsets();
  return (
    <Container style={[styles.container, { paddingTop: top }]}>
      <ContactsByLocationHeader location={route.params.location} />
      <LoadingView />
    </Container>
  );
};

const ContactsByLocationHeader = ({ location }: { location: string }) => {
  const intl = useIntl();
  const router = useRouter();
  return (
    <Header
      middleElement={intl.formatMessage(
        {
          defaultMessage: 'Received in {location}',
          description: 'Contacts by location header',
        },
        {
          location,
        },
      )}
      leftElement={
        <IconButton
          icon="arrow_left"
          onPress={router.back}
          iconSize={30}
          size={47}
          variant="icon"
        />
      }
    />
  );
};

export default relayScreen(ContactsByLocationScreen, {
  query: contactsByLocationScreenQuery,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId ?? '',
    fetchPolicy: 'store-and-network',
  }),
  fallback: ContactsByLocationScreenFallback,
  refreshOnFocus: true,
});
