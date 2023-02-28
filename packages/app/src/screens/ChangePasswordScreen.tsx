import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  isNotFalsyString,
  isValidPassword,
} from '@azzapp/shared/stringHelpers';

import { useRouter } from '#PlatformEnvironment';
import { colors, fontFamilies, textStyles } from '#theme';
import useViewportSize, { insetBottom } from '#hooks/useViewportSize';
import Button from '#ui/Button';
import Form, { Submit } from '#ui/Form/Form';
import PressableNative from '#ui/PressableNative';
import SecuredTextInput from '#ui/SecuredTextInput';
import TextInput from '#ui/TextInput';

type ChangePasswordScreenProps = {
  changePassword: (token: string, password: string) => Promise<void>;
};

const ChangePasswordScreen = ({
  changePassword,
}: ChangePasswordScreenProps) => {
  const vp = useViewportSize();
  const router = useRouter();
  const intl = useIntl();

  const [password, setPassword] = useState('');
  const [checkPassword, setCheckPassword] = useState('');

  const [passwordError, setPasswordError] = useState(false);
  const [confirmError, setConfirmError] = useState(false);

  const onSubmit = async () => {
    let canCallApi = true;
    if (!isValidPassword(password)) {
      setPasswordError(true);

      canCallApi = false;
    } else {
      setPasswordError(false);
    }
    if (password !== checkPassword) {
      setConfirmError(true);
      canCallApi = false;
    } else {
      setConfirmError(false);
    }
    if (canCallApi) {
      await changePassword('token', password);
      router.replace({ route: 'SIGN_IN' });
    }
  };

  const navigateToLogin = () => {
    router.replace({ route: 'SIGN_IN' });
  };

  return (
    <View style={styles.mainContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={-VERTICAL_OFFSET}
        style={{ flex: 1 }}
      >
        <View onTouchStart={Keyboard.dismiss} style={[styles.container]}>
          <Form style={styles.inner} onSubmit={onSubmit}>
            <View style={styles.logoContainer}>
              <Image
                source={require('#assets/lock/lock.png')}
                resizeMode="contain"
                style={styles.logo}
              />
            </View>
            <View style={styles.viewText}>
              <Text style={styles.textForgot}>
                <FormattedMessage
                  defaultMessage="Create a new password"
                  description="ChangePasswordScreen - create a new password  title"
                />
              </Text>
            </View>
            <TextInput
              placeholder={intl.formatMessage({
                defaultMessage: 'New password',
                description: 'ChangePassword Screen - New password',
              })}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCorrect={false}
              containerStyle={styles.textinputContainer}
            />
            <SecuredTextInput
              placeholder={intl.formatMessage({
                defaultMessage: 'Confirm password',
                description: 'ChangePassword Screen - Confirm password',
              })}
              value={checkPassword}
              onChangeText={setCheckPassword}
              autoCapitalize="none"
              containerStyle={styles.textinputContainer}
            />
            <Submit>
              <Button
                label={intl.formatMessage({
                  defaultMessage: 'Create new password',
                  description: 'ChangePasswordScreen - Create new password',
                })}
                accessibilityLabel={intl.formatMessage({
                  defaultMessage: 'Tap to reset your passward',
                  description:
                    'ChangePassword Screen - AccessibilityLabel Reset password button',
                })}
                style={styles.button}
                onPress={onSubmit}
                disabled={
                  !isNotFalsyString(password) ||
                  !isNotFalsyString(checkPassword)
                }
              />
            </Submit>
            {passwordError && (
              <Text
                style={{
                  ...textStyles.error,
                  paddingLeft: 10,
                  marginTop: 10,
                }}
              >
                <FormattedMessage
                  defaultMessage="Password should contain at least 8 characters with at least 1 number, 1 uppercase letter and 1 lowercase letter"
                  description="ChangePasswordS Screen - Accessibility error message password rules"
                />
              </Text>
            )}
            {confirmError && (
              <Text
                style={{
                  ...textStyles.error,
                  paddingLeft: 10,
                  marginTop: 10,
                }}
              >
                <FormattedMessage
                  defaultMessage="Password doesn't match"
                  description="ChangePasswordScreen Screen - error passwords doesn't match"
                />
              </Text>
            )}
          </Form>
        </View>
      </KeyboardAvoidingView>
      <View
        style={{
          marginBottom: vp`${insetBottom}` + 30,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <PressableNative onPress={navigateToLogin}>
          <Text style={styles.back}>
            <FormattedMessage
              defaultMessage="Log In"
              description="ChangePassword Screen - Back to Log In bottom screen link"
            />
          </Text>
        </PressableNative>
      </View>
    </View>
  );
};

export default ChangePasswordScreen;
const VERTICAL_OFFSET = 100;
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  inner: {
    padding: 20,
  },
  textinputContainer: {
    padding: 0,
    margin: 0,
    marginBottom: 5,
  },
  button: {
    marginTop: 5,
    height: 45,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  textForgotExplain: {
    ...fontFamilies.fontMedium,
    color: colors.grey400,
    textAlign: 'center',
    marginTop: 20,
  },
  textForgot: {
    ...fontFamilies.fontMedium,
    color: colors.grey900,
    fontSize: 20,
  },
  viewText: {
    alignItems: 'center',
    marginBottom: 20,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItem: 'center',
    marginBottom: VERTICAL_OFFSET,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  logo: { width: 38, height: 54 },
  back: { color: colors.grey200 },
});
