import { useCallback, useMemo, useState, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import {
  isNotFalsyString,
  isPhoneNumber,
  isValidEmail,
} from '@azzapp/shared/stringHelpers';
import { fontFamilies, colors } from '#theme';
import Link from '#components/Link';
import { getLocales } from '#helpers/localeHelpers';
import useViewportSize, { insetBottom } from '#hooks/useViewportSize';

import Button from '#ui/Button';
import Form, { Submit } from '#ui/Form/Form';
import TextInput from '#ui/TextInput';
import type { SignInParams } from '@azzapp/shared/WebAPI';
import type { CountryCode } from 'libphonenumber-js';
import type { TextInput as NativeTextInput } from 'react-native';
type SignInMobileScreenProps = {
  signin: (params: SignInParams) => Promise<void>;
};

const SignInMobileScreen = ({ signin }: SignInMobileScreenProps) => {
  const vp = useViewportSize();

  const [signinError, setSigninError] = useState(false);
  const intl = useIntl();
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');

  const isValidMailOrPhone = useMemo(() => {
    if (isValidEmail(phoneOrEmail)) {
      return true;
    }

    const locales = getLocales();
    for (let i = 0; i < locales.length; i++) {
      if (isPhoneNumber(phoneOrEmail, locales[i].countryCode as CountryCode)) {
        return true;
      }
    }
    return false;
  }, [phoneOrEmail]);

  const onSubmit = useCallback(async () => {
    try {
      if (isValidMailOrPhone) {
        await signin({ credential: phoneOrEmail, password });
      }
      setSigninError(false);
    } catch (error) {
      //TODO handle more error cases ?
      setSigninError(true);
    }
  }, [isValidMailOrPhone, signin, phoneOrEmail, password]);
  const passwordRef = useRef<NativeTextInput>(null);
  const focusPassword = () => {
    passwordRef?.current?.focus();
  };
  return (
    <View style={styles.mainContainer}>
      <View
        onTouchStart={Keyboard.dismiss}
        style={styles.containerImagebackground}
      >
        <Image
          source={require('#assets/sign/sign_background.png')}
          resizeMode="cover"
        />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={-vp`${insetBottom}`}
      >
        <View style={styles.container}>
          <Form
            style={[styles.inner, { marginBottom: vp`${insetBottom}` }]}
            onSubmit={onSubmit}
          >
            <View style={styles.logoContainer}>
              <Image
                source={require('#assets/logo-full.png')}
                resizeMode="contain"
                style={styles.logo}
              />
            </View>

            <TextInput
              placeholder={intl.formatMessage({
                defaultMessage: 'Phone number or email address',
                description:
                  'SignIn Screen Phone number or email address input placeholder',
              })}
              value={phoneOrEmail}
              onChangeText={setPhoneOrEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              autoCorrect={false}
              containerStyle={styles.textinputContainer}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Enter your phone number or email address',
                description:
                  'SignIn Screen - Accessibility TextInput phone number or email address',
              })}
              onSubmitEditing={focusPassword}
              returnKeyType="next"
            />
            <TextInput
              ref={passwordRef}
              placeholder={intl.formatMessage({
                defaultMessage: 'Password',
                description: 'Password input placeholder',
              })}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              containerStyle={styles.textinputContainer}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Enter your password',
                description:
                  'SignIn Screen - Accessibility TextInput email address ',
              })}
              returnKeyType="done"
            />
            <View style={styles.viewForgetPassword}>
              <Link modal route="FORGOT_PASSWORD">
                <Text style={styles.greyText}>
                  <FormattedMessage
                    defaultMessage="Forgot your password?"
                    description="SigninScreen - Forgot your password?"
                  />
                </Text>
              </Link>
            </View>
            <Submit>
              <Button
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
                disabled={!isValidMailOrPhone || !isNotFalsyString(password)}
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
                <Text style={styles.errorTextStyle}>
                  <FormattedMessage
                    defaultMessage="Invalid credentials"
                    description="SigninScreen - Invalid Credentials"
                  />
                </Text>
              </View>
            )}
            <View style={[styles.viewSignup]}>
              <Text style={styles.greyText}>
                <FormattedMessage
                  defaultMessage="Don't have an account?"
                  description="SigninScreen - Don't have an account"
                />
              </Text>
              <Link modal route="SIGN_UP" replace>
                <Text style={styles.linkLogin}>
                  <FormattedMessage
                    defaultMessage="Sign Up"
                    description="SigninScreen - Sign Up"
                  />
                </Text>
              </Link>
            </View>
          </Form>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignInMobileScreen;

const styles = StyleSheet.create({
  containerImagebackground: {
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    backgroundColor: 'black',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  viewForgetPassword: { alignItems: 'flex-end', paddingRight: 10 },
  viewSignup: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  greyText: { ...fontFamilies.fontMedium, color: colors.grey200 },
  flex: { flex: 1 },
  button: {
    marginTop: 20,
    height: 45,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  container: {
    justifyContent: 'center',
    alignItem: 'center',
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  inner: {
    padding: 20,
  },
  textinputContainer: {
    padding: 0,
    margin: 0,
    marginBottom: 5,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: { height: 34, width: 165 },
  linkLogin: { ...fontFamilies.fontMedium, paddingLeft: 5 },
  errorTextStyle: {
    ...fontFamilies.fontMedium,
    color: colors.red400,
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 14,
  },
});
