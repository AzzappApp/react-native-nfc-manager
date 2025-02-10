import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet, Linking } from 'react-native';

import AccountHeader from '#components/AccountHeader';

import useScreenInsets from '#hooks/useScreenInsets';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';

const TERMS_OF_SERVICE = process.env.TERMS_OF_SERVICE;
const PRIVACY_POLICY = process.env.PRIVACY_POLICY;
const ABOUT = process.env.ABOUT;
const FAQ = process.env.FAQ;

const AboutScreen = () => {
  const intl = useIntl();
  const insets = useScreenInsets();

  return (
    <Container
      style={{
        flex: 1,
        rowGap: 20,
        paddingBottom: insets.bottom,
      }}
    >
      <AccountHeader
        webCard={null}
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
        onPress={() => Linking.openURL(`${ABOUT}`)}
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
        onPress={() => Linking.openURL(`${TERMS_OF_SERVICE}`)}
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
        onPress={() => Linking.openURL(`${PRIVACY_POLICY}`)}
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
        onPress={() => Linking.openURL(`${FAQ}`)}
      >
        <Text variant="medium">
          <FormattedMessage
            defaultMessage="FAQ"
            description="AboutScreen - FAQ menu item"
          />
        </Text>
        <Icon icon="arrow_right" />
      </PressableNative>
    </Container>
  );
};

export default AboutScreen;

const styles = StyleSheet.create({
  aboutIcon: { width: 50, height: 50, alignSelf: 'center' },
  aboutMessage: { width: 255, textAlign: 'center', alignSelf: 'center' },
  rowStyle: {
    height: 32,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
