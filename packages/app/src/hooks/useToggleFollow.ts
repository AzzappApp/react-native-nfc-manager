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
  userNameFilter?: string,
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

  const nbFollowers = profile?.getValue('nbFollowersProfiles');

  if (typeof nbFollowers === 'number') {
    profile?.setValue(
      follow ? nbFollowers + 1 : nbFollowers - 1,
      'nbFollowersProfiles',
    );
  }

  const viewer = store.getRoot().getLinkedRecord('viewer');

  if (viewer) {
    const connectionRecord = ConnectionHandler.getConnection(
      viewer,
      'Account_followedProfiles',
      {
        userName: userNameFilter ?? '',
      },
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

const useToggleFollow = (
  currentProfileId?: string,
  userNameFilter?: string,
) => {
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
              isFollowing: follow,
            },
          },
        },
        optimisticUpdater: store =>
          updater(store, currentProfileId, profileId, follow, userNameFilter),
        updater: store =>
          updater(store, currentProfileId, profileId, follow, userNameFilter),
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
