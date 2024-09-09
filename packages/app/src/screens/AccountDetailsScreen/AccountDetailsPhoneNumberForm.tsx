import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import { getCountry } from 'react-native-localize';
import Purchases from 'react-native-purchases';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { isPhoneNumber } from '@azzapp/shared/stringHelpers';
import { useRouter } from '#components/NativeRouter';
import { requestUpdateContact } from '#helpers/MobileWebAPI';
import useScreenInsets from '#hooks/useScreenInsets';
import Button from '#ui/Button';
import CountryCodeListWithOptions from '#ui/CountryCodeListWithOptions';
import COUNTRY_FLAG from '#ui/CountrySelector/CountryFlag';
import Header from '#ui/Header';
import InputAccessoryView from '#ui/InputAccessoryView';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import useUpdateUser from './useUpdateUser';
import type { CountryCode } from 'libphonenumber-js';
import type { TextInput as NativeTextInput } from 'react-native';

const parseNumber = (
  phoneNumber: string | null,
  country: string,
): {
  phoneNumber: string;
  countryCode: string;
} => {
  const parsedPhoneNumber =
    phoneNumber && isValidPhoneNumber(phoneNumber)
      ? parsePhoneNumber(phoneNumber)
      : null;
  return {
    phoneNumber: parsedPhoneNumber?.formatNational() ?? '',
    countryCode:
      parsedPhoneNumber?.country ??
      (country in COUNTRY_FLAG ? country : COUNTRY_FLAG.AC),
  };
};

const AccountDetailsPhoneNumberForm = ({
  currentUser,
  visible,
  toggleBottomSheet,
}: {
  visible: boolean;
  toggleBottomSheet: () => void;
  currentUser: {
    id: string;
    email: string | null;
    phoneNumber: string | null;
  };
}) => {
  const hasEmail = currentUser.email != null;
  const router = useRouter();

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

  const country = getCountry();

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<z.infer<typeof phoneNumberFormSchema>>({
    resolver: (data, context, options) => {
      clearErrors();
      return zodResolver(phoneNumberFormSchema)(data, context, options);
    },
    defaultValues: parseNumber(currentUser.phoneNumber, country),
    mode: 'onChange',
  });

  const intl = useIntl();

  useEffect(() => {
    if (visible) {
      reset({ ...parseNumber(currentUser.phoneNumber, country) });
    }
  }, [country, currentUser.phoneNumber, reset, visible]);

  const updatePhoneNumber = async (phoneNumber: string) => {
    try {
      if (phoneNumber === currentUser.phoneNumber) {
        toggleBottomSheet();
        return;
      }

      const { issuer } = await requestUpdateContact({
        locale: intl.locale,
        phoneNumber,
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
  };

  const [commit, isLoading] = useUpdateUser();

  const deletePhoneNumber = () => {
    commit({
      variables: {
        input: {
          phoneNumber: null,
        },
      },
      optimisticResponse: {
        updateUser: {
          user: {
            id: currentUser?.id,
            email: currentUser?.email,
            phoneNumber: null,
          },
        },
      },
      updater: store => {
        store
          .getRoot()
          .getLinkedRecord('currentUser')
          ?.setValue(null, 'phoneNumber');

        Purchases.setPhoneNumber(null);
      },
      onCompleted: () => {
        toggleBottomSheet();
      },
      onError: () => {
        Toast.show({
          type: 'error',
          text1: intl.formatMessage({
            defaultMessage: 'Unknown error - Please retry',
            description:
              'AccountDetailsPhoneNumberForm - Error Unknown error - Please retry',
          }),
          visibilityTime: 5000,
        });
      },
    });
  };

  const submit = handleSubmit(async ({ phoneNumber, countryCode }) => {
    if (phoneNumber) {
      const storedPhoneNumber = parsePhoneNumber(
        phoneNumber,
        countryCode as CountryCode,
      ).formatInternational();

      updatePhoneNumber(storedPhoneNumber);
    } else {
      deletePhoneNumber();
    }
  });

  const { bottom } = useScreenInsets();

  const phoneNumberInputRef = useRef<NativeTextInput>(null);

  return (
    <InputAccessoryView
      visible={visible}
      onClose={toggleBottomSheet}
      style={{ paddingBottom: bottom }}
    >
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
            loading={isSubmitting || isLoading}
            disabled={isSubmitting || isLoading}
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
