import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { buildContactCardModalStyleSheet } from '#helpers/contactCardHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import TextInput from '#ui/TextInput';

import ContactCardEditFieldWrapper from './ContactCardEditFieldWrapper';
import type { TextInputProps } from 'react-native';

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
}) => {
  const styles = useStyleSheet(stylesheet);

  return (
    <ContactCardEditFieldWrapper
      labelKey={labelKey}
      control={control}
      labelValues={labelValues}
      onChangeLabel={onChangeLabel}
      deleteField={deleteField}
      selectedKey={selectedKey}
    >
      <Controller
        control={control}
        name={valueKey}
        render={({ field: { onChange, value } }) => (
          <TextInput
            value={value as string}
            onChangeText={onChange}
            style={styles.input}
            numberOfLines={1}
            keyboardType={keyboardType}
            clearButtonMode="while-editing"
            testID="contact-card-edit-modal-field"
            placeholder={placeholder}
            autoCapitalize={autoCapitalize}
          />
        )}
      />
    </ContactCardEditFieldWrapper>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  ...buildContactCardModalStyleSheet(appearance),
}));

export default ContactCardEditField;
