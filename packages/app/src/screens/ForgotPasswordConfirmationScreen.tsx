import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Platform, View, StyleSheet } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { isValidEmail } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { useRouter } from '#components/NativeRouter';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
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

  const navigateToLogin = () => {
    router.replace({ route: 'SIGN_IN' });
  };

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
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
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

          <TextInput
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete={Platform.select({
              android: 'sms-otp' as const,
              default: 'one-time-code' as const,
            })}
            style={styles.textInputStyle}
            onSubmitEditing={onSubmit}
            returnKeyType="send"
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
      </KeyboardAvoidingView>
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

const styles = StyleSheet.create({
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
    alignItems: 'center',
    marginBottom: 100,
    paddingHorizontal: 15,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 64, height: 64 },
  back: { color: colors.grey200 },
  textInputStyle: {
    marginHorizontal: 20,
  },
});
