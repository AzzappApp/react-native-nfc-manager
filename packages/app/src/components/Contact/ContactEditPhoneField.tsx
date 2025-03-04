import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { type TextInputProps } from 'react-native';
import { colors } from '#theme';
import { buildContactStyleSheet } from '#helpers/contactHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import { isPhoneNumberValid } from '#helpers/phoneNumbersHelper';
import CountryCodeListWithOptions from '#ui/CountryCodeListWithOptions';
import TextInput from '#ui/TextInput';
import ContactCardEditFieldWrapper from './ContactEditFieldWrapper';
import type { CountryCode } from 'libphonenumber-js';
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
  selectedKey,
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
  selectedKey?: FieldPath<TFieldValues>;
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
        field: { onChange, value, onBlur },
        fieldState: { error, isDirty },
      }) => (
        <ContactCardEditFieldWrapper
          labelKey={labelKey}
          control={control}
          labelValues={labelValues}
          onChangeLabel={onChangeLabel}
          deleteField={deleteField}
          selectedKey={selectedKey}
          errorMessage={error ? (errorMessage ?? error.message) : undefined}
        >
          <Controller
            control={control}
            name={countryCodeKey}
            render={({
              field: { onChange: onChangeCountryCode, value: countryCode },
            }) => {
              const isValid = isPhoneNumberValid(value, countryCode);
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
                  <TextInput
                    value={value as string}
                    onChangeText={
                      trim ? value => onChange(value.trim()) : onChange
                    }
                    style={[styles.input, !isValid && styles.warning]}
                    numberOfLines={4}
                    multiline
                    keyboardType={keyboardType}
                    clearButtonMode="while-editing"
                    testID="contact-card-edit-modal-field"
                    placeholder={placeholder}
                    autoCapitalize={autoCapitalize}
                    isErrored={!!error}
                    onBlur={onBlur}
                    autoFocus={isDirty}
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
