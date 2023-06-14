import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, useFragment, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { useRouter } from '#components/NativeRouter';
import PostList from '#components/PostList';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import type { PostRendererFragment_author$key } from '@azzapp/relay/artifacts/PostRendererFragment_author.graphql';
import type { ProfilePostsListFragment_author$key } from '@azzapp/relay/artifacts/ProfilePostsListFragment_author.graphql';
import type { ProfilePostsListFragment_posts$key } from '@azzapp/relay/artifacts/ProfilePostsListFragment_posts.graphql';

type ProfilePostListProps = {
  profile: PostRendererFragment_author$key &
    ProfilePostsListFragment_author$key &
    ProfilePostsListFragment_posts$key;
  hasFocus: boolean;
};

const ProfilePostsList = ({ profile, hasFocus }: ProfilePostListProps) => {
  const { data, loadNext, refetch, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment ProfilePostsListFragment_posts on Profile
        @refetchable(queryName: "ProfilePostsList_profile_posts_connection")
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
      profile as ProfilePostsListFragment_posts$key,
    );

  const authorProfile = useFragment(
    graphql`
      fragment ProfilePostsListFragment_author on Profile {
        id
        isViewer
        userName
      }
    `,
    profile as ProfilePostsListFragment_author$key,
  );

  const intl = useIntl();
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

  if (!profile) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Header
        middleElement={
          authorProfile.isViewer
            ? intl.formatMessage({
                defaultMessage: 'My posts',
                description: 'ProfilePostScreen viewer user title Header',
              })
            : intl.formatMessage(
                {
                  defaultMessage: '{firstName} posts',
                  description: 'ProfilePostScreen title Header',
                },
                { firstName: authorProfile.userName },
              )
        }
        leftElement={
          <IconButton
            icon="arrow_down"
            onPress={onClose}
            iconSize={30}
            size={47}
            variant="icon"
          />
        }
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

export default ProfilePostsList;
