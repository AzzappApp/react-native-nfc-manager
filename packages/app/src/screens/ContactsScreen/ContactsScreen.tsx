import { Suspense, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { colors } from '#theme';
import AccountHeader from '#components/AccountHeader';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import Container from '#ui/Container';
import LoadingView from '#ui/LoadingView';
import RoundedMenuComponent from '#ui/RoundedMenuComponent';
import SearchBarStatic from '#ui/SearchBarStatic';
import Text from '#ui/Text';

import ContactScreenLists from './ContactsScreenLists';
import type { ContactsScreenQuery } from '#relayArtifacts/ContactsScreenQuery.graphql';
import type { PreloadedQuery } from 'react-relay';

const contactsScreenQuery = graphql`
  query ContactsScreenQuery($profileId: ID!) {
    profile: node(id: $profileId) {
      ... on Profile {
        nbContacts
        ...ContactsScreenLists_contacts
        webCard {
          ...CoverRenderer_webCard
          ...AccountHeader_webCard
        }
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

  const styles = useStyleSheet(stylesheet);

  const [searchBy, setSearchBy] = useState<'date' | 'name'>('date');
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [debounceSearch] = useDebounce(search, 500);

  const intl = useIntl();

  return (
    <Container style={styles.container}>
      {profile?.webCard && (
        <AccountHeader
          leftIcon="close"
          webCard={profile?.webCard}
          title={
            <Text variant="large">
              <FormattedMessage
                description="ContactsScreen - Title"
                defaultMessage="{contacts, plural,
                =0 {# contacts received}
                =1 {# contact received}
                other {# contacts received}
        }"
                values={{ contacts: profile?.nbContacts ?? 0 }}
              />
            </Text>
          }
        />
      )}
      <View style={styles.menu}>
        <RoundedMenuComponent
          selected={searchBy === 'date'}
          label={intl.formatMessage({
            defaultMessage: 'Date',
            description: 'Date selector label in ContactsScreen',
          })}
          id="date"
          onSelect={() => setSearchBy('date')}
        />
        <RoundedMenuComponent
          selected={searchBy === 'name'}
          label={intl.formatMessage({
            defaultMessage: 'Name',
            description: 'Name selector label in ContactsScreen',
          })}
          id="name"
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
      <Suspense>
        {profile && (
          <ContactScreenLists
            search={debounceSearch}
            searchBy={searchBy}
            profile={profile}
          />
        )}
      </Suspense>
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

const ContactsScreenFallback = () => (
  <Container style={{ flex: 1 }}>
    <AccountHeader leftIcon="close" title="" webCard={null} />
    <LoadingView />
  </Container>
);

export default relayScreen(ContactsScreen, {
  query: contactsScreenQuery,
  getVariables: (_, profileInfos) => ({
    profileId: profileInfos?.profileId ?? '',
  }),
  fallback: ContactsScreenFallback,
});
