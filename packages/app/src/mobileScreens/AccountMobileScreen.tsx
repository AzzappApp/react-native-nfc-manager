import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '#helpers/relayScreen';
import AccountScreen from '#screens/AccountScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { AccountRoute } from '#routes';
import type { AccountMobileScreenQuery } from '@azzapp/relay/artifacts/AccountMobileScreenQuery.graphql';

const accountScreenQuery = graphql`
  query AccountMobileScreenQuery {
    currentUser {
      ...AccountScreen_user
    }
  }
`;

const AccountMobileScreen = ({
  preloadedQuery,
}: RelayScreenProps<AccountRoute, AccountMobileScreenQuery>) => {
  const { currentUser } = usePreloadedQuery(accountScreenQuery, preloadedQuery);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AccountScreen user={currentUser} />
    </SafeAreaView>
  );
};

export default relayScreen(AccountMobileScreen, {
  query: accountScreenQuery,
});
