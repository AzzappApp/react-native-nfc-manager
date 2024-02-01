import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import { getCountry } from 'react-native-localize';
import { z } from 'zod';
import ERRORS from '@azzapp/shared/errors';
import { isPhoneNumber } from '@azzapp/shared/stringHelpers';
import useUpdateUser from '#screens/AccountDetailsScreen/useUpdateUser';
import Button from '#ui/Button';
import CountryCodeListWithOptions from '#ui/CountryCodeListWithOptions';
import COUNTRY_FLAG from '#ui/CountrySelector/CountryFlag';
import Header from '#ui/Header';
import InputAccessoryView from '#ui/InputAccessoryView';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import type { GraphQLError } from 'graphql';
import type { CountryCode } from 'libphonenumber-js';
import type { TextInput as NativeTextInput } from 'react-native';

const AccountDetailsPhoneNumberForm = ({
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
  const hasEmail = currentUser.email != null;

  const phoneNumberFormSchema = z
    .object({
      phoneNumber: hasEmail ? z.string().optional() : z.string().min(1),
      countryCode: z.string().min(1),
    })
    .refine(
      ({ phoneNumber, countryCode }) => {
        if (hasEmail && !phoneNumber) return true;
        return (
          phoneNumber &&
          countryCode &&
          isPhoneNumber(phoneNumber, countryCode as CountryCode)
        );
      },
      val => ({
        message: `${val.phoneNumber} is not a valid phone number for country ${val.countryCode}`,
        path: ['phoneNumber'],
      }),
    );

  const parsedPhoneNumber =
    currentUser.phoneNumber && isValidPhoneNumber(currentUser.phoneNumber)
      ? parsePhoneNumber(currentUser.phoneNumber)
      : null;

  const country = getCountry();

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { isSubmitting, errors },
  } = useForm<z.infer<typeof phoneNumberFormSchema>>({
    resolver: (data, context, options) => {
      clearErrors();
      return zodResolver(phoneNumberFormSchema)(data, context, options);
    },
    defaultValues: {
      phoneNumber: parsedPhoneNumber?.formatNational() ?? '',
      countryCode:
        parsedPhoneNumber?.country ??
        (country in COUNTRY_FLAG ? country : COUNTRY_FLAG.AC),
    },
    mode: 'onChange',
  });

  const intl = useIntl();

  const [commitMutation] = useUpdateUser();

  const submit = handleSubmit(async ({ phoneNumber, countryCode }) => {
    let storedPhoneNumber: string | null = null;
    if (phoneNumber) {
      storedPhoneNumber = parsePhoneNumber(
        phoneNumber,
        countryCode as CountryCode,
      ).formatInternational();
    }

    commitMutation({
      variables: {
        input: {
          phoneNumber: storedPhoneNumber,
        },
      },
      optimisticResponse: {
        updateUser: {
          user: {
            ...currentUser,
            phoneNumber: storedPhoneNumber,
          },
        },
      },
      updater: store => {
        store
          .getRoot()
          .getLinkedRecord('currentUser')
          ?.setValue(storedPhoneNumber, 'phoneNumber');
      },
      onCompleted: () => {
        toggleBottomSheet();
      },
      onError: error => {
        const response = ('response' in error ? error.response : undefined) as
          | { errors: GraphQLError[] }
          | undefined;
        if (
          response?.errors.some(
            r => r.message === ERRORS.PHONENUMBER_ALREADY_EXISTS,
          )
        ) {
          setError('root.server', {
            message: intl.formatMessage({
              defaultMessage: 'This phone number is already registered',
              description:
                'Account Details Screen - Error This phone number is already registered ',
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

  const phoneNumberInputRef = useRef<NativeTextInput>(null);

  return (
    <InputAccessoryView visible={visible} onClose={toggleBottomSheet}>
      <Header
        leftElement={
          <Button
            label={intl.formatMessage({
              defaultMessage: 'Cancel',
              description: 'Edit phone number modal cancel button label',
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
              description: 'Edit phone number modal save button label',
            })}
            onPress={submit}
            variant="primary"
            style={styles.headerButton}
          />
        }
        middleElement={intl.formatMessage({
          defaultMessage: 'Edit phone number',
          description: 'Edit phone number modal title',
        })}
      />
      <View style={styles.phoneAndCountryCode}>
        <Controller
          control={control}
          name="countryCode"
          render={({ field: { onChange, value } }) => (
            <CountryCodeListWithOptions
              phoneSectionTitle={intl.formatMessage({
                defaultMessage: 'Select your country',
                description:
                  'Account details - Section title in country selection list',
              })}
              value={value}
              options={[]}
              onChange={onChange}
              inputRef={phoneNumberInputRef}
              accessibilityLabel={intl.formatMessage({
                defaultMessage: 'Select a calling code',
                description:
                  'Account details - The accessibility label for the country selector',
              })}
              accessibilityHint={intl.formatMessage({
                defaultMessage:
                  'Opens a list of countries and allows you to select a calling code',
                description:
                  'Account details - The accessibility hint for the country selector',
              })}
            />
          )}
        />
        <Controller
          control={control}
          name="phoneNumber"
          render={({
            field: { onChange, onBlur, value },
            formState: { errors },
          }) => (
            <View style={{ flex: 1 }}>
              <TextInput
                ref={phoneNumberInputRef}
                testID="phoneNumberInput"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
                autoComplete="off"
                keyboardType="phone-pad"
                autoCorrect={false}
                isErrored={errors.phoneNumber != null}
                style={{ flex: 1 }}
                onSubmitEditing={submit}
                returnKeyType="done"
                autoFocus
              />
            </View>
          )}
        />
      </View>
      {errors.phoneNumber ? (
        <Text variant="error">
          <FormattedMessage
            defaultMessage="Please enter a valid phone number"
            description="Error message when the user enters an invalid phone number"
          />
        </Text>
      ) : null}
      {errors.root?.server ? (
        <Text variant="error">{errors.root.server.message}</Text>
      ) : null}
    </InputAccessoryView>
  );
};

const styles = StyleSheet.create({
  headerButton: { paddingHorizontal: 5, minWidth: 74 },
  phoneAndCountryCode: {
    padding: 20,
    gap: 5,
    flexDirection: 'row',
    width: '100%',
  },
});

export default AccountDetailsPhoneNumberForm;
