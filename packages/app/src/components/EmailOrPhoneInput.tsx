import { useEffect, useMemo, useRef } from 'react';
import { useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import CountryCodeListWithOptions from '#ui/CountryCodeListWithOptions';
import TextInput from '#ui/TextInput';
import PhoneInput from './PhoneInput';
import type { CountryCodeListOption } from '#ui/CountryCodeListWithOptions';
import type { CountryCode } from 'libphonenumber-js';

type EmailOrPhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  hasError: boolean;
  onSubmitEditing?: () => void;
  countryCodeOrEmail: CountryCode | 'email';
  setCountryCodeOrEmail: (value: CountryCode | 'email') => void;
};

const EmailOrPhoneInput = ({
  value,
  onChange,
  countryCodeOrEmail,
  setCountryCodeOrEmail,
  hasError,
  onSubmitEditing,
}: EmailOrPhoneInputProps) => {
  const intl = useIntl();

  const prev = useRef(countryCodeOrEmail);

  useEffect(() => {
    if (
      prev.current !== countryCodeOrEmail &&
      (prev.current === 'email' || countryCodeOrEmail === 'email')
    ) {
      prev.current = countryCodeOrEmail;
      onChange('');
    }
  }, [countryCodeOrEmail, onChange]);

  const SELECTORS: Array<CountryCodeListOption<'email'>> = useMemo(
    () => [
      {
        type: 'email',
        title: intl.formatMessage({
          defaultMessage: 'Email address',
          description: 'The email address option in the country selector',
        }),
        icon: 'mail',
      },
    ],
    [intl],
  );

  return (
    <View style={styles.phoneOrEmailContainer}>
      <CountryCodeListWithOptions<'email'>
        otherSectionTitle={intl.formatMessage({
          defaultMessage: 'Connect with email address',
          description:
            'Signup Form Connect with email address section title in country selection list',
        })}
        phoneSectionTitle={intl.formatMessage({
          defaultMessage: 'Connect with phone number',
          description:
            'Signup Form Connect with phone number section title in country selection list',
        })}
        value={countryCodeOrEmail}
        options={SELECTORS}
        onChange={setCountryCodeOrEmail}
        style={styles.countryCodeOrEmailButton}
        accessibilityLabel={intl.formatMessage({
          defaultMessage: 'Select a calling code or email',
          description:
            'Signup - The accessibility label for the country selector',
        })}
        accessibilityHint={intl.formatMessage({
          defaultMessage:
            'Opens a list of countries and email address and allows you to select if you want to use your email address or a phone number',
          description:
            'Signup- The accessibility hint for the country selector',
        })}
      />
      {countryCodeOrEmail === 'email' ? (
        <TextInput
          nativeID="email"
          placeholder={intl.formatMessage({
            defaultMessage: 'Email address',
            description: 'Signup Screen - email address input placeholder',
          })}
          value={value}
          onChangeText={onChange}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          autoCorrect={false}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Enter your email address',
            description:
              'Signup Screen - Accessibility TextInput email address',
          })}
          isErrored={hasError}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="next"
          style={styles.flex}
        />
      ) : (
        <PhoneInput
          nativeID="phoneNumber"
          placeholder={intl.formatMessage({
            defaultMessage: 'Phone number',
            description: 'Signup Screen - phone number input placeholder',
          })}
          value={value}
          onChange={onChange}
          defaultCountry={countryCodeOrEmail}
          autoCapitalize="none"
          keyboardType="phone-pad"
          autoCorrect={false}
          accessibilityLabel={intl.formatMessage({
            defaultMessage: 'Enter your phone number',
            description: 'Signup Screen - Accessibility TextInput phone number',
          })}
          isErrored={hasError}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="next"
          style={styles.flex}
        />
      )}
    </View>
  );
};

export default EmailOrPhoneInput;

const styles = StyleSheet.create({
  flex: { flex: 1 },

  phoneOrEmailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeOrEmailButton: {
    marginRight: 5,
  },
});
