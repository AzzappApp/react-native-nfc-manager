import { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import Toast from 'react-native-toast-message';
import { graphql, usePaginationFragment } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { isEditor } from '@azzapp/shared/profileHelpers';
import WebCardList from '#components/WebCardList';
import useAuthState from '#hooks/useAuthState';
import useToggleFollow from '#hooks/useToggleFollow';
import type { FollowingsScreenList_webCard$key } from '#relayArtifacts/FollowingsScreenList_webCard.graphql';

type FollowingsListProps = {
  webCard: FollowingsScreenList_webCard$key | null;
};

const FollowingsScreenList = ({ webCard: webCardKey }: FollowingsListProps) => {
  const { data, loadNext, hasNext, isLoadingNext, refetch } =
    usePaginationFragment(
      graphql`
        fragment FollowingsScreenList_webCard on WebCard
        @refetchable(queryName: "FollowingsListScreenQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 10 }
          userName: { type: String, defaultValue: "" }
        ) {
          followings(after: $after, first: $first, userName: $userName)
            @connection(key: "Account_followings") {
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

  const [isRefreshing, setIsRefreshing] = useState(false);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext && !isRefreshing) {
      loadNext(10);
    }
  }, [isLoadingNext, hasNext, isRefreshing, loadNext]);

  const intl = useIntl();

  const [searchValue, setSearchValue] = useState<string | undefined>('');

  const [debouncedSearch] = useDebounce(searchValue, 300);

  const toggleFollow = useToggleFollow(debouncedSearch);

  useEffect(() => {
    // We need to refetch to see new coming followers (specially when we follow another webCard we have)
    refetch(
      { first: 10, after: null },
      {
        fetchPolicy: 'store-and-network',
      },
    );
  }, [refetch]);

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

  const { profileInfos } = useAuthState();

  const onToggleFollow = useCallback(
    (profileId: string, profileUserName: string) => {
      if (isEditor(profileInfos?.profileRole)) {
        toggleFollow(profileId, profileUserName, false);
      } else {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage:
              'Only admins & editors can stop following a WebCard',
            description:
              'Error message when trying to unfollow a WebCard without being an admin',
          }),
        });
      }
    },
    [profileInfos, intl, toggleFollow],
  );

  return (
    <WebCardList
      searchValue={searchValue}
      setSearchValue={setSearchValue}
      noProfileFoundLabel={intl.formatMessage({
        defaultMessage: 'Not following anyone',
        description:
          'Message displayed in the followed profiles screen when the user is not following anyone',
      })}
      users={convertToNonNullArray(
        data?.followings?.edges?.map(edge => edge?.node) ?? [],
      )}
      onEndReached={onEndReached}
      onToggleFollow={onToggleFollow}
    />
  );
};

export default FollowingsScreenList;
