import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '#helpers/relayScreen';
import PostCommentsList from './PostCommentsList';

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

export default relayScreen(PostCommentsMobileScreen, {
  query: postCommentsMobileScreenQuery,
  getVariables: ({ postId }) => ({ postId }),
});
