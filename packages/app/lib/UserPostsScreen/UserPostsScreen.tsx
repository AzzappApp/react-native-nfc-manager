import { useCallback, useMemo, useState } from 'react';
import { FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, useFragment, usePaginationFragment } from 'react-relay';
import Header from '../components/Header';
import IconButton from '../components/IconButton';
import PostRenderer from '../components/PostRenderer';
import { useRouter } from '../PlatformEnvironment';
import type { UserPostsScreenFragment_posts$key } from '@azzapp/relay/artifacts/UserPostsScreenFragment_posts.graphql';
import type { UserPostsScreenFragment_user$key } from '@azzapp/relay/artifacts/UserPostsScreenFragment_user.graphql';

type UserPostsProps = {
  user: UserPostsScreenFragment_posts$key & UserPostsScreenFragment_user$key;
};

const UserPosts = ({ user: userKey }: UserPostsProps) => {
  const user = useFragment(
    graphql`
      fragment UserPostsScreenFragment_user on User {
        id
        userName
        ...PostRendererFragment_author
      }
    `,
    userKey as UserPostsScreenFragment_user$key,
  );

  const { data, loadNext, refetch, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment UserPostsScreenFragment_posts on User
        @refetchable(queryName: "UserPostsQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 10 }
        ) {
          posts(after: $after, first: $first) @connection(key: "User_posts") {
            edges {
              node {
                id
                ...PostRendererFragment_post
              }
            }
          }
        }
      `,
      userKey as UserPostsScreenFragment_posts$key,
    );

  const [refreshing, setRefreshing] = useState(false);

  const onEndReached = useCallback(() => {
    if (!isLoadingNext && hasNext && !refreshing) {
      loadNext(10);
    }
  }, [isLoadingNext, hasNext, refreshing, loadNext]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (!refreshing && !isLoadingNext) {
      refetch({
        onComplete() {
          setRefreshing(false);
        },
      });
    }
  }, [isLoadingNext, refetch, refreshing]);

  const router = useRouter();
  const onClose = () => {
    router.back();
  };

  const postLists = useMemo(
    () => data.posts?.edges?.map(edge => edge?.node ?? null),
    [data.posts?.edges],
  );
  console.log(data.posts?.edges);
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Header
        title={`${user.userName} posts`}
        leftButton={<IconButton icon="chevron" onPress={onClose} />}
      />
      <FlatList
        style={{ flex: 1 }}
        data={postLists}
        keyExtractor={(item, index) => item?.id ?? `${index}-null`}
        renderItem={({ item }) =>
          item != null ? <PostRenderer post={item} author={user} /> : null
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    </SafeAreaView>
  );
};

export default UserPosts;
