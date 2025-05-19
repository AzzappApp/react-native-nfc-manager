import { Suspense, useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';
import { useDebounce } from 'use-debounce';
import { useRouter, type NativeScreenProps } from '#components/NativeRouter';
import useScreenInsets from '#hooks/useScreenInsets';
import ContactActionModal from '#screens/ContactsScreen/ContactActionModal';
import ContactsByNameList from '#screens/ContactsScreen/ContactsByNameList';
import Container from '#ui/Container';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import LoadingView from '#ui/LoadingView';
import SearchBarStatic from '#ui/SearchBarStatic';
import type { ContactType } from '#helpers/contactTypes';
import type { ContactsByDateRoute, ContactsByLocationRoute } from '#routes';

const ContactsFilteredListScreen = ({
  route: { params, route },
}: NativeScreenProps<ContactsByDateRoute | ContactsByLocationRoute>) => {
  const [search, setSearch] = useState<string | undefined>(undefined);
  const [debounceSearch] = useDebounce(search, 500);

  const [contactActionData, setContactActionData] = useState<
    ContactType | ContactType[] | undefined
  >();

  const router = useRouter();
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

  const intl = useIntl();
  const { top, bottom } = useScreenInsets();

  const location =
    route === 'CONTACTS_BY_LOCATION' ? params.location : undefined;
  const date = route === 'CONTACTS_BY_DATE' ? params.date : undefined;

  return (
    <>
      <Container style={[styles.container, { paddingTop: top }]}>
        <ContactsByLocationHeader location={location} date={date} />
        <SearchBarStatic
          style={styles.search}
          value={search}
          placeholder={intl.formatMessage({
            defaultMessage: 'Search for name, company...',
            description: 'Search placeholder in ContactsScreen',
          })}
          onChangeText={setSearch}
        />
        <Suspense fallback={<LoadingView />}>
          <ContactsByNameList
            search={debounceSearch}
            location={location}
            date={date}
            onShowContact={onShowContact}
            showContactAction={setContactActionData}
            contentContainerStyle={{ paddingBottom: bottom }}
            fetchPolicy="store-and-network"
          />
        </Suspense>
      </Container>
      <ContactActionModal
        data={contactActionData}
        close={() => setContactActionData(undefined)}
        onShow={onShowContact}
      />
    </>
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
    />
  );
};

export default ContactsFilteredListScreen;
