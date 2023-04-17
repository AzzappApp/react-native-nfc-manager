import { FormattedMessage } from 'react-intl';
import { View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { graphql, usePreloadedQuery } from 'react-relay';
import { useRouter } from '#PlatformEnvironment';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import relayScreen from '#helpers/relayScreen';
import Text from '#ui/Text';
import type { RelayScreenProps } from '#helpers/relayScreen';
import type { SettingsRoute } from '#routes';
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
    void dispatchGlobalEvent({ type: 'SIGN_OUT' });
  };

  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {viewer.profile && (
        <>
          <TouchableOpacity onPress={logout} style={{ marginBottom: 30 }}>
            <Text>
              <FormattedMessage
                defaultMessage="Logout"
                description="logout link"
              />
            </Text>
          </TouchableOpacity>
          {/* AVoid getting stuck on the page and hav eto kill the app */}
          <TouchableOpacity onPress={() => router.back()}>
            <Text>Go Back</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default relayScreen(SettingsMobileScreen, {
  query: settingsScreenQuery,
});
