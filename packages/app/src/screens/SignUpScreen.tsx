import { parsePhoneNumber } from 'libphonenumber-js';
import { useCallback, useState, useRef, memo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, Image, Keyboard } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import ERRORS from '@azzapp/shared/errors';
import {
  isNotFalsyString,
  isPhoneNumber,
  isValidEmail,
  isValidPassword,
} from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import EmailOrPhoneInput from '#components/EmailOrPhoneInput';
import Link from '#components/Link';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { getCurrentLocale } from '#helpers/localeHelpers';
import { signup } from '#helpers/MobileWebAPI';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import CheckBox from '#ui/CheckBox';
import Form, { Submit } from '#ui/Form/Form';
import HyperLink from '#ui/HyperLink';
import SecuredTextInput from '#ui/SecuredTextInput';
import Text from '#ui/Text';
import type { EmailPhoneInput } from '#components/EmailOrPhoneInput';
import type { CheckboxStatus } from '#ui/CheckBox';
import type { TextInput as NativeTextInput } from 'react-native';

const TERMS_OF_SERVICE = process.env.TERMS_OF_SERVICE;
const PRIVACY_POLICY = process.env.PRIVACY_POLICY;

const SignupScreen = () => {
  const router = useRouter();
  const [contact, setContact] = useState<EmailPhoneInput>({
    countryCodeOrEmail: 'email',
    value: '',
  });

  const [phoneOrEmailError, setPhoneOrEmailError] = useState('');

  const [password, setPassword] = useState('');
  const [showPasswordError, setShowPasswordError] = useState(false);

  const [checkedTos, setCheckedTos] = useState<CheckboxStatus>('none');
  const [checkedPrivacy, setCheckedPrivacy] = useState<CheckboxStatus>('none');
  const [showTOSError, setShowTOSError] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const intl = useIntl();

  const onSubmit = useCallback(async () => {
    setPhoneOrEmailError('');
    let canSignup = true;
    if (contact.countryCodeOrEmail === 'email') {
      if (!isValidEmail(contact.value)) {
        setPhoneOrEmailError(
          intl.formatMessage({
            defaultMessage: 'Please enter a valid email address',
            description:
              'Signup Screen - Error message for invalid email address',
          }),
        );
        canSignup = false;
      }
    } else if (!isPhoneNumber(contact.value, contact.countryCodeOrEmail)) {
      setPhoneOrEmailError(
        intl.formatMessage({
          defaultMessage: 'Please enter a valid phone number',
          description: 'Signup Screen - Error message for invalid phone number',
        }),
      );
      canSignup = false;
    }

    const passWordValid = isValidPassword(password);
    setShowPasswordError(!passWordValid);
    canSignup &&= passWordValid;

    const tosValid = checkedTos === 'checked' && checkedPrivacy === 'checked';
    setShowTOSError(!tosValid);
    canSignup &&= tosValid;

    if (canSignup) {
      let tokens: Awaited<ReturnType<typeof signup>>;
      try {
        setIsSubmitting(true);
        const locale = getCurrentLocale();
        if (contact.countryCodeOrEmail === 'email') {
          tokens = await signup({
            email: contact.value,
            password,
            locale,
          });
        } else {
          tokens = await signup({
            phoneNumber: parsePhoneNumber(
              contact.value,
              contact.countryCodeOrEmail,
            ).formatInternational(),
            locale,
            password,
          });
        }
        if (isNotFalsyString(tokens.userId)) {
          // Signin process
          const { profileInfos } = tokens;
          await dispatchGlobalEvent({
            type: 'SIGN_IN',
            payload: {
              authTokens: {
                token: tokens.token,
                refreshToken: tokens.refreshToken,
              },
              profileInfos: profileInfos ?? null,
              email: tokens.email,
              phoneNumber: tokens.phoneNumber,
              userId: tokens.userId,
            },
          });
        } else {
          const { issuer } = tokens;

          router.push({
            route: 'CONFIRM_REGISTRATION',
            params: {
              issuer: issuer!,
            },
          });
        }
        setIsSubmitting(false);
      } catch (error: any) {
        setPhoneOrEmailError(
          typeof error === 'object' &&
            error &&
            'message' in error &&
            error.message === ERRORS.FORBIDDEN
            ? intl.formatMessage({
                defaultMessage:
                  'Your account has been disabled. Please contact support.',
                description:
                  'Signup Screen - Error message when the account has been disabled',
              })
            : intl.formatMessage({
                defaultMessage: 'Unknown error - Please retry',
                description: 'Signup Screen - Error unknown',
              }),
        );

        setIsSubmitting(false);
      }
    }
  }, [
    checkedPrivacy,
    checkedTos,
    contact.countryCodeOrEmail,
    contact.value,
    intl,
    password,
    router,
  ]);

  const passwordRef = useRef<NativeTextInput>(null);

  const styles = useStyleSheet(styleSheet);

  // #endregion

  const insets = useScreenInsets();
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
      <KeyboardAvoidingView behavior="padding" style={styles.body}>
        <Form
          style={[styles.form, { marginBottom: insets.bottom }]}
          onSubmit={onSubmit}
        >
          <View style={styles.header}>
            <Text style={styles.title} variant="xlarge">
              <FormattedMessage
                defaultMessage="Welcome!"
                description="Signup Screen - Welcome title"
              />
            </Text>

            <Text style={styles.subTitle} variant="medium">
              <FormattedMessage
                defaultMessage="Let's get started with Azzapp!"
                description="Signup Screen - Let's get started with Azzapp! subtitle"
              />
            </Text>
          </View>

          <EmailOrPhoneInput
            input={contact}
            onChange={setContact}
            hasError={!!phoneOrEmailError}
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
            readOnly={isSubmitting}
          />
          <Text style={styles.error} variant="error">
            {phoneOrEmailError}
          </Text>

          <SecuredTextInput
            nativeID="password"
            ref={passwordRef}
            placeholder={intl.formatMessage({
              defaultMessage: 'Password',
              description: 'Signup Screen - password textinput placeholder',
            })}
            onChangeText={isSubmitting ? undefined : setPassword}
            accessibilityLabel={intl.formatMessage({
              defaultMessage:
                'Enter your password. It should contain at least 8 characters with one digit, one upper and one lower case',
              description:
                'Signup Screen - Accessibility Label TextInput Password',
            })}
            returnKeyType="send"
            onSubmitEditing={onSubmit}
            isErrored={showPasswordError}
            readOnly={isSubmitting}
          />
          <Text style={styles.error} variant="error">
            {showPasswordError && (
              <FormattedMessage
                defaultMessage="Password should contain at least 8 characters and at most 32 characters, a number, an uppercase letter and a lowercase letter"
                description="Signup Screen - error message when password is not compliant with our rules"
              />
            )}
          </Text>
          <View style={styles.checkboxesContainer}>
            <CheckBox
              label={
                <Text style={styles.checkLabel} variant="medium">
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
                    url={`${TERMS_OF_SERVICE}`}
                  />
                </Text>
              }
              status={checkedTos}
              onValueChange={setCheckedTos}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Tap to accept the terms of service',
                description:
                  'Signup Screen - Accessibility checkbox terms of service',
              })}
            />
            <CheckBox
              label={
                <Text style={styles.checkLabel} variant="medium">
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
                    url={`${PRIVACY_POLICY}`}
                  />
                </Text>
              }
              status={checkedPrivacy}
              onValueChange={setCheckedPrivacy}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Tap to accept the privacy policy',
                description:
                  'Signup Screen - Accessibility checkbox  Privacy Policy',
              })}
            />
          </View>

          <Submit>
            <Button
              testID="submit"
              label={intl.formatMessage({
                defaultMessage: 'Sign Up',
                description: 'Signup Screen - Sign Up button',
              })}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Tap to sign up',
                description: 'Signup Screen - Accessibility Sign Up button',
              })}
              style={styles.button}
              disabled={!contact.value || !password}
              loading={isSubmitting}
            />
          </Submit>
          {showTOSError && (
            <Text style={styles.formError} variant="error">
              <FormattedMessage
                defaultMessage="You need to accept the Terms of Service and the Privacy Policy"
                description="Signup Screen - error message when the user did not accept the terms of service and the privacy policy"
              />
            </Text>
          )}
          <View style={styles.footer}>
            <Text style={styles.alrSignText} variant="medium">
              <FormattedMessage
                defaultMessage="Already have an account?"
                description="Signup Screen - Already have an account?"
              />
            </Text>
            <Link route="SIGN_IN" replace>
              <Text style={styles.linkLogin} variant="medium">
                <FormattedMessage
                  defaultMessage="Log In"
                  description="Signup Screen - Login link bottom screen"
                />
              </Text>
            </Link>
          </View>
        </Form>
      </KeyboardAvoidingView>
    </View>
  );
};

export default memo(SignupScreen);

const styleSheet = createStyleSheet(appearance => ({
  flex: { flex: 1 },
  root: {
    flex: 1,
  },
  background: {
    width: '100%',
    position: 'absolute',
    top: 0,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
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
  body: {
    justifyContent: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: appearance === 'light' ? colors.white : colors.black,
  },
  form: {
    padding: 20,
    paddingBottom: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    marginBottom: 10,
  },
  subTitle: {
    color: colors.grey400,
  },
  phoneOrEmailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeOrEmailButton: {
    marginRight: 5,
  },
  error: {
    minHeight: 15,
    marginBottom: 5,
  },
  checkLabel: {
    paddingLeft: 11,
  },
  checkboxesContainer: {
    gap: 20,
  },
  button: {
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formError: {
    paddingLeft: 10,
    marginTop: 10,
  },
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alrSignText: {
    color: colors.grey200,
  },
  linkLogin: {
    paddingLeft: 5,
  },
}));
