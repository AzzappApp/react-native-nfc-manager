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

const companyNameFormSchema = z.object({
  companyName: z.string(),
});

type CompanyNameForm = z.infer<typeof companyNameFormSchema>;

type WebcardParametersCompanyNameFormProps = {
  visible: boolean;
  toggleBottomSheet: () => void;
  webCard: {
    id: string;
    companyName: string | null;
  };
};
const WebcardParametersCompanyNameForm = ({
  webCard,
  visible,
  toggleBottomSheet,
}: WebcardParametersCompanyNameFormProps) => {
  const {
    control,
    handleSubmit,
    setError,
    watch,
    trigger,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<CompanyNameForm>({
    defaultValues: {
      companyName: webCard.companyName ?? '',
    },
    resetOptions: {
      keepDefaultValues: false,
      keepDirtyValues: false,
      keepDirty: false,
    },
    mode: 'onSubmit',
    resolver: zodResolver(companyNameFormSchema),
  });

  useEffect(() => {
    if (visible) {
      reset({
        companyName: webCard.companyName ?? '',
      });
    }
  }, [reset, visible, webCard.companyName]);

  const intl = useIntl();

  const [commitMutation] = useMutation(graphql`
    mutation WebCardParametersCompanyNameFormMutation(
      $webCardId: ID!
      $input: UpdateWebCardInput!
    ) {
      updateWebCard(webCardId: $webCardId, input: $input) {
        webCard {
          id
          companyName
        }
      }
    }
  `);

  const onSubmit = handleSubmit(async ({ companyName }) => {
    commitMutation({
      variables: {
        webCardId: webCard.id,
        input: {
          companyName,
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

  const companyName = watch('companyName');
  const [debouncedCompanyName] = useDebounce(companyName, 200);

  const companyNameError =
    webCard.companyName !== companyName && errors.companyName;

  useEffect(() => {
    if (debouncedCompanyName) {
      void trigger('companyName');
    }
  }, [debouncedCompanyName, trigger]);

  return (
    <InputAccessoryView visible={visible} onClose={toggleBottomSheet}>
      <Header
        middleElement={intl.formatMessage({
          defaultMessage: 'Edit company name',
          description: 'Edit Webcard company Name modal title',
        })}
        leftElement={
          <Button
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description:
                'Edit Webcard company Name modal cancel button label',
            })}
            onPress={toggleBottomSheet}
            variant="secondary"
            style={styles.headerButton}
          />
        }
        rightElement={
          <Button
            loading={isSubmitting}
            disabled={isSubmitting || webCard.companyName === companyName}
            label={intl.formatMessage({
              defaultMessage: 'Save',
              description: 'Edit Webcard Name modal save button label',
            })}
            onPress={onSubmit}
            variant="primary"
            style={styles.headerButton}
          />
        }
        style={styles.header}
      />

      <View style={styles.controllerContainer}>
        <Controller
          control={control}
          name="companyName"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                nativeID="companyName"
                accessibilityLabelledBy="companyNameLabel"
                placeholder={intl.formatMessage({
                  defaultMessage: 'Company name',
                  description: 'ProfileForm companyname textinput placeholder',
                })}
                isErrored={!!companyNameError}
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
      {companyNameError ? (
        <Text variant="error">{companyNameError.message}</Text>
      ) : null}
      {errors.root?.server ? (
        <Text variant="error">{errors.root.server.message}</Text>
      ) : null}
    </InputAccessoryView>
  );
};

const styles = StyleSheet.create({
  header: { paddingHorizontal: 10 },
  headerButton: { paddingHorizontal: 5, minWidth: 74 },
  inputContainer: { flex: 1, height: 50, paddingHorizontal: 10 },
  controllerContainer: {
    paddingVertical: 10,
    gap: 5,
    flexDirection: 'row',
    width: '100%',
  },
});

export default WebcardParametersCompanyNameForm;
