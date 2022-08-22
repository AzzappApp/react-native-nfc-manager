import { Pressable, SafeAreaView, Text } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { graphql, usePreloadedQuery } from 'react-relay';
import Link from '../components/Link';
import { resetEnvironment } from '../helpers/relayEnvironment';
import relayScreen from '../helpers/relayScreen';
import { clearTokens } from '../helpers/tokensStore';
import type { RelayScreenProps } from '../helpers/relayScreen';
import type { SettingsRoute } from '../routes';
import type { SettingsMobileScreenQuery } from '@azzapp/relay/artifacts/SettingsMobileScreenQuery.graphql';

const settingsScreenQuery = graphql`
  query SettingsMobileScreenQuery {
    viewer {
      user {
        id
      }
    }
  }
`;

const SettingsMobileScreen = ({
  preloadedQuery,
}: RelayScreenProps<SettingsRoute, SettingsMobileScreenQuery>) => {
  const { viewer } = usePreloadedQuery(settingsScreenQuery, preloadedQuery);
  const logout = async () => {
    await clearTokens();
    resetEnvironment();
  };
  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      {viewer.user ? (
        <>
          <TouchableOpacity onPress={logout}>
            <Text>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Link modal route="SIGN_IN">
            <Pressable>
              <Text>Sig in</Text>
            </Pressable>
          </Link>
          <Link modal route="SIGN_UP">
            <Pressable>
              <Text>Sig up</Text>
            </Pressable>
          </Link>
        </>
      )}
    </SafeAreaView>
  );
};

export default relayScreen(SettingsMobileScreen, {
  query: settingsScreenQuery,
});
