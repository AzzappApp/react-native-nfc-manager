import { parsePhoneNumber } from 'libphonenumber-js';
import { useCallback, useMemo, useState, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  Text,
  Image,
} from 'react-native';
import { fetchQuery, graphql, useRelayEnvironment } from 'react-relay';
import {
  isNotFalsyString,
  isPhoneNumber,
  isValidEmail,
  isValidPassword,
  isValidUsername,
  REGEX_CHAR_USERNAME,
} from '@azzapp/shared/stringHelpers';
import { textStyles, fontFamilies, colors } from '#theme';
import Link from '#components/Link';
import { getLocales } from '#helpers/localeHelpers';
import useViewportSize, { insetBottom } from '#hooks/useViewportSize';
import Button from '#ui/Button';
import CheckBox from '#ui/CheckBox';
import Form, { Submit } from '#ui/Form/Form';
import HyperLink from '#ui/HyperLink';
import SecuredTextInput from '#ui/SecuredTextInput';
import TextInput from '#ui/TextInput';
import type { SignUpScreenQuery } from '@azzapp/relay/artifacts/SignUpScreenQuery.graphql';
import type { SignUpParams } from '@azzapp/shared/WebAPI';
import type { CountryCode } from 'libphonenumber-js';

import type { TextInput as NativeTextInput } from 'react-native';

type SignupScreenProps = {
  signup: (params: SignUpParams) => Promise<void>;
};

const SignupScreen = ({ signup }: SignupScreenProps) => {
  const vp = useViewportSize();
  const intl = useIntl();
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [phoneEmailError, setPhoneEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [pwdError, setPwdError] = useState(false);
  const [checkedTos, setCheckedTos] = useState(false);
  const [checkedPrivacy, setCheckedPrivacy] = useState(false);
  const [errorTos, setErrorTos] = useState<boolean>(false);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | undefined>();
  const userNameRef = useRef<NativeTextInput>(null);
  const passwordRef = useRef<NativeTextInput>(null);
  const environment = useRelayEnvironment();

  const onChangeUsername = useCallback(
    (text: string) => {
      if (isNotFalsyString(text)) {
        if (REGEX_CHAR_USERNAME.test(text.slice(-1))) {
          setUsernameError(undefined);
          setUsername(text);
        } else {
          setUsernameError(
            intl.formatMessage({
              defaultMessage:
                'Usernames can only use Roman latines letters(a-z, A-Z), numbers, underscores and full stops. Should contains at least 4 characters',
              description:
                'Signup Screen - Error message for invalid username on textInput',
            }),
          );
        }
      } else {
        setUsername('');
      }
    },
    [intl],
  );

  const usernameExist = useCallback(async () => {
    if (isValidUsername(username)) {
      const result = await fetchQuery<SignUpScreenQuery>(
        environment,
        graphql`
          query SignUpScreenQuery($userName: String!) {
            profile(userName: $userName) {
              id
              userName
            }
          }
        `,
        { userName: username },
      ).toPromise();
      if (result?.profile?.userName === username) {
        return true;
      }
    }
    return false;
  }, [environment, username]);

  const validateUsername = useCallback(async () => {
    if (!isValidUsername(username)) {
      setUsernameError(
        intl.formatMessage({
          defaultMessage:
            'Usernames can only use Roman latines letters(a-z, A-Z), numbers, underscores and full stops. Should contains at least 4 characters',
          description:
            'Signup Screen - Error message for invalid username on textInput',
        }),
      );
      return;
    }
    if (await usernameExist()) {
      setUsernameError(
        intl.formatMessage({
          defaultMessage: 'This username is already taken',
          description:
            'Signup Screen - Error message for  username is already taken',
        }),
      );
      return;
    }
    setUsernameError(undefined);
  }, [intl, username, usernameExist]);

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
      setPhoneEmailError('');
      let canSignup = true;
      if (!isValidPassword(password)) {
        setPwdError(true);
        canSignup = false;
      } else {
        setPwdError(false);
      }
      if (!(checkedTos && checkedPrivacy)) {
        setErrorTos(true);
        canSignup = false;
        return;
      }
      setErrorTos(false);
      if (!isValidMailOrPhone) {
        setPhoneEmailError(
          intl.formatMessage({
            defaultMessage:
              'Please enter a valid phone number or email address',
            description:
              'Signup Screen - Error message for invalid phone or email address on textInput ',
          }),
        );

        canSignup = false;
        return;
      }
      // test is not working if doing  if (canSignup && !(await usernameExist())
      const canCreateUsername = !(await usernameExist());
      if (canSignup && canCreateUsername) {
        let phoneEmail = phoneOrEmail;

        const locales = getLocales();
        if (!isValidEmail(phoneOrEmail)) {
          for (let i = 0; i < locales.length; i++) {
            if (
              isPhoneNumber(phoneOrEmail, locales[i].countryCode as CountryCode)
            ) {
              const res = parsePhoneNumber(
                phoneOrEmail,
                locales[i].countryCode as CountryCode,
              );
              //this will format
              phoneEmail = res.formatInternational();
              break;
            }
          }

          await signup({
            userName: username,
            phoneNumber: phoneEmail,
            password,
          });
        } else {
          await signup({
            userName: username,
            email: phoneEmail,
            password,
          });
        }
      }
    } catch (error: any) {
      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        setPhoneEmailError(
          intl.formatMessage({
            defaultMessage: 'This email address is already registered',
            description:
              'Signup Screen - Error This email address is already registered ',
          }),
        );
      } else if (error.message === 'PHONENUMBER_ALREADY_EXISTS') {
        setPhoneEmailError(
          intl.formatMessage({
            defaultMessage: 'This phone number is already registered',
            description:
              'Signup Screen - Error This phone number is already registered ',
          }),
        );
      } else if (error.message === 'USERNAME_ALREADY_EXIST') {
        setUsernameError(
          intl.formatMessage({
            defaultMessage: 'This username is not available',
            description: 'Signup Screen - Error This username is not available',
          }),
        );
      } else {
        setPhoneEmailError(
          intl.formatMessage({
            defaultMessage: 'Unknown error - Please retry',
            description: 'Signup Screen - Error unkown',
          }),
        );
      }
    }
  }, [
    checkedPrivacy,
    checkedTos,
    intl,
    isValidMailOrPhone,
    password,
    phoneOrEmail,
    signup,
    username,
    usernameExist,
  ]);

  const focusUserName = () => {
    userNameRef?.current?.focus();
  };

  const focusPassword = () => {
    passwordRef?.current?.focus();
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.containerImagebackground}>
        <Image
          source={require('#assets/sign/darkensign_background.png')}
          resizeMode="cover"
        />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={-vp`${insetBottom}`}
        style={styles.flexible}
      >
        <View
          style={styles.logoContainer}
          onTouchStart={() => Keyboard.dismiss()}
        >
          <Image
            source={require('#assets/logo-full_white.png')}
            resizeMode="contain"
            style={styles.logo}
          />
        </View>
        <View style={styles.container}>
          <Form
            style={[styles.inner, { marginBottom: vp`${insetBottom}` }]}
            onSubmit={onSubmit}
          >
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <Text
                style={{
                  ...fontFamilies.semiBold,
                  fontSize: 26,
                  marginBottom: 10,
                }}
              >
                <FormattedMessage
                  defaultMessage="Welcome"
                  description="Signup Screen - Welcome title"
                />
              </Text>

              <Text>
                <FormattedMessage
                  defaultMessage="Let's get started with Azzapp!"
                  description="Signup Screen - Let's get started with Azzapp! subtitle"
                />
              </Text>
            </View>

            <TextInput
              key="email"
              placeholder={intl.formatMessage({
                defaultMessage: 'Phone Number of email address',
                description:
                  'Signup Screen - email address or phone number input placeholder',
              })}
              value={phoneOrEmail}
              onChangeText={setPhoneOrEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              autoCorrect={false}
              containerStyle={styles.textinputContainer}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Enter your email address or phone number',
                description:
                  'Signup Screen - Accessibility TextInput email address or phone number',
              })}
              errorLabel={phoneEmailError}
              onSubmitEditing={focusUserName}
              returnKeyType="next"
            />

            <TextInput
              key="username"
              ref={userNameRef}
              placeholder={intl.formatMessage({
                defaultMessage: 'Choose a username',
                description:
                  'Signup Screen - choose a username input placeholder',
              })}
              value={username}
              onChangeText={onChangeUsername}
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect={false}
              errorLabel={usernameError}
              onBlur={validateUsername}
              containerStyle={styles.textinputContainer}
              onSubmitEditing={focusPassword}
              returnKeyType="next"
            />
            <SecuredTextInput
              key="password"
              ref={passwordRef}
              placeholder={intl.formatMessage({
                defaultMessage: 'Password',
                description: 'Signup Screen - password textinput placeholder',
              })}
              value={password}
              onChangeText={setPassword}
              errorLabel={
                pwdError
                  ? intl.formatMessage({
                      defaultMessage:
                        'Password should contain at least 8 characters with at least 1 number, 1 uppercase letter and 1 lowercase letter',
                      description:
                        'SignupScreen - error message when password is not compliant with our rules',
                    })
                  : undefined
              }
              containerStyle={styles.textinputContainer}
              accessibilityLabel={intl.formatMessage({
                defaultMessage:
                  'Enter your password. It should contain at least 8 characters with one digit, one upper and one lower case',
                description:
                  'Signup Screen - Accessibility Label TextInput Password',
              })}
              returnKeyType="done"
            />
            <CheckBox
              label={
                <Text style={styles.checkLabel}>
                  <FormattedMessage
                    defaultMessage="I agree to the"
                    description="Signup Screen - 'I agree to the' Terms of service "
                  />{' '}
                  <HyperLink
                    label={intl.formatMessage({
                      defaultMessage: 'Terms of Service',
                      description:
                        'Signup Screen - Terms of Service label for hyperlink',
                    })}
                    url="http://www.azzapp.com/tos"
                  />
                </Text>
              }
              checked={checkedTos}
              onValueChange={setCheckedTos}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Tap to accept the terms of service',
                description:
                  'Signup Screen - Accessibility checkbox terms of service',
              })}
            />
            <CheckBox
              label={
                <Text style={styles.checkLabel}>
                  <FormattedMessage
                    defaultMessage="I agree to the"
                    description="Signup Screen - 'I agree to the' Privacy Policy"
                  />{' '}
                  <HyperLink
                    label={intl.formatMessage({
                      defaultMessage: 'Privacy Policy',
                      description:
                        'Signup Screen - Privacy Policy Hyperlink Clickable label',
                    })}
                    url="http://www.azzapp.com/tos"
                  />
                </Text>
              }
              checked={checkedPrivacy}
              onValueChange={setCheckedPrivacy}
              containerStyle={styles.ppContainer}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Tap to accept the privacy policy',
                description:
                  'Signup Screen - Accessibility checkbox  Privacy Policy',
              })}
            />

            <Submit>
              <Button
                label={intl.formatMessage({
                  defaultMessage: 'Sign Up',
                  description: 'Signup Screen - Sign Up button',
                })}
                accessibilityLabel={intl.formatMessage({
                  defaultMessage: 'Tap to sign up',
                  description: 'Signup Screen - Accessibility Sign Up button',
                })}
                style={styles.button}
                disabled={!isValidMailOrPhone && !isNotFalsyString(username)}
              />
            </Submit>
            {errorTos && (
              <Text
                style={{
                  ...textStyles.error,
                  paddingLeft: 10,
                  marginTop: 10,
                }}
              >
                <FormattedMessage
                  defaultMessage="You need to accept the Terms of Service and the Privacy Policy"
                  description="Signup Screen - error message when the user did not accept the terms of service and the privacy policy"
                />
              </Text>
            )}
            <View style={styles.viewAlreadyAccount}>
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
          </Form>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  flexible: { flex: 1 },
  viewAlreadyAccount: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerImagebackground: {
    width: '100%',
    position: 'absolute',
    top: 0,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    justifyContent: 'center',
    alignItem: 'center',
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  textinputContainer: {
    padding: 0,
    margin: 0,
    marginBottom: 5,
  },
  button: {
    marginTop: 20,
    height: 45,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  checkLabel: {
    ...fontFamilies.fontMedium,
    fontSize: 14,
    color: colors.black,
    paddingLeft: 11,
  },
  ppContainer: { paddingTop: 20 },
  inner: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { height: 34, width: 165 },
  alrSignText: { color: colors.grey200 },
  linkLogin: { ...fontFamilies.fontMedium, paddingLeft: 5 },
});
