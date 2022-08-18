import { convertToNonNullArray } from '@azzapp/shared/lib/arrayHelpers';
import { useCallback, useMemo } from 'react';
import { graphql, usePaginationFragment } from 'react-relay';
import CoverList from '../components/CoverList';
import type { CoverList_users$key } from '@azzapp/relay/artifacts/CoverList_users.graphql';
import type { RecommandedUsersList_viewer$key } from '@azzapp/relay/artifacts/RecommandedUsersList_viewer.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type RecommandedUsersListProps = {
  viewer: RecommandedUsersList_viewer$key;
  canPlay: boolean;
  style?: StyleProp<ViewStyle>;
};

const RecommandedUsersList = ({
  viewer,
  canPlay,
  style,
}: RecommandedUsersListProps) => {
  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment(
    graphql`
      fragment RecommandedUsersList_viewer on Viewer
      @refetchable(queryName: "RecommandedUsersListQuery")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 10 }
      ) {
        recommandedUsers(after: $after, first: $first)
          @connection(key: "Viewer_recommandedUsers") {
          edges {
            node {
              ...CoverList_users
            }
          }
        }
        user {
          ...CoverList_users
        }
      }
    `,
    viewer,
  );

  const users: CoverList_users$key = useMemo(() => {
    const recommandedUrsers = data.recommandedUsers.edges
      ?.map(edge => edge?.node)
      .filter(item => !!item);
    return convertToNonNullArray(
      data.user
        ? [data.user, ...(recommandedUrsers ?? [])]
        : recommandedUrsers ?? [],
    );
  }, [data.recommandedUsers.edges, data.user]);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext) {
      loadNext(10);
    }
  }, [isLoadingNext, hasNext, loadNext]);

  return (
    <CoverList
      users={users}
      onEndReached={onEndReached}
      canPlay={canPlay}
      style={style}
    />
  );
};

export default RecommandedUsersList;
