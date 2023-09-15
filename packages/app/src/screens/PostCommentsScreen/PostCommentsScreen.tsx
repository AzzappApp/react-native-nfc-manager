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
import type { PostRoute } from '#routes';
import type { PostCommentsScreenQuery } from '@azzapp/relay/artifacts/PostCommentsScreenQuery.graphql';

const postCommentsMobileScreenQuery = graphql`
  query PostCommentsScreenQuery($postId: ID!) {
    viewer {
      profile {
        ...AuthorCartoucheFragment_profile
      }
    }
    node(id: $postId) {
      ...PostCommentsList_comments
    }
  }
`;

const PostCommentsMobileScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<PostRoute, PostCommentsScreenQuery>) => {
  const data = usePreloadedQuery(postCommentsMobileScreenQuery, preloadedQuery);

  if (!data.viewer.profile || !data.node) {
    return null;
  }
  return (
    <PostCommentsList
      viewer={data.viewer.profile}
      post={data.node}
      postId={params.postId}
    />
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
  fallback: PostCommentsScreenFallback,
  getVariables: ({ postId }) => ({ postId }),
});
