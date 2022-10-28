import {
  isValidPassword,
  isValidEmail,
} from '@azzapp/shared/lib/stringHelpers';

import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, fontFamilies, textStyles } from '../../theme';
import Link from '../components/Link';
import useViewportSize, {
  insetBottom,
  insetTop,
} from '../hooks/useViewportSize';
import { useRouter } from '../PlatformEnvironment';
import Button from '../ui/Button';
import CheckBox from '../ui/CheckBox';
import FloatingIconButton from '../ui/FloatingIconButton';
import Form, { Submit } from '../ui/Form/Form';

import TextInput from '../ui/TextInput';

import type { SignUpParams } from '@azzapp/shared/lib/WebAPI';

type SignUpScreenProps = {
  signup: (params: SignUpParams) => Promise<void>;
};

const SignUpScreen = ({ signup }: SignUpScreenProps) => {
  const vp = useViewportSize();
  const intl = useIntl();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState('');
  const [pwdError, setPwdError] = useState<string | undefined>(undefined);
  const [checkedTos, setCheckedTos] = useState(false);
  const [checkedPrivacy, setCheckedPrivacy] = useState(false);
  const [errorTos, setErrorTos] = useState<boolean>(false);

  const onSubmit = async () => {
    let canSignup = true;
    if (!isValidEmail(email)) {
      setEmailError(
        intl.formatMessage({
          defaultMessage: 'Please enter a valid email address',
          description:
            'SignupScreen - error message when input doest not validate as an email',
        }),
      );
      canSignup = false;
    } else {
      setEmailError(undefined);
    }

    if (!isValidPassword(password)) {
      setPwdError(
        intl.formatMessage({
          defaultMessage: 'At least 8 caracters, 1upper, 1 lower 1 digit',
          description:
            'SignupScreen - error message when password is not valid',
        }),
      );
      canSignup = false;
    } else {
      setPwdError(undefined);
    }
    if (!(checkedTos && checkedPrivacy)) {
      setErrorTos(true);
      canSignup = false;
      return;
    }
    setErrorTos(false);

    if (canSignup) {
      //TODO: have a review about username , dont want to break api signup for now
      await signup({ userName: email, email, password });
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
              testID="azzapp_SignUp_textInput-email"
              key="email"
              placeholder={intl.formatMessage({
                defaultMessage: 'Email Address',
                description: 'Signup Screen - email address input placeholder',
              })}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              autoCorrect={false}
              errorLabel={emailError}
            />
            <TextInput
              testID="azzapp_SignUp_textInput-password"
              key="password"
              placeholder={intl.formatMessage({
                defaultMessage: 'Password',
                description: 'Signup Screen - password',
              })}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              errorLabel={pwdError}
            />
            <CheckBox
              label={<TosLabel />}
              checked={checkedTos}
              onValueChange={setCheckedTos}
              containerStyle={styles.tosContainer}
            />
            <CheckBox
              label={<PPLabel />}
              checked={checkedPrivacy}
              onValueChange={setCheckedPrivacy}
              containerStyle={styles.ppContainer}
            />
            {errorTos && (
              <Text
                testID="azzapp_SignUp_textInput-errorTos"
                style={{
                  ...textStyles.error,
                  paddingLeft: 10,
                  marginTop: 10,
                }}
              >
                <FormattedMessage
                  defaultMessage="You need to accept the Terms of services & privacy policy"
                  description="Signup Screen - error message when TOS or PP are not checked"
                />
              </Text>
            )}
            <Submit>
              <Button
                label={intl.formatMessage({
                  defaultMessage: 'Sign Up',
                  description: 'Signup Screen - Sign Up button',
                })}
                accessibilityLabel={intl.formatMessage({
                  defaultMessage: 'Tap to sign up',
                  description:
                    'Signup Screen - AccessibilityLabel Sign Up button',
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
            defaultMessage="Already have an account?"
            description="Signup Screen - Already have an account?"
          />
        </Text>
        <Link modal route="SIGN_IN" replace>
          <Text style={styles.linkLogin}>
            <FormattedMessage
              defaultMessage="Log In"
              description="Signup Screen - Login link bottom screen"
            />
          </Text>
        </Link>
      </View>
    </View>
  );
};

//TODO: discuss the way to link to terms of services and privacy policy, with inside navigator or outside
const TosLabel = () => (
  <Text style={styles.checkLabel}>
    <FormattedMessage
      defaultMessage="I agree to the "
      description="Signup Screen - I agree to the TOS first part"
    />
    <Text
      style={{ ...textStyles.hyperLink }}
      onPress={() => Linking.openURL('http://www.google.com')}
    >
      <FormattedMessage
        defaultMessage="Terms of services"
        description="Signup Screen - Terms of Service link"
      />
    </Text>
  </Text>
);

const PPLabel = () => (
  <Text style={styles.checkLabel}>
    <FormattedMessage
      defaultMessage="I accept with "
      description="Signup Screen - I accept with PP first part"
    />

    <Text
      style={{ ...textStyles.hyperLink }}
      onPress={() => Linking.openURL('http://www.google.com')}
    >
      <FormattedMessage
        defaultMessage="privacy policy"
        description="Signup Screen - privacy policy link"
      />
    </Text>
  </Text>
);

export default SignUpScreen;

const styles = StyleSheet.create({
  checkLabel: {
    ...fontFamilies.fontMedium,
    fontSize: 14,
    color: colors.black,
    paddingLeft: 11,
  },
  ppContainer: { paddingLeft: 10, paddingTop: 15 },
  tosContainer: { paddingLeft: 10, paddingTop: 10 },
  flex: { flex: 1 },
  button: { marginLeft: 10, marginRight: 10, marginTop: 15 },
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
    marginBottom: 30,
  },
  logo: { width: 242, height: 50 },
  alrSignText: { color: colors.grey200 },
  linkLogin: { ...fontFamilies.fontMedium, paddingLeft: 8 },
  closeButton: {
    position: 'absolute',
    start: 15,
    zIndex: 1,
  },
});
