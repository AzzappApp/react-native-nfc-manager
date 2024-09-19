import { zodResolver } from '@hookform/resolvers/zod';
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

const lastNameFormSchema = z.object({
  lastName: z.string(),
});

type LastNameForm = z.infer<typeof lastNameFormSchema>;

type WebcardParametersLastNameFormProps = {
  visible: boolean;
  toggleBottomSheet: () => void;
  webCard: {
    id: string;
    lastName: string | null;
  };
};
const WebcardParametersLastNameForm = ({
  webCard,
  visible,
  toggleBottomSheet,
}: WebcardParametersLastNameFormProps) => {
  const {
    control,
    handleSubmit,
    setError,
    watch,
    trigger,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<LastNameForm>({
    defaultValues: {
      lastName: webCard.lastName ?? '',
    },
    mode: 'onSubmit',
    resolver: zodResolver(lastNameFormSchema),
  });

  useEffect(() => {
    if (visible) {
      reset();
    }
  }, [reset, visible]);

  const intl = useIntl();

  const [commitMutation] = useMutation(graphql`
    mutation WebCardParametersLastNameFormMutation(
      $webCardId: ID!
      $input: UpdateWebCardInput!
    ) {
      updateWebCard(webCardId: $webCardId, input: $input) {
        webCard {
          id
          lastName
        }
      }
    }
  `);

  const onSubmit = handleSubmit(async ({ lastName }) => {
    commitMutation({
      variables: {
        webCardId: webCard.id,
        input: {
          lastName,
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

  const lastName = watch('lastName');
  const [debouncedLastName] = useDebounce(lastName, 200);

  const lastNameError = webCard.lastName !== lastName && errors.lastName;

  useEffect(() => {
    if (debouncedLastName) {
      void trigger('lastName');
    }
  }, [debouncedLastName, trigger]);

  return (
    <InputAccessoryView visible={visible} onClose={toggleBottomSheet}>
      <Header
        middleElement={intl.formatMessage({
          defaultMessage: 'Edit your lastname',
          description: 'Edit Webcard LastName modal title',
        })}
        leftElement={
          <Button
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'Edit Webcard LastName modal cancel button label',
            })}
            onPress={toggleBottomSheet}
            variant="secondary"
            style={styles.headerButton}
          />
        }
        rightElement={
          <Button
            loading={isSubmitting}
            disabled={isSubmitting || webCard.lastName === lastName}
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
          name="lastName"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                nativeID="lastName"
                accessibilityLabelledBy="lastNameLabel"
                placeholder={intl.formatMessage({
                  defaultMessage: 'Select a WebCard name',
                  description: 'ProfileForm lastname textinput placeholder',
                })}
                isErrored={!!lastNameError}
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
      {lastNameError ? (
        <Text variant="error">{lastNameError.message}</Text>
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

export default WebcardParametersLastNameForm;
