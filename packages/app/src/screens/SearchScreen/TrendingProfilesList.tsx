import { useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { graphql, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import CoverList from '#components/CoverList';
import type { CoverList_users$key } from '@azzapp/relay/artifacts/CoverList_users.graphql';
import type { TrendingProfilesList_viewer$key } from '@azzapp/relay/artifacts/TrendingProfilesList_viewer.graphql';
import type { TrendingProfilesListQuery } from '@azzapp/relay/artifacts/TrendingProfilesListQuery.graphql';

type TrendingProfilesListProps = {
  viewer: TrendingProfilesList_viewer$key;
};

const TrendingProfilesList = ({ viewer }: TrendingProfilesListProps) => {
  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment<
    TrendingProfilesListQuery,
    TrendingProfilesList_viewer$key
  >(
    graphql`
      fragment TrendingProfilesList_viewer on Viewer
      @refetchable(queryName: "TrendingProfilesListQuery")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 10 }
      ) {
        trendingProfiles(after: $after, first: $first)
          @connection(key: "Viewer_trendingProfiles") {
          edges {
            node {
              ...CoverList_users
            }
          }
        }
      }
    `,
    viewer,
  );

  const users: CoverList_users$key = useMemo(() => {
    return convertToNonNullArray(
      data.trendingProfiles.edges?.map(edge => edge?.node) ?? [],
    );
  }, [data.trendingProfiles.edges]);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext) {
      loadNext(10);
    }
  }, [isLoadingNext, hasNext, loadNext]);

  return (
    <CoverList
      users={users}
      onEndReached={onEndReached}
      containerStyle={styles.containerStyle}
      coverStyle={styles.coverStyle}
    />
  );
};

export default TrendingProfilesList;

const styles = StyleSheet.create({
  containerStyle: { paddingLeft: 3 },
  coverStyle: { width: 80, marginLeft: 5, marginRight: 0 },
});
