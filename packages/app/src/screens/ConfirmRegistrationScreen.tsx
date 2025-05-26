import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { Platform, StyleSheet, View } from 'react-native';

import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';
import * as z from 'zod';
import { isValidEmail } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { useRouter, type NativeScreenProps } from '#components/NativeRouter';
import { logSignUp } from '#helpers/analytics';
import { dispatchGlobalEvent } from '#helpers/globalEvents';
import { confirmRegistration } from '#helpers/MobileWebAPI';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import type { ConfirmRegistrationRoute } from '#routes';

const CELL_COUNT = 6;

const codeFieldSchema = z.object({
  code: z.string().length(CELL_COUNT),
});

const ConfirmRegistrationScreen = ({
  route: { params },
}: NativeScreenProps<ConfirmRegistrationRoute>) => {
  const intl = useIntl();
  const insets = useScreenInsets();
  const router = useRouter();

  const isEmail = isValidEmail(params.issuer);

  const navigateToSignup = useCallback(() => {
    router.replace({ route: 'SIGN_UP' });
  }, [router]);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isValid },
  } = useForm({
    defaultValues: {
      code: '',
    },
    resolver: zodResolver(codeFieldSchema),
    reValidateMode: 'onChange',
  });

  const onSubmit = handleSubmit(async ({ code }: { code: string }) => {
    try {
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
  });

  return (
    <Container style={styles.flex}>
      <KeyboardAvoidingView style={styles.container} behavior="padding">
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
          <Controller
            control={control}
            name="code"
            render={({ field: { value, onChange } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete={Platform.select({
                  android: 'sms-otp' as const,
                  default: 'one-time-code' as const,
                })}
                caretHidden={value !== ''}
                style={styles.textInputStyle}
                returnKeyType="send"
                onSubmitEditing={onSubmit}
                autoFocus
              />
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
            disabled={!isValid}
            loading={isSubmitting}
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

  textInputStyle: { marginHorizontal: 20 },
});

export default ConfirmRegistrationScreen;
