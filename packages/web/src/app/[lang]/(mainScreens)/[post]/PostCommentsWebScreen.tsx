'use client';

import { graphql } from 'react-relay';
import PostCommentsScreen from '@azzapp/app/screens/PostCommentsScreen';
import useServerQuery from '#hooks/useServerQuery';
import type { ServerQuery } from '#helpers/preloadServerQuery';
import type { PostCommentsWebScreenQuery } from '@azzapp/relay/artifacts/PostCommentsWebScreenQuery.graphql';

const postCommentsWebScreenQuery = graphql`
  query PostCommentsWebScreenQuery($postId: ID!) {
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

type PostCommentsWebScreen = {
  serverQuery: ServerQuery<PostCommentsWebScreenQuery>;
  params: { postId: string };
};

const PostCommentsWebScreen = ({
  serverQuery,
  params,
}: PostCommentsWebScreen) => {
  const data = useServerQuery<PostCommentsWebScreenQuery>(
    postCommentsWebScreenQuery,
    serverQuery,
  );

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

export default PostCommentsWebScreen;
