import { convertToNonNullArray } from '@azzapp/shared/lib/arrayHelpers';
import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, useFragment, usePaginationFragment } from 'react-relay';
import Header from '../components/Header';
import PostList from '../components/PostList';
import { useRouter } from '../PlatformEnvironment';
import IconButton from '../ui/IconButton';
import type { ProfilePostsScreenFragment_posts$key } from '@azzapp/relay/artifacts/ProfilePostsScreenFragment_posts.graphql';
import type { ProfilePostsScreenFragment_profile$key } from '@azzapp/relay/artifacts/ProfilePostsScreenFragment_profile.graphql';

type ProfilePostsScreenProps = {
  profile: ProfilePostsScreenFragment_posts$key &
    ProfilePostsScreenFragment_profile$key;
  hasFocus?: boolean;
};

const ProfilePostsScreen = ({
  profile: profileKey,
  hasFocus = true,
}: ProfilePostsScreenProps) => {
  const profile = useFragment(
    graphql`
      fragment ProfilePostsScreenFragment_profile on Profile {
        id
        userName
        ...PostRendererFragment_author
      }
    `,
    profileKey as ProfilePostsScreenFragment_profile$key,
  );

  const { data, loadNext, refetch, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment ProfilePostsScreenFragment_posts on Profile
        @refetchable(queryName: "ProfilePostsQuery")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 10 }
        ) {
          posts(after: $after, first: $first)
            @connection(key: "Profile_posts") {
            edges {
              node {
                id
                ...PostList_posts @arguments(includeAuthor: false)
              }
            }
          }
        }
      `,
      profileKey as ProfilePostsScreenFragment_posts$key,
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
        title={`${profile.userName} posts`}
        leftButton={<IconButton icon="chevron" onPress={onClose} />}
      />
      <PostList
        style={{ flex: 1 }}
        posts={posts}
        author={profile}
        canPlay={hasFocus}
        refreshing={refreshing}
        onEndReached={onEndReached}
        onRefresh={onRefresh}
      />
    </SafeAreaView>
  );
};

export default ProfilePostsScreen;
