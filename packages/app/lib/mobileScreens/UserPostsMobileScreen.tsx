import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '../helpers/relayScreen';
import UserPosts from '../UserPostsScreen/UserPostsScreen';
import type { UserPostsMobileScreenQuery } from '@azzapp/relay/artifacts/UserPostsMobileScreenQuery.graphql';
import type { PreloadedQuery } from 'react-relay';

const userPostsScreenQuery = graphql`
  query UserPostsMobileScreenQuery($userId: ID!) {
    node(id: $userId) {
      ...UserPostsScreenFragment_posts
      ...UserPostsScreenFragment_user
    }
  }
`;

const UserPostsMobileScreen = ({
  preloadedQuery,
}: {
  preloadedQuery: PreloadedQuery<UserPostsMobileScreenQuery>;
}) => {
  const data = usePreloadedQuery(userPostsScreenQuery, preloadedQuery);
  if (!data.node) {
    return null;
  }
  return <UserPosts user={data.node} />;
};

export default relayScreen(UserPostsMobileScreen, {
  query: userPostsScreenQuery,
  getVariables: ({ userId }) => ({ userId }),
});
