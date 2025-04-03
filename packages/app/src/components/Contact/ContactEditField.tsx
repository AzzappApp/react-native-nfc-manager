import { Controller } from 'react-hook-form';
import { type TextInputProps } from 'react-native';
import { colors } from '#theme';
import PremiumIndicator from '#components/PremiumIndicator';
import { buildContactStyleSheet } from '#helpers/contactHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import TextInput from '#ui/TextInput';
import ContactCardEditFieldWrapper from './ContactEditFieldWrapper';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

const ContactCardEditField = <TFieldValues extends FieldValues>({
  labelKey,
  deleteField,
  keyboardType,
  valueKey,
  selectedKey,
  control,
  labelValues,
  placeholder,
  onChangeLabel,
  autoCapitalize,
  errorMessage,
  trim = false,
  autoComplete = 'off',
  isPremium,
  requiresPremium,
}: {
  labelKey?: FieldPath<TFieldValues>;
  keyboardType: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  deleteField: () => void;
  valueKey: FieldPath<TFieldValues>;
  selectedKey?: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  labelValues?: Array<{ key: string; value: string }>;
  placeholder?: string;
  onChangeLabel?: (label: string) => void;
  errorMessage?: string;
  trim?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
  isPremium?: boolean | null;
  requiresPremium?: boolean;
}) => {
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
            autoComplete={autoComplete}
          />
          {requiresPremium && (
            <PremiumIndicator
              isRequired={!isPremium}
              color={value ? undefined : colors.grey100}
            />
          )}
        </ContactCardEditFieldWrapper>
      )}
    />
  );
};

const stylesheet = createStyleSheet(appearance => ({
  ...buildContactStyleSheet(appearance),
}));

export default ContactCardEditField;
