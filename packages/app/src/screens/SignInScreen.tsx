import { parsePhoneNumber } from 'libphonenumber-js';
import { useCallback, useState, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Image, View, Keyboard } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import {
  isNotFalsyString,
  isValidEmail,
  isValidUserName,
} from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import Link from '#components/Link';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { getLocales } from '#helpers/localeHelpers';
import { signin } from '#helpers/MobileWebAPI';
import useAnimatedKeyboardHeight from '#hooks/useAnimatedKeyboardHeight';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Form, { Submit } from '#ui/Form/Form';
import PressableOpacity from '#ui/PressableOpacity';
import SecuredTextInput from '#ui/SecuredTextInput';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import type { TextInput as NativeTextInput } from 'react-native';

const SignInScreen = () => {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [credentialInvalid, setCredentialInvalid] = useState(false);
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

    if (
      !intlPhoneNumber &&
      !isValidEmail(credential) &&
      !isValidUserName(credential)
    ) {
      setCredentialInvalid(true);
      return;
    }
    setCredentialInvalid(false);

    try {
      setIsSubmitting(true);
      const { token, refreshToken, profileInfos, email, phoneNumber, userId } =
        await signin({
          credential: intlPhoneNumber ?? credential,
          password,
        });

      await dispatchGlobalEvent({
        type: 'SIGN_IN',
        payload: {
          authTokens: { token, refreshToken },
          profileInfos,
          email,
          phoneNumber,
          userId,
        },
      });
    } catch (error) {
      //TODO handle more error cases ?
      setSigninError(true);
      setIsSubmitting(false);
      return;
    }
  }, [credential, password]);

  const passwordRef = useRef<NativeTextInput>(null);
  // #endregion

  const intl = useIntl();
  const insets = useScreenInsets();

  const styles = useStyleSheet(stylesheet);

  const keyboardHeight = useAnimatedKeyboardHeight();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: -keyboardHeight.value,
        },
      ],
    };
  });

  return (
    <View style={styles.root}>
      <View style={styles.background}>
        <Image
          source={require('#assets/sign/darkensign_background.png')}
          resizeMode="cover"
        />
      </View>

      <View style={styles.logoContainer} onTouchStart={Keyboard.dismiss}>
        <Image
          source={require('#assets/logo-full_white.png')}
          resizeMode="contain"
          style={styles.logo}
        />
      </View>
      <Animated.View style={[styles.content, animatedStyle]}>
        <View style={styles.header}>
          <Text variant="xlarge">
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
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
          />
          <View>
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
              disabled={
                !isNotFalsyString(credential) || !isNotFalsyString(password)
              }
              loading={isSubmitting}
            />
          </Submit>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text variant="error">
              {credentialInvalid ? (
                <FormattedMessage
                  defaultMessage="Please use a valid phone number or email address"
                  description="SigninScreen - Invalid email or phone number"
                />
              ) : signinError ? (
                <FormattedMessage
                  defaultMessage="Invalid credentials"
                  description="SigninScreen - Invalid Credentials"
                />
              ) : (
                // just to keep the same height
                ' '
              )}
            </Text>
          </View>
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

const stylesheet = createStyleSheet(appearance => ({
  root: {
    flex: 1,
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
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 20,
  },
  content: {
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
    justifyContent: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    paddingRight: 10,
    marginTop: 5,
  },
  greyText: {
    color: colors.grey200,
  },
  error: {
    paddingLeft: 10,
    paddingRight: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkLogout: {
    paddingLeft: 5,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 10,
  },
}));
