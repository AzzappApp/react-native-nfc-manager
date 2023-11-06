import { useIntl } from 'react-intl';
import Toast from 'react-native-toast-message';
import { useMutation, graphql, ConnectionHandler } from 'react-relay';
import Text from '#ui/Text';
import useAuthState from './useAuthState';
import type {
  useToggleFollowMutation,
  useToggleFollowMutation$data,
} from '@azzapp/relay/artifacts/useToggleFollowMutation.graphql';
import type { RecordSourceSelectorProxy, RecordProxy } from 'relay-runtime';

const propagateFollowUpdateInProfileList = (
  connection: RecordProxy,
  store: RecordSourceSelectorProxy<useToggleFollowMutation$data>,
  follow: boolean,
  webCardId: string,
) => {
  if (follow) {
    const followed = store.get(webCardId);
    if (followed) {
      const edge = ConnectionHandler.createEdge(
        store,
        connection,
        followed,
        'WebCardEdge',
      );
      ConnectionHandler.insertEdgeBefore(connection, edge);
    }
  } else {
    ConnectionHandler.deleteNode(connection, webCardId);
  }
};

const updater = (
  store: RecordSourceSelectorProxy<useToggleFollowMutation$data>,
  currentWebCardId: string,
  webCardId: string,
  follow: boolean,
  userNameFilter?: string,
) => {
  const currentWebCard = store.get(currentWebCardId);

  const nbFollowings = currentWebCard?.getValue('nbFollowings');

  if (typeof nbFollowings === 'number') {
    currentWebCard?.setValue(
      follow ? nbFollowings + 1 : nbFollowings - 1,
      'nbFollowings',
    );
  }

  const webCard = store.get(webCardId);

  webCard?.setValue(follow, 'isFollowing');

  const nbFollowers = webCard?.getValue('nbFollowers');

  if (typeof nbFollowers === 'number') {
    webCard?.setValue(
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
        webCardId,
      );
    }

    const connectionRecordHome = ConnectionHandler.getConnection(
      viewer,
      'WebCard_followings',
    );

    if (connectionRecordHome) {
      propagateFollowUpdateInProfileList(
        connectionRecordHome,
        store,
        follow,
        webCardId,
      );
    }

    ConnectionHandler.getConnection(
      viewer,
      'WebCard_followingsPosts',
    )?.invalidateRecord();
  }
};

const useToggleFollow = (userNameFilter?: string) => {
  const { webCardId: currentWebCardId } = useAuthState();
  const [commit, toggleFollowingActive] = useMutation<useToggleFollowMutation>(
    graphql`
      mutation useToggleFollowMutation($input: ToggleFollowingInput!) {
        toggleFollowing(input: $input) {
          webCard {
            id
            isFollowing
          }
        }
      }
    `,
  );

  const intl = useIntl();

  const toggleFollow = (
    webCardId: string,
    userName: string,
    follow: boolean,
  ) => {
    // TODO do we really want to prevent fast clicking?
    if (toggleFollowingActive) {
      return;
    }

    Toast.show({
      text1: (follow
        ? intl.formatMessage(
            {
              defaultMessage: 'You started to follow this Webcard{azzappAp}',
              description: 'Toast message when user follows a profile',
            },
            {
              azzappAp: <Text variant="azzapp">a</Text>,
            },
          )
        : intl.formatMessage(
            {
              defaultMessage: 'You no longer follow this Webcard{azzappAp}',
              description: 'Toast message when user unfollows a profile',
            },
            {
              azzappAp: <Text variant="azzapp">a</Text>,
            },
          )) as string,
    });

    // currentProfileId is undefined when user is anonymous so we can't follow
    if (currentWebCardId) {
      commit({
        variables: {
          input: {
            webCardId,
            follow,
          },
        },
        optimisticResponse: {
          toggleFollowing: {
            webCard: {
              id: webCardId,
              isFollowing: follow,
            },
          },
        },
        optimisticUpdater: store =>
          updater(store, currentWebCardId, webCardId, follow, userNameFilter),
        updater: store =>
          updater(store, currentWebCardId, webCardId, follow, userNameFilter),
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
