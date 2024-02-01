import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AccountHeader from '#components/AccountHeader';

import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';

const AboutScreen = () => {
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
