import { useMemo, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { usePaginationFragment, graphql } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { COVER_CARD_RADIUS, COVER_RATIO } from '@azzapp/shared/coverHelpers';

import { colors } from '#theme';
import CoverList from '#components/CoverList';
import SkeletonPlaceholder from '#components/Skeleton';
import Button from '#ui/Button';
import Text from '#ui/Text';
import type { CoverList_users$key } from '@azzapp/relay/artifacts/CoverList_users.graphql';

import type { SearchResultGlobalListHeader_viewer$key } from '@azzapp/relay/artifacts/SearchResultGlobalListHeader_viewer.graphql';

type SearchResultGlobalListHeaderProps = {
  viewer: SearchResultGlobalListHeader_viewer$key;
  goToProfilesTab: () => void;
};

const SearchResultGlobalListHeader = ({
  viewer,
  goToProfilesTab,
}: SearchResultGlobalListHeaderProps) => {
  const { data, loadNext, isLoadingNext, hasNext } = usePaginationFragment(
    graphql`
      fragment SearchResultGlobalListHeader_viewer on Viewer
      @refetchable(queryName: "SearchGlobalProfilesListQuery")
      @argumentDefinitions(
        after: { type: String }
        first: { type: Int, defaultValue: 8 }
        search: { type: "String!" }
        useLocation: { type: "Boolean!" }
      ) {
        searchWebCards(
          after: $after
          first: $first
          search: $search
          useLocation: $useLocation
        ) @connection(key: "ViewerGlobal_searchWebCards") {
          edges {
            node {
              id
              ...CoverList_users
            }
          }
        }
      }
    `,
    viewer,
  );

  const onEndReachedCover = useCallback(() => {
    if (!isLoadingNext && hasNext) {
      loadNext(10);
    }
  }, [isLoadingNext, hasNext, loadNext]);

  const users: CoverList_users$key = useMemo(() => {
    return convertToNonNullArray(
      data.searchWebCards?.edges?.map(edge => edge?.node) ?? [],
    );
  }, [data]);

  const intl = useIntl();

  return (
    <>
      <Text variant="button" style={styles.titleSection}>
        <FormattedMessage
          defaultMessage="Webcards"
          description="SearchPage - Result - Global search profiles title"
        />
      </Text>
      <View>
        <CoverList
          users={users}
          onEndReached={onEndReachedCover}
          containerStyle={styles.containerStyle}
          coverStyle={styles.coverStyle}
          style={styles.coverListStyle}
        />
        <Button
          variant="little_round"
          label={intl.formatMessage({
            defaultMessage: 'See all',
            description: 'See all found profiles',
          })}
          onPress={goToProfilesTab}
          style={styles.seeAll}
        />
      </View>
      <Text variant="button" style={styles.titleSection}>
        <FormattedMessage
          defaultMessage="Posts"
          description="SearchPage - Result - Global search posts title"
        />
      </Text>
    </>
  );
};
export default SearchResultGlobalListHeader;

export const SearchResultGlobalListHeaderPlaceholder = () => {
  return (
    <>
      <Text variant="button" style={styles.titleSection}>
        <FormattedMessage
          defaultMessage="Profiles"
          description="SearchPage - Result - Global search profiles title"
        />
      </Text>
      <View style={{ paddingLeft: 3, flexDirection: 'row' }}>
        <SkeletonPlaceholder style={styles.profilePlaceHolder} />
        <SkeletonPlaceholder style={styles.profilePlaceHolder} />
        <SkeletonPlaceholder style={styles.profilePlaceHolder} />
        <SkeletonPlaceholder style={styles.profilePlaceHolder} />
        <SkeletonPlaceholder style={styles.profilePlaceHolder} />
      </View>

      <Text variant="button" style={styles.titleSection}>
        <FormattedMessage
          defaultMessage="Posts"
          description="SearchPage - Result - Global search posts title"
        />
      </Text>
    </>
  );
};

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  titleSection: {
    marginTop: 17,
    marginBottom: 7,
    marginLeft: 10,
  },
  coverStyle: { width: 80 },
  containerStyle: { paddingLeft: 3 },
  profilePlaceHolder: {
    width: 80,
    aspectRatio: COVER_RATIO,
    padding: '5%',
    borderRadius: COVER_CARD_RADIUS * 80,
    marginLeft: 5,
    marginRight: 2.5,
    backgroundColor: colors.grey50,
  },
  coverListStyle: {
    height: 128,
  },
  seeAll: {
    position: 'absolute',
    right: 12,
    top: 44,
  },
});
