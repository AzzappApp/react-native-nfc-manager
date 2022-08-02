import { COVER_BASE_WIDTH } from '@azzapp/shared/lib/imagesHelpers';
import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { graphql, usePaginationFragment } from 'react-relay';
import CoverLink from '../components/CoverLink';
import type {
  RecommandedUsersList_viewer$data,
  RecommandedUsersList_viewer$key,
} from '@azzapp/relay/artifacts/RecommandedUsersList_viewer.graphql';
import type { ListRenderItemInfo, StyleProp, ViewStyle } from 'react-native';

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
              id
              ... on User {
                userName
                card {
                  cover {
                    ...CoverRenderer_cover
                  }
                }
              }
            }
          }
        }
        user {
          id
          userName
          card {
            cover {
              ...CoverRenderer_cover
            }
          }
        }
      }
    `,
    viewer,
  );

  const userLists = useMemo(() => {
    const recommandedUrsers =
      data.recommandedUsers.edges?.map(edge => edge?.node ?? null) ?? [];
    return data.user
      ? [
          data.user,
          ...recommandedUrsers.filter(val => val?.id !== data.user?.id),
        ]
      : recommandedUrsers;
  }, [data.recommandedUsers.edges, data.user]);

  const keyExtractor = useCallback(
    (item: UserNodeType) => item?.id ?? 'null-' + Math.random(),
    [],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<UserNodeType>) =>
      item ? (
        <CoverLink
          cover={item.card?.cover}
          width={COVER_BASE_WIDTH}
          userName={item.userName}
          userId={item.id}
          style={styles.item}
          playTransition={canPlay}
          videoPaused={!canPlay}
        />
      ) : null,
    [canPlay],
  );

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext) {
      loadNext(10);
    }
  }, [isLoadingNext, hasNext, loadNext]);

  return (
    <FlatList
      data={userLists}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      horizontal
      directionalLockEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={style}
    />
  );
};

export default RecommandedUsersList;

type UserNodeType = Exclude<ItemType<EdgesType>, null>['node'];

type ItemType<T> = T extends ReadonlyArray<infer U> ? U : never;

type EdgesType = Exclude<
  RecommandedUsersList_viewer$data['recommandedUsers']['edges'],
  null
>;

const styles = StyleSheet.create({
  container: {
    height: '100%',
    paddingLeft: 10,
    flexGrow: 0,
  },
  item: {
    height: '100%',
    marginRight: 10,
    width: 125,
  },
});
