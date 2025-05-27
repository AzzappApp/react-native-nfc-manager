import { Controller } from 'react-hook-form';
import { type TextInputProps } from 'react-native';
import { colors } from '#theme';
import PremiumIndicator from '#components/PremiumIndicator';
import { buildContactStyleSheet } from '#helpers/contactHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import TextInput from '#ui/TextInput';
import TextInputWithEllipsizeMode from '#ui/TextInputWithEllipsizeMode';
import ContactCardEditFieldWrapper from './ContactCardEditFieldWrapper';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

const ContactCardEditField = <TFieldValues extends FieldValues>({
  labelKey,
  deleteField,
  keyboardType,
  valueKey,
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
  returnKeyType,
  multiline,
  offsetRef,
  ellipsize,
}: {
  labelKey?: FieldPath<TFieldValues>;
  keyboardType: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  deleteField: () => void;
  valueKey: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  labelValues?: Array<{ key: string; value: string }>;
  placeholder?: string;
  onChangeLabel?: (label: string) => void;
  errorMessage?: string;
  trim?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
  isPremium?: boolean | null;
  requiresPremium?: boolean;
  returnKeyType?: TextInputProps['returnKeyType'];
  multiline?: boolean;
  offsetRef?: React.RefObject<number>;
  ellipsize?: boolean;
}) => {
  const styles = useStyleSheet(stylesheet);

  const Input = ellipsize ? TextInputWithEllipsizeMode : TextInput;

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
          errorMessage={error ? (errorMessage ?? error.message) : undefined}
          offsetRef={offsetRef}
        >
          <Input
            value={value as string}
            onChangeText={trim ? value => onChange(value.trim()) : onChange}
            style={styles.input}
            numberOfLines={4}
            multiline={multiline}
            keyboardType={keyboardType}
            clearButtonMode="while-editing"
            testID="contact-card-edit-modal-field"
            placeholder={placeholder}
            autoCapitalize={autoCapitalize}
            isErrored={!!error}
            onBlur={onBlur}
            autoFocus={isDirty}
            autoComplete={autoComplete}
            returnKeyType={returnKeyType}
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
