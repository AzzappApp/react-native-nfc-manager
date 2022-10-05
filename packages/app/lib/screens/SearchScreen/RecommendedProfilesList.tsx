import { convertToNonNullArray } from '@azzapp/shared/lib/arrayHelpers';
import { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { graphql, usePaginationFragment } from 'react-relay';
import CoverList from '../../components/CoverList';
import type { CoverList_users$key } from '@azzapp/relay/artifacts/CoverList_users.graphql';
import type { RecommendedProfilesList_viewer$key } from '@azzapp/relay/artifacts/RecommendedProfilesList_viewer.graphql';
import type { RecommendedProfilesListQuery } from '@azzapp/relay/artifacts/RecommendedProfilesListQuery.graphql';
type RecommendedProfilesListProps = {
  viewer: RecommendedProfilesList_viewer$key;
  canPlay: boolean;
};

const RecommendedProfilesList = ({
  viewer,
  canPlay,
}: RecommendedProfilesListProps) => {
  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment<
    RecommendedProfilesListQuery,
    RecommendedProfilesList_viewer$key
  >(
    graphql`
      fragment RecommendedProfilesList_viewer on Viewer
      @refetchable(queryName: "RecommendedProfilesListQuery")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 10 }
      ) {
        recommendedProfiles(after: $after, first: $first)
          @connection(key: "Viewer_recommendedProfiles") {
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
    return convertToNonNullArray(
      data.recommendedProfiles.edges?.map(edge => edge?.node) ?? [],
    );
  }, [data?.recommendedProfiles?.edges]);

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
      coverStyle={styles.coverStyle}
      containerStyle={styles.containerStyle}
    />
  );
};

export default RecommendedProfilesList;

const styles = StyleSheet.create({
  coverStyle: { width: 80, marginLeft: 5, marginRight: 0 },
  containerStyle: { paddingLeft: 3 },
});
