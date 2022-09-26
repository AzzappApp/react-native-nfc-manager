import { isNotFalsyString } from '@azzapp/shared/lib/stringHelpers';
import { useState } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, fontFamilies } from '../../theme';
import Link from '../components/Link';

import useViewportSize, {
  insetBottom,
  insetTop,
} from '../hooks/useViewportSize';
import { useRouter } from '../PlatformEnvironment';
import Button from '../ui/Button';
import FloatingIconButton from '../ui/FloatingIconButton';
import Form, { Submit } from '../ui/Form/Form';
import TextInput from '../ui/TextInput';
import type { SignInParams } from '@azzapp/shared/lib/WebAPI';

type SignInScreenProps = {
  signin: (params: SignInParams) => Promise<void>;
};

const SignInScreen = ({ signin }: SignInScreenProps) => {
  const vp = useViewportSize();
  const router = useRouter();
  const intl = useIntl();
  const [userNameOrEmail, setUserNameOrEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | undefined>(
    undefined,
  );

  const onSubmit = async () => {
    let canSignin = true;
    if (!isNotFalsyString(userNameOrEmail)) {
      setEmailError(
        intl.formatMessage({
          defaultMessage: 'Please enter a valid email',
          description:
            'SigninScreen - error message when input usernameOrEmail is empty',
        }),
      );
      canSignin = false;
    } else {
      setEmailError(undefined);
    }
    if (!isNotFalsyString(password)) {
      setPasswordError(
        intl.formatMessage({
          defaultMessage: 'Please enter a password',
          description:
            'SigninScreen - error message when input password is empty',
        }),
      );
      return;
    }
    setPasswordError(undefined);
    if (canSignin) {
      await signin({ userNameOrEmail, password });
    }
  };

  const onBack = () => {
    router.back();
  };

  return (
    <View style={styles.flex}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View onTouchStart={Keyboard.dismiss} style={styles.container}>
          <Form style={styles.inner} onSubmit={onSubmit}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/logo-full.png')}
                resizeMode="contain"
                style={styles.logo}
              />
            </View>

            <TextInput
              testID="azzapp_SignIn_textInput-usernameOrEmail"
              placeholder={intl.formatMessage({
                defaultMessage: 'Email Address',
                description: 'Signin Screen email address input placeholder',
              })}
              value={userNameOrEmail}
              onChangeText={setUserNameOrEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              autoCorrect={false}
              errorLabel={emailError}
            />
            <TextInput
              testID="azzapp_SignIn_textInput-password"
              placeholder={intl.formatMessage({
                defaultMessage: 'Password',
                description: 'Password input placeholder',
              })}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              errorLabel={passwordError}
            />
            <View style={{ alignItems: 'flex-end', paddingRight: 10 }}>
              <Link modal route="FORGOT_PASSWORD">
                <Text style={styles.linkTextForgot}>
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
                  description: 'Password input placeholder',
                })}
                style={styles.button}
              />
            </Submit>
          </Form>
        </View>
      </KeyboardAvoidingView>
      <View style={[styles.closeButton, { top: vp`${insetTop} + ${16}` }]}>
        <FloatingIconButton icon="chevron" onPress={onBack} />
      </View>
      <View
        style={{
          bottom: vp`${insetBottom} + ${35}`,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={styles.alrSignText}>
          <FormattedMessage
            defaultMessage="Don't have an account"
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
    </View>
  );
};

export default SignInScreen;

const styles = StyleSheet.create({
  linkTextForgot: { ...fontFamilies.fontMedium, color: colors.grey200 },
  flex: { flex: 1 },
  button: {
    marginLeft: 10,
    marginRight: 10,
    marginTop: 41,
    height: 45,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  container: {
    marginBottom: 34,
    flex: 1,
    justifyContent: 'center',
    alignItem: 'center',
  },
  inner: {
    padding: 15,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 61,
  },
  logo: { width: 242, height: 50 },
  alrSignText: { color: colors.grey200 },
  linkLogin: { ...fontFamilies.fontMedium, paddingLeft: 8 },
  errorTextStyle: {
    ...fontFamilies.fontMedium,
    color: colors.red400,
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 14,
  },
  closeButton: {
    position: 'absolute',
    start: 15,
    zIndex: 1,
  },
});
