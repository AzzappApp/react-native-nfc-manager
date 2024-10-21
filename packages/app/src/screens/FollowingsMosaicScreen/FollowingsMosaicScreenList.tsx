import { useCallback, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { graphql, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import CoverList from '#components/CoverList';
import type { CoverList_users$key } from '#relayArtifacts/CoverList_users.graphql';
import type { FollowingsMosaicScreenList_webCard$key } from '#relayArtifacts/FollowingsMosaicScreenList_webCard.graphql';

const FollowingsMosaicScreen = ({
  webCard,
}: {
  webCard: FollowingsMosaicScreenList_webCard$key | null;
}) => {
  const { data, loadNext, hasNext, isLoadingNext, isLoadingPrevious, refetch } =
    usePaginationFragment(
      graphql`
        fragment FollowingsMosaicScreenList_webCard on WebCard
        @refetchable(queryName: "FollowingsMosaicListScreenQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 6 }
          userName: { type: String, defaultValue: "" }
        ) {
          followings(after: $after, first: $first, userName: $userName)
            @connection(key: "Account_followings") {
            edges {
              node {
                ...CoverList_users
              }
            }
          }
        }
      `,
      webCard,
    );

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext) {
      loadNext(6);
    }
  }, [isLoadingNext, hasNext, loadNext]);

  const users: CoverList_users$key = useMemo(() => {
    return convertToNonNullArray(
      data?.followings?.edges?.map(edge => edge?.node) ?? [],
    );
  }, [data?.followings?.edges]);

  return (
    <View style={styles.containerStyle}>
      <CoverList
        users={users}
        onEndReached={onEndReached}
        coverWidth={COVER_WIDTH}
        horizontal={false}
        numColums={2}
        gap={8}
        onRefresh={() =>
          refetch({
            after: null,
            first: 15,
          })
        }
        refreshing={isLoadingPrevious}
        withShadow
      />
    </View>
  );
};

const COVER_WIDTH = (Dimensions.get('window').width - 2 * 8) / 2;

const styles = StyleSheet.create({
  containerStyle: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
});

export default FollowingsMosaicScreen;
