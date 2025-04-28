import {
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { type TextInputProps } from 'react-native';
import { colors } from '#theme';
import { buildContactStyleSheet } from '#helpers/contactHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import CountryCodeListWithOptions from '#ui/CountryCodeListWithOptions';
import TextInputWithPrefix from '#ui/TextInputWithPrefix';
import ContactCardEditFieldWrapper from './ContactEditFieldWrapper';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

export type PhoneInput = {
  countryCode: CountryCode;
  number: string;
};

const ContactCardEditPhoneField = <TFieldValues extends FieldValues>({
  deleteField,
  keyboardType,
  control,
  valueKey,
  labelKey,
  countryCodeKey,
  labelValues,
  placeholder,
  onChangeLabel,
  autoCapitalize,
  errorMessage,
  trim = false,
}: {
  keyboardType: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  deleteField: () => void;
  control: Control<TFieldValues>;
  labelKey?: FieldPath<TFieldValues>;
  valueKey: FieldPath<TFieldValues>;
  countryCodeKey: FieldPath<TFieldValues>;
  labelValues?: Array<{ key: string; value: string }>;
  placeholder?: string;
  onChangeLabel?: (label: string) => void;
  errorMessage?: string;
  trim?: boolean;
}) => {
  const intl = useIntl();
  const styles = useStyleSheet(stylesheet);

  return (
    <Controller
      control={control}
      name={valueKey}
      render={({
        field: { onChange, value: inputValue, onBlur },
        fieldState: { error, isDirty },
      }) => (
        <ContactCardEditFieldWrapper
          labelKey={labelKey}
          control={control}
          labelValues={labelValues}
          onChangeLabel={onChangeLabel}
          deleteField={deleteField}
          errorMessage={error ? (errorMessage ?? error.message) : undefined}
        >
          <Controller
            control={control}
            name={countryCodeKey}
            render={({
              field: { onChange: onChangeCountryCode, value: countryCode },
            }) => {
              const phoneNumber = parsePhoneNumberFromString(
                inputValue,
                countryCode,
              );
              return (
                <>
                  <CountryCodeListWithOptions
                    phoneSectionTitle={intl.formatMessage({
                      defaultMessage: 'Phone number',
                      description:
                        'Phone field title in country selection list',
                    })}
                    value={countryCode}
                    options={[]}
                    onChange={onChangeCountryCode}
                    accessibilityHint={intl.formatMessage({
                      defaultMessage:
                        'Opens a list of countries and allows you to select if you want to use your email address or a phone number',
                      description:
                        'Phone field- The accessibility hint for the country selector',
                    })}
                  />
                  <TextInputWithPrefix
                    value={
                      phoneNumber?.nationalNumber || (inputValue as string)
                    }
                    onChangeText={
                      trim ? value => onChange(value.trim()) : onChange
                    }
                    style={[
                      styles.input,
                      !phoneNumber?.isValid() && styles.warning,
                    ]}
                    numberOfLines={4}
                    keyboardType={keyboardType}
                    clearButtonMode="while-editing"
                    testID="contact-card-edit-modal-field"
                    placeholder={placeholder}
                    autoCapitalize={autoCapitalize}
                    isErrored={!!error}
                    onBlur={onBlur}
                    autoFocus={isDirty}
                    prefix={
                      phoneNumber?.countryCallingCode
                        ? `+${phoneNumber?.countryCallingCode}`
                        : ''
                    }
                  />
                </>
              );
            }}
          />
        </ContactCardEditFieldWrapper>
      )}
    />
  );
};

const stylesheet = createStyleSheet(appearance => ({
  ...buildContactStyleSheet(appearance),
  warning: {
    borderBottomWidth: 1,
    borderColor: colors.warn,
  },
}));

export default ContactCardEditPhoneField;
