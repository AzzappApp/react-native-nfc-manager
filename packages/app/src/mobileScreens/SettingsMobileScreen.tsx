import { FormattedMessage } from 'react-intl';
import { /*Pressable,*/ SafeAreaView, Text } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { graphql, usePreloadedQuery } from 'react-relay';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import relayScreen from '#helpers/relayScreen';
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
    dispatchGlobalEvent({ type: 'SIGN_OUT' });
  };
  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      {viewer.profile && (
        <>
          <TouchableOpacity onPress={logout}>
            <Text>
              <FormattedMessage
                defaultMessage="logout"
                description="logout link"
              />
            </Text>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
};

export default relayScreen(SettingsMobileScreen, {
  query: settingsScreenQuery,
});
