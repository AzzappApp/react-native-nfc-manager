import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, usePreloadedQuery } from 'react-relay';
import ProfilePostsList from '#components/ProfilePostsList';
import relayScreen from '#helpers/relayScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ProfilePostsRoute } from '#routes';
import type { ProfilePostsScreenQuery } from '@azzapp/relay/artifacts/ProfilePostsScreenQuery.graphql';

const userPostsScreenQuery = graphql`
  query ProfilePostsScreenQuery($userName: String!) {
    profile(userName: $userName) {
      id
      userName
      isViewer
      ...PostRendererFragment_author
      ...ProfilePostsListFragment_posts
      ...ProfilePostsListFragment_author
    }
  }
`;

const ProfilePostsScreen = ({
  preloadedQuery,
  hasFocus,
}: RelayScreenProps<ProfilePostsRoute, ProfilePostsScreenQuery>) => {
  const { profile } = usePreloadedQuery(userPostsScreenQuery, preloadedQuery);

  if (!profile) {
    return null;
  }
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ProfilePostsList profile={profile} hasFocus={hasFocus} />
    </SafeAreaView>
  );
};

export default relayScreen(ProfilePostsScreen, {
  query: userPostsScreenQuery,
  getVariables: ({ userName }) => ({ userName }),
});
