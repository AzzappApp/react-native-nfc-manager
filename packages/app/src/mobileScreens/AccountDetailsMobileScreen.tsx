import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, usePreloadedQuery } from 'react-relay';
import relayScreen from '#helpers/relayScreen';
import AccountDetailsScreen from '#screens/AccountDetailsScreen';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { AccountDetailsRoute } from '#routes';
import type { AccountDetailsMobileScreenQuery } from '@azzapp/relay/artifacts/AccountDetailsMobileScreenQuery.graphql';

const accountDetailsScreenQuery = graphql`
  query AccountDetailsMobileScreenQuery {
    ...AccountDetailsScreen_query
  }
`;

const AccountDetailsMobileScreen = ({
  preloadedQuery,
}: RelayScreenProps<AccountDetailsRoute, AccountDetailsMobileScreenQuery>) => {
  const data = usePreloadedQuery(accountDetailsScreenQuery, preloadedQuery);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AccountDetailsScreen data={data} />
    </SafeAreaView>
  );
};

export default relayScreen(AccountDetailsMobileScreen, {
  query: accountDetailsScreenQuery,
});
