import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import { graphql, useMutation } from 'react-relay';
import { useDebounce } from 'use-debounce';
import { z } from 'zod';
import Button from '#ui/Button';
import Header from '#ui/Header';
import InputAccessoryView from '#ui/InputAccessoryView';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';

const firstNameFormSchema = z.object({
  firstName: z.string(),
});

type FirstNameForm = z.infer<typeof firstNameFormSchema>;

type WebcardParametersFirstNameFormProps = {
  visible: boolean;
  toggleBottomSheet: () => void;
  webCard: {
    id: string;
    firstName: string | null;
  };
};
const WebcardParametersFirstNameForm = ({
  webCard,
  visible,
  toggleBottomSheet,
}: WebcardParametersFirstNameFormProps) => {
  const {
    control,
    handleSubmit,
    setError,
    watch,
    trigger,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<FirstNameForm>({
    defaultValues: {
      firstName: webCard.firstName ?? '',
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (visible) {
      reset();
    }
  }, [reset, visible]);

  const intl = useIntl();

  const [commitMutation] = useMutation(graphql`
    mutation WebCardParametersFirstNameFormMutation(
      $webCardId: ID!
      $input: UpdateWebCardInput!
    ) {
      updateWebCard(webCardId: $webCardId, input: $input) {
        webCard {
          id
          firstName
        }
      }
    }
  `);

  const onSubmit = handleSubmit(async ({ firstName }) => {
    commitMutation({
      variables: {
        webCardId: webCard.id,
        input: {
          firstName,
        },
      },
      onCompleted: () => {
        toggleBottomSheet();
      },
      onError: () => {
        setError('root.server', {
          message: intl.formatMessage({
            defaultMessage: 'Unknown error - Please retry',
            description:
              'WebcardParameters Name form - Error Unknown error - Please retry',
          }),
        });
      },
    });
  });

  const firstName = watch('firstName');
  const [debouncedFirstName] = useDebounce(firstName, 200);

  const firstNameError = webCard.firstName !== firstName && errors.firstName;

  useEffect(() => {
    if (debouncedFirstName) {
      void trigger('firstName');
    }
  }, [debouncedFirstName, trigger]);

  return (
    <InputAccessoryView visible={visible} onClose={toggleBottomSheet}>
      <Header
        middleElement={intl.formatMessage({
          defaultMessage: 'Edit your firstname',
          description: 'Edit Webcard FirstName modal title',
        })}
        leftElement={
          <Button
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'Edit Webcard FirstName modal cancel button label',
            })}
            onPress={toggleBottomSheet}
            variant="secondary"
            style={styles.headerButton}
          />
        }
        rightElement={
          <Button
            loading={isSubmitting}
            disabled={isSubmitting || webCard.firstName === firstName}
            label={intl.formatMessage({
              defaultMessage: 'Save',
              description: 'Edit Webcard Name modal save button label',
            })}
            onPress={onSubmit}
            variant="primary"
            style={styles.headerButton}
          />
        }
      />

      <View style={styles.controllerContainer}>
        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                nativeID="firstName"
                accessibilityLabelledBy="firstNameLabel"
                placeholder={intl.formatMessage({
                  defaultMessage: 'Select a WebCard name',
                  description: 'ProfileForm firstname textinput placeholder',
                })}
                isErrored={!!firstNameError}
                value={value}
                onChangeText={text => onChange(text)}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={onSubmit}
                autoFocus
              />
            </View>
          )}
        />
      </View>
      {firstNameError ? (
        <Text variant="error">{firstNameError.message}</Text>
      ) : null}
      {errors.root?.server ? (
        <Text variant="error">{errors.root.server.message}</Text>
      ) : null}
    </InputAccessoryView>
  );
};

const styles = StyleSheet.create({
  headerButton: { paddingHorizontal: 5, minWidth: 74 },
  inputContainer: { flex: 1, height: 50, paddingHorizontal: 10 },
  controllerContainer: {
    paddingVertical: 10,
    gap: 5,
    flexDirection: 'row',
    width: '100%',
  },
});

export default WebcardParametersFirstNameForm;
