import { useCallback, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, usePaginationFragment, usePreloadedQuery } from 'react-relay';
import { convertToNonNullArray } from '@azzapp/shared/arrayHelpers';
import { useRouter } from '#components/NativeRouter';
import PostList from '#components/PostList';
import relayScreen from '#helpers/relayScreen';
import Header from '#ui/Header';
import IconButton from '#ui/IconButton';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ProfilePostsRoute } from '#routes';
import type { ProfilePostsScreenFragment_posts$key } from '@azzapp/relay/artifacts/ProfilePostsScreenFragment_posts.graphql';
import type { ProfilePostsScreenQuery } from '@azzapp/relay/artifacts/ProfilePostsScreenQuery.graphql';

const userPostsScreenQuery = graphql`
  query ProfilePostsScreenQuery($userName: String!) {
    profile(userName: $userName) {
      id
      userName
      ...PostRendererFragment_author
      ...ProfilePostsScreenFragment_posts
    }
    viewer {
      profile {
        id
        userName
      }
    }
  }
`;

const ProfilePostsScreen = ({
  preloadedQuery,
  hasFocus,
}: RelayScreenProps<ProfilePostsRoute, ProfilePostsScreenQuery>) => {
  const { profile, viewer } = usePreloadedQuery(
    userPostsScreenQuery,
    preloadedQuery,
  );
  const { data, loadNext, refetch, hasNext, isLoadingNext } =
    usePaginationFragment(
      graphql`
        fragment ProfilePostsScreenFragment_posts on Profile
        @refetchable(queryName: "ProfilePostsScreen_profile_posts_connection")
        @argumentDefinitions(
          after: { type: String }
          first: { type: Int, defaultValue: 10 }
        ) {
          posts(after: $after, first: $first)
            @connection(key: "ProfilePostsScreen_profile_connection_posts") {
            edges {
              node {
                id
                ...PostList_posts @arguments(includeAuthor: false)
              }
            }
          }
        }
      `,
      profile as ProfilePostsScreenFragment_posts$key,
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Header
        middleElement={
          viewer.profile?.userName === profile.userName
            ? intl.formatMessage({
                defaultMessage: 'My posts',
                description: 'ProfilePostScreen viewer user title Header',
              })
            : intl.formatMessage(
                {
                  defaultMessage: '{firstName} posts',
                  description: 'ProfilePostScreen title Header',
                },
                { firstName: profile.userName },
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

export default relayScreen(ProfilePostsScreen, {
  query: userPostsScreenQuery,
  getVariables: ({ userName }) => ({ userName }),
});
