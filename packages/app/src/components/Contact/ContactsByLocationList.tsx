import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { graphql, useLazyLoadQuery, usePaginationFragment } from 'react-relay';
import SectionContactsHorizontalList from '#components/Contact/SectionContactsHorizontalList';
import { useRouter } from '#components/NativeRouter';
import ContactsByLocationListQueryNode from '#relayArtifacts/ContactsByLocationListQuery.graphql';
import ListLoadingFooter from '#ui/ListLoadingFooter';
import ContactActionModal from './ContactActionModal';
import useRefetch from './useRefetch';
import type { ContactActionModal_contact$key } from '#relayArtifacts/ContactActionModal_contact.graphql';
import type { ContactsByLocationList_root$key } from '#relayArtifacts/ContactsByLocationList_root.graphql';
import type { ContactsByLocationListQuery } from '#relayArtifacts/ContactsByLocationListQuery.graphql';

import type {
  ViewStyle,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

type ContactsByLocationListProps = {
  search: string;
  onShowContact: (contact: string) => void;
  contentContainerStyle?: ViewStyle;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const ContactsByLocationList = ({
  search,
  onShowContact,
  contentContainerStyle,
  onScroll,
}: ContactsByLocationListProps) => {
  const queryResult = useLazyLoadQuery<ContactsByLocationListQuery>(
    ContactsByLocationListQueryNode,
    {},
    { fetchPolicy: 'store-or-network' },
  );
  const { data, loadNext, hasNext, isLoadingNext, refetch } =
    usePaginationFragment<
      ContactsByLocationListQuery,
      ContactsByLocationList_root$key
    >(
      graphql`
        fragment ContactsByLocationList_root on Query
        @refetchable(queryName: "ContactsByLocationListQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 10 }
          search: { type: String, defaultValue: null }
        ) {
          currentUser {
            id
            nbContacts #keep this field to update  on the main screen after updating by pulling down #7896
            contactsByLocation(after: $after, first: $first, search: $search)
              @connection(key: "currentUser_contactsByLocation") {
              __id
              edges {
                node {
                  location
                  nbContacts
                  contacts {
                    id
                    ...ContactActionModal_contact
                    # eslint-disable-next-line relay/must-colocate-fragment-spreads
                    ...ContactsHorizontalList_contacts
                  }
                }
              }
            }
          }
        }
      `,
      queryResult,
    );

  const currentSearch = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (
      (!currentSearch.current && !search) ||
      currentSearch.current === search
    ) {
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

  const { refreshing, onRefresh } = useRefetch({
    query: ContactsByLocationListQueryNode,
    variables: {
      first: 10,
      search,
    },
  });

  const router = useRouter();
  const onSeeAll = useCallback(
    (location: string | null) => {
      router.push({
        route: 'CONTACTS_BY_LOCATION',
        params: { location },
      });
    },
    [router],
  );

  const intl = useIntl();

  const sections = useMemo(
    () =>
      data.currentUser?.contactsByLocation.edges
        ?.map(edge => {
          const node = edge?.node;
          if (!node) {
            return null;
          }
          const contacts = node.contacts?.filter(contact => !!contact);
          if (!contacts.length) {
            return null;
          }

          const { location, nbContacts } = node;
          const hasSeeAll = nbContacts > contacts.length;
          return {
            title:
              location ??
              intl.formatMessage({
                defaultMessage: 'No location data',
                description:
                  'ContactsScreenSearchByLocation - Title for unknown location',
              }),
            onSeeAll: hasSeeAll ? () => onSeeAll(location) : undefined,
            contacts: hasSeeAll ? contacts.slice(0, 5) : contacts,
            count: nbContacts,
          };
        })
        .filter(data => !!data) ?? [],
    [data.currentUser?.contactsByLocation.edges, intl, onSeeAll],
  );

  const contacts = useMemo(
    () =>
      data.currentUser?.contactsByLocation.edges
        ?.flatMap(edge => edge?.node?.contacts ?? [])
        .filter(contact => !!contact) ?? [],
    [data.currentUser?.contactsByLocation.edges],
  );
  const [contactActionData, setContactActionData] = useState<
    | ContactActionModal_contact$key
    | ContactActionModal_contact$key[]
    | undefined
  >(undefined);
  const onShowContactAction = useCallback(
    (contactId: string[] | string) => {
      if (Array.isArray(contactId)) {
        setContactActionData(contacts.filter(c => contactId.includes(c.id)));
        return;
      }
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        setContactActionData(contact);
      }
    },
    [contacts],
  );

  return (
    <>
      <SectionContactsHorizontalList
        sections={sections}
        onEndReached={onEndReached}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onShowContact={onShowContact}
        onShowContactAction={onShowContactAction}
        showLocationInSubtitle
        contentContainerStyle={contentContainerStyle}
        onScroll={onScroll}
        ListFooterComponent={<ListLoadingFooter loading={isLoadingNext} />}
      />
      <ContactActionModal
        data={contactActionData}
        close={() => setContactActionData(undefined)}
        onShow={onShowContact}
      />
    </>
  );
};

export default ContactsByLocationList;
