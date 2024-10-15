import {
  getContactsAsync,
  Fields,
  requestPermissionsAsync,
  updateContactAsync,
  presentFormAsync,
  addContactAsync,
  displayContactAsync,
  PermissionStatus as ContactPermissionStatus,
} from 'expo-contacts';
import { useMemo, useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Platform, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { usePaginationFragment, graphql, useMutation } from 'react-relay';
import { useOnFocus } from '#components/NativeRouter';
import { findLocalContact } from '#helpers/contactCardHelpers';
import { buildLocalContact } from '#helpers/contactListHelpers';
import { useProfileInfos } from '#hooks/authStateHooks';
import { storage } from '#hooks/useDeepLink';
import ContactsScreenSearchByDate from './ContactsScreenSearchByDate';
import ContactsScreenSearchByName from './ContactsScreenSearchByName';
import type { ContactsScreenListQuery$data } from '#relayArtifacts/ContactsScreenListQuery.graphql';
import type { ContactsScreenLists_contacts$data } from '#relayArtifacts/ContactsScreenLists_contacts.graphql';
import type { ContactsScreenListsMutation } from '#relayArtifacts/ContactsScreenListsMutation.graphql';
import type { ArrayItemType } from '@azzapp/shared/arrayHelpers';
import type { Contact } from 'expo-contacts';

type ContactsScreenListsProps = {
  search: string | undefined;
  searchBy: 'date' | 'name';
  profile: ContactsScreenListQuery$data['node'];
};
const ContactsScreenLists = ({
  search,
  searchBy,
  profile,
}: ContactsScreenListsProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const [localContacts, setLocalContacts] = useState<Contact[]>([]);
  const intl = useIntl();
  const profileInfos = useProfileInfos();

  useEffect(() => {
    const getLocalContacts = async () => {
      const { data } = await getContactsAsync({
        fields: [Fields.Emails, Fields.PhoneNumbers, Fields.ID],
      });
      setLocalContacts(data);
    };

    getLocalContacts();
  }, []);

  const { data, loadNext, hasNext, isLoadingNext, refetch } =
    usePaginationFragment(
      graphql`
        fragment ContactsScreenLists_contacts on Profile
        @refetchable(queryName: "ContactsScreenListQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 12 }
          name: { type: String, defaultValue: "" }
          orderBy: { type: SearchContactOrderBy, defaultValue: name }
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
                contactProfile {
                  id
                  avatar {
                    id
                    uri: uri(width: 61, pixelRatio: $pixelRatio)
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
                    ...CoverRenderer_webCard
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
      refetch(
        { name: search, orderBy: searchBy },
        { fetchPolicy: 'store-and-network' },
      );
      setRefreshing(false);
    }
  }, [search, isLoadingNext, refetch, refreshing, searchBy]);

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
    commitRemoveContact({
      variables: {
        profileId: profileInfos!.profileId,
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
          const profile = store.get(profileInfos!.profileId);
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
      const contactToAdd = buildLocalContact(contact);

      try {
        let messageToast = '';
        const { status } = await requestPermissionsAsync();
        if (status === 'granted') {
          const foundContact = await findLocalContact(
            storage,
            contact.phoneNumbers.map(({ number }) => number),
            contact.emails.map(({ address }) => address),
            localContacts,
            contact.contactProfile?.id,
          );

          if (foundContact) {
            if (Platform.OS === 'ios') {
              await updateContactAsync({
                ...contactToAdd,
                id: foundContact.id,
              });
            } else {
              await presentFormAsync(foundContact.id, contactToAdd);
            }
            messageToast = intl.formatMessage({
              defaultMessage: 'The contact was updated successfully.',
              description:
                'Toast message when a contact is updated successfully',
            });
          } else {
            const resultId = await addContactAsync(contactToAdd);

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
    [intl, localContacts],
  );

  const onShowContact = useCallback(
    async (contact: ContactType) => {
      const { status } = await requestPermissionsAsync();
      if (status === ContactPermissionStatus.GRANTED && localContacts) {
        const foundContact = await findLocalContact(
          storage,
          contact.phoneNumbers.map(({ number }) => number),
          contact.emails.map(({ address }) => address),
          localContacts,
          contact.contactProfile?.id,
        );
        if (foundContact?.id) {
          await displayContactAsync(foundContact.id);
        }
        // FIXME open in app contact detail view
      }
    },
    [localContacts],
  );

  return (
    <View
      style={{
        marginHorizontal: 10,
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
        />
      )}
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
