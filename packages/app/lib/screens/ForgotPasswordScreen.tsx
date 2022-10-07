import { isValidEmail } from '@azzapp/shared/lib/stringHelpers';
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
import { colors, fontFamilies } from '../../theme';

import useViewportSize, {
  insetBottom,
  insetTop,
  VW100,
} from '../hooks/useViewportSize';
import { useRouter } from '../PlatformEnvironment';
import Button from '../ui/Button';
import FloatingIconButton from '../ui/FloatingIconButton';
import Form, { Submit } from '../ui/Form/Form';
import PressableNative from '../ui/PressableNative';
import TextInput from '../ui/TextInput';
import ViewTransition from '../ui/ViewTransition';
import type { ForgotPasswordParams } from '@azzapp/shared/lib/WebAPI';

type ForgotPasswordScreenProps = {
  forgotPassword: (params: ForgotPasswordParams) => Promise<void>;
};

const ForgotPasswordScreen = ({
  forgotPassword,
}: ForgotPasswordScreenProps) => {
  const vp = useViewportSize();
  const router = useRouter();
  const intl = useIntl();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const onSubmit = async () => {
    if (!isValidEmail(email)) {
      setEmailError(
        intl.formatMessage({
          defaultMessage: 'Please enter a valid email',
          description:
            'ForgotpasswordScreen - error message when input doest not validate as an email',
        }),
      );
      return;
    }
    await forgotPassword({ email });
    setIsSubmitted(true);
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
        <View onTouchStart={Keyboard.dismiss} style={[styles.container]}>
          <Form style={styles.inner} onSubmit={onSubmit}>
            <ViewTransition
              testID="azzapp__ForgotPasswordScreen__ViewTransition-confirm"
              style={[
                styles.viewtransition,
                { width: vp`${VW100}`, opacity: isSubmitted ? 1 : 0 },
              ]}
              transitionDuration={300}
              transitions={['opacity']}
              pointerEvents="none"
            >
              <View style={styles.logoContainer}>
                <Image
                  source={require('../assets/mail/mail.png')}
                  resizeMode="contain"
                  style={styles.logo}
                />
              </View>
              <View style={styles.viewText}>
                <Text style={styles.textForgot}>
                  <FormattedMessage
                    defaultMessage="Check your emails !"
                    description="ForgotPasswordScreen - Check your emails !"
                  />
                </Text>
                <Text style={styles.textForgotExplain}>
                  <FormattedMessage
                    defaultMessage="We just send you a link to create a new password"
                    description="ForgotPasswordScreen - email send indication"
                  />
                </Text>
              </View>
            </ViewTransition>
            <ViewTransition
              testID="azzapp__ForgotPasswordScreen__ViewTransition-email"
              style={[
                styles.viewtransition,
                { width: vp`${VW100}`, opacity: isSubmitted ? 0 : 1 },
              ]}
              transitionDuration={300}
              transitions={['opacity']}
            >
              <View style={styles.logoContainer}>
                <Image
                  source={require('../assets/lock/lock.png')}
                  resizeMode="contain"
                  style={styles.logo}
                />
              </View>
              <View style={styles.viewText}>
                <Text style={styles.textForgot}>
                  <FormattedMessage
                    defaultMessage="Forgot your password ?"
                    description="ForgotPasswordScreen - Forgot your password  title"
                  />
                </Text>
                <Text style={styles.textForgotExplain}>
                  <FormattedMessage
                    defaultMessage="Enter your email address and we'll send you a link to create a new password"
                    description="ForgotPasswordScreen - Forgot your password description"
                  />
                </Text>
              </View>
              <TextInput
                placeholder={intl.formatMessage({
                  defaultMessage: 'Email Address',
                  description: 'ForgotpasswordScreen - Email Address',
                })}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                autoCorrect={false}
                errorLabel={emailError}
              />
              <Submit>
                <Button
                  label={intl.formatMessage({
                    defaultMessage: 'Reset password',
                    description: 'ForgotpasswordScreen - Reset password',
                  })}
                  style={styles.button}
                  onPress={onSubmit}
                />
              </Submit>
            </ViewTransition>
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
        <PressableNative onPress={onBack}>
          <Text style={styles.back}>
            <FormattedMessage
              defaultMessage="Back to Log In"
              description="ForgotPasswordScreen - Back to Log In bottom screen link"
            />
          </Text>
        </PressableNative>
      </View>
    </View>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  inner: {
    height: 300,
  },
  viewtransition: {
    position: 'absolute',
    top: 0,
    alignContent: 'center',
    justifyContent: 'center',
    height: 300,
    paddingLeft: 15,
    paddingRight: 15,
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
    paddingLeft: 38,
    paddingRight: 38,
  },
  flex: { flex: 1 },
  button: { marginLeft: 10, marginRight: 10, marginTop: 20 },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItem: 'center',
    marginBottom: 100,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  logo: { width: 38, height: 54 },
  back: { color: colors.grey200 },
  closeButton: {
    position: 'absolute',
    start: 15,
    zIndex: 1,
  },
});
