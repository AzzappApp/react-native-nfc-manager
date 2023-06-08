import { SafeAreaView } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '#helpers/relayScreen';
import FollowersScreen from '#screens/FollowersScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { FollowedProfilesRoute } from '#routes';
import type { FollowersMobileScreenQuery } from '@azzapp/relay/artifacts/FollowersMobileScreenQuery.graphql';

const followersScreenQuery = graphql`
  query FollowersMobileScreenQuery {
    viewer {
      ...FollowersScreen_viewer
    }
  }
`;

const FollowersMobileScreen = ({
  preloadedQuery,
}: RelayScreenProps<FollowedProfilesRoute, FollowersMobileScreenQuery>) => {
  const { viewer } = usePreloadedQuery(followersScreenQuery, preloadedQuery);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FollowersScreen viewer={viewer} />
    </SafeAreaView>
  );
};

export default relayScreen(FollowersMobileScreen, {
  query: followersScreenQuery,
});
