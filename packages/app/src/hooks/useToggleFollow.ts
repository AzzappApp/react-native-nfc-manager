import { useMutation, graphql, ConnectionHandler } from 'react-relay';
import type {
  useToggleFollowMutation,
  useToggleFollowMutation$data,
} from '@azzapp/relay/artifacts/useToggleFollowMutation.graphql';
import type { RecordSourceSelectorProxy, RecordProxy } from 'relay-runtime';

const propagateFollowUpdateInProfileList = (
  connection: RecordProxy,
  store: RecordSourceSelectorProxy<useToggleFollowMutation$data>,
  follow: boolean,
  profileId: string,
) => {
  if (follow) {
    const followed = store.get(profileId);
    if (followed) {
      const edge = ConnectionHandler.createEdge(
        store,
        connection,
        followed,
        'ProfileEdge',
      );
      ConnectionHandler.insertEdgeAfter(connection, edge);
    }
  } else {
    ConnectionHandler.deleteNode(connection, profileId);
  }
};

const updater = (
  store: RecordSourceSelectorProxy<useToggleFollowMutation$data>,
  currentProfileId: string,
  profileId: string,
  follow: boolean,
) => {
  const currentProfile = store.get(currentProfileId);

  const nbFollowedProfiles = currentProfile?.getValue('nbFollowedProfiles');

  if (typeof nbFollowedProfiles === 'number') {
    currentProfile?.setValue(
      follow ? nbFollowedProfiles + 1 : nbFollowedProfiles - 1,
      'nbFollowedProfiles',
    );
  }

  const profile = store.get(profileId);

  profile?.setValue(follow, 'isFollowing');

  const viewer = store.getRoot().getLinkedRecord('viewer');

  if (viewer) {
    const connectionRecord = ConnectionHandler.getConnection(
      viewer,
      'Account_followedProfiles',
    );

    if (connectionRecord) {
      propagateFollowUpdateInProfileList(
        connectionRecord,
        store,
        follow,
        profileId,
      );
    }

    const connectionRecordHome = ConnectionHandler.getConnection(
      viewer,
      'Viewer_followedProfiles',
    );

    if (connectionRecordHome) {
      propagateFollowUpdateInProfileList(
        connectionRecordHome,
        store,
        follow,
        profileId,
      );
    }

    ConnectionHandler.getConnection(
      viewer,
      'SuggestedProfilesList_suggestedProfiles',
    )?.invalidateRecord();

    ConnectionHandler.getConnection(
      viewer,
      'Viewer_followedProfilesPosts',
    )?.invalidateRecord();
  }
};

const useToggleFollow = (currentProfileId?: string) => {
  const [commit, toggleFollowingActive] =
    useMutation<useToggleFollowMutation>(graphql`
      mutation useToggleFollowMutation($input: ToggleFollowingInput!) {
        toggleFollowing(input: $input) {
          profile {
            id
            isFollowing
          }
        }
      }
    `);

  const toggleFollow = (profileId: string, follow: boolean) => {
    // TODO do we really want to prevent fast clicking?
    if (toggleFollowingActive) {
      return;
    }

    // currentProfileId is undefined when user is anonymous so we can't follow
    if (currentProfileId) {
      commit({
        variables: {
          input: {
            profileId,
            follow,
          },
        },
        optimisticResponse: {
          toggleFollowing: {
            profile: {
              id: profileId,
              isFollowing: false,
            },
          },
        },
        optimisticUpdater: store =>
          updater(store, currentProfileId, profileId, follow),
        updater: store => updater(store, currentProfileId, profileId, follow),
        onError(error) {
          // TODO: handle error
          console.log(error);
        },
      });
    }
  };

  return toggleFollow;
};

export default useToggleFollow;
