import { useCallback } from 'react';
import { graphql, useMutation } from 'react-relay';
import type { RecordSourceSelectorProxy } from 'relay-runtime';

const updater = (
  store: RecordSourceSelectorProxy<object>,
  webCardId: string,
) => {
  const root = store.getRoot();
  const user = root.getLinkedRecord('currentUser');
  const profiles = user?.getLinkedRecords('profiles');
  if (!profiles) {
    return;
  }

  user?.setLinkedRecords(
    profiles?.filter(
      linkedProfile =>
        linkedProfile?.getLinkedRecord('webCard')?.getDataID() !== webCardId,
    ),
    'profiles',
  );
  root.setLinkedRecord(user, 'currentUser');
};

const useQuitWebCard = (
  webCardId?: string,
  onCompleted?: () => void,
  onError?: (error: Error) => void,
) => {
  const quitWebCardMutation = graphql`
    mutation useQuitWebCardMutation($webCardId: ID!) @raw_response_type {
      quitWebCard(webCardId: $webCardId) {
        webCardId
      }
    }
  `;

  const [commitMutationFn, isLoading] = useMutation(quitWebCardMutation);

  const quitWebCard = useCallback(() => {
    if (!webCardId) {
      return;
    }
    return commitMutationFn({
      variables: {
        webCardId,
      },
      optimisticResponse: {
        quitWebCard: {
          webCardId,
        },
      },
      updater: store => updater(store, webCardId),
      onCompleted,
      onError,
    });
  }, [commitMutationFn, onCompleted, onError, webCardId]);

  return [quitWebCard, isLoading] as const;
};

export default useQuitWebCard;
