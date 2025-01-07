import {
  updateContactAsync,
  addContactAsync,
  PermissionStatus as ContactPermissionStatus,
  displayContactAsync,
} from 'expo-contacts';
import { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { useIntl } from 'react-intl';
import { AppState, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { usePaginationFragment, graphql, useMutation } from 'react-relay';
import { useOnFocus } from '#components/NativeRouter';
import { emitContactAdded, useOnContactAdded } from '#helpers/addContactHelper';
import { findLocalContact } from '#helpers/contactCardHelpers';
import {
  buildLocalContact,
  reworkContactForDeviceInsert,
} from '#helpers/contactListHelpers';
import { getLocalContactsMap } from '#helpers/getLocalContactsMap';
import { useProfileInfos } from '#hooks/authStateHooks';
import { usePhonebookPermission } from '#hooks/usePhonebookPermission';
import ContactDetailsModal from './ContactDetailsModal';
import { storage } from './ContactsScreen';
import ContactsScreenSearchByDate from './ContactsScreenSearchByDate';
import ContactsScreenSearchByName from './ContactsScreenSearchByName';
import type {
  ContactsScreenLists_contacts$data,
  ContactsScreenLists_contacts$key,
} from '#relayArtifacts/ContactsScreenLists_contacts.graphql';
import type { ContactsScreenListsMutation } from '#relayArtifacts/ContactsScreenListsMutation.graphql';
import type { ContactsScreenListsMutationUpdateContactsLastViewMutation } from '#relayArtifacts/ContactsScreenListsMutationUpdateContactsLastViewMutation.graphql';
import type {
  ContactDetails,
  ContactDetailsModalActions,
} from './ContactDetailsModal';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { Contact } from 'expo-contacts';

type ContactsScreenListsProps = {
  search: string | undefined;
  searchBy: 'date' | 'name';
  profile: ContactsScreenLists_contacts$key;
};
const ContactsScreenLists = ({
  search,
  searchBy,
  profile,
}: ContactsScreenListsProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const [localContacts, setLocalContacts] = useState<Contact[]>();
  const intl = useIntl();
  const profileInfos = useProfileInfos();
  const [contactsPermissionStatus, setContactsPermissionStatus] = useState(
    ContactPermissionStatus.UNDETERMINED,
  );
  const contactDetails = useRef<ContactDetailsModalActions>(null);

  const { requestPhonebookPermissionAndRedirectToSettingsAsync } =
    usePhonebookPermission();

  // will setup the permission for this screen at first opening
  useEffect(() => {
    if (contactsPermissionStatus === ContactPermissionStatus.UNDETERMINED) {
      const updatePermission = async () => {
        const { status } =
          await requestPhonebookPermissionAndRedirectToSettingsAsync();
        setContactsPermissionStatus(status);
      };
      updatePermission();
    }
  }, [
    contactsPermissionStatus,
    requestPhonebookPermissionAndRedirectToSettingsAsync,
  ]);

  // refresh loca contact map
  const refreshLocalContacts = useCallback(async () => {
    if (contactsPermissionStatus === ContactPermissionStatus.GRANTED) {
      setLocalContacts(await getLocalContactsMap());
    } else if (contactsPermissionStatus === ContactPermissionStatus.DENIED) {
      setLocalContacts([]);
    } // else wait for permission update
  }, [contactsPermissionStatus]);

  useOnContactAdded(refreshLocalContacts);

  useEffect(() => {
    refreshLocalContacts();
  }, [refreshLocalContacts]);

  // ensure we refresh contacts oon resume
  useEffect(() => {
    if (contactsPermissionStatus === ContactPermissionStatus.GRANTED) {
      const subscription = AppState.addEventListener('change', state => {
        if (state === 'active') {
          refreshLocalContacts();
        }
      });
      return () => {
        subscription.remove();
      };
    }
  }, [contactsPermissionStatus, refreshLocalContacts]);

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
        ) {
          searchContacts(
            after: $after
            first: $first
            name: $name
            orderBy: $orderBy
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
                birthday
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
                    cardIsPublished
                    userName
                    hasCover
                    ...ContactDetailsModal_webCard
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

  const contacts = useMemo(() => {
    return (
      (data as ContactsScreenLists_contacts$data)?.searchContacts?.edges
        ?.map(edge => edge?.node)
        .filter(contact => !!contact) ?? []
    );
  }, [data]);

  const onRefresh = useCallback(() => {
    if (!isLoadingNext && !refreshing) {
      setRefreshing(true);
      refreshLocalContacts();
      refetch(
        { name: search, orderBy: searchBy },
        { fetchPolicy: 'store-and-network' },
      );
      setRefreshing(false);
    }
  }, [
    isLoadingNext,
    refreshing,
    refreshLocalContacts,
    refetch,
    search,
    searchBy,
  ]);

  // This code is used to refresh the screen when we come back to it.
  // After a contact exchange, this screen shall be refreshed to ensure the new contact is well displayed
  // Or not.
  // In some case, the new contact shall be displayed, and during search for exemple we cannot infer if the new contact shall be displayed
  // The safest way to implement it is to refresh the screen.
  useOnFocus(onRefresh);

  const onEndReached = useCallback(() => {
    if (hasNext && !isLoadingNext) {
      loadNext(20);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  useEffect(() => {
    refetch(
      { name: search || undefined, orderBy: searchBy },
      { fetchPolicy: 'store-and-network' },
    );
  }, [search, refetch, searchBy]);

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
      updater: store => {
        const profile = store.get(profileId);
        profile?.setValue(0, 'nbNewContacts');
      },
    });
  }, [commitContactsLastView, profileInfos, profileInfos?.profileId]);

  const [commitRemoveContact] = useMutation<ContactsScreenListsMutation>(
    graphql`
      mutation ContactsScreenListsMutation(
        $profileId: ID!
        $input: RemoveContactsInput!
      ) {
        removeContacts(profileId: $profileId, input: $input) {
          removedContactIds
        }
      }
    `,
  );

  const onRemoveContacts = (contactIds: string[]) => {
    const profileId = profileInfos?.profileId;
    if (!profileId) {
      return;
    }
    commitRemoveContact({
      variables: {
        profileId,
        input: {
          contactIds,
        },
      },
      updater: (store, response) => {
        if (response?.removeContacts) {
          response.removeContacts.removedContactIds.forEach(
            removedContactId => {
              store.delete(removedContactId);
            },
          );
          const profile = store.get(profileId);
          const nbContacts = profile?.getValue('nbContacts');

          if (typeof nbContacts === 'number') {
            profile?.setValue(
              nbContacts - response.removeContacts.removedContactIds.length,
              'nbContacts',
            );
          }
        }
      },
    });
  };

  const onInviteContact = useCallback(
    async (contact: ContactType, onHideInvitation: () => void) => {
      const contactToAdd: Contact = await buildLocalContact(contact);
      try {
        let messageToast = '';
        if (
          contactsPermissionStatus === ContactPermissionStatus.GRANTED &&
          localContacts
        ) {
          const foundContact = await findLocalContact(
            storage,
            contact.phoneNumbers.map(({ number }) => number),
            contact.emails.map(({ address }) => address),
            localContacts,
            contact.contactProfile?.id,
          );

          if (foundContact) {
            const contactToAddReworked = reworkContactForDeviceInsert({
              ...contactToAdd,
              id: foundContact.id,
            });

            await updateContactAsync(contactToAddReworked);
            messageToast = intl.formatMessage({
              defaultMessage: 'The contact was updated successfully.',
              description:
                'Toast message when a contact is updated successfully',
            });
          } else {
            const contactToAddReworked =
              reworkContactForDeviceInsert(contactToAdd);

            const resultId = await addContactAsync(contactToAddReworked);

            if (contact.contactProfile) {
              storage.set(contact.contactProfile.id, resultId);
            }
            messageToast = intl.formatMessage({
              defaultMessage: 'The contact was created successfully.',
              description:
                'Toast message when a contact is created successfully',
            });
          }

          onHideInvitation();

          Toast.show({
            type: 'success',
            text1: messageToast,
          });
        }
      } catch (e) {
        console.error(e);
      }
    },
    [contactsPermissionStatus, intl, localContacts],
  );

  const onShowContact = useCallback(
    async (contact: ContactType) => {
      if (
        contactsPermissionStatus === ContactPermissionStatus.GRANTED &&
        localContacts
      ) {
        const foundContact = await findLocalContact(
          storage,
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

      const details = await buildLocalContact(contact);

      contactDetails.current?.open({
        ...details,
        createdAt: contact.createdAt,
        profileId: contact.contactProfile?.id,
        webCard: contact.contactProfile?.webCard?.cardIsPublished
          ? contact.contactProfile?.webCard
          : null,
      });
    },
    [contactsPermissionStatus, localContacts],
  );

  const onInviteFromContactDetails = useCallback(
    async (contact: ContactDetails) => {
      try {
        let messageToast = '';
        if (
          contactsPermissionStatus === ContactPermissionStatus.GRANTED &&
          localContacts
        ) {
          const phoneNumbers =
            contact.phoneNumbers
              ?.filter(({ number }) => !!number)
              .map(({ number }) => number) ?? [];

          const emails =
            contact.emails
              ?.filter(({ email }) => !!email)
              .map(({ email }) => email) ?? [];

          const foundContact = await findLocalContact(
            storage,
            phoneNumbers as string[],
            emails as string[],
            localContacts,
            contact.profileId,
          );

          if (foundContact) {
            const contactToAddReworked = reworkContactForDeviceInsert({
              ...contact,
              id: foundContact.id,
            });
            await updateContactAsync(contactToAddReworked);
            messageToast = intl.formatMessage({
              defaultMessage: 'The contact was updated successfully.',
              description:
                'Toast message when a contact is updated successfully',
            });
          } else {
            const contactToAddReworked = reworkContactForDeviceInsert(contact);
            const resultId = await addContactAsync(contactToAddReworked);

            if (contact.profileId) {
              storage.set(contact.profileId, resultId);
            }
            messageToast = intl.formatMessage({
              defaultMessage: 'The contact was created successfully.',
              description:
                'Toast message when a contact is created successfully',
            });
          }
          emitContactAdded();
          Toast.show({
            type: 'success',
            text1: messageToast,
          });
        }
      } catch (e) {
        console.error(e);
      }
    },
    [contactsPermissionStatus, intl, localContacts],
  );

  if (
    localContacts === undefined ||
    contactsPermissionStatus === ContactPermissionStatus.UNDETERMINED
  ) {
    // no need to render before locaContacts is queried
    return undefined;
  }

  return (
    <View
      style={{
        flex: 1,
      }}
    >
      {profile && searchBy === 'name' && (
        <ContactsScreenSearchByName
          contacts={contacts}
          onEndReached={onEndReached}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onRemoveContacts={onRemoveContacts}
          onInviteContact={onInviteContact}
          onShowContact={onShowContact}
          storage={storage}
          localContacts={localContacts}
          contactsPermissionStatus={contactsPermissionStatus}
        />
      )}
      {profile && searchBy === 'date' && (
        <ContactsScreenSearchByDate
          contacts={contacts}
          onEndReached={onEndReached}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onRemoveContacts={onRemoveContacts}
          onInviteContact={onInviteContact}
          onShowContact={onShowContact}
          storage={storage}
          localContacts={localContacts}
          contactsPermissionStatus={contactsPermissionStatus}
        />
      )}
      <ContactDetailsModal
        ref={contactDetails}
        onInviteContact={onInviteFromContactDetails}
      />
    </View>
  );
};

export default ContactsScreenLists;

type ContactType = NonNullable<
  NonNullable<
    NonNullable<
      ArrayItemType<
        ContactsScreenLists_contacts$data['searchContacts']['edges']
      >
    >
  >['node']
>;
