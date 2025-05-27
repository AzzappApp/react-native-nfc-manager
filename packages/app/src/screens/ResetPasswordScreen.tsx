import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet, Keyboard } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';
import * as z from 'zod';
import { REGEX_PWD } from '@azzapp/shared/stringHelpers';
import { colors } from '#theme';
import { useRouter, type NativeScreenProps } from '#components/NativeRouter';
import ToastContainer from '#components/Toast';
import { changePassword } from '#helpers/MobileWebAPI';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import Container from '#ui/Container';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import SecuredTextInput from '#ui/SecuredTextInput';
import Text from '#ui/Text';
import type { ResetPasswordRoute } from '#routes';
import type { TextInput } from 'react-native';

const ResetPasswordScreenSchema = z
  .object({
    password: z.string().regex(REGEX_PWD),
    confirmPassword: z.string(),
  })
  .refine(data => data.confirmPassword === data.password, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type ResetPasswordForm = z.infer<typeof ResetPasswordScreenSchema>;

const ResetPasswordScreen = ({
  route: { params },
}: NativeScreenProps<ResetPasswordRoute>) => {
  const {
    control,
    formState: { isSubmitting, isDirty, errors, isSubmitSuccessful },
    handleSubmit,
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(ResetPasswordScreenSchema),
    mode: 'onBlur',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const intl = useIntl();

  const confirmPasswordRef = useRef<TextInput>(null);

  const router = useRouter();

  const navigateToLogin = useCallback(() => {
    router.replace({ route: 'SIGN_IN' });
  }, [router]);

  const onSubmit = useCallback(
    () =>
      handleSubmit(async data => {
        Keyboard.dismiss();
        try {
          await changePassword({
            password: data.password,
            token: params.token,
            issuer: params.issuer,
          });
          Toast.show({
            type: 'success',
            position: 'bottom',
            text1: intl.formatMessage({
              defaultMessage: 'Password changed successfully',
              description: 'Toast success message when resetting password',
            }),
            onHide: navigateToLogin,
          });
        } catch {
          Toast.show({
            type: 'error',
            position: 'top',
            text1: intl.formatMessage({
              defaultMessage: 'Error while changing your password.',
              description: 'Toast Error message when resetting password fails',
            }),
            text2: intl.formatMessage({
              defaultMessage: 'Please retry the whole process.',
              description: 'Toast Error message when resetting password fails',
            }),
            visibilityTime: 5000,
          });
        }
      })(),
    [handleSubmit, intl, navigateToLogin, params.issuer, params.token],
  );

  const insets = useScreenInsets();

  return (
    <Container style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View style={styles.form}>
          <Icon icon="unlock_line" style={styles.logo} />
          <Text variant="xlarge">
            <FormattedMessage
              defaultMessage="Create new password"
              description="Create new password screen title"
            />
          </Text>
          <Controller
            name="password"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => {
              return (
                <SecuredTextInput
                  returnKeyType="next"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  style={styles.field}
                  onSubmitEditing={() => {
                    confirmPasswordRef.current?.focus();
                  }}
                  placeholder={intl.formatMessage({
                    defaultMessage: 'New password',
                    description: 'New password input placeholder',
                  })}
                />
              );
            }}
          />
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => {
              return (
                <SecuredTextInput
                  returnKeyType="done"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  ref={confirmPasswordRef}
                  value={value}
                  style={styles.field}
                  placeholder={intl.formatMessage({
                    defaultMessage: 'Confirm password',
                    description: 'Confirm password input placeholder',
                  })}
                />
              );
            }}
          />

          <Button
            variant="primary"
            testID="submitButton"
            label={intl.formatMessage({
              defaultMessage: 'Create new password',
              description: 'Create new password screen button label',
            })}
            accessibilityLabel={intl.formatMessage({
              defaultMessage: 'Tap to create new password',
              description:
                'Create new password Screen - AccessibilityLabel Create New Password button',
            })}
            style={styles.field}
            disabled={!isDirty || isSubmitting || isSubmitSuccessful}
            loading={isSubmitting}
            onPress={onSubmit}
          />
          <View style={{ alignItems: 'center', rowGap: 20 }}>
            {errors.password && (
              <Text variant="error" style={{ textAlign: 'center' }}>
                <FormattedMessage
                  defaultMessage="Password should contain at least 8 characters and at most 32 characters, a number, an uppercase letter and a lowercase letter"
                  description="Reset password Screen - error message when password is not compliant with our rules"
                />
              </Text>
            )}
            {errors.confirmPassword && (
              <Text variant="error" style={{ textAlign: 'center' }}>
                <FormattedMessage
                  defaultMessage="Passwords do not match"
                  description="Reset password Screen - error message when password and confirm password do not match"
                />
              </Text>
            )}
          </View>
        </View>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            paddingBottom: insets.bottom,
          }}
        >
          <PressableNative onPress={navigateToLogin}>
            <Text style={styles.back}>
              <FormattedMessage
                defaultMessage="Back to Log In"
                description="ChangePassword Screen - Back to Log In bottom screen link"
              />
            </Text>
          </PressableNative>
        </View>
      </KeyboardAvoidingView>
      <ToastContainer />
    </Container>
  );
};

const styles = StyleSheet.create({
  back: { color: colors.grey200 },
  form: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    rowGap: 20,
    paddingHorizontal: 20,
    maxWidth: 335,
    alignSelf: 'center',
    width: '100%',
  },
  logo: {
    width: 64,
    height: 64,
  },
  field: { width: '100%' },
});

export default ResetPasswordScreen;
