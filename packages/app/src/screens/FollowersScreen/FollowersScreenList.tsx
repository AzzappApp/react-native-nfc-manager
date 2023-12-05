import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import Toast from 'react-native-toast-message';
import { graphql, useMutation, usePaginationFragment } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { isEditor } from '@azzapp/shared/profileHelpers';
import WebCardList from '#components/WebCardList';
import useAuthState from '#hooks/useAuthState';
import type {
  FollowersScreenList_removeFollowerMutation,
  FollowersScreenList_removeFollowerMutation$data,
} from '@azzapp/relay/artifacts/FollowersScreenList_removeFollowerMutation.graphql';
import type { FollowersScreenList_webCard$key } from '@azzapp/relay/artifacts/FollowersScreenList_webCard.graphql';
import type { RecordSourceSelectorProxy } from 'relay-runtime';

type FollowersListProps = {
  isPublic: boolean;
  currentWebCardId: string;
  webCard: FollowersScreenList_webCard$key | null;
};

const FollowersScreenList = ({
  isPublic,
  currentWebCardId,
  webCard: webCardKey,
}: FollowersListProps) => {
  const { data, loadNext, hasNext, isLoadingNext, refetch } =
    usePaginationFragment(
      graphql`
        fragment FollowersScreenList_webCard on WebCard
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
                ...WebCardList_webCard
              }
            }
          }
        }
      `,
      webCardKey,
    );

  useEffect(() => {
    // We need to refetch to see new coming followers (specially when we follow another webCard we have)
    refetch(
      { first: 10, after: null },
      {
        fetchPolicy: 'store-and-network',
      },
    );
  }, [refetch]);

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

  const { profileRole } = useAuthState();

  const removeFollower = useCallback(
    (webCardId: string) => {
      if (profileRole && isEditor(profileRole)) {
        // currentProfileId is undefined when user is anonymous so we can't follow
        if (currentWebCardId && data?.followers) {
          //data.followers was null on sentry crash
          const connectionID = data.followers.__id;

          commit({
            variables: {
              input: {
                webCardId,
              },
              connections: [connectionID],
            },
            optimisticResponse: {
              removeFollower: {
                removedFollowerId: webCardId,
              },
            },
            optimisticUpdater: store =>
              updater(store, currentWebCardId, webCardId),
            updater: store => updater(store, currentWebCardId, webCardId),
            onError(error) {
              console.error(error);
              Toast.show({
                type: 'error',
                text1: intl.formatMessage({
                  defaultMessage:
                    'Error, could not remove follower, please try again later',
                  description:
                    'Error message displayed  when the user is not allowed to remove a follower',
                }),
              });
            },
          });
        }
      } else {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Only admins can remove a follower',
            description:
              'Error message displayed when the user is not allowed to remove a follower',
          }),
        });
      }
    },
    [commit, currentWebCardId, data?.followers, intl, profileRole],
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
      isPublic ? undefined : (webCardId: string) => removeFollower(webCardId),
    [isPublic, removeFollower],
  );

  return (
    <WebCardList
      searchValue={searchValue}
      setSearchValue={setSearchValue}
      users={convertToNonNullArray(
        data?.followers.edges?.map(edge => edge?.node) ?? [],
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
  currentWebCardId: string,
  webCardId: string,
) => {
  const currentWebCard = store.get(currentWebCardId);

  const nbFollowers = currentWebCard?.getValue('nbFollowers');

  if (typeof nbFollowers === 'number') {
    currentWebCard?.setValue(nbFollowers - 1, 'nbFollowers');
  }

  const webCard = store.get(webCardId);

  const nbFollowings = webCard?.getValue('nbFollowings');

  if (typeof nbFollowings === 'number') {
    webCard?.setValue(nbFollowings - 1, 'nbFollowings');
  }
};

export default FollowersScreenList;
