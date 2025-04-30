import { useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Image, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { graphql, useMutation } from 'react-relay';
import { colors } from '#theme';
import Link from '#components/Link';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import PressableOpacity from '#ui/PressableOpacity';
import Text from '#ui/Text';
import type { CookieConsentScreenMutation } from '#relayArtifacts/CookieConsentScreenMutation.graphql';

const CookieContentScreen = () => {
  const [commit, inFlight] = useMutation<CookieConsentScreenMutation>(graphql`
    mutation CookieConsentScreenMutation($input: SaveCookiePreferencesInput!) {
      saveCookiePreferences(input: $input) {
        user {
          id
          cookiePreferences {
            analytics
            functional
          }
        }
      }
    }
  `);

  const intl = useIntl();

  const saveConsent = useCallback(
    (consent: boolean) => {
      commit({
        variables: {
          input: {
            analytics: consent,
            functional: consent,
            marketing: false,
          },
        },
        onError: () => {
          Toast.show({
            type: 'error',
            text1: intl.formatMessage({
              defaultMessage: 'An error occurred while saving your preferences',
              description:
                'Error toast message when saving cookie preferences fails in cookie content screen',
            }),
          });
        },
      });
    },
    [commit, intl],
  );

  const onDoNotConsent = useCallback(() => {
    saveConsent(false);
  }, [saveConsent]);

  const onAccept = useCallback(() => {
    saveConsent(true);
  }, [saveConsent]);

  const insets = useScreenInsets();
  const styles = useStyleSheet(styleSheet);

  return (
    <Container
      style={[
        styles.root,
        { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 30 },
      ]}
    >
      <PressableOpacity onPress={onDoNotConsent}>
        <Text variant="small" style={styles.doNotConsentText}>
          <FormattedMessage
            defaultMessage="Continue without accepting"
            description="Cookie content screen do not consent button"
          />
        </Text>
      </PressableOpacity>
      <View style={styles.content}>
        <Image source={require('./assets/lock.png')} style={styles.lock} />
        <Text variant="xlarge" style={styles.title}>
          <FormattedMessage
            defaultMessage="Psst, we take your privacy very seriously"
            description="Cookie content screen title"
          />
        </Text>
        <Text variant="medium" style={styles.message}>
          <FormattedMessage
            defaultMessage="At azzapp, we like transparency...{br}and cookies! {br}{br}{br}Why? Because they allow us to gather statistical information on your visits to improve your experience. It's as simple as that. You can browse with complete confidence."
            values={{
              br: '\n',
            }}
            description="Cookie content screen description"
          />
        </Text>
      </View>
      <View style={[styles.buttons, { bottom: insets.bottom + 20 }]}>
        <Button
          label={
            <FormattedMessage
              defaultMessage="Accept and close"
              description="Cookie content screen accept button"
            />
          }
          onPress={onAccept}
          loading={inFlight}
        />
        <Link route="COOKIE_SETTINGS" params={{ fromConsent: true }}>
          <Button
            variant="secondary"
            label={
              <FormattedMessage
                defaultMessage="Cookies Settings"
                description="Cookie content screen settings button"
              />
            }
          />
        </Link>
      </View>
    </Container>
  );
};

export default CookieContentScreen;

const styleSheet = createStyleSheet(appearance => ({
  root: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 20 },
  doNotConsentText: {
    textAlign: 'right',
    color: appearance === 'dark' ? colors.grey700 : colors.grey200,
  },
  content: {
    gap: 20,
    alignItems: 'center',
  },
  lock: {
    tintColor: appearance === 'dark' ? colors.grey100 : colors.black,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  buttons: {
    gap: 10,
  },
}));
