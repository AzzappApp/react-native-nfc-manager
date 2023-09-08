import { useMemo, useCallback, memo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { graphql, usePaginationFragment, usePreloadedQuery } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';
import CoverList from '#components/CoverList';
import SkeletonPlaceholder from '#components/Skeleton';
import type { CoverList_users$key } from '@azzapp/relay/artifacts/CoverList_users.graphql';
import type { SearchResultProfiles_viewer$key } from '@azzapp/relay/artifacts/SearchResultProfiles_viewer.graphql';
import type { SearchResultProfilesQuery } from '@azzapp/relay/artifacts/SearchResultProfilesQuery.graphql';
import type { PreloadedQuery } from 'react-relay';

export const searchResultProfilesQuery = graphql`
  query SearchResultProfilesQuery($search: String!) {
    viewer {
      ...SearchResultProfiles_viewer @arguments(search: $search)
    }
  }
`;

type SearchResultProfilesProps = {
  queryReference: PreloadedQuery<SearchResultProfilesQuery>;
};

const SearchResultProfiles = ({
  queryReference,
}: SearchResultProfilesProps) => {
  const preloadedQuery = usePreloadedQuery<SearchResultProfilesQuery>(
    searchResultProfilesQuery,
    queryReference,
  );

  const { data, loadNext, isLoadingNext, hasNext } = usePaginationFragment<
    SearchResultProfilesQuery,
    SearchResultProfiles_viewer$key
  >(
    graphql`
      fragment SearchResultProfiles_viewer on Viewer
      @refetchable(queryName: "SearchResultProfilesListQuery")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 8 }
        search: { type: "String!" }
      ) {
        searchProfiles(
          after: $after
          first: $first
          search: $search
          useLocation: false
        ) @connection(key: "Viewer_searchProfiles") {
          edges {
            node {
              ...CoverList_users
            }
          }
        }
      }
    `,
    preloadedQuery.viewer,
  );

  const users: CoverList_users$key = useMemo(() => {
    return convertToNonNullArray(
      data.searchProfiles?.edges?.map(edge => edge?.node) ?? [],
    );
  }, [data.searchProfiles?.edges]);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext) {
      loadNext(20);
    }
  }, [isLoadingNext, hasNext, loadNext]);

  return (
    <CoverList
      users={users}
      onEndReached={onEndReached}
      containerStyle={styles.containerStyle}
      coverStyle={styles.coverStyle}
      horizontal={false}
      numColums={2}
      initialNumToRender={4}
      columnWrapperStyle={styles.columnStyle}
      withShadow
    />
  );
};

export default memo(SearchResultProfiles);

export const SearchResultProfilesPlaceHolder = () => {
  return (
    <View style={styles.viewPlaceholder}>
      <View style={[styles.viewColumn, { paddingRight: 3 }]}>
        <SkeletonPlaceholder style={[styles.profilePlaceHolder]} />
        <SkeletonPlaceholder style={[styles.profilePlaceHolder]} />
        <SkeletonPlaceholder style={[styles.profilePlaceHolder]} />
      </View>
      <View style={[styles.viewColumn, { paddingLeft: 3 }]}>
        <SkeletonPlaceholder style={[styles.profilePlaceHolder]} />
        <SkeletonPlaceholder style={[styles.profilePlaceHolder]} />
        <SkeletonPlaceholder style={[styles.profilePlaceHolder]} />
      </View>
    </View>
  );
};

const COVER_WIDTH = (Dimensions.get('window').width - 8 * 2) / 2;

const styles = StyleSheet.create({
  viewColumn: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: COVER_WIDTH - 4,
  },
  viewPlaceholder: {
    marginLeft: 8,
    marginRight: 8,
    flexDirection: 'row',
    marginTop: 8,
  },
  coverStyle: {
    width: COVER_WIDTH,
  },
  containerStyle: {
    padding: 4,
  },
  columnStyle: {
    gap: 8,
  },
  profilePlaceHolder: {
    width: COVER_WIDTH - 8,
    aspectRatio: COVER_RATIO,
    borderRadius: (COVER_WIDTH - 4) * COVER_CARD_RADIUS,
    marginBottom: 8,
  },
});
