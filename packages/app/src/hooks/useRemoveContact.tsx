import { useCallback } from 'react';
import { useMutation, graphql } from 'react-relay';
import { removeContactUpdater } from '#helpers/contactHelpers';
import type { useRemoveContactMutation } from '#relayArtifacts/useRemoveContactMutation.graphql';

type useRemoveContactProps = {
  onCompleted?: () => void;
  onError?: (e: Error) => void;
};

const useRemoveContact = ({
  onCompleted,
  onError,
}: useRemoveContactProps = {}) => {
  const [commitRemoveContact] = useMutation<useRemoveContactMutation>(graphql`
    mutation useRemoveContactMutation($input: RemoveContactsInput!) {
      removeContacts(input: $input) {
        removedContactIds
      }
    }
  `);

  const removeContacts = useCallback(
    (contactIds: string[]) => {
      commitRemoveContact({
        variables: {
          input: {
            contactIds,
          },
        },
        updater: (store, response) => {
          if (!response?.removeContacts) {
            return;
          }
          const user = store.getRoot().getLinkedRecord('currentUser');
          if (!user) {
            return;
          }
          response.removeContacts.removedContactIds.forEach(contactId => {
            removeContactUpdater(store, user, contactId);
          });
        },
        onCompleted,
        onError,
      });
    },
    [commitRemoveContact, onCompleted, onError],
  );

  return removeContacts;
};

export default useRemoveContact;
