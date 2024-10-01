import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Platform, View } from 'react-native';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import { isValidEmail } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { keyboardDismiss } from '#helpers/keyboardHelper';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { NativeScreenProps } from '#components/NativeRouter';
import type { ForgotPasswordConfirmationRoute } from '#routes';

const CELL_COUNT = 6;

const ForgotPasswordConfirmationScreen = ({
  route: { params },
}: NativeScreenProps<ForgotPasswordConfirmationRoute>) => {
  const router = useRouter();
  const intl = useIntl();

  const insets = useScreenInsets();

  const [code, setCode] = useState('');
  const ref = useBlurOnFulfill({ value: code, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value: code,
    setValue: setCode,
  });

  const navigateToLogin = () => {
    router.replace({ route: 'SIGN_IN' });
  };

  const styles = useStyleSheet(styleSheet);

  const onSubmit = () => {
    router.replace({
      route: 'RESET_PASSWORD',
      params: {
        issuer: params.issuer,
        token: code,
      },
    });
  };

  const isEmail = isValidEmail(params.issuer);
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
                    description="ForgotPasswordScreen - Check your emails or messages!"
                  />
                </Text>
                <Text style={styles.textForgotExplain} variant="medium">
                  <FormattedMessage
                    defaultMessage="We've sent a validation code to {email}. Please enter the code below to reset your password."
                    description="ForgotPasswordScreen - message to inform the user an email has been sent to reset the password"
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
                    description="ForgotPasswordScreen - Check your messages!"
                  />
                </Text>
                <Text style={styles.textForgotExplain} variant="medium">
                  <FormattedMessage
                    defaultMessage="We've sent a validation code to {phoneNumber}. Please enter the code below to reset your password."
                    description="ForgotPasswordScreen - message to inform the user an sms has been sent to reset the password"
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
              defaultMessage: 'Reset password',
              description: 'ForgotpasswordScreen - Reset password',
            })}
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Tap to reset your passward',
              description:
                'ForgotPassword Screen - AccessibilityLabel Reset password button',
            })}
            style={styles.button}
            onPress={onSubmit}
            disabled={!(code.length === CELL_COUNT)}
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
        <PressableNative onPress={navigateToLogin}>
          <Text style={styles.back} variant="medium">
            <FormattedMessage
              defaultMessage="Back to Log In"
              description="ForgotPasswordScreen - Back to Log In bottom screen link"
            />
          </Text>
        </PressableNative>
      </View>
    </Container>
  );
};

export default ForgotPasswordConfirmationScreen;

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
