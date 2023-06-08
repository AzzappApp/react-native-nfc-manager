import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '#helpers/relayScreen';
import ProfilePostsScreen from '#screens/ProfilePostsScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { ProfilePostsRoute } from '#routes';
import type { ProfilePostsMobileScreenQuery } from '@azzapp/relay/artifacts/ProfilePostsMobileScreenQuery.graphql';

const userPostsScreenQuery = graphql`
  query ProfilePostsMobileScreenQuery($userName: String!) {
    profile(userName: $userName) {
      ...ProfilePostsScreenFragment_posts
      ...ProfilePostsScreenFragment_profile
    }
    viewer {
      profile {
        ...ProfilePostsScreenFragment_viewerProfile
      }
    }
  }
`;

const ProfilePostsMobileScreen = ({
  preloadedQuery,
  hasFocus,
}: RelayScreenProps<ProfilePostsRoute, ProfilePostsMobileScreenQuery>) => {
  const { profile, viewer } = usePreloadedQuery(
    userPostsScreenQuery,
    preloadedQuery,
  );
  if (!(profile && viewer.profile)) {
    return null;
  }
  return (
    <ProfilePostsScreen
      hasFocus={hasFocus}
      profile={profile}
      viewerProfile={viewer.profile}
    />
  );
};

export default relayScreen(ProfilePostsMobileScreen, {
  query: userPostsScreenQuery,
  getVariables: ({ userName }) => ({ userName }),
});
