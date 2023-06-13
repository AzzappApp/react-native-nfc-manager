import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import ERRORS from '@azzapp/shared/errors';
import useUpdateUser from '#screens/AccountDetailsScreen/useUpdateUser';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import type { GraphQLError } from 'graphql';

const emailFormSchema = z.object({
  email: z.string().email().min(1),
});

type EmailForm = z.infer<typeof emailFormSchema>;

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

  const insets = useSafeAreaInsets();

  const [commitMutation] = useUpdateUser();

  const submit = handleSubmit(async ({ email }) => {
    commitMutation({
      variables: {
        input: {
          email,
        },
      },
      optimisticResponse: {
        updateUser: {
          user: {
            ...currentUser,
            email,
          },
        },
      },
      updater: store => {
        store
          .getRoot()
          .getLinkedRecord('currentUser')
          ?.setValue(email, 'email');
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
          variant="cancel"
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
