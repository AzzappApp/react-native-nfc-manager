import { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { graphql, usePaginationFragment } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import ProfileList from '#components/ProfileList';
import useToggleFollow from '#hooks/useToggleFollow';
import type { FollowingsScreenList_viewer$key } from '@azzapp/relay/artifacts/FollowingsScreenList_viewer.graphql';

type FollowingsListProps = {
  currentProfileId: string;
  viewer: FollowingsScreenList_viewer$key;
};

const FollowingsScreenList = ({
  currentProfileId,
  viewer: viewerKey,
}: FollowingsListProps) => {
  const { data, loadNext, hasNext, isLoadingNext, refetch } =
    usePaginationFragment(
      graphql`
        fragment FollowingsScreenList_viewer on Viewer
        @refetchable(queryName: "FollowingsListScreenQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 10 }
        ) {
          followings(after: $after, first: $first)
            @connection(key: "Account_followings") {
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

  const intl = useIntl();

  const [searchValue, setSearchValue] = useState<string | undefined>('');

  const [debouncedSearch] = useDebounce(searchValue, 300);

  const toggleFollow = useToggleFollow(currentProfileId, debouncedSearch);

  useEffect(() => {
    const { dispose } = refetch(
      { first: 10, userName: debouncedSearch, after: null },
      {
        fetchPolicy: 'store-and-network',
      },
    );
    return dispose;
  }, [debouncedSearch, refetch]);

  const onToggleFollow = useCallback(
    (profileId: string) => {
      toggleFollow(profileId, false);
    },
    [toggleFollow],
  );

  return (
    <ProfileList
      searchValue={searchValue}
      setSearchValue={setSearchValue}
      noProfileFoundLabel={intl.formatMessage({
        defaultMessage: 'Not following anyone',
        description:
          'Message displayed in the followed profiles screen when the user is not following anyone',
      })}
      users={convertToNonNullArray(
        data.followings.edges?.map(edge => edge?.node) ?? [],
      )}
      onEndReached={onEndReached}
      onToggleFollow={onToggleFollow}
    />
  );
};

export default FollowingsScreenList;
