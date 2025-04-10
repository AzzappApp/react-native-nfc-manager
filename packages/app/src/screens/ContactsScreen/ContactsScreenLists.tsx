import {
  PermissionStatus as ContactPermissionStatus,
  displayContactAsync,
} from 'expo-contacts';
import { useMemo, useCallback, useEffect, useState } from 'react';
import { AppState, View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { usePaginationFragment, graphql, useMutation } from 'react-relay';
import { useOnFocus, useRouter } from '#components/NativeRouter';
import {
  useOnContactAddedToProfile,
  useOnContactAdded,
} from '#helpers/addContactHelper';
import { findLocalContact } from '#helpers/contactHelpers';
import { getLocalContactsMap } from '#helpers/getLocalContactsMap';
import { useProfileInfos } from '#hooks/authStateHooks';
import useKeyboardHeight from '#hooks/useKeyboardHeight';
import useOnInviteContact from '#hooks/useOnInviteContact';
import { usePhonebookPermission } from '#hooks/usePhonebookPermission';
import useRemoveContact from '#hooks/useRemoveContact';
import useScreenInsets from '#hooks/useScreenInsets';
import { BOTTOM_MENU_HEIGHT } from '#ui/BottomMenu';
import ContactActionModal from './ContactActionModal';
import ContactsFilteredByLocation from './ContactsFilteredByLocation';
import ContactsScreenSearchByDate from './ContactsScreenSearchByDate';
import ContactsScreenSearchByLocation from './ContactsScreenSearchByLocation';
import ContactsScreenSearchByName from './ContactsScreenSearchByName';
import { IsAzzappSupportedProvider } from './isWhatsappSupportedContext';
import type { ContactDetails, ContactType } from '#helpers/contactListHelpers';
import type {
  ContactsScreenLists_contacts$data,
  ContactsScreenLists_contacts$key,
} from '#relayArtifacts/ContactsScreenLists_contacts.graphql';
import type { ContactsScreenListsMutationUpdateContactsLastViewMutation } from '#relayArtifacts/ContactsScreenListsMutationUpdateContactsLastViewMutation.graphql';
import type { Contact } from 'expo-contacts';

export type ContactActionProps = {
  contact?: ContactType | ContactType[];
  showInvite: boolean;
  hideInvitation?: () => void;
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
  const [localContacts, setLocalContacts] = useState<Contact[]>();
  const profileInfos = useProfileInfos();
  const [contactsPermissionStatus, setContactsPermissionStatus] = useState(
    ContactPermissionStatus.UNDETERMINED,
  );
  const [contactActionData, setContactActionData] = useState<
    ContactActionProps | undefined
  >();

  const { requestPhonebookPermissionAndRedirectToSettingsAsync } =
    usePhonebookPermission();

  // refresh local contact map
  const refreshLocalContacts = useCallback(async () => {
    if (contactsPermissionStatus === ContactPermissionStatus.GRANTED) {
      setLocalContacts(await getLocalContactsMap());
    } else if (contactsPermissionStatus === ContactPermissionStatus.DENIED) {
      setLocalContacts([]);
    } // else wait for permission update
  }, [contactsPermissionStatus]);

  // will setup the permission for this screen at first opening
  useEffect(() => {
    if (contactsPermissionStatus === ContactPermissionStatus.UNDETERMINED) {
      const updatePermission = async () => {
        const { status } =
          await requestPhonebookPermissionAndRedirectToSettingsAsync();
        setContactsPermissionStatus(status);
      };
      updatePermission();
    } else {
      refreshLocalContacts();
    }
  }, [
    contactsPermissionStatus,
    refreshLocalContacts,
    requestPhonebookPermissionAndRedirectToSettingsAsync,
  ]);

  useOnContactAdded(refreshLocalContacts);

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
                createdAt
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
                  uri: uri(width: 61, pixelRatio: $pixelRatio, format: png)
                }
                logo {
                  id
                  uri: uri(width: 61, pixelRatio: $pixelRatio, format: png)
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
                  avatar {
                    id
                    uri: uri(width: 61, pixelRatio: $pixelRatio, format: png)
                  }
                  contactCard {
                    urls {
                      address
                      selected
                    }
                    socials {
                      url
                      label
                      selected
                    }
                  }
                  webCard {
                    id
                    cardIsPublished
                    userName
                    hasCover
                    commonInformation {
                      addresses {
                        label
                        address
                      }
                      company
                      emails {
                        label
                        address
                      }
                      phoneNumbers {
                        label
                        number
                      }
                      socials {
                        label
                        url
                      }
                      urls {
                        address
                      }
                    }
                  }
                }
                webCard {
                  ...CoverRenderer_webCard
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

  // ensure we refresh contacts on resume
  useEffect(() => {
    if (contactsPermissionStatus === ContactPermissionStatus.GRANTED) {
      const subscription = AppState.addEventListener('change', state => {
        if (state === 'active') {
          refreshLocalContacts();
          refetchWithDefaultProps();
        }
      });
      return () => {
        subscription.remove();
      };
    }
  }, [contactsPermissionStatus, refetchWithDefaultProps, refreshLocalContacts]);

  const contacts = useMemo(() => {
    return (
      (data as ContactsScreenLists_contacts$data)?.searchContacts?.edges
        ?.map(edge => edge?.node)
        .filter(contact => !!contact) ?? []
    );
  }, [data]);

  // Warning This code trigger a full refresh of the contacts list
  useOnContactAddedToProfile(refetchWithDefaultProps);

  const onRefresh = useCallback(() => {
    if (!isLoadingNext && !refreshing) {
      setRefreshing(true);
      refreshLocalContacts();
      refetchWithDefaultProps();
      setRefreshing(false);
    }
  }, [
    isLoadingNext,
    refreshing,
    refreshLocalContacts,
    refetchWithDefaultProps,
  ]);

  // This code is used to refresh the screen when we come back to it.
  // After a contact exchange, this screen shall be refreshed to ensure the new contact is well displayed
  // Or not.
  // In some case, the new contact shall be displayed, and during search for example we cannot infer if the new contact shall be displayed
  // The safest way to implement it is to refresh the screen.
  useOnFocus(refreshLocalContacts);

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
    const profileId = profileInfos?.profileId;
    if (!profileId) {
      return;
    }
    commitContactsLastView({
      variables: {
        profileId,
      },
    });
  }, [commitContactsLastView, profileInfos, profileInfos?.profileId]);

  const removeContact = useRemoveContact();

  const onRemoveContacts = (contactIds: ContactType | ContactType[]) => {
    const profileId = profileInfos?.profileId;
    if (!profileId) {
      return;
    }
    const removedIds = (
      Array.isArray(contactIds) ? contactIds : [contactIds]
    ).map(contact => contact.id);

    removeContact(removedIds, profileId);
  };

  const onInviteContact = useOnInviteContact({
    onEnd: contactActionData?.hideInvitation,
  });

  const onInviteContactInner = useCallback(
    async (
      contact: ContactDetails | ContactType | ContactType[],
      onHideInvitation?: () => void,
    ) => {
      const result = await onInviteContact(
        contactsPermissionStatus,
        contact,
        localContacts,
        onHideInvitation,
      );
      if (result) {
        if (result.status) {
          setContactsPermissionStatus(result.status);
        }
        if (result.localContacts) {
          setLocalContacts(result.localContacts);
        }
      }
    },
    [contactsPermissionStatus, localContacts, onInviteContact],
  );

  const router = useRouter();
  const onShowContact = useCallback(
    async (contact: ContactType) => {
      if (
        contactsPermissionStatus === ContactPermissionStatus.GRANTED &&
        localContacts
      ) {
        const foundContact = await findLocalContact(
          contact.phoneNumbers.map(({ number }) => number),
          contact.emails.map(({ address }) => address),
          localContacts,
          contact.contactProfile?.id,
        );
        if (foundContact?.id) {
          await displayContactAsync(foundContact.id);
          return;
        }
      }

      router.push({
        route: 'CONTACT_DETAILS',
        params: {
          contactId: contact.id,
          profileId: contact.contactProfile?.id,
          webCardId: contact.contactProfile?.webCard?.cardIsPublished
            ? contact.contactProfile?.webCard?.id
            : null,
        },
      });
    },
    [contactsPermissionStatus, localContacts, router],
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

  if (
    localContacts === undefined ||
    contactsPermissionStatus === ContactPermissionStatus.UNDETERMINED
  ) {
    // no need to render before localContacts is queried
    return undefined;
  }

  return (
    <IsAzzappSupportedProvider>
      <View style={styles.flex}>
        {profile && searchBy === 'name' && (
          <ContactsScreenSearchByName
            contacts={contacts}
            onEndReached={onEndReached}
            onRefresh={onRefresh}
            refreshing={refreshing}
            onShowContact={onShowContact}
            localContacts={localContacts}
            contactsPermissionStatus={contactsPermissionStatus}
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
              localContacts={localContacts}
              contactsPermissionStatus={contactsPermissionStatus}
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
              localContacts={localContacts}
              contactsPermissionStatus={contactsPermissionStatus}
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
            localContacts={localContacts}
            contactsPermissionStatus={contactsPermissionStatus}
            showContactAction={setContactActionData}
            listFooterComponent={<Animated.View style={footerStyle} />}
          />
        )}
        <ContactActionModal
          contactActionData={contactActionData}
          close={() => setContactActionData(undefined)}
          onRemoveContacts={onRemoveContacts}
          onInviteContact={onInviteContactInner}
          onShow={onShowContact}
        />
      </View>
    </IsAzzappSupportedProvider>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});

export default ContactsScreenLists;
