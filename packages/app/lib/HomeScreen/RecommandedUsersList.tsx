import ROUTES from '@azzapp/shared/lib/routes';
import debounce from 'lodash/debounce';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { graphql, usePaginationFragment } from 'react-relay';
import CoverRenderer from '../components/CoverRenderer';
import Link from '../components/Link';
import { useCurrentRoute } from '../PlatformEnvironment';
import type {
  RecommandedUsersList_viewer$data,
  RecommandedUsersList_viewer$key,
} from '@azzapp/relay/artifacts/RecommandedUsersList_viewer.graphql';
import type { ListRenderItemInfo, StyleProp, ViewStyle } from 'react-native';

type RecommandedUsersListProps = {
  viewer: RecommandedUsersList_viewer$key;
  style?: StyleProp<ViewStyle>;
};

const RecommandedUsersList = ({ viewer, style }: RecommandedUsersListProps) => {
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

  const currentRoute = useCurrentRoute('willChange');
  const activeUser = useMemo(() => {
    return currentRoute.route === ROUTES.USER
      ? (currentRoute.params?.userId as string)
      : null;
  }, [currentRoute]);

  const [userPressed, setUserPressed] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cancelUserPressed = useCallback(
    debounce((userId: string) => {
      if (userPressed === userId) {
        setUserPressed(null);
      }
    }, 300),
    [userPressed],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<UserNodeType>) =>
      item ? (
        <Link
          route={ROUTES.USER}
          params={{
            userId: item.id,
            userName: item.userName,
            useSharedAnimation: item.card?.cover != null,
          }}
          onPressIn={() => setUserPressed(item.id)}
          onPressOut={() => cancelUserPressed(item.id)}
          onPress={() => cancelUserPressed(item.id)}
        >
          {({ pressed }) => (
            <CoverRenderer
              cover={item.card?.cover}
              userName={item.userName}
              style={[styles.item, pressed && { opacity: 0.8 }]}
              useLargeImage={userPressed === item.id || activeUser === item.id}
            />
          )}
        </Link>
      ) : null,
    [activeUser, cancelUserPressed, userPressed],
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
      extraData={userPressed ?? activeUser}
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
