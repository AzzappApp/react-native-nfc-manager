import { FormattedMessage } from 'react-intl';
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
      profile {
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
      {viewer.profile ? (
        <>
          <TouchableOpacity onPress={logout}>
            <Text>
              <FormattedMessage
                defaultMessage="logout"
                description="logout link"
              />
            </Text>
          </TouchableOpacity>
          <Link modal route="ONBOARDING">
            <Pressable>
              <Text>ONBOARDING- Temporary access for test</Text>
            </Pressable>
          </Link>
        </>
      ) : (
        <>
          <Link modal route="ONBOARDING">
            <Pressable>
              <Text>ONBOARDING- Temporary access for test</Text>
            </Pressable>
          </Link>
          <Link modal route="ONBOARDING">
            <Pressable>
              <Text>ONBOARDING- Temporary access for test</Text>
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
