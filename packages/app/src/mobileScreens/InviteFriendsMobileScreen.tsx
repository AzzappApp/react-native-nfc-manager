import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '#helpers/relayScreen';
import InviteFriendsScreen from '#screens/InviteFriendsScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { InviteFriendsRoute } from '#routes';
import type { InviteFriendsMobileScreenQuery } from '@azzapp/relay/artifacts/InviteFriendsMobileScreenQuery.graphql';

const inviteFriendsMobileScreenQuery = graphql`
  query InviteFriendsMobileScreenQuery {
    viewer {
      ...InviteFriendsScreen_viewer
    }
  }
`;

const InviteFriendsMobileScreen = ({
  preloadedQuery,
}: RelayScreenProps<InviteFriendsRoute, InviteFriendsMobileScreenQuery>) => {
  const { viewer } = usePreloadedQuery(
    inviteFriendsMobileScreenQuery,
    preloadedQuery,
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <InviteFriendsScreen viewer={viewer} />
    </SafeAreaView>
  );
};

export default relayScreen(InviteFriendsMobileScreen, {
  query: inviteFriendsMobileScreenQuery,
});
