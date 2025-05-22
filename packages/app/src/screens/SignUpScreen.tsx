import { parsePhoneNumberWithError } from 'libphonenumber-js';
import LottieView from 'lottie-react-native';
import { useCallback, useState, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, Image, Keyboard, Platform, StyleSheet } from 'react-native';
import { setSharedWebCredentials } from 'react-native-keychain';
import { getLocales } from 'react-native-localize';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { waitTime } from '@azzapp/shared/asyncHelpers';
import ERRORS from '@azzapp/shared/errors';
import {
  isPhoneNumber,
  isValidEmail,
  isValidPassword,
} from '@azzapp/shared/stringHelpers';
import env from '#env';
import { colors } from '#theme';
import EmailOrPhoneInput from '#components/EmailOrPhoneInput';
import { useNativeNavigationEvent, useRouter } from '#components/NativeRouter';
import OauthButtonsBar from '#components/OauthButtonsBar';
import TermsCheckBoxes from '#components/TermsCheckBoxes';
import { logEvent } from '#helpers/analytics';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { signup } from '#helpers/MobileWebAPI';
import useBoolean from '#hooks/useBoolean';
import useKeyboardHeight from '#hooks/useKeyboardHeight';
import useScreenDimensions from '#hooks/useScreenDimensions';
import useScreenInsets from '#hooks/useScreenInsets';
import AzzappLogoLoader from '#ui/AzzappLogoLoader';
import Button from '#ui/Button';
import PressableOpacity from '#ui/PressableOpacity';
import SecuredTextInput from '#ui/SecuredTextInput';
import Text from '#ui/Text';
import type { EmailPhoneInput } from '#components/EmailOrPhoneInput';
import type { CheckboxStatus } from '#ui/CheckBox';
import type {
  LayoutChangeEvent,
  TextInput as NativeTextInput,
} from 'react-native';

const SignUpScreen = () => {
  const router = useRouter();
  const [contact, setContact] = useState<EmailPhoneInput>({
    countryCodeOrEmail: 'email',
    value: '',
  });

  const [phoneOrEmailError, setPhoneOrEmailError] = useState('');

  const [password, setPassword] = useState('');
  const [showPasswordError, setShowPasswordError] = useState(false);

  const [communicationChecked, setCommunicationChecked] =
    useState<CheckboxStatus>('checked');
  const [termsOfUseChecked, setTermsOfUseChecked] =
    useState<CheckboxStatus>('none');
  const [showTOSError, setShowTOSError] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clearPassword, setClearPassword] = useState(false);

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

    const toUValid = termsOfUseChecked === 'checked';
    setShowTOSError(!toUValid);
    canSignup &&= toUValid;

    if (canSignup) {
      let tokens: Awaited<ReturnType<typeof signup>>;
      let username: string;

      try {
        setIsSubmitting(true);
        const locale = getLocales()[0];
        if (contact.countryCodeOrEmail === 'email') {
          username = contact.value;
          tokens = await signup({
            email: username,
            password,
            locale: locale.languageTag,
            hasAcceptedCommunications: communicationChecked === 'checked',
          });
        } else {
          username = parsePhoneNumberWithError(
            contact.value,
            contact.countryCodeOrEmail,
          ).formatInternational();
          tokens = await signup({
            phoneNumber: username,
            locale: locale.languageTag,
            password,
            hasAcceptedCommunications: communicationChecked === 'checked',
          });
        }
        await setSharedWebCredentials(
          env.APP_WEBSHARED_CREDENTIALS,
          username,
          password,
        ).catch(() => {});
        setClearPassword(true);
        if ('issuer' in tokens) {
          const { issuer } = tokens;

          logEvent('sign_up_attempt', { issuer });

          router.push({
            route: 'CONFIRM_REGISTRATION',
            params: {
              issuer: issuer!,
            },
          });
        } else {
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
        }
        setIsSubmitting(false);
      } catch (error) {
        if (error && typeof error == 'object' && 'message' in error) {
          switch (error.message) {
            case ERRORS.EMAIL_NOT_VALID:
              setPhoneOrEmailError(
                intl.formatMessage({
                  defaultMessage: 'Please enter a valid email address',
                  description:
                    'Signup Screen - Error message for invalid email address',
                }),
              );
              break;
            case ERRORS.PHONENUMBER_NOT_VALID:
              setPhoneOrEmailError(
                intl.formatMessage({
                  defaultMessage: 'Please enter a valid phone number',
                  description:
                    'Signup Screen - Error message for invalid phone number',
                }),
              );
              break;
            case ERRORS.FORBIDDEN:
              setPhoneOrEmailError(
                intl.formatMessage({
                  defaultMessage:
                    'Your account has been disabled. Please contact support.',
                  description:
                    'Signup Screen - Error message when the account has been disabled',
                }),
              );
              break;

            default:
              setPhoneOrEmailError(
                intl.formatMessage({
                  defaultMessage: 'Unknown error - Please retry',
                  description: 'Signup Screen - Error unknown',
                }),
              );
          }
        } else {
          setPhoneOrEmailError(
            intl.formatMessage({
              defaultMessage: 'Unknown error - Please retry',
              description: 'Signup Screen - Error unknown',
            }),
          );
        }

        setIsSubmitting(false);
      }
    }
  }, [
    communicationChecked,
    termsOfUseChecked,
    contact.countryCodeOrEmail,
    contact.value,
    intl,
    password,
    router,
  ]);

  const passwordRef = useRef<NativeTextInput>(null);

  const styles = useStyleSheet(styleSheet);

  // #endregion

  const navigateTo = useCallback(async () => {
    if (Platform.OS === 'ios') {
      setClearPassword(true);
      await waitTime(100);
    }
    router.push({ route: 'SIGN_IN' });
  }, [router]);

  useNativeNavigationEvent('appear', () => {
    setClearPassword(false);
  });

  const [oauthLoading, setOauthIsLoading, setOauthIsNotLoading] =
    useBoolean(false);

  const { height } = useScreenDimensions();
  const [panelHeight, setPanelHeight] = useState(height - 353);
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setPanelHeight(height - event.nativeEvent.layout.height + 20); //20 for the radius
    },
    [height],
  );

  const insets = useScreenInsets();
  const keyboardHeight = useKeyboardHeight();
  const keyboardAvoidAnimatedStyle = useAnimatedStyle(() => {
    return {
      paddingBottom:
        keyboardHeight.value -
        insets.bottom +
        (keyboardHeight.value && Platform.OS === 'ios' ? 80 : 16),
    };
  });

  return (
    <View style={styles.flex}>
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
      <Animated.View style={[styles.body, keyboardAvoidAnimatedStyle]}>
        <View
          style={[styles.form, { marginBottom: insets.bottom }]}
          onLayout={onLayout}
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

          <OauthButtonsBar
            onLoadingStart={setOauthIsLoading}
            onLoadingEnd={setOauthIsNotLoading}
          />

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
            value={clearPassword ? '' : password}
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
          <TermsCheckBoxes
            communicationChecked={communicationChecked}
            onCommunicationCheckChange={setCommunicationChecked}
            termsOfUseChecked={termsOfUseChecked}
            onTermsOfUseCheckChange={setTermsOfUseChecked}
            showError={showTOSError}
          />

          <Button
            variant="primary"
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
            onPress={onSubmit}
          />
          <View style={styles.footer}>
            <Text style={styles.alrSignText} variant="medium">
              <FormattedMessage
                defaultMessage="Already have an account?"
                description="Signup Screen - Already have an account?"
              />
            </Text>
            <PressableOpacity onPress={navigateTo}>
              <Text style={styles.linkLogin} variant="medium">
                <FormattedMessage
                  defaultMessage="Log In"
                  description="Signup Screen - Login link bottom screen"
                />
              </Text>
            </PressableOpacity>
          </View>
        </View>
        {oauthLoading && (
          <AzzappLogoLoader
            backgroundOpacity={0.5}
            style={StyleSheet.absoluteFill}
          />
        )}
      </Animated.View>
    </View>
  );
};

export default SignUpScreen;

SignUpScreen.options = {
  replaceAnimation: 'push',
  stackAnimation: 'fade',
};

const styleSheet = createStyleSheet(appearance => ({
  flex: { flex: 1 },
  background: [StyleSheet.absoluteFill, { backgroundColor: 'black' }],
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
    paddingHorizontal: 11,
  },
  checkboxesContainer: {
    gap: 20,
  },
  button: {
    marginTop: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
