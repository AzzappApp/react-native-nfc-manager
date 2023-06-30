import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, usePaginationFragment } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { useRouter } from '#components/NativeRouter';
import PostList from '#components/PostList';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import type { PostRendererFragment_author$key } from '@azzapp/relay/artifacts/PostRendererFragment_author.graphql';
import type { ProfilePostsList_profile$key } from '@azzapp/relay/artifacts/ProfilePostsList_profile.graphql';

type ProfilePostsListProps = {
  profile: PostRendererFragment_author$key & ProfilePostsList_profile$key;
  isViewer: boolean;
  hasFocus: boolean;
  userName: string;
};

const ProfilePostsList = ({
  profile,
  isViewer,
  hasFocus,
  userName,
}: ProfilePostsListProps) => {
  const { data, loadNext, refetch, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment ProfilePostsList_profile on Profile
        @refetchable(queryName: "ProfilePostsListprofile_posts_connection")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 10 }
        ) {
          posts(after: $after, first: $first)
            @connection(key: "ProfilePostsListprofile_connection_posts") {
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
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header
        middleElement={
          isViewer
            ? intl.formatMessage({
                defaultMessage: 'My posts',
                description: 'ProfilePostScreen viewer user title Header',
              })
            : intl.formatMessage(
                {
                  defaultMessage: '{userName} posts',
                  description: 'ProfilePostScreen title Header',
                },
                { userName },
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
