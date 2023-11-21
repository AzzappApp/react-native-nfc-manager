import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { graphql, usePreloadedQuery } from 'react-relay';

import AccountHeader from '#components/AccountHeader';
import relayScreen from '#helpers/relayScreen';

import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';

import type { RelayScreenProps } from '#helpers/relayScreen';
import type { AboutRoute } from '#routes';
import type { AboutScreenWithoutProfileQuery } from '@azzapp/relay/artifacts/AboutScreenWithoutProfileQuery.graphql';
import type { AboutScreenWithProfileQuery } from '@azzapp/relay/artifacts/AboutScreenWithProfileQuery.graphql';

const aboutScreenWithProfileQuery = graphql`
  query AboutScreenWithProfileQuery {
    currentUser {
      email
      phoneNumber
    }
    viewer {
      profile {
        userName
        ...AccountHeader_profile
      }
    }
  }
`;

const aboutScreenWithoutProfileQuery = graphql`
  query AboutScreenWithoutProfileQuery {
    currentUser {
      email
      phoneNumber
    }
  }
`;

const AboutScreen = ({
  preloadedQuery,
  route: { params },
}: RelayScreenProps<
  AboutRoute,
  AboutScreenWithoutProfileQuery | AboutScreenWithProfileQuery
>) => {
  const preloaded = usePreloadedQuery(
    params.withProfile
      ? aboutScreenWithProfileQuery
      : aboutScreenWithoutProfileQuery,
    preloadedQuery,
  );
  const viewer = 'viewer' in preloaded ? preloaded.viewer : null;
  const profile = viewer?.profile;

  const intl = useIntl();

  return (
    <Container style={{ flex: 1 }}>
      <SafeAreaView
        style={{
          flex: 1,
          rowGap: 20,
        }}
      >
        <AccountHeader
          profile={profile ?? null}
          title={intl.formatMessage({
            defaultMessage: 'About',
            description: 'Title of the about screen',
          })}
        />
        <Icon icon="about" style={styles.aboutIcon} />
        <View style={{ rowGap: 20, paddingHorizontal: 10 }}>
          <Text variant="xsmall" style={styles.aboutMessage}>
            <FormattedMessage
              defaultMessage="Learn more about Azzapp."
              description="Label displayed at the top on the about screen"
            />
          </Text>
        </View>
        <PressableNative
          style={styles.rowStyle}
          onPress={() => Alert.alert('TODO')}
        >
          <Text variant="medium">
            <FormattedMessage
              defaultMessage="About"
              description="AboutScreen - About menu item"
            />
          </Text>
          <Icon icon="arrow_right" />
        </PressableNative>
        <PressableNative
          style={styles.rowStyle}
          onPress={() => Linking.openURL('http://www.azzapp.com/tos')}
        >
          <Text variant="medium">
            <FormattedMessage
              defaultMessage="Terms of service"
              description="AboutScreen - Terms of service item"
            />
          </Text>
          <Icon icon="arrow_right" />
        </PressableNative>
        <PressableNative
          style={styles.rowStyle}
          onPress={() => Linking.openURL('http://www.azzapp.com/privacy')}
        >
          <Text variant="medium">
            <FormattedMessage
              defaultMessage="Privacy policy"
              description="AboutScreen - Privacy policy menu item"
            />
          </Text>
          <Icon icon="arrow_right" />
        </PressableNative>
        <PressableNative
          style={styles.rowStyle}
          onPress={() => Alert.alert('TODO')}
        >
          <Text variant="medium">
            <FormattedMessage
              defaultMessage="FAQ"
              description="AboutScreen - FAQ menu item"
            />
          </Text>
          <Icon icon="arrow_right" />
        </PressableNative>
      </SafeAreaView>
    </Container>
  );
};

export default relayScreen(AboutScreen, {
  query: params =>
    params.withProfile
      ? aboutScreenWithProfileQuery
      : aboutScreenWithoutProfileQuery,
  profileBound: params => params.withProfile,
});

const styles = StyleSheet.create({
  aboutIcon: { width: 50, height: 50, alignSelf: 'center' },
  aboutMessage: { width: 255, textAlign: 'center', alignSelf: 'center' },
  rowStyle: {
    height: 32,
    marginLeft: 10,
    marginRight: 10,
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
});
