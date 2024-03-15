import { useCallback } from 'react';
import { graphql, useMutation } from 'react-relay';
import type { RecordSourceSelectorProxy } from 'relay-runtime';

const updater = (
  store: RecordSourceSelectorProxy<object>,
  profileId: string,
) => {
  const root = store.getRoot();
  const user = root.getLinkedRecord('currentUser');
  const profiles = user?.getLinkedRecords('profiles');
  if (!profiles) {
    return;
  }

  user?.setLinkedRecords(
    profiles?.filter(linkedProfile => linkedProfile.getDataID() !== profileId),
    'profiles',
  );
  root.setLinkedRecord(user, 'currentUser');
};

const useQuitWebCard = (
  profileId: string,
  onCompleted?: () => void,
  onError?: (error: Error) => void,
) => {
  const quitWebCardMutation = graphql`
    mutation useQuitWebCardMutation($profileId: ID!) @raw_response_type {
      quitWebCard(profileId: $profileId) {
        profileId
      }
    }
  `;

  const [commitMutationFn, isLoading] = useMutation(quitWebCardMutation);

  const quitWebCard = useCallback(
    () =>
      commitMutationFn({
        variables: {
          profileId,
        },
        optimisticResponse: {
          quitWebCard: {
            profileId,
          },
        },
        optimisticUpdater: store => updater(store, profileId),
        updater: store => updater(store, profileId),
        onCompleted,
        onError,
      }),
    [commitMutationFn, onCompleted, onError, profileId],
  );

  return [quitWebCard, isLoading] as const;
};

export default useQuitWebCard;
