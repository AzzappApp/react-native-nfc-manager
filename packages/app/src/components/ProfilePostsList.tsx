import { useState, useCallback, useMemo } from 'react';
import { usePaginationFragment, graphql } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import PostList from './PostList';
import type { PostRendererFragment_author$key } from '@azzapp/relay/artifacts/PostRendererFragment_author.graphql';
import type { ProfilePostsList_profile$key } from '@azzapp/relay/artifacts/ProfilePostsList_profile.graphql';

const ProfilePostList = ({
  profile,
  canPlay,
}: {
  profile: PostRendererFragment_author$key & ProfilePostsList_profile$key;
  canPlay: boolean;
}) => {
  const { data, loadNext, refetch, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment ProfilePostsList_profile on Profile
        @refetchable(queryName: "ProfilePostsList_profile_posts_query")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 10 }
        ) {
          posts(after: $after, first: $first)
            @connection(key: "ProfilePostsList_profile_connection_posts") {
            edges {
              node {
                id
                ...PostList_posts @arguments(includeAuthor: false)
              }
            }
          }
        }
      `,
      profile as ProfilePostsList_profile$key,
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
      refetch(
        {},
        {
          fetchPolicy: 'store-and-network',
          onComplete() {
            setRefreshing(false);
          },
        },
      );
    }
  }, [isLoadingNext, refetch, refreshing]);

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
    <PostList
      posts={posts}
      author={profile}
      canPlay={canPlay}
      refreshing={refreshing}
      onEndReached={onEndReached}
      onRefresh={onRefresh}
    />
  );
};

export default ProfilePostList;
