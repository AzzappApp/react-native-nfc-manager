import { useIntl } from 'react-intl';
import Toast from 'react-native-toast-message';
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
      ConnectionHandler.insertEdgeBefore(connection, edge);
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

  const nbFollowings = currentProfile?.getValue('nbFollowings');

  if (typeof nbFollowings === 'number') {
    currentProfile?.setValue(
      follow ? nbFollowings + 1 : nbFollowings - 1,
      'nbFollowings',
    );
  }

  const profile = store.get(profileId);

  profile?.setValue(follow, 'isFollowing');

  const nbFollowers = profile?.getValue('nbFollowers');

  if (typeof nbFollowers === 'number') {
    profile?.setValue(
      follow ? nbFollowers + 1 : nbFollowers - 1,
      'nbFollowers',
    );
  }

  const viewer = store.getRoot().getLinkedRecord('viewer');

  if (viewer) {
    const connectionRecord = ConnectionHandler.getConnection(
      viewer,
      'Account_followings',
      { userName: userNameFilter ?? '' },
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
      'Viewer_followings',
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
      'Viewer_followingsPosts',
    )?.invalidateRecord();
  }
};

const useToggleFollow = (
  currentProfileId?: string | null,
  userNameFilter?: string,
) => {
  const [commit, toggleFollowingActive] = useMutation<useToggleFollowMutation>(
    graphql`
      mutation useToggleFollowMutation($input: ToggleFollowingInput!) {
        toggleFollowing(input: $input) {
          profile {
            id
            isFollowing
          }
        }
      }
    `,
  );

  const intl = useIntl();

  const toggleFollow = (
    profileId: string,
    userName: string,
    follow: boolean,
  ) => {
    // TODO do we really want to prevent fast clicking?
    if (toggleFollowingActive) {
      return;
    }

    Toast.show({
      text1: follow
        ? intl.formatMessage({
            defaultMessage: 'You started to follow this Webcard™',
            description: 'Toast message when user follows a profile',
          })
        : intl.formatMessage({
            defaultMessage: 'You no longer follow this Webcard™',
            description: 'Toast message when user unfollows a profile',
          }),
    });

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
          console.error(error);
          Toast.show({
            type: 'error',
            text1: intl.formatMessage(
              {
                defaultMessage: 'Error, could not follow {userName}',
                description:
                  'Error toast message when we could not follow a user',
              },
              { userName },
            ),
          });
        },
      });
    }
  };

  return toggleFollow;
};

export default useToggleFollow;
