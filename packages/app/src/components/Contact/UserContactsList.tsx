import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { graphql, useLazyLoadQuery, usePaginationFragment } from 'react-relay';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import ContactsList from '#components/Contact/ContactsList';
import UserContactsListQueryNode from '#relayArtifacts/UserContactsListQuery.graphql';
import Container from '#ui/Container';
import ListLoadingFooter from '#ui/ListLoadingFooter';
import Text from '#ui/Text';
import ContactActionModal from './ContactActionModal';
import type { ContactsListItemType } from '#components/Contact/ContactsList/ContactsList';
import type { contactHelpersReadContactData$key } from '#relayArtifacts/contactHelpersReadContactData.graphql';
import type { UserContactsList_root$key } from '#relayArtifacts/UserContactsList_root.graphql';
import type { UserContactsListQuery } from '#relayArtifacts/UserContactsListQuery.graphql';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  SectionListData,
  ViewStyle,
} from 'react-native';
import type { FetchPolicy } from 'react-relay';

type UserContactsListProps = {
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
   * Are the contacts ordered by date or by name
   * @default name
   */
  orderBy?: 'date' | 'name';
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
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const UserContactsList = ({
  search,
  location,
  date,
  orderBy = 'name',
  onShowContact,
  fetchPolicy = 'store-or-network',
  contentContainerStyle,
  ListHeaderComponent,
  onScroll,
}: UserContactsListProps) => {
  const queryResult = useLazyLoadQuery<UserContactsListQuery>(
    UserContactsListQueryNode,
    { location: location !== null ? location : '\uffff', date, orderBy },
    { fetchPolicy },
  );
  const { data, loadNext, hasNext, isLoadingNext, refetch } =
    usePaginationFragment<UserContactsListQuery, UserContactsList_root$key>(
      graphql`
        fragment UserContactsList_root on Query
        @refetchable(queryName: "UserContactsListQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 20 }
          search: { type: String, defaultValue: null }
          location: { type: String, defaultValue: null }
          date: { type: DateTime, defaultValue: null }
          orderBy: { type: ContactOrderBy, defaultValue: null }
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
              orderBy: $orderBy
            ) @connection(key: "currentUser_contacts") {
              __id
              edges {
                node {
                  id
                  firstName
                  lastName
                  company
                  meetingDate
                  contactProfile {
                    webCard {
                      userName
                    }
                  }
                  ...ContactsListItem_contact
                  ...contactHelpersReadContactData
                  ...contactHelpersShareContactDataQuery_contact
                }
              }
            }
          }
        }
      `,
      queryResult as UserContactsList_root$key,
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
        let title: string;

        if (orderBy === 'date') {
          if (!contact.meetingDate) {
            return accumulator;
          }
          title = new Date(contact.meetingDate).toLocaleDateString();
        } else {
          title = (
            contact.lastName?.[0] ??
            contact.firstName?.[0] ??
            contact.company?.[0] ??
            contact.contactProfile?.webCard?.userName?.[0] ??
            ''
          ).toLocaleUpperCase();
        }

        const existingSection = accumulator.find(
          section => section.title === title,
        );

        if (!existingSection) {
          accumulator.push({ title, data: [contact] });
        } else {
          existingSection.data.push(contact);
        }

        return accumulator;
      },
      [] as Array<{ title: string; data: ContactsListItemType[] }>,
    );
  }, [contacts, orderBy]);

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
        onScroll={onScroll}
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

export default UserContactsList;
