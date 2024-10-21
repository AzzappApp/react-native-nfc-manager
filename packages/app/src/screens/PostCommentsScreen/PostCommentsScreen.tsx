import { View } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import SafeAreaView from '#ui/SafeAreaView';
import PostCommentsList from './PostCommentsList';
import PostCommentsScreenHeader from './PostCommentsScreenHeader';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { PostCommentsScreenQuery } from '#relayArtifacts/PostCommentsScreenQuery.graphql';
import type { PostRoute } from '#routes';

const postCommentsMobileScreenQuery = graphql`
  query PostCommentsScreenQuery($profileId: ID!, $postId: ID!) {
    post: node(id: $postId) {
      ...PostCommentsList_post
    }
    profile: node(id: $profileId) {
      ...PostCommentsList_myProfile
      ... on WebCard {
        ...AuthorCartoucheFragment_webCard
      }
    }
  }
`;

const PostCommentsMobileScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<PostRoute, PostCommentsScreenQuery>) => {
  const { profile, post } = usePreloadedQuery(
    postCommentsMobileScreenQuery,
    preloadedQuery,
  );

  if (!profile || !post) {
    return null;
  }
  return (
    <PostCommentsList profile={profile} post={post} postId={params.postId} />
  );
};

const PostCommentsScreenFallback = () => {
  const router = useRouter();
  const onBack = () => {
    router.back();
  };
  return (
    <Container style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <PostCommentsScreenHeader onClose={onBack} />
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    </Container>
  );
};

export default relayScreen(PostCommentsMobileScreen, {
  query: postCommentsMobileScreenQuery,
  getVariables: ({ postId }, profileInfos) => ({
    postId,
    profileId: profileInfos?.profileId ?? '',
  }),
  fallback: PostCommentsScreenFallback,
});
