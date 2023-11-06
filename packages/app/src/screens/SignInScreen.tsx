import { parsePhoneNumber } from 'libphonenumber-js';
import { useCallback, useState, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Image, View, StyleSheet, Keyboard } from 'react-native';

import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import Link from '#components/Link';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { getLocales } from '#helpers/localeHelpers';
import { signin } from '#helpers/MobileWebAPI';
import useAnimatedKeyboardHeight from '#hooks/useAnimatedKeyboardHeight';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Form, { Submit } from '#ui/Form/Form';
import PressableOpacity from '#ui/PressableOpacity';
import SecuredTextInput from '#ui/SecuredTextInput';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import type { TextInput as NativeTextInput } from 'react-native';

const SignInScreen = () => {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [signinError, setSigninError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = useCallback(async () => {
    if (!isNotFalsyString(credential) || !isNotFalsyString(password)) {
      return;
    }
    const locales = getLocales();
    const intlPhoneNumber = tryGetPhoneNumber(
      credential,
      locales[0]?.countryCode,
    );

    let token: string;
    let refreshToken: string;
    let webCardId: string | undefined;
    let profileRole: string | undefined;
    try {
      setIsSubmitting(true);
      ({ token, refreshToken, webCardId, profileRole } = await signin({
        credential: intlPhoneNumber ?? credential,
        password,
      }));
    } catch (error) {
      //TODO handle more error cases ?
      setSigninError(true);
      setIsSubmitting(false);
      return;
    }
    await dispatchGlobalEvent({
      type: 'SIGN_IN',
      payload: { authTokens: { token, refreshToken }, webCardId, profileRole },
    });
  }, [credential, password]);

  const passwordRef = useRef<NativeTextInput>(null);
  const focusPassword = () => {
    passwordRef?.current?.focus();
  };

  // #region KeyboardAvoidingView manual handling blinking of secured text input and keyboard changing value for nohting
  const keyboardHeight = useAnimatedKeyboardHeight();
  const animatedStyle = useAnimatedStyle(() => {
    return {
      flex: 1,
      transform: [
        {
          translateY: keyboardHeight.value,
        },
      ],
    };
  });
  // #endregion

  const intl = useIntl();
  const insets = useScreenInsets();

  return (
    <View style={styles.root}>
      <View style={styles.background}>
        <Image
          source={require('#assets/sign/darkensign_background.png')}
          resizeMode="cover"
        />
      </View>
      <Animated.View style={animatedStyle}>
        <View style={styles.logoContainer} onTouchStart={Keyboard.dismiss}>
          <Image
            source={require('#assets/logo-full_white.png')}
            resizeMode="contain"
            style={styles.logo}
          />
        </View>
        <Container style={styles.content}>
          <View style={styles.header}>
            <Text variant="xlarge" style={styles.title}>
              <FormattedMessage
                defaultMessage="Log in"
                description="Signin Screen - Log in title"
              />
            </Text>
          </View>
          <Form
            style={[styles.form, { marginBottom: insets.bottom }]}
            onSubmit={onSubmit}
          >
            <TextInput
              testID="credential-input"
              placeholder={intl.formatMessage({
                defaultMessage: 'Phone number or email address',
                description:
                  'SignIn Screen Phone number or email address input placeholder',
              })}
              value={credential}
              onChangeText={isSubmitting ? undefined : setCredential}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              autoCorrect={false}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Enter your phone number or email address',
                description:
                  'SignIn Screen - Accessibility TextInput phone number or email address',
              })}
              returnKeyType="next"
              onSubmitEditing={focusPassword}
              style={styles.textInput}
            />

            <SecuredTextInput
              ref={passwordRef}
              testID="password-input"
              placeholder={intl.formatMessage({
                defaultMessage: 'Password',
                description: 'Password input placeholder',
              })}
              onChangeText={isSubmitting ? undefined : setPassword}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Enter your password',
                description:
                  'SignIn Screen - Accessibility TextInput email address ',
              })}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
              style={styles.textInput}
            />

            <View style={styles.forgotPasswordContainer}>
              <Link route="FORGOT_PASSWORD">
                <PressableOpacity>
                  <Text style={styles.greyText} variant="small">
                    <FormattedMessage
                      defaultMessage="Forgot your password?"
                      description="SigninScreen - Forgot your password?"
                    />
                  </Text>
                </PressableOpacity>
              </Link>
            </View>
            <Submit>
              <Button
                variant="primary"
                testID="submitButton"
                label={intl.formatMessage({
                  defaultMessage: 'Log In',
                  description: 'SigninScreen - Login Button Placeholder',
                })}
                accessibilityLabel={intl.formatMessage({
                  defaultMessage: 'Tap to sign in',
                  description:
                    'SignIn Screen - AccessibilityLabel Sign In button',
                })}
                style={styles.button}
                disabled={
                  !isNotFalsyString(credential) || !isNotFalsyString(password)
                }
                loading={isSubmitting}
              />
            </Submit>
            {signinError && (
              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 20,
                }}
              >
                <Text variant="error">
                  <FormattedMessage
                    defaultMessage="Invalid credentials"
                    description="SigninScreen - Invalid Credentials"
                  />
                </Text>
              </View>
            )}
            <View style={styles.footer}>
              <Text style={styles.greyText} variant="medium">
                <FormattedMessage
                  defaultMessage="Don't have an account?"
                  description="SigninScreen - Don't have an account"
                />
              </Text>
              <Link modal route="SIGN_UP" replace>
                <Text style={styles.linkLogout} variant="medium">
                  <FormattedMessage
                    defaultMessage="Sign Up"
                    description="SigninScreen - Sign Up"
                  />
                </Text>
              </Link>
            </View>
          </Form>
        </Container>
      </Animated.View>
    </View>
  );
};

export default SignInScreen;

SignInScreen.options = {
  replaceAnimation: 'push',
};

function tryGetPhoneNumber(phoneNumber: string, countryCode?: string) {
  try {
    const phonenumber = parsePhoneNumber(phoneNumber, countryCode as any);
    if (phonenumber.isValid()) {
      return phonenumber.formatInternational();
    }
  } catch {
    return null;
  }

  return null;
}

const styles = StyleSheet.create({
  keyboardVAvoidingiew: { flex: 1 },
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  background: {
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    backgroundColor: 'black',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    height: 34,
    width: 165,
  },
  form: {
    padding: 20,
  },
  textInput: {
    marginBottom: 20,
  },
  content: {
    justifyContent: 'center',
    alignItem: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  greyText: {
    color: colors.grey200,
  },
  button: {
    marginTop: 20,
  },
  error: {
    paddingLeft: 10,
    paddingRight: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  linkLogout: {
    paddingLeft: 5,
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
  },
  title: {
    marginBottom: 10,
  },
});
