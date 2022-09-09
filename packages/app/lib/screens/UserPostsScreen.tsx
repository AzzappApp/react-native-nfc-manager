import { convertToNonNullArray } from '@azzapp/shared/lib/arrayHelpers';
import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, useFragment, usePaginationFragment } from 'react-relay';
import Header from '../components/Header';
import PostList from '../components/PostList';
import { useRouter } from '../PlatformEnvironment';
import IconButton from '../ui/IconButton';
import type { UserPostsScreenFragment_posts$key } from '@azzapp/relay/artifacts/UserPostsScreenFragment_posts.graphql';
import type { UserPostsScreenFragment_user$key } from '@azzapp/relay/artifacts/UserPostsScreenFragment_user.graphql';

type UserPostsScreenProps = {
  user: UserPostsScreenFragment_posts$key & UserPostsScreenFragment_user$key;
};

const UserPostsScreen = ({ user: userKey }: UserPostsScreenProps) => {
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
                ...PostList_posts @arguments(includeAuthor: false)
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

  const posts = useMemo(
    () =>
      data.posts?.edges
        ? convertToNonNullArray(
            data.posts.edges.map(edge => edge?.node ?? null),
          )
        : [],
    [data.posts?.edges],
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header
        title={`${user.userName} posts`}
        leftButton={<IconButton icon="chevron" onPress={onClose} />}
      />
      <PostList
        style={{ flex: 1 }}
        posts={posts}
        author={user}
        refreshing={refreshing}
        onEndReached={onEndReached}
        onRefresh={onRefresh}
      />
    </SafeAreaView>
  );
};

export default UserPostsScreen;
