import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import Toast from 'react-native-toast-message';
import { graphql, useMutation, usePaginationFragment } from 'react-relay';
import { useDebounce } from 'use-debounce';
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
  const { data, loadNext, hasNext, isLoadingNext, refetch } =
    usePaginationFragment(
      graphql`
        fragment FollowersScreenList_viewer on Viewer
        @refetchable(queryName: "FollowersListScreenQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 10 }
          userName: { type: String, defaultValue: "" }
        ) {
          followers(after: $after, first: $first, userName: $userName)
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

  const [isRefreshing, setIsRefreshing] = useState(false);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext && !isRefreshing) {
      loadNext(10);
    }
  }, [isLoadingNext, hasNext, isRefreshing, loadNext]);

  const [commit] = useMutation<FollowersScreenList_removeFollowerMutation>(
    graphql`
      mutation FollowersScreenList_removeFollowerMutation(
        $connections: [ID!]!
        $input: RemoveFollowerInput!
      ) {
        removeFollower(input: $input) {
          removedFollowerId @deleteEdge(connections: $connections)
        }
      }
    `,
  );

  const intl = useIntl();

  const removeFollower = useCallback(
    (profileId: string) => {
      // currentProfileId is undefined when user is anonymous so we can't follow
      if (currentProfileId && data.followers) {
        //data.followers was null on sentry crash
        const connectionID = data.followers.__id;

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
          optimisticUpdater: store =>
            updater(store, currentProfileId, profileId),
          updater: store => updater(store, currentProfileId, profileId),
          onError(error) {
            console.error(error);
            Toast.show({
              type: 'error',
              text1: intl.formatMessage({
                defaultMessage:
                  'Error, could not remove follower, please try again later',
                description:
                  'Error message displayed when the user could not remove a follower',
              }),
            });
          },
        });
      }
    },
    [commit, currentProfileId, data.followers.__id, intl],
  );

  const [searchValue, setSearchValue] = useState<string | undefined>('');

  const [debouncedSearch] = useDebounce(searchValue, 300);

  useEffect(() => {
    if (debouncedSearch) {
      setIsRefreshing(true);
      const { dispose } = refetch(
        { first: 10, userName: debouncedSearch, after: null },
        {
          fetchPolicy: 'store-and-network',
          onComplete() {
            setIsRefreshing(false);
          },
        },
      );
      return dispose;
    }
  }, [debouncedSearch, refetch]);

  const onToggleFollow = useMemo(
    () =>
      isPublic ? undefined : (profileId: string) => removeFollower(profileId),
    [isPublic, removeFollower],
  );

  return (
    <ProfileList
      searchValue={searchValue}
      setSearchValue={setSearchValue}
      users={convertToNonNullArray(
        data.followers.edges?.map(edge => edge?.node) ?? [],
      )}
      onEndReached={onEndReached}
      onToggleFollow={onToggleFollow}
      noProfileFoundLabel={intl.formatMessage({
        defaultMessage: 'No followers',
        description:
          'Message displayed in the followers screen when the user has no followers',
      })}
    />
  );
};

const updater = (
  store: RecordSourceSelectorProxy<FollowersScreenList_removeFollowerMutation$data>,
  currentProfileId: string,
  profileId: string,
) => {
  const currentProfile = store.get(currentProfileId);

  const nbFollowers = currentProfile?.getValue('nbFollowers');

  if (typeof nbFollowers === 'number') {
    currentProfile?.setValue(nbFollowers - 1, 'nbFollowers');
  }

  const profile = store.get(profileId);

  const nbFollowings = profile?.getValue('nbFollowings');

  if (typeof nbFollowings === 'number') {
    profile?.setValue(nbFollowings - 1, 'nbFollowings');
  }
};

export default FollowersScreenList;
