import { zodResolver } from '@hookform/resolvers/zod';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import { z } from 'zod';
import ERRORS from '@azzapp/shared/errors';
import { REGEX_PWD } from '@azzapp/shared/stringHelpers';
import useScreenInsets from '#hooks/useScreenInsets';
import useUpdateUser from '#screens/AccountDetailsScreen/useUpdateUser';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import SecuredTextInput from '#ui/SecuredTextInput';
import Text from '#ui/Text';
import type { GraphQLError } from 'graphql';
import type { TextInput } from 'react-native';

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().regex(REGEX_PWD),
});

type PasswordForm = z.infer<typeof passwordFormSchema>;

const AccountDetailsPasswordForm = ({
  visible,
  toggleBottomSheet,
}: {
  visible: boolean;
  toggleBottomSheet: () => void;
}) => {
  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
    },
  });

  const intl = useIntl();

  const insets = useScreenInsets();

  const [commitMutation] = useUpdateUser();

  const submit = handleSubmit(async ({ currentPassword, newPassword }) => {
    commitMutation({
      variables: {
        input: {
          currentPassword,
          newPassword,
        },
      },
      onCompleted: () => {
        toggleBottomSheet();
      },
      onError: error => {
        const response = ('response' in error ? error.response : undefined) as
          | { errors: GraphQLError[] }
          | undefined;
        if (
          response?.errors.some(r => r.message === ERRORS.INVALID_CREDENTIALS)
        ) {
          setError('root.server', {
            message: intl.formatMessage({
              defaultMessage: 'Your current password is incorrect',
              description:
                'Account Details Screen -  Error Your current password is incorrect',
            }),
          });
        } else {
          setError('root.server', {
            message: intl.formatMessage({
              defaultMessage: 'Unknown error - Please retry',
              description:
                'Account Details Screen - Error Unknown error - Please retry',
            }),
          });
        }
      },
    });
  });

  const newPasswordRef = useRef<TextInput>(null);

  return (
    <BottomSheetModal
      visible={visible}
      height={insets.bottom + 280}
      onRequestClose={toggleBottomSheet}
      headerTitle={intl.formatMessage({
        defaultMessage: 'Edit password',
        description: 'Edit password modal title',
      })}
      showGestureIndicator={false}
      headerLeftButton={
        <Button
          label={intl.formatMessage({
            defaultMessage: 'Cancel',
            description: 'Edit password modal cancel button label',
          })}
          onPress={toggleBottomSheet}
          variant="secondary"
          style={styles.headerButton}
        />
      }
      headerRightButton={
        <Button
          disabled={isSubmitting}
          loading={isSubmitting}
          label={intl.formatMessage({
            defaultMessage: 'Save',
            description: 'Edit password modal save button label',
          })}
          onPress={submit}
          variant="primary"
          style={styles.headerButton}
        />
      }
    >
      <View style={styles.container}>
        <Controller
          control={control}
          name="currentPassword"
          render={({
            field: { onChange, onBlur, value },
            formState: { errors },
          }) => (
            <View style={styles.field}>
              <View style={styles.input}>
                <Text variant="medium">
                  <FormattedMessage
                    defaultMessage="Current password"
                    description="Account Details - Change password form - current password label"
                  />
                </Text>
                <SecuredTextInput
                  value={value}
                  onChangeText={onChange}
                  testID="currentPasswordInput"
                  onBlur={onBlur}
                  isErrored={errors.currentPassword != null}
                  onSubmitEditing={() => newPasswordRef.current?.focus()}
                  returnKeyType="next"
                  autoFocus
                />
              </View>
              {errors.currentPassword ? (
                <Text variant="error">
                  <FormattedMessage
                    defaultMessage="Please enter your current password"
                    description="Error message when no current password is provided"
                  />
                </Text>
              ) : null}
            </View>
          )}
        />
        <Controller
          control={control}
          name="newPassword"
          render={({
            field: { onChange, onBlur, value },
            formState: { errors },
          }) => (
            <View style={styles.field}>
              <View style={styles.input}>
                <Text variant="medium">
                  <FormattedMessage
                    defaultMessage="New password"
                    description="Account Details - Change password form - new password label"
                  />
                </Text>
                <SecuredTextInput
                  ref={newPasswordRef}
                  testID="newPasswordInput"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  isErrored={errors.newPassword != null}
                  onSubmitEditing={submit}
                  returnKeyType="done"
                />
              </View>
              {errors.newPassword ? (
                <Text variant="error">
                  <FormattedMessage
                    defaultMessage="Password should contain at least 8 characters, a number, an uppercase letter and a lowercase letter"
                    description="Account details - error message when password is not compliant with our rules"
                  />
                </Text>
              ) : null}
            </View>
          )}
        />
        {errors.root?.server ? (
          <Text variant="error">{errors.root.server.message}</Text>
        ) : null}
      </View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  headerButton: { paddingHorizontal: 5, minWidth: 74 },
  container: { rowGap: 20 },
  field: { paddingTop: 10, rowGap: 5 },
  input: { rowGap: 10 },
});

export default AccountDetailsPasswordForm;
