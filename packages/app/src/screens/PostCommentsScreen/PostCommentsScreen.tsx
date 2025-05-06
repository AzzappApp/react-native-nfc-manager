import { graphql, usePreloadedQuery } from 'react-relay';
import { useRouter } from '#components/NativeRouter';
import relayScreen from '#helpers/relayScreen';
import Container from '#ui/Container';
import LoadingView from '#ui/LoadingView';
import SafeAreaView from '#ui/SafeAreaView';
import PostCommentsList from './PostCommentsList';
import PostCommentsScreenHeader from './PostCommentsScreenHeader';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { PostCommentsScreenQuery } from '#relayArtifacts/PostCommentsScreenQuery.graphql';
import type { PostRoute } from '#routes';

const postCommentsMobileScreenQuery = graphql`
  query PostCommentsScreenQuery($profileId: ID!, $postId: ID!) {
    postNode: node(id: $postId) {
      ...PostCommentsList_post @alias(as: "post")
    }
    profileNode: node(id: $profileId) {
      ... on Profile @alias(as: "profile") {
        ...PostCommentsList_myProfile
        webCard {
          ...AuthorCartoucheFragment_webCard
        }
      }
    }
  }
`;

const PostCommentsMobileScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<PostRoute, PostCommentsScreenQuery>) => {
  const { profileNode, postNode } = usePreloadedQuery(
    postCommentsMobileScreenQuery,
    preloadedQuery,
  );

  if (!profileNode?.profile || !postNode?.post) {
    return null;
  }
  return (
    <PostCommentsList
      profile={profileNode.profile}
      post={postNode.post}
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
        <LoadingView />
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
