import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { graphql, useMutation, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import ProfileList from '#components/ProfileList';
import type {
  FollowersScreenList_removeFollowerMutation,
  FollowersScreenList_removeFollowerMutation$data,
} from '@azzapp/relay/artifacts/FollowersScreenList_removeFollowerMutation.graphql';
import type { FollowersScreenList_viewer$key } from '@azzapp/relay/artifacts/FollowersScreenList_viewer.graphql';
import type { RecordSourceSelectorProxy } from 'relay-runtime';

type FollowersListProps = {
  isPublic: boolean;
  currentProfileId: string;
  viewer: FollowersScreenList_viewer$key;
};

const FollowersScreenList = ({
  isPublic,
  currentProfileId,
  viewer: viewerKey,
}: FollowersListProps) => {
  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment(
    graphql`
      fragment FollowersScreenList_viewer on Viewer
      @refetchable(queryName: "FollowersListScreenQuery")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 10 }
      ) {
        followers(after: $after, first: $first)
          @connection(key: "Account_followers") {
          __id
          edges {
            node {
              ...ProfileList_users
            }
          }
        }
      }
    `,
    viewerKey,
  );

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext) {
      loadNext(10);
    }
  }, [isLoadingNext, hasNext, loadNext]);

  const [commit] =
    useMutation<FollowersScreenList_removeFollowerMutation>(graphql`
      mutation FollowersScreenList_removeFollowerMutation(
        $connections: [ID!]!
        $input: RemoveFollowerInput!
      ) {
        removeFollower(input: $input) {
          removedFollowerId @deleteEdge(connections: $connections)
        }
      }
    `);

  const removeFollower = (profileId: string) => {
    // currentProfileId is undefined when user is anonymous so we can't follow
    if (currentProfileId) {
      const connectionID = data.followers.__id;

      console.log({ profileId });

      commit({
        variables: {
          input: {
            profileId,
          },
          connections: [connectionID],
        },
        optimisticResponse: {
          removeFollower: {
            removedFollowerId: profileId,
          },
        },
        optimisticUpdater: store => updater(store, currentProfileId, profileId),
        updater: store => updater(store, currentProfileId, profileId),
        onError(error) {
          // TODO: handle error
          console.log(error);
        },
      });
    }
  };

  const intl = useIntl();

  return (
    data.followers?.edges && (
      <ProfileList
        users={convertToNonNullArray(
          data.followers.edges?.map(edge => edge?.node),
        )}
        onEndReached={onEndReached}
        onToggleFollow={
          isPublic
            ? undefined
            : (profileId: string) => removeFollower(profileId)
        }
        noProfileFoundLabel={intl.formatMessage({
          defaultMessage: 'No followers',
          description:
            'Message displayed in the followers screen when the user has no followers',
        })}
      />
    )
  );
};

const updater = (
  store: RecordSourceSelectorProxy<FollowersScreenList_removeFollowerMutation$data>,
  currentProfileId: string,
  profileId: string,
) => {
  const currentProfile = store.get(currentProfileId);

  const nbFollowers = currentProfile?.getValue('nbFollowersProfiles');

  if (typeof nbFollowers === 'number') {
    currentProfile?.setValue(nbFollowers - 1, 'nbFollowersProfiles');
  }

  const profile = store.get(profileId);

  const nbFollowings = profile?.getValue('nbFollowedProfiles');

  if (typeof nbFollowings === 'number') {
    profile?.setValue(nbFollowings - 1, 'nbFollowedProfiles');
  }
};

export default FollowersScreenList;
