import { useMemo, useCallback, useEffect, useState } from 'react';
import { AppState, View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { usePaginationFragment, graphql, useMutation } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
import { useOnContactAddedToProfile } from '#helpers/addContactHelper';
import { getAuthState } from '#helpers/authStore';
import { buildContactTypeFromContactNode } from '#helpers/contactListHelpers';
import useKeyboardHeight from '#hooks/useKeyboardHeight';
import useScreenInsets from '#hooks/useScreenInsets';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import ContactActionModal from './ContactActionModal';
import ContactsFilteredByLocation from './ContactsFilteredByLocation';
import ContactsScreenSearchByDate from './ContactsScreenSearchByDate';
import ContactsScreenSearchByLocation from './ContactsScreenSearchByLocation';
import ContactsScreenSearchByName from './ContactsScreenSearchByName';
import { IsWhatsappSupportedProvider } from './isWhatsappSupportedContext';
import type { ContactType } from '#helpers/contactTypes';
import type { ContactsScreenLists_contacts$key } from '#relayArtifacts/ContactsScreenLists_contacts.graphql';
import type { ContactsScreenListsMutationUpdateContactsLastViewMutation } from '#relayArtifacts/ContactsScreenListsMutationUpdateContactsLastViewMutation.graphql';

export type ContactActionProps = {
  contact?: ContactType | ContactType[];
};

type ContactsScreenListsProps = {
  search: string | undefined;
  searchBy: 'date' | 'location' | 'name';
  profile: ContactsScreenLists_contacts$key;
  filterBy?: string;
};
const ContactsScreenLists = ({
  search,
  searchBy,
  profile,
  filterBy,
}: ContactsScreenListsProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const [contactActionData, setContactActionData] = useState<
    ContactActionProps | undefined
  >();

  const { data, loadNext, hasNext, isLoadingNext, refetch } =
    usePaginationFragment(
      graphql`
        fragment ContactsScreenLists_contacts on Profile
        @refetchable(queryName: "ContactsScreenListQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 12 }
          name: { type: String, defaultValue: "" }
          orderBy: { type: SearchContactOrderBy, defaultValue: date }
          pixelRatio: {
            type: "Float!"
            provider: "CappedPixelRatio.relayprovider"
          }
          filterBy: { type: SearchFilter }
          screenWidth: { type: "Float!", provider: "ScreenWidth.relayprovider" }
        ) {
          id
          nbContacts #keep this field to update  on the main screen after updating by pulling down #7896
          searchContacts(
            after: $after
            first: $first
            name: $name
            orderBy: $orderBy
            filterBy: $filterBy
          ) @connection(key: "Profile_searchContacts") {
            __id
            edges {
              node {
                id
                firstName
                lastName
                company
                title
                meetingDate
                note
                emails {
                  label
                  address
                }
                phoneNumbers {
                  label
                  number
                }
                addresses {
                  address
                  label
                }
                socials {
                  label
                  url
                }
                urls {
                  url
                }
                avatar {
                  id
                  uri: uri(width: 112, pixelRatio: $pixelRatio, format: png)
                }
                logo {
                  id
                  uri: uri(width: 180, pixelRatio: $pixelRatio, format: png)
                }
                birthday
                meetingPlace {
                  city
                  region
                  subregion
                  country
                }
                contactProfile {
                  id
                  webCard {
                    id
                    cardIsPublished
                    userName
                    hasCover
                    ...CoverRenderer_webCard
                    coverMedia {
                      id
                      ... on MediaVideo {
                        webcardThumbnail: thumbnail(
                          width: $screenWidth
                          pixelRatio: $pixelRatio
                        )
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
      profile,
    );

  const refetchWithDefaultProps = useCallback(() => {
    refetch(
      {
        name: search,
        orderBy: searchBy,
        filterBy: filterBy
          ? {
              value: filterBy,
              type: 'location',
            }
          : undefined,
      },
      { fetchPolicy: 'store-and-network' },
    );
  }, [filterBy, refetch, search, searchBy]);

  // ensure we refresh contacts oon resume
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refetchWithDefaultProps();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [refetchWithDefaultProps]);

  const contacts = useMemo(() => {
    // data?.searchContacts?.edges[0]?.node?.webCard
    return (
      data?.searchContacts?.edges
        ?.map(edge => buildContactTypeFromContactNode(edge?.node))
        .filter(contact => !!contact) ?? []
    );
  }, [data]);
  const onAzzappContactAdded = useCallback(() => {
    // Warning This code trigger a full refresh of the contacts list
    refetchWithDefaultProps();
  }, [refetchWithDefaultProps]);

  useOnContactAddedToProfile(onAzzappContactAdded);

  const onRefresh = useCallback(() => {
    if (!isLoadingNext && !refreshing) {
      setRefreshing(true);
      refetchWithDefaultProps();
      setRefreshing(false);
    }
  }, [isLoadingNext, refreshing, refetchWithDefaultProps]);

  const onEndReached = useCallback(() => {
    if (hasNext && !isLoadingNext) {
      loadNext(20);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  useEffect(() => {
    refetchWithDefaultProps();
  }, [refetchWithDefaultProps]);

  const [commitContactsLastView] =
    useMutation<ContactsScreenListsMutationUpdateContactsLastViewMutation>(
      graphql`
        mutation ContactsScreenListsMutationUpdateContactsLastViewMutation(
          $profileId: ID!
        ) {
          updateContactsLastView(profileId: $profileId)
        }
      `,
    );

  useEffect(() => {
    const profileId = getAuthState().profileInfos?.profileId;
    if (!profileId) {
      return;
    }
    commitContactsLastView({
      variables: {
        profileId,
      },
    });
  }, [commitContactsLastView]);

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

  // manage keyboard height
  const { bottom } = useScreenInsets();
  const keyboardHeight = useKeyboardHeight();
  const footerStyle = useAnimatedStyle(() => {
    const normalizedHeight = bottom + BOTTOM_MENU_HEIGHT - keyboardHeight.value;
    return {
      height: Math.max(normalizedHeight, keyboardHeight.value),
    };
  });

  return (
    <IsWhatsappSupportedProvider>
      <View style={styles.flex}>
        {profile && searchBy === 'name' && (
          <ContactsScreenSearchByName
            contacts={contacts}
            onEndReached={onEndReached}
            onRefresh={onRefresh}
            refreshing={refreshing}
            onShowContact={onShowContact}
            showContactAction={setContactActionData}
            listFooterComponent={<Animated.View style={footerStyle} />}
          />
        )}
        {profile &&
          searchBy === 'date' &&
          (filterBy ? (
            <ContactsFilteredByLocation
              contacts={contacts}
              onEndReached={onEndReached}
              onRefresh={onRefresh}
              refreshing={refreshing}
              onShowContact={onShowContact}
              showContactAction={setContactActionData}
              listFooterComponent={<Animated.View style={footerStyle} />}
            />
          ) : (
            <ContactsScreenSearchByDate
              contacts={contacts}
              onEndReached={onEndReached}
              onRefresh={onRefresh}
              refreshing={refreshing}
              onShowContact={onShowContact}
              showContactAction={setContactActionData}
              listFooterComponent={<Animated.View style={footerStyle} />}
            />
          ))}
        {profile && searchBy === 'location' && (
          <ContactsScreenSearchByLocation
            contacts={contacts}
            onEndReached={onEndReached}
            onRefresh={onRefresh}
            refreshing={refreshing}
            onShowContact={onShowContact}
            showContactAction={setContactActionData}
            listFooterComponent={<Animated.View style={footerStyle} />}
          />
        )}
        <ContactActionModal
          contactActionData={contactActionData}
          close={() => setContactActionData(undefined)}
          onShow={onShowContact}
        />
      </View>
    </IsWhatsappSupportedProvider>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});

export default ContactsScreenLists;
