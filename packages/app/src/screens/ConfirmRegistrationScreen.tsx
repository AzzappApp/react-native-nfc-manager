import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Platform, View } from 'react-native';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import Toast from 'react-native-toast-message';
import { isValidEmail } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { useRouter, type NativeScreenProps } from '#components/NativeRouter';
import { logSignUp } from '#helpers/analytics';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { keyboardDismiss } from '#helpers/keyboardHelper';
import { confirmRegistration } from '#helpers/MobileWebAPI';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { ConfirmRegistrationRoute } from '#routes';

const ConfirmRegistrationScreen = ({
  route: { params },
}: NativeScreenProps<ConfirmRegistrationRoute>) => {
  const styles = useStyleSheet(styleSheet);
  const intl = useIntl();
  const insets = useScreenInsets();
  const router = useRouter();

  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const ref = useBlurOnFulfill({ value: code, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value: code,
    setValue: setCode,
  });

  const isEmail = isValidEmail(params.issuer);

  const navigateToSignup = () => {
    router.replace({ route: 'SIGN_UP' });
  };

  const onSubmit = async () => {
    try {
      setIsSubmitting(true);
      const tokens = await confirmRegistration({
        issuer: params.issuer,
        token: code,
      });
      const { profileInfos } = tokens;

      logSignUp(tokens.userId);

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
    } catch (e) {
      console.error(e);
      Toast.show({
        type: 'error',
        text1: isEmail
          ? intl.formatMessage({
              defaultMessage: 'Error while confirming your email.',
              description: 'Toast Error message when confirming email fails',
            })
          : intl.formatMessage({
              defaultMessage: 'Error while confirming your phone number.',
              description: 'Toast Error message when confirming phone number',
            }),
        text2: intl.formatMessage({
          defaultMessage: 'Please try again.',
          description:
            'Toast Error message when confirm email or phone number fails',
        }),
        visibilityTime: 5000,
      });
    }
    setIsSubmitting(false);
  };

  return (
    <Container style={styles.flex}>
      <View onTouchStart={keyboardDismiss} style={styles.container}>
        <View style={styles.inner}>
          <View style={styles.logoContainer}>
            <Icon icon={isEmail ? 'mail_line' : 'sms'} style={styles.logo} />
          </View>

          <View style={styles.viewText}>
            {isEmail ? (
              <>
                <Text style={styles.textForgot} variant="xlarge">
                  <FormattedMessage
                    defaultMessage="Check your emails!"
                    description="ConfirmRegistrationScreen - Check your emails or messages!"
                  />
                </Text>
                <Text style={styles.textForgotExplain} variant="medium">
                  <FormattedMessage
                    defaultMessage="We just sent you a link to confirm your email {email}, or you can type the code below"
                    description="ConfirmRegistrationScreen - message to inform the user an email has been sent to confirm his email address"
                    values={{
                      email: params.issuer,
                    }}
                  />
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.textForgot} variant="xlarge">
                  <FormattedMessage
                    defaultMessage="Check your messages!"
                    description="ConfirmRegistrationScreen - Check your messages!"
                  />
                </Text>
                <Text style={styles.textForgotExplain} variant="medium">
                  <FormattedMessage
                    defaultMessage="We just sent you a code in your phone {phoneNumber}, or you can type the code below"
                    description="ConfirmRegistrationScreen - message to inform the user an sms has been sent to confirm his phone number"
                    values={{
                      phoneNumber: params.issuer,
                    }}
                  />
                </Text>
              </>
            )}
          </View>
          <CodeField
            ref={ref}
            {...props}
            value={code}
            onChangeText={setCode}
            cellCount={CELL_COUNT}
            rootStyle={styles.codeFieldRoot}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete={Platform.select({
              android: 'sms-otp' as const,
              default: 'one-time-code' as const,
            })}
            caretHidden={code !== ''}
            textInputStyle={styles.textInputStyle}
            renderCell={({ index, symbol, isFocused }) => (
              <View
                key={index}
                style={[styles.cell, isFocused && styles.focusCell]}
                onLayout={getCellOnLayoutHandler(index)}
              >
                <Text variant="large">
                  {symbol || (isFocused ? <Cursor /> : null)}
                </Text>
              </View>
            )}
          />
          <Button
            label={intl.formatMessage({
              defaultMessage: 'Confirm',
              description: 'ConfirmRegistrationScreen - Confirm button',
            })}
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Tap to confirm you email or phone number',
              description:
                'ConfirmRegistrationScreen - AccessibilityLabel confirm email or phone number button',
            })}
            style={styles.button}
            onPress={onSubmit}
            disabled={!(code.length === CELL_COUNT)}
            loading={isSubmitting}
          />
        </View>
      </View>

      <View
        style={{
          bottom: insets.bottom,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <PressableNative onPress={navigateToSignup}>
          <Text style={styles.back} variant="medium">
            <FormattedMessage
              defaultMessage="Back to Sign Up"
              description="ConfirmRegistrationScreen - Back to Sign Up bottom screen link"
            />
          </Text>
        </PressableNative>
      </View>
    </Container>
  );
};
const CELL_COUNT = 6;

const styleSheet = createStyleSheet(appearance => ({
  inner: {
    height: 300,
    rowGap: 20,
  },
  textForgotExplain: {
    color: colors.grey400,
    textAlign: 'center',
  },
  textForgot: {
    color: colors.grey900,
  },
  viewText: {
    alignItems: 'center',
    paddingLeft: 38,
    paddingRight: 38,
    rowGap: 20,
  },
  flex: { flex: 1 },
  button: { marginHorizontal: 20 },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItem: 'center',
    marginBottom: 100,
    paddingHorizontal: 15,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 64, height: 64 },
  back: { color: colors.grey200 },
  codeFieldRoot: {
    paddingHorizontal: 12,
  },
  cell: {
    width: 47,
    height: 47,
    lineHeight: 38,
    fontSize: 24,
    backgroundColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    borderWidth: 1,
    borderColor: appearance === 'light' ? colors.grey50 : colors.grey1000,
    borderRadius: 12,
    color: appearance === 'light' ? colors.black : colors.grey400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusCell: {
    borderColor: appearance === 'light' ? colors.grey900 : colors.grey400,
  },
  textInputStyle: {
    marginStart: 30,
  },
}));

export default ConfirmRegistrationScreen;
