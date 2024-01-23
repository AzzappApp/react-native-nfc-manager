import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import ActivityIndicator from '#ui/ActivityIndicator';
import Container from '#ui/Container';
import PostCommentsList from './PostCommentsList';
import PostCommentsScreenHeader from './PostCommentsScreenHeader';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { PostCommentsScreenQuery } from '#relayArtifacts/PostCommentsScreenQuery.graphql';
import type { PostRoute } from '#routes';

const postCommentsMobileScreenQuery = graphql`
  query PostCommentsScreenQuery($webCardId: ID!, $postId: ID!) {
    webCard: node(id: $webCardId) {
      ...AuthorCartoucheFragment_webCard
    }
    post: node(id: $postId) {
      ...PostCommentsList_post
    }
  }
`;

const PostCommentsMobileScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<PostRoute, PostCommentsScreenQuery>) => {
  const { webCard, post } = usePreloadedQuery(
    postCommentsMobileScreenQuery,
    preloadedQuery,
  );

  if (!webCard || !post) {
    return null;
  }
  return (
    <PostCommentsList webCard={webCard} post={post} postId={params.postId} />
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
    webCardId: profileInfos?.webCardId ?? '',
  }),
  fallback: PostCommentsScreenFallback,
});
