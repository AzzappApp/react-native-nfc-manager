import { useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { isPhoneNumber, isValidEmail } from '@azzapp/shared/stringHelpers';

import { useRouter } from '#PlatformEnvironment';
import { colors } from '#theme';
import { getLocales } from '#helpers/localeHelpers';
import useViewportSize, { insetBottom, VW100 } from '#hooks/useViewportSize';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Form, { Submit } from '#ui/Form/Form';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import ViewTransition from '#ui/ViewTransition';
import type { ForgotPasswordParams } from '@azzapp/shared/WebAPI';
import type { CountryCode } from 'libphonenumber-js';

type ForgotPasswordScreenProps = {
  forgotPassword: (params: ForgotPasswordParams) => Promise<void>;
};
const ForgotPasswordScreen = ({
  forgotPassword,
}: ForgotPasswordScreenProps) => {
  const vp = useViewportSize();
  const router = useRouter();
  const intl = useIntl();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isValidMailOrPhone = useMemo(() => {
    if (isValidEmail(emailOrPhone)) {
      return true;
    }

    const locales = getLocales();
    for (let i = 0; i < locales.length; i++) {
      if (isPhoneNumber(emailOrPhone, locales[i].countryCode as CountryCode)) {
        return true;
      }
    }
    return false;
  }, [emailOrPhone]);

  const onSubmit = async () => {
    if (isValidMailOrPhone) {
      if (!isSubmitted) {
        await forgotPassword({ credential: emailOrPhone });
      }
      setIsSubmitted(true);
    }
  };

  const onBack = () => {
    router.back();
  };

  return (
    <Container style={styles.flex}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View onTouchStart={Keyboard.dismiss} style={[styles.container]}>
          <Form style={styles.inner} onSubmit={onSubmit}>
            <ViewTransition
              testID="azzapp__ForgotPasswordScreen__ViewTransition-confirm"
              style={[
                styles.viewtransition,
                { width: vp`${VW100}`, opacity: isSubmitted ? 1 : 0 },
              ]}
              transitionDuration={300}
              transitions={['opacity']}
              pointerEvents="none"
            >
              <View style={styles.logoContainer}>
                <Image
                  source={require('#assets/mail/mail.png')}
                  resizeMode="contain"
                  style={styles.logo}
                />
              </View>
              <View style={styles.viewText}>
                <Text style={styles.textForgot} variant="xlarge">
                  <FormattedMessage
                    defaultMessage="Check your emails or messages!"
                    description="ForgotPasswordScreen - Check your emails or messages!"
                  />
                </Text>
                <Text style={styles.textForgotExplain} variant="medium">
                  <FormattedMessage
                    defaultMessage="We just send you a link to create a new password"
                    description="ForgotPasswordScreen - message to inform the user an email or sms has been sent to reset the password"
                  />
                </Text>
              </View>
            </ViewTransition>
            <ViewTransition
              testID="azzapp__ForgotPasswordScreen__ViewTransition-email"
              style={[
                styles.viewtransition,
                { width: vp`${VW100}`, opacity: isSubmitted ? 0 : 1 },
              ]}
              transitionDuration={300}
              transitions={['opacity']}
            >
              <View style={styles.logoContainer}>
                <Image
                  source={require('#assets/lock/lock.png')}
                  resizeMode="contain"
                  style={styles.logo}
                />
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
              <TextInput
                placeholder={intl.formatMessage({
                  defaultMessage: 'Phone number or email address',
                  description:
                    'ForgotpasswordScreen - Phone number or email address placeholder',
                })}
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                autoCorrect={false}
                autoFocus
                style={styles.input}
              />
              <Submit>
                <Button
                  label={intl.formatMessage({
                    defaultMessage: 'Reset password',
                    description: 'ForgotpasswordScreen - Reset password',
                  })}
                  accessibilityLabel={intl.formatMessage({
                    defaultMessage: 'Tap to reset your passward',
                    description:
                      'ForgotPassword Screen - AccessibilityLabel Reset password button',
                  })}
                  style={styles.button}
                  onPress={onSubmit}
                  disabled={!isValidMailOrPhone}
                />
              </Submit>
            </ViewTransition>
          </Form>
        </View>
      </KeyboardAvoidingView>
      <View
        style={{
          bottom: vp`${insetBottom} + ${35}`,
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
  },
  viewtransition: {
    position: 'absolute',
    top: 0,
    alignContent: 'center',
    justifyContent: 'center',
    height: 300,
    paddingLeft: 15,
    paddingRight: 15,
  },
  textForgotExplain: {
    color: colors.grey400,
    textAlign: 'center',
    marginTop: 20,
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
  button: { marginLeft: 10, marginRight: 10, marginTop: 20 },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItem: 'center',
    marginBottom: 100,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  logo: { width: 38, height: 54 },
  back: { color: colors.grey200 },
  input: {
    marginTop: 20,
    marginHorizontal: 12,
  },
});
