import { parsePhoneNumber } from 'libphonenumber-js';
import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Keyboard, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { isPhoneNumber, isValidEmail } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import EmailOrPhoneInput from '#components/EmailOrPhoneInput';
import { useRouter } from '#components/NativeRouter';
import { forgotPassword } from '#helpers/MobileWebAPI';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { EmailPhoneInput } from '#components/EmailOrPhoneInput';

const ForgotPasswordScreen = () => {
  const router = useRouter();
  const intl = useIntl();

  const [contact, setContact] = useState<EmailPhoneInput>({
    countryCodeOrEmail: 'email',
    value: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(false);

  const isValidMailOrPhone = useMemo(() => {
    if (isValidEmail(contact.value)) {
      return true;
    }

    if (
      contact.countryCodeOrEmail !== 'email' &&
      isPhoneNumber(contact.value, contact.countryCodeOrEmail)
    ) {
      return true;
    }

    return false;
  }, [contact]);

  const onSubmit = async () => {
    if (isValidMailOrPhone) {
      if (!isSubmitted) {
        setIsSubmitted(true);
        let issuer: string;
        try {
          ({ issuer } = await forgotPassword({
            locale: intl.locale,
            credential:
              contact.countryCodeOrEmail === 'email'
                ? contact.value
                : parsePhoneNumber(
                    contact.value,
                    contact.countryCodeOrEmail,
                  ).formatInternational(),
          }));
        } catch {
          setIsSubmitted(false);
          setError(true);
          return;
        }

        router.push({
          route: 'FORGOT_PASSWORD_CONFIRMATION',
          params: { issuer },
        });
      }
    }
  };

  const onBack = () => {
    router.back();
  };

  const insets = useScreenInsets();

  return (
    <Container style={styles.flex}>
      <View onTouchStart={Keyboard.dismiss} style={styles.container}>
        <KeyboardAvoidingView behavior="padding">
          <View style={styles.container}>
            <View style={styles.inner}>
              <View style={styles.logoContainer}>
                <Icon icon="unlock_line" style={styles.logo} />
              </View>
              <View style={styles.viewText}>
                <Text style={styles.textForgot} variant="xlarge">
                  <FormattedMessage
                    defaultMessage="Forgot your password?"
                    description="ForgotPasswordScreen - Forgot your password title"
                  />
                </Text>
                <Text style={styles.textForgotExplain} variant="medium">
                  <FormattedMessage
                    defaultMessage="Enter your email address or phone number and we'll send you a link to create a new password"
                    description="ForgotPasswordScreen - Forgot your password description"
                  />
                </Text>
              </View>
              <View style={styles.input}>
                <EmailOrPhoneInput
                  input={contact}
                  onChange={setContact}
                  hasError={error}
                />
              </View>
              {error && (
                <Text variant="error" style={styles.error}>
                  {intl.formatMessage({
                    defaultMessage:
                      'Invalid email/phone number or no account found',
                    description:
                      'ForgotpasswordScreen - Invalid email or phone number error',
                  })}
                </Text>
              )}
              <Button
                label={intl.formatMessage({
                  defaultMessage: 'Reset password',
                  description: 'ForgotpasswordScreen - Reset password',
                })}
                accessibilityLabel={intl.formatMessage({
                  defaultMessage: 'Tap to reset your password',
                  description:
                    'ForgotPassword Screen - AccessibilityLabel Reset password button',
                })}
                style={styles.button}
                onPress={onSubmit}
                disabled={!isValidMailOrPhone}
                loading={isSubmitted}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
      <View
        style={{
          bottom: insets.bottom,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <PressableNative onPress={onBack}>
          <Text style={styles.back} variant="medium">
            <FormattedMessage
              defaultMessage="Back to Log In"
              description="ForgotPasswordScreen - Back to Log In bottom screen link"
            />
          </Text>
        </PressableNative>
      </View>
    </Container>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  inner: {
    height: 300,
    rowGap: 20,
  },
  textForgotExplain: {
    color: colors.grey400,
    textAlign: 'center',
  },
  textForgot: {
    color: colors.grey900,
  },
  viewText: {
    alignItems: 'center',
    paddingLeft: 38,
    paddingRight: 38,
  },
  flex: { flex: 1 },
  button: { marginHorizontal: 10 },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 64, height: 64 },
  back: { color: colors.grey200 },
  input: {
    marginHorizontal: 12,
  },
  error: {
    marginHorizontal: 12,
    marginTop: 6,
  },
});
