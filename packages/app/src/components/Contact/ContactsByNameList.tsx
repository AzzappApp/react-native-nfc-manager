import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { graphql, useLazyLoadQuery, usePaginationFragment } from 'react-relay';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import ContactsList from '#components/Contact/ContactsList';
import ContactsByNameListQueryNode from '#relayArtifacts/ContactsByNameListQuery.graphql';
import Container from '#ui/Container';
import ListLoadingFooter from '#ui/ListLoadingFooter';
import Text from '#ui/Text';
import ContactActionModal from './ContactActionModal';
import type { ContactsListItemType } from '#components/Contact/ContactsList/ContactsList';
import type { contactHelpersReadContactData$key } from '#relayArtifacts/contactHelpersReadContactData.graphql';
import type { ContactsByNameList_root$key } from '#relayArtifacts/ContactsByNameList_root.graphql';
import type { ContactsByNameListQuery } from '#relayArtifacts/ContactsByNameListQuery.graphql';
import type { ScrollViewProps, SectionListData, ViewStyle } from 'react-native';
import type { FetchPolicy } from 'react-relay';

type ContactsByNameListProps = {
  /**
   * Search string to filter contacts by name or company
   */
  search: string | undefined;
  /**
   * Location to filter contacts by location
   * :warning: `undefined` and `null` are different in this case
   * `undefined` means no location filter
   * `null` means to fetch contacts without location
   * @default undefined
   */
  location: string | null | undefined;
  /**
   * Date to filter contacts by date
   */
  date: string | undefined;
  onShowContact: (contact: string) => void;
  contentContainerStyle?: ViewStyle;
  fetchPolicy?: FetchPolicy;
  ListHeaderComponent?:
    | React.ComponentType<any>
    | React.ReactElement
    | null
    | undefined;
  renderScrollComponent?:
    | ((props: ScrollViewProps) => React.ReactElement<ScrollViewProps>)
    | undefined;
};

const ContactsByNameList = ({
  search,
  location,
  date,
  onShowContact,
  fetchPolicy = 'store-or-network',
  contentContainerStyle,
  ListHeaderComponent,
  renderScrollComponent,
}: ContactsByNameListProps) => {
  const queryResult = useLazyLoadQuery<ContactsByNameListQuery>(
    ContactsByNameListQueryNode,
    { location: location !== null ? location : '\uffff', date },
    { fetchPolicy },
  );
  const { data, loadNext, hasNext, isLoadingNext, refetch } =
    usePaginationFragment<ContactsByNameListQuery, ContactsByNameList_root$key>(
      graphql`
        fragment ContactsByNameList_root on Query
        @refetchable(queryName: "ContactsByNameListQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 20 }
          search: { type: String, defaultValue: null }
          location: { type: String, defaultValue: null }
          date: { type: DateTime, defaultValue: null }
        ) {
          currentUser {
            id
            nbContacts #keep this field to update  on the main screen after updating by pulling down #7896
            contacts(
              after: $after
              first: $first
              search: $search
              location: $location
              date: $date
            ) @connection(key: "currentUser_contacts") {
              __id
              edges {
                node {
                  id
                  firstName
                  lastName
                  company
                  contactProfile {
                    webCard {
                      userName
                    }
                  }
                  ...ContactsListItem_contact
                  ...contactHelpersReadContactData
                }
              }
            }
          }
        }
      `,
      queryResult as ContactsByNameList_root$key,
    );

  const currentSearch = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (currentSearch.current === search) {
      return;
    }
    currentSearch.current = search;
    refetch({ search });
  }, [refetch, search]);

  const onEndReached = useCallback(() => {
    if (hasNext && !isLoadingNext) {
      loadNext(20);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch(
      { search },
      {
        fetchPolicy: 'network-only',
        onComplete: () => {
          setRefreshing(false);
        },
      },
    );
  }, [refetch, search]);

  const contacts = useMemo(
    () =>
      data?.currentUser?.contacts?.edges
        ?.map(edge => edge?.node)
        .filter(contact => !!contact) ?? [],
    [data],
  );

  const [contactActionData, setContactActionData] = useState<
    contactHelpersReadContactData$key | undefined
  >(undefined);
  const onShowContactAction = useCallback(
    (contactId: string) => {
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        setContactActionData(contact);
      }
    },
    [contacts],
  );

  const sections = useMemo(() => {
    return contacts.reduce(
      (accumulator, contact) => {
        const initial = (
          contact.lastName?.[0] ??
          contact.firstName?.[0] ??
          contact.company?.[0] ??
          contact.contactProfile?.webCard?.userName?.[0] ??
          ''
        ).toLocaleUpperCase();

        const existingSection = accumulator.find(
          section => section.title === initial,
        );

        if (!existingSection) {
          accumulator.push({ title: initial, data: [contact] });
        } else {
          existingSection.data.push(contact);
        }

        return accumulator;
      },
      [] as Array<{ title: string; data: ContactsListItemType[] }>,
    );
  }, [contacts]);

  const renderHeaderSection = useCallback(
    ({
      section: { title },
    }: {
      section: SectionListData<
        ContactsListItemType,
        { title: string; data: ContactsListItemType[] }
      >;
    }) => {
      if (isNotFalsyString(title)) {
        return (
          <Container style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
          </Container>
        );
      }
      return null;
    },
    [],
  );

  return (
    <>
      <ContactsList
        sections={sections}
        refreshing={refreshing}
        renderSectionHeader={renderHeaderSection}
        onEndReached={onEndReached}
        onRefresh={onRefresh}
        onShowContact={onShowContact}
        onShowContactAction={onShowContactAction}
        contentContainerStyle={contentContainerStyle}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={<ListLoadingFooter loading={isLoadingNext} />}
        renderScrollComponent={renderScrollComponent}
      />
      <ContactActionModal
        data={contactActionData}
        close={() => setContactActionData(undefined)}
        onShow={onShowContact}
      />
    </>
  );
};

const styles = StyleSheet.create({
  titleContainer: {
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  title: {
    textTransform: 'uppercase',
  },
});

export default ContactsByNameList;
