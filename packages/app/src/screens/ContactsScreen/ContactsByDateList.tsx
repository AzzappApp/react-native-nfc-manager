import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { graphql, usePaginationFragment } from 'react-relay';
import SectionContactsHorizontalList from '#components/Contact/SectionContactsHorizontalList';
import { useRouter } from '#components/NativeRouter';
import { readContactData } from '#helpers/contactListHelpers';
import ListLoadingFooter from '#ui/ListLoadingFooter';
import type { ContactType } from '#helpers/contactTypes';
import type { ContactsByDateList_root$key } from '#relayArtifacts/ContactsByDateList_root.graphql';
import type { ContactsByDateListQuery } from '#relayArtifacts/ContactsByDateListQuery.graphql';
import type { ViewStyle } from 'react-native';

type ContactsByDateListProps = {
  // Unlike the other lists, we use the reference from the ContactScreenQuery
  // to avoid double fetching the data
  queryRef: ContactsByDateList_root$key;
  search: string | undefined;
  onShowContact: (contact: ContactType) => void;
  showContactAction: (arg: ContactType | ContactType[]) => void;
  contentContainerStyle?: ViewStyle;
};

const ContactsByDateList = ({
  queryRef,
  search,
  onShowContact,
  showContactAction,
  contentContainerStyle,
}: ContactsByDateListProps) => {
  const { data, loadNext, hasNext, isLoadingNext, refetch } =
    usePaginationFragment<ContactsByDateListQuery, ContactsByDateList_root$key>(
      graphql`
        fragment ContactsByDateList_root on Query
        @refetchable(queryName: "ContactsByDateListQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 10 }
          search: { type: String, defaultValue: null }
        ) {
          currentUser {
            id
            nbContacts #keep this field to update  on the main screen after updating by pulling down #7896
            contactsByDates(
              after: $after
              first: $first
              search: $search
              nbContactsByDate: 10
            ) @connection(key: "currentUser_contactsByDates") {
              __id
              edges {
                node {
                  date
                  nbContacts
                  contacts {
                    ...contactListHelpersReadContact_contact
                  }
                }
              }
            }
          }
        }
      `,
      queryRef,
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
      loadNext(10);
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

  const router = useRouter();
  const onSeeAll = useCallback(
    (date: Date) => {
      router.push({
        route: 'CONTACTS_BY_DATE',
        params: { date: date.toISOString() },
      });
    },
    [router],
  );

  const intl = useIntl();

  const sections = useMemo(() => {
    const today = new Date();
    return (
      data.currentUser?.contactsByDates.edges
        ?.map(edge => {
          const node = edge?.node;
          if (!node) {
            return null;
          }
          const date = node.date ? new Date(edge.node.date) : null;
          const contacts = node.contacts
            ?.filter(contact => !!contact)
            ?.map(contact => readContactData(contact));

          if (!contacts?.length || !date) {
            return null;
          }

          const isToday =
            new Date(date).getDate() === today.getDate() &&
            new Date(date).getMonth() === today.getMonth() &&
            new Date(date).getFullYear() === today.getFullYear();

          return {
            title: isToday
              ? intl.formatMessage({
                  defaultMessage: 'Today',
                  description: 'Contacts by date - Title for current day',
                })
              : date.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }),
            count: node.nbContacts,
            contacts,
            onSeeAll:
              node.nbContacts > contacts.length
                ? () => onSeeAll(date)
                : undefined,
          };
        })
        .filter(data => !!data) ?? []
    );
  }, [data.currentUser?.contactsByDates?.edges, onSeeAll, intl]);

  return (
    <SectionContactsHorizontalList
      sections={sections}
      onEndReached={onEndReached}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onShowContact={onShowContact}
      showContactAction={showContactAction}
      showLocationInSubtitle
      contentContainerStyle={contentContainerStyle}
      ListFooterComponent={<ListLoadingFooter loading={isLoadingNext} />}
    />
  );
};

export default ContactsByDateList;
