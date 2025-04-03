import { type CountryCode } from 'libphonenumber-js';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useIntl } from 'react-intl';
import { View, StyleSheet } from 'react-native';
import { getLocales } from 'react-native-localize';
import { isNotFalsyString } from '@azzapp/shared/stringHelpers';
import { mergeRefs } from '#helpers/mergeRefs';
import { parsePhoneNumber } from '#helpers/phoneNumbersHelper';
import CountryCodeListWithOptions from '#ui/CountryCodeListWithOptions';
import TextInput from '#ui/TextInput';
import PhoneInput from './PhoneInput';
import type { CountryCodeListOption } from '#ui/CountryCodeListWithOptions';
import type { Ref } from 'react';
import type {
  TextInput as NativeTextInput,
  TextInputProps,
} from 'react-native';

export type EmailPhoneInput = {
  countryCodeOrEmail: CountryCode | 'email';
  value: string;
};
type EmailOrPhoneInputProps = Omit<
  TextInputProps,
  'keyboardType' | 'onChange' | 'value'
> & {
  input: EmailPhoneInput;
  onChange: (value: EmailPhoneInput) => void;
  hasError: boolean;
  inputRef?: Ref<NativeTextInput>;
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
};

const EmailOrPhoneInput = ({
  input,
  onChange,
  hasError,
  inputRef,
  onSubmitEditing,
  blurOnSubmit,
  ...others
}: EmailOrPhoneInputProps) => {
  const intl = useIntl();

  const inputRefInner = useRef<NativeTextInput>(null);

  useEffect(() => {
    const locales = getLocales();

    if (!isNotFalsyString(input.countryCodeOrEmail) && locales.length > 0) {
      const localCountryCode = locales[0].countryCode;

      try {
        const number = parsePhoneNumber(input.value);

        if (number?.country) {
          onChange({
            countryCodeOrEmail: number?.country,
            value: input.value,
          });
        } else {
          onChange({
            countryCodeOrEmail: localCountryCode as CountryCode,
            value: input.value,
          });
        }

        return;
      } catch {
        onChange({
          countryCodeOrEmail: localCountryCode as CountryCode,
          value: input.value,
        });
      }
    }
  }, [input.countryCodeOrEmail, input.value, onChange]);

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

  const onChangeCode = useCallback(
    (code: CountryCode | 'email') => {
      if (
        (input.countryCodeOrEmail === 'email' && code !== 'email') ||
        (input.countryCodeOrEmail !== 'email' && code === 'email')
      ) {
        onChange({ ...input, countryCodeOrEmail: code, value: '' });
      } else {
        onChange({ ...input, countryCodeOrEmail: code });
      }
    },
    [input, onChange],
  );

  const onChangeValue = useCallback(
    (value: string) => {
      onChange({ ...input, value });
    },
    [input, onChange],
  );

  return (
    <View style={styles.phoneOrEmailContainer}>
      <CountryCodeListWithOptions<'email'>
        inputRef={inputRefInner}
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
        value={input.countryCodeOrEmail}
        options={SELECTORS}
        onChange={onChangeCode}
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
      {input.countryCodeOrEmail === 'email' ? (
        <TextInput
          ref={mergeRefs([inputRefInner, inputRef])}
          nativeID="email"
          placeholder={intl.formatMessage({
            defaultMessage: 'Email address',
            description: 'Signup Screen - email address input placeholder',
          })}
          value={input.value}
          onChangeText={onChangeValue}
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
          blurOnSubmit={blurOnSubmit}
          {...others}
        />
      ) : (
        <PhoneInput
          ref={mergeRefs([inputRefInner, inputRef])}
          nativeID="phoneNumber"
          placeholder={intl.formatMessage({
            defaultMessage: 'Phone number',
            description: 'Signup Screen - phone number input placeholder',
          })}
          value={input.value}
          onChangeText={onChangeValue}
          countryCode={input.countryCodeOrEmail}
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
          blurOnSubmit={blurOnSubmit}
          {...others}
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
