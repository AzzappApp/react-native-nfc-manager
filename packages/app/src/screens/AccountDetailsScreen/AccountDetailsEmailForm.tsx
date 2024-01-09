import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';
import ERRORS from '@azzapp/shared/errors';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import useScreenInsets from '#hooks/useScreenInsets';
import useUpdateUser from '#screens/AccountDetailsScreen/useUpdateUser';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import type { GraphQLError } from '#helpers/relayEnvironment';

const AccountDetailsEmailForm = ({
  currentUser,
  visible,
  toggleBottomSheet,
}: {
  visible: boolean;
  toggleBottomSheet: () => void;
  currentUser: {
    email: string | null;
    phoneNumber: string | null;
  };
}) => {
  const hasPhoneNumber = currentUser.phoneNumber != null;
  const emailFormSchema = z.object({
    email: hasPhoneNumber ? z.string().optional() : z.string().min(1),
  });

  type EmailForm = z.infer<typeof emailFormSchema>;
  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<EmailForm>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: currentUser.email ?? '',
    },
  });

  const intl = useIntl();

  const insets = useScreenInsets();

  const [commitMutation] = useUpdateUser();

  const submit = handleSubmit(async ({ email }) => {
    let storedEmail: string | null = null;
    if (isNotFalsyString(email)) {
      storedEmail = email!;
    }

    commitMutation({
      variables: {
        input: {
          email: storedEmail,
        },
      },
      optimisticResponse: {
        updateUser: {
          user: {
            ...currentUser,
            email: storedEmail,
          },
        },
      },
      updater: store => {
        store
          .getRoot()
          .getLinkedRecord('currentUser')
          ?.setValue(storedEmail, 'email');
      },
      onCompleted: () => {
        toggleBottomSheet();
      },
      onError: error => {
        const response = ('response' in error ? error.response : undefined) as
          | { errors: GraphQLError[] }
          | undefined;
        if (
          response?.errors.some(r => r.message === ERRORS.EMAIL_ALREADY_EXISTS)
        ) {
          setError('root.server', {
            message: intl.formatMessage({
              defaultMessage: 'This email address is already registered',
              description:
                'Account Details Screen - Error This email address is already registered ',
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

  return (
    <BottomSheetModal
      visible={visible}
      height={insets.bottom + 160}
      onRequestClose={toggleBottomSheet}
      headerTitle={intl.formatMessage({
        defaultMessage: 'Edit email address',
        description: 'Edit email address modal title',
      })}
      showGestureIndicator={false}
      headerLeftButton={
        <Button
          label={intl.formatMessage({
            defaultMessage: 'Cancel',
            description: 'Edit email address modal cancel button label',
          })}
          onPress={toggleBottomSheet}
          variant="secondary"
          style={styles.headerButton}
        />
      }
      headerRightButton={
        <Button
          loading={isSubmitting}
          disabled={isSubmitting}
          label={intl.formatMessage({
            defaultMessage: 'Save',
            description: 'Edit email address modal save button label',
          })}
          onPress={submit}
          variant="primary"
          style={styles.headerButton}
        />
      }
    >
      <Controller
        control={control}
        name="email"
        render={({
          field: { onChange, onBlur, value },
          formState: { errors },
        }) => (
          <View style={styles.field}>
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              autoCorrect={false}
              isErrored={errors.email != null}
              onSubmitEditing={submit}
              returnKeyType="done"
              autoFocus
            />
            {errors.email ? (
              <Text variant="error">
                <FormattedMessage
                  defaultMessage="Please enter a valid email address"
                  description="Error message when the user enters an invalid email address"
                />
              </Text>
            ) : null}
          </View>
        )}
      />
      {errors.root?.server ? (
        <Text variant="error">{errors.root.server.message}</Text>
      ) : null}
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  field: { paddingTop: 10, rowGap: 5 },
  headerButton: { paddingHorizontal: 5, minWidth: 74 },
});

export default AccountDetailsEmailForm;
