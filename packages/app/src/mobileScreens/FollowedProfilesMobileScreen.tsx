import { SafeAreaView } from 'react-native';
import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '#helpers/relayScreen';
import FollowedProfilesScreen from '#screens/FollowedProfilesScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { FollowedProfilesRoute } from '#routes';
import type { FollowedProfilesMobileScreenQuery } from '@azzapp/relay/artifacts/FollowedProfilesMobileScreenQuery.graphql';

const followedProfilesScreenQuery = graphql`
  query FollowedProfilesMobileScreenQuery {
    viewer {
      ...FollowedProfilesScreen_viewer
    }
  }
`;

const FollowedProfilesMobileScreen = ({
  preloadedQuery,
}: RelayScreenProps<
  FollowedProfilesRoute,
  FollowedProfilesMobileScreenQuery
>) => {
  const { viewer } = usePreloadedQuery(
    followedProfilesScreenQuery,
    preloadedQuery,
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FollowedProfilesScreen viewer={viewer} />
    </SafeAreaView>
  );
};

export default relayScreen(FollowedProfilesMobileScreen, {
  query: followedProfilesScreenQuery,
});
