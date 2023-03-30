import { parsePhoneNumber } from 'libphonenumber-js';
import { useCallback, useState, useRef } from 'react';
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
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { fontFamilies, colors } from '#theme';
import Link from '#components/Link';
import { getLocales } from '#helpers/localeHelpers';
import useViewportSize, { insetBottom } from '#hooks/useViewportSize';

import Button from '#ui/Button';
import Form, { Submit } from '#ui/Form/Form';
import SecuredTextInput from '#ui/SecuredTextInput';
import TextInput from '#ui/TextInput';
import type { SignInParams } from '@azzapp/shared/WebAPI';
import type { TextInput as NativeTextInput } from 'react-native';

type SignInScreenProps = {
  signin: (params: SignInParams) => Promise<void>;
};

const SignInScreen = ({ signin }: SignInScreenProps) => {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [signinError, setSigninError] = useState(false);

  const intl = useIntl();

  const onSubmit = useCallback(async () => {
    if (!isNotFalsyString(credential) || !isNotFalsyString(password)) {
      return;
    }
    const locales = getLocales();
    const intlPhoneNumber = tryGetPhoneNumber(
      credential,
      locales[0]?.countryCode,
    );

    try {
      await signin({ credential: intlPhoneNumber ?? credential, password });
    } catch (error) {
      //TODO handle more error cases ?
      setSigninError(true);
    }
  }, [signin, credential, password]);

  const passwordRef = useRef<NativeTextInput>(null);
  const focusPassword = () => {
    passwordRef?.current?.focus();
  };

  const vp = useViewportSize();
  return (
    <View style={styles.root}>
      <View onTouchStart={Keyboard.dismiss} style={styles.background}>
        <Image
          source={require('#assets/sign/sign_background.png')}
          resizeMode="cover"
        />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={-vp`${insetBottom}`}
      >
        <View style={styles.content}>
          <Form
            style={[styles.form, { marginBottom: vp`${insetBottom}` }]}
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
              value={credential}
              onChangeText={setCredential}
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
              placeholder={intl.formatMessage({
                defaultMessage: 'Password',
                description: 'Password input placeholder',
              })}
              value={password}
              onChangeText={setPassword}
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
                <Text style={styles.error}>
                  <FormattedMessage
                    defaultMessage="Invalid credentials"
                    description="SigninScreen - Invalid Credentials"
                  />
                </Text>
              </View>
            )}
            <View style={styles.footer}>
              <Text style={styles.greyText}>
                <FormattedMessage
                  defaultMessage="Don't have an account?"
                  description="SigninScreen - Don't have an account"
                />
              </Text>
              <Link modal route="SIGN_UP" replace>
                <Text style={styles.linkLogout}>
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

export default SignInScreen;

function tryGetPhoneNumber(phoneNumber: string, countryCode?: string) {
  try {
    const phonenumber = parsePhoneNumber(phoneNumber, countryCode as any);
    if (phonenumber) {
      return phonenumber.formatInternational();
    }
  } catch {
    return null;
  }

  return null;
}

const styles = StyleSheet.create({
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: {
    height: 34,
    width: 165,
  },
  form: {
    padding: 20,
  },
  textInput: {
    marginBottom: 5,
  },
  content: {
    justifyContent: 'center',
    alignItem: 'center',
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  greyText: {
    ...fontFamilies.fontMedium,
    color: colors.grey200,
  },
  button: {
    marginTop: 20,
    height: 45,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  error: {
    ...fontFamilies.fontMedium,
    color: colors.red400,
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  linkLogout: {
    ...fontFamilies.fontMedium,
    paddingLeft: 5,
  },
});
