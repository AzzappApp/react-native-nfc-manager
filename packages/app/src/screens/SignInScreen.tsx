import { parsePhoneNumber } from 'libphonenumber-js';
import LottieView from 'lottie-react-native';
import { useCallback, useState, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Image, View, Keyboard, Platform, StyleSheet } from 'react-native';
import { setSharedWebCredentials } from 'react-native-keychain';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { waitTime } from '@azzapp/shared/asyncHelpers';
import ERRORS from '@azzapp/shared/errors';
import {
  isNotFalsyString,
  isValidEmail,
  isValidUserName,
} from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import EmailOrPhoneInput from '#components/EmailOrPhoneInput';
import { useNativeNavigationEvent, useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { signin } from '#helpers/MobileWebAPI';
import useKeyboardHeight from '#hooks/useKeyboardHeight';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import PressableOpacity from '#ui/PressableOpacity';
import SecuredTextInput from '#ui/SecuredTextInput';
import Text from '#ui/Text';
import type { EmailPhoneInput } from '#components/EmailOrPhoneInput';
import type { Route } from '#routes';
import type {
  LayoutChangeEvent,
  TextInput as NativeTextInput,
} from 'react-native';

const SignInScreen = () => {
  const [credential, setCredential] = useState<EmailPhoneInput>({
    countryCodeOrEmail: 'email',
    value: '',
  });
  const [password, setPassword] = useState('');
  const [credentialInvalid, setCredentialInvalid] = useState(false);
  const [signinError, setSigninError] = useState<
    'default' | 'forbidden' | undefined
  >(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clearPassword, setClearPassword] = useState(false);

  const router = useRouter();

  const onSubmit = useCallback(async () => {
    if (!isNotFalsyString(credential.value) || !isNotFalsyString(password)) {
      return;
    }

    const intlPhoneNumber = tryGetPhoneNumber(
      credential.value,
      credential.countryCodeOrEmail,
    );

    if (
      !intlPhoneNumber &&
      !isValidEmail(credential.value) &&
      !isValidUserName(credential.value)
    ) {
      setCredentialInvalid(true);
      return;
    }

    setCredentialInvalid(false);

    try {
      setIsSubmitting(true);

      const signedIn = await signin({
        credential: intlPhoneNumber ?? credential.value,
        password,
      });

      await setSharedWebCredentials(
        process.env.APP_WEBSHARED_CREDENTIALS!,
        intlPhoneNumber ?? credential.value,
        password,
      ).catch(() => {});
      setClearPassword(true);

      if (signedIn.issuer) {
        router.push({
          route: 'CONFIRM_REGISTRATION',
          params: {
            issuer: signedIn.issuer,
          },
        });
      } else {
        const {
          token,
          refreshToken,
          profileInfos,
          email,
          phoneNumber,
          userId,
        } = signedIn;

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
      }
    } catch (error) {
      //TODO handle more error cases ?
      setSigninError(
        typeof error === 'object' &&
          error &&
          'message' in error &&
          error.message === ERRORS.FORBIDDEN
          ? 'forbidden'
          : 'default',
      );
      setIsSubmitting(false);
      return;
    }
  }, [credential, password, router]);

  const passwordRef = useRef<NativeTextInput>(null);
  // #endregion

  const intl = useIntl();
  const insets = useScreenInsets();

  const styles = useStyleSheet(stylesheet);

  const navigateTo = useCallback(
    async (route: Route, replace: boolean) => {
      if (Platform.OS === 'ios') {
        setClearPassword(true);
        await waitTime(100);
      }
      if (replace) {
        router.replace(route);
      } else {
        router.push(route);
      }
    },
    [router],
  );

  const onForgotLinkPasswordPress = useCallback(() => {
    navigateTo({ route: 'FORGOT_PASSWORD' }, false);
  }, [navigateTo]);

  const onSignupLinkPress = useCallback(() => {
    navigateTo({ route: 'SIGN_UP' }, true);
  }, [navigateTo]);

  useNativeNavigationEvent('appear', () => {
    setClearPassword(false);
  });

  const { height } = useScreenDimensions();
  const [panelHeight, setPanelHeight] = useState(height - 353);
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setPanelHeight(height - event.nativeEvent.layout.height + 20); //20 for the radius
    },
    [height],
  );

  const keyboardHeight = useKeyboardHeight();
  const keyboardAvoidAnimatedStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: keyboardHeight.value - insets.bottom + 16,
    };
  });

  return (
    <View style={styles.root}>
      <View style={styles.background}>
        <LottieView
          source={require('../assets/sign/login_sign_up_asset.json')}
          autoPlay
          loop
          hardwareAccelerationAndroid
          style={{
            width: '100%',
            height: panelHeight,
            opacity: 0.3,
          }}
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
      <Animated.View style={[styles.content, keyboardAvoidAnimatedStyle]}>
        <View onLayout={onLayout}>
          <View style={styles.header}>
            <Text variant="xlarge">
              <FormattedMessage
                defaultMessage="Log in"
                description="Signin Screen - Log in title"
              />
            </Text>
          </View>
          <View style={[styles.form, { marginBottom: insets.bottom }]}>
            <EmailOrPhoneInput
              input={credential ?? { countryCodeOrEmail: 'email', value: '' }}
              onChange={input => {
                if (!isSubmitting) setCredential(input);
              }}
              testID="credential-input"
              placeholder={
                credential.countryCodeOrEmail === 'email'
                  ? intl.formatMessage({
                      defaultMessage: 'Email address',
                      description:
                        'SignIn Screen email address input placeholder',
                    })
                  : intl.formatMessage({
                      defaultMessage: 'Phone number',
                      description:
                        'SignIn Screen phone number input placeholder',
                    })
              }
              hasError={credentialInvalid}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Enter your phone number or email address',
                description:
                  'SignIn Screen - Accessibility TextInput phone number or email address',
              })}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              readOnly={isSubmitting}
            />
            <View>
              <SecuredTextInput
                ref={passwordRef}
                testID="password-input"
                placeholder={intl.formatMessage({
                  defaultMessage: 'Password',
                  description: 'Password input placeholder',
                })}
                value={clearPassword ? '' : password}
                onChangeText={isSubmitting ? undefined : setPassword}
                accessibilityLabel={intl.formatMessage({
                  defaultMessage: 'Enter your password',
                  description:
                    'SignIn Screen - Accessibility TextInput email address ',
                })}
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                readOnly={isSubmitting}
              />
              <View style={styles.forgotPasswordContainer}>
                <PressableOpacity onPress={onForgotLinkPasswordPress}>
                  <Text style={styles.greyText} variant="small">
                    <FormattedMessage
                      defaultMessage="Forgot your password?"
                      description="SigninScreen - Forgot your password?"
                    />
                  </Text>
                </PressableOpacity>
              </View>
            </View>
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
                !isNotFalsyString(credential.value) ||
                !isNotFalsyString(password)
              }
              loading={isSubmitting}
              onPress={onSubmit}
            />
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
                ) : signinError === 'default' ? (
                  <FormattedMessage
                    defaultMessage="Invalid credentials"
                    description="SigninScreen - Invalid Credentials"
                  />
                ) : signinError === 'forbidden' ? (
                  <FormattedMessage
                    defaultMessage="Your account has been disabled. Please contact support."
                    description="SigninScreen - Account disabled"
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
              <PressableOpacity onPress={onSignupLinkPress}>
                <Text style={styles.linkLogout} variant="medium">
                  <FormattedMessage
                    defaultMessage="Sign Up"
                    description="SigninScreen - Sign Up"
                  />
                </Text>
              </PressableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default SignInScreen;

SignInScreen.options = {
  replaceAnimation: 'push',
  stackAnimation: 'fade',
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
  background: [StyleSheet.absoluteFill, { backgroundColor: 'black' }],
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
