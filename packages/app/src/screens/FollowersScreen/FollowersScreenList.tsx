import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import Toast from 'react-native-toast-message';
import { graphql, useMutation, usePaginationFragment } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import WebCardList from '#components/WebCardList';
import { getAuthState } from '#helpers/authStore';
import { profileInfoHasEditorRight } from '#helpers/profileRoleHelper';
import type {
  FollowersScreenList_removeFollowerMutation,
  FollowersScreenList_removeFollowerMutation$data,
} from '#relayArtifacts/FollowersScreenList_removeFollowerMutation.graphql';
import type { FollowersScreenList_webCard$key } from '#relayArtifacts/FollowersScreenList_webCard.graphql';
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
        $webCardId: ID!
        $input: RemoveFollowerInput!
      ) {
        removeFollower(webCardId: $webCardId, input: $input) {
          removedFollowerId @deleteEdge(connections: $connections)
        }
      }
    `,
  );

  const intl = useIntl();

  const removeFollower = useCallback(
    (removedFollowerId: string) => {
      const { profileInfos } = getAuthState();
      const webCardId = profileInfos?.webCardId;
      if (!webCardId) {
        return;
      }
      if (profileInfoHasEditorRight(profileInfos)) {
        // currentProfileId is undefined when user is anonymous so we can't follow
        if (currentWebCardId && data?.followers) {
          //data.followers was null on sentry crash
          const connectionID = data.followers.__id;

          commit({
            variables: {
              webCardId,
              input: {
                removedFollowerId,
              },
              connections: [connectionID],
            },
            optimisticUpdater: store =>
              updater(store, currentWebCardId, removedFollowerId),
            updater: store =>
              updater(store, currentWebCardId, removedFollowerId),
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
            defaultMessage: 'Your role does not permit this action',
            description:
              'Error message displayed when the user is not allowed to remove a follower',
          }),
        });
      }
    },
    [commit, currentWebCardId, data?.followers, intl],
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
