import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { useRouter } from '#components/NativeRouter';
import { requestUpdateContact } from '#helpers/MobileWebAPI';
import Button from '#ui/Button';
import Header from '#ui/Header';
import InputAccessoryView from '#ui/InputAccessoryView';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';

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
  const router = useRouter();
  const hasPhoneNumber = currentUser.phoneNumber != null;
  const emailFormSchema = z.object({
    email: hasPhoneNumber
      ? z.string().email().optional()
      : z.string().email().min(1),
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

  const submit = handleSubmit(async ({ email }) => {
    let storedEmail: string | null = null;
    if (isNotFalsyString(email)) {
      storedEmail = email!;
    }

    try {
      const { issuer } = await requestUpdateContact({
        locale: intl.locale,
        email: storedEmail,
      });

      toggleBottomSheet();

      router.push({
        route: 'CONFIRM_CHANGE_CONTACT',
        params: {
          issuer,
        },
      });
    } catch (e) {
      console.error(e);
      setError('root.server', {
        message: intl.formatMessage({
          defaultMessage: 'Unknown error - Please retry',
          description:
            'Account Details Screen - Error Unknown error - Please retry',
        }),
      });
    }
  });

  return (
    <InputAccessoryView visible={visible} onClose={toggleBottomSheet}>
      <Header
        leftElement={
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
        rightElement={
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
        middleElement={intl.formatMessage({
          defaultMessage: 'Edit email address',
          description: 'Edit email address modal title',
        })}
      />
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
    </InputAccessoryView>
  );
};

const styles = StyleSheet.create({
  field: { padding: 20, rowGap: 5 },
  headerButton: { paddingHorizontal: 5, minWidth: 74 },
});

export default AccountDetailsEmailForm;
