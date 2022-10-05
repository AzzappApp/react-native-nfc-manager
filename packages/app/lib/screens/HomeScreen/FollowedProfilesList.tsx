import { convertToNonNullArray } from '@azzapp/shared/lib/arrayHelpers';
import { useCallback, useMemo } from 'react';
import { graphql, usePaginationFragment } from 'react-relay';
import CoverList from '../../components/CoverList';
import type { CoverList_users$key } from '@azzapp/relay/artifacts/CoverList_users.graphql';
import type { FollowedProfilesList_viewer$key } from '@azzapp/relay/artifacts/FollowedProfilesList_viewer.graphql';
import type { StyleProp, ViewStyle } from 'react-native';

type FollowedProfilesListProps = {
  viewer: FollowedProfilesList_viewer$key;
  canPlay: boolean;
  style?: StyleProp<ViewStyle>;
};

const FollowedProfilesList = ({
  viewer,
  canPlay,
  style,
}: FollowedProfilesListProps) => {
  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment(
    graphql`
      fragment FollowedProfilesList_viewer on Viewer
      @refetchable(queryName: "FollowedProfilesListQuery")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 10 }
      ) {
        followedProfiles(after: $after, first: $first)
          @connection(key: "Viewer_followedProfiles") {
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
    const recommendedUrsers = data.followedProfiles.edges
      ?.map(edge => edge?.node)
      .filter(item => !!item);
    return convertToNonNullArray(
      data.user
        ? [data.user, ...(recommendedUrsers ?? [])]
        : recommendedUrsers ?? [],
    );
  }, [data.followedProfiles.edges, data.user]);

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

export default FollowedProfilesList;
