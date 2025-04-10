import { useCallback } from 'react';
import { useMutation, graphql } from 'react-relay';
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
    mutation useRemoveContactMutation(
      $profileId: ID!
      $input: RemoveContactsInput!
    ) {
      removeContacts(profileId: $profileId, input: $input) {
        removedContactIds
      }
    }
  `);

  const removeContacts = useCallback(
    (contactIds: string[], profileId: string) => {
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
              (contactIds: string) => {
                store.delete(contactIds);
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
        onCompleted,
        onError,
      });
    },
    [commitRemoveContact, onCompleted, onError],
  );

  return removeContacts;
};

export default useRemoveContact;
