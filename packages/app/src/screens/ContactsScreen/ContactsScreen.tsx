import { Suspense, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { colors } from '#theme';
import AccountHeader from '#components/AccountHeader';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import relayScreen from '#helpers/relayScreen';
import useBoolean from '#hooks/useBoolean';
import useNotificationsEvent from '#hooks/useNotifications';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import LoadingView from '#ui/LoadingView';
import RoundedMenuComponent from '#ui/RoundedMenuComponent';
import SearchBarStatic from '#ui/SearchBarStatic';
import Text from '#ui/Text';

import ContactScreenLists from './ContactsScreenLists';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ContactsScreenQuery } from '#relayArtifacts/ContactsScreenQuery.graphql';
import type { ContactsRoute } from '#routes';
import type { PushNotificationType } from '@azzapp/shared/notificationHelpers';

const contactsScreenQuery = graphql`
  query ContactsScreenQuery($profileId: ID!) {
    profile: node(id: $profileId) {
      ... on Profile {
        id
        nbContacts
        ...ContactsScreenLists_contacts
        webCard {
          id
          ...CoverRenderer_webCard
          ...AccountHeader_webCard
        }
      }
    }
  }
`;

const ContactsScreen = ({
  preloadedQuery,
  refreshQuery,
}: RelayScreenProps<ContactsRoute, ContactsScreenQuery>) => {
  const router = useRouter();
  const { profile } = usePreloadedQuery(contactsScreenQuery, preloadedQuery);

  const styles = useStyleSheet(stylesheet);

  const [searchBy, setSearchBy] = useState<'date' | 'location' | 'name'>(
    'date',
  );
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [debounceSearch] = useDebounce(search, 500);
  const [isAddNewContactMenuOpen, openNewContactMenu, closeNewContactMenu] =
    useBoolean();

  const onDeepLink = useCallback(
    (notification: PushNotificationType) => {
      if (
        notification.type === 'shareBack' &&
        notification.webCardId === profile?.webCard?.id
      ) {
        refreshQuery?.();
      }
    },
    [profile?.webCard?.id, refreshQuery],
  );

  useNotificationsEvent({ onDeepLinkInApp: onDeepLink });

  const onCreateWithScanner = useCallback(() => {
    closeNewContactMenu();
    if (profile?.id) {
      router.push({
        route: 'CONTACT_CREATE',
        params: { showCardScanner: true },
      });
    }
  }, [closeNewContactMenu, profile?.id, router]);

  const onCreateContact = useCallback(() => {
    closeNewContactMenu();
    if (profile?.id) {
      router.push({
        route: 'CONTACT_CREATE',
        params: { showCardScanner: false },
      });
    }
  }, [closeNewContactMenu, profile?.id, router]);

  const intl = useIntl();

  return (
    <>
      <Container style={styles.container}>
        {profile?.webCard && (
          <AccountHeader
            leftIcon={null}
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
          <RoundedMenuComponent
            selected={searchBy === 'location'}
            label="Location"
            id="location"
            onSelect={() => setSearchBy('location')}
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
    </>
  );
};

const stylesheet = createStyleSheet(appearance => ({
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
    fetchPolicy: 'store-and-network',
  }),
  fallback: ContactsScreenFallback,
});
