import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '#helpers/relayScreen';
import PostCommentsScreen from '#screens/PostCommentsScreen';

import type { RelayScreenProps } from '#helpers/relayScreen';
import type { PostRoute } from '#routes';
import type { PostCommentsMobileScreenQuery } from '@azzapp/relay/artifacts/PostCommentsMobileScreenQuery.graphql';

const postCommentsMobileScreenQuery = graphql`
  query PostCommentsMobileScreenQuery($postId: ID!) {
    viewer {
      profile {
        ...AuthorCartoucheFragment_profile
      }
    }
    node(id: $postId) {
      ...PostCommentsScreen_comments
    }
  }
`;

const PostCommentsMobileScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<PostRoute, PostCommentsMobileScreenQuery>) => {
  const data = usePreloadedQuery(postCommentsMobileScreenQuery, preloadedQuery);

  if (!data.viewer.profile || !data.node) {
    return null;
  }
  return (
    <PostCommentsScreen
      viewer={data.viewer.profile}
      post={data.node}
      postId={params.postId}
    />
  );
};

export default relayScreen(PostCommentsMobileScreen, {
  query: postCommentsMobileScreenQuery,
  getVariables: ({ postId }) => ({ postId }),
});
