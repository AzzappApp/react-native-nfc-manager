import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { type TextInputProps } from 'react-native';
import { buildContactCardModalStyleSheet } from '#helpers/contactCardHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import CountryCodeListWithOptions from '#ui/CountryCodeListWithOptions';
import TextInput from '#ui/TextInput';
import ContactCardEditFieldWrapper from './ContactCardEditFieldWrapper';
import type { CountryCode } from 'libphonenumber-js';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

export type PhoneInput = {
  countryCode: CountryCode;
  number: string;
};

const ContactCardEditPhoneField = <TFieldValues extends FieldValues>({
  labelKey,
  deleteField,
  keyboardType,
  valueKey,
  selectedKey,
  countryCodeKey,
  control,
  labelValues,
  placeholder,
  onChangeLabel,
  autoCapitalize,
  errorMessage,
  trim = false,
}: {
  labelKey?: FieldPath<TFieldValues>;
  keyboardType: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  deleteField: () => void;
  valueKey: FieldPath<TFieldValues>;
  countryCodeKey: FieldPath<TFieldValues>;
  selectedKey?: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
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
            render={({ field: { onChange, value } }) => (
              <CountryCodeListWithOptions
                phoneSectionTitle={intl.formatMessage({
                  defaultMessage: 'Phone number',
                  description: 'Phone field title in country selection list',
                })}
                value={value}
                options={[]}
                onChange={onChange}
                accessibilityHint={intl.formatMessage({
                  defaultMessage:
                    'Opens a list of countries and allows you to select if you want to use your email address or a phone number',
                  description:
                    'Phone field- The accessibility hint for the country selector',
                })}
              />
            )}
          />

          <TextInput
            value={value as string}
            onChangeText={trim ? value => onChange(value.trim()) : onChange}
            style={styles.input}
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
        </ContactCardEditFieldWrapper>
      )}
    />
  );
};

const stylesheet = createStyleSheet(appearance => ({
  ...buildContactCardModalStyleSheet(appearance),
}));

export default ContactCardEditPhoneField;
