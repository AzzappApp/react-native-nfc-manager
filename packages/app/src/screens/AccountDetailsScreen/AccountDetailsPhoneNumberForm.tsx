import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import { getCountry } from 'react-native-localize';
import { z } from 'zod';
import ERRORS from '@azzapp/shared/errors';
import { isPhoneNumber } from '@azzapp/shared/stringHelpers';
import useScreenInsets from '#hooks/useScreenInsets';
import useUpdateUser from '#screens/AccountDetailsScreen/useUpdateUser';
import BottomSheetModal from '#ui/BottomSheetModal';
import Button from '#ui/Button';
import CountryCodeListWithOptions from '#ui/CountryCodeListWithOptions';
import COUNTRY_FLAG from '#ui/CountrySelector/CountryFlag';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import type { GraphQLError } from 'graphql';
import type { CountryCode } from 'libphonenumber-js';

const phoneNumberFormSchema = z
  .object({
    phoneNumber: z.string().min(1),
    countryCode: z.string().min(1),
  })
  .refine(
    ({ phoneNumber, countryCode }) => {
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

type PhoneNumberForm = z.infer<typeof phoneNumberFormSchema>;

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
  const parsedPhoneNumber =
    currentUser.phoneNumber && isValidPhoneNumber(currentUser.phoneNumber)
      ? parsePhoneNumber(currentUser.phoneNumber)
      : null;

  const country = getCountry();

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<PhoneNumberForm>({
    resolver: zodResolver(phoneNumberFormSchema),
    defaultValues: {
      phoneNumber: parsedPhoneNumber?.formatNational() ?? '',
      countryCode:
        parsedPhoneNumber?.country ??
        (country in COUNTRY_FLAG ? country : COUNTRY_FLAG.AC),
    },
  });

  const intl = useIntl();

  const insets = useScreenInsets();

  const [commitMutation] = useUpdateUser();

  const submit = handleSubmit(async ({ phoneNumber, countryCode }) => {
    const storedPhoneNumber = parsePhoneNumber(
      phoneNumber,
      countryCode as CountryCode,
    ).formatInternational();

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

  return (
    <BottomSheetModal
      visible={visible}
      height={insets.bottom + 160}
      onRequestClose={toggleBottomSheet}
      headerTitle={intl.formatMessage({
        defaultMessage: 'Edit phone number',
        description: 'Edit phone number modal title',
      })}
      showGestureIndicator={false}
      headerLeftButton={
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
      headerRightButton={
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
    >
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
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  headerButton: { paddingHorizontal: 5, minWidth: 74 },
  phoneAndCountryCode: {
    paddingTop: 10,
    gap: 5,
    flexDirection: 'row',
    width: '100%',
  },
});

export default AccountDetailsPhoneNumberForm;
