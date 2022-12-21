import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '../helpers/relayScreen';
import UserPostsScreen from '../screens/UserPostsScreen';
import type { RelayScreenProps } from '../helpers/relayScreen';
import type { UserPostsRoute } from '../routes';
import type { UserPostsMobileScreenQuery } from '@azzapp/relay/artifacts/UserPostsMobileScreenQuery.graphql';

const userPostsScreenQuery = graphql`
  query UserPostsMobileScreenQuery($userName: String!) {
    user(userName: $userName) {
      ...UserPostsScreenFragment_posts
      ...UserPostsScreenFragment_user
    }
  }
`;

const UserPostsMobileScreen = ({
  preloadedQuery,
  hasFocus,
}: RelayScreenProps<UserPostsRoute, UserPostsMobileScreenQuery>) => {
  const data = usePreloadedQuery(userPostsScreenQuery, preloadedQuery);
  if (!data.user) {
    return null;
  }
  return <UserPostsScreen hasFocus={hasFocus} user={data.user} />;
};

export default relayScreen(UserPostsMobileScreen, {
  query: userPostsScreenQuery,
  getVariables: ({ userName }) => ({ userName }),
});
