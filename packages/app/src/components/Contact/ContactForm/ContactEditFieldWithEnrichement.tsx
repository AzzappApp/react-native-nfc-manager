import { useEffect, useRef } from 'react';
import { useController, useWatch } from 'react-hook-form';
import ContactEditField from '../ContactEditField';
import type { TextInputProps } from '#ui/TextInput';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

export const ContactEditFieldWithEnrichment = <
  TFieldValues extends FieldValues,
>({
  control,
  index,
  remove,
  placeholder,
  labelValues,
  multiline = false,
  keyboardType,
  labelKey,
  valueKey,
  removedFromEnrichmentKey,
  autoCapitalize,
  errorMessage,
  returnKeyType,
}: {
  control: Control<TFieldValues>;
  index: number;
  remove: (index: number) => void;
  placeholder: string;
  labelValues?: Array<{ key: string; value: string }>;
  multiline?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  labelKey: FieldPath<TFieldValues>;
  valueKey: FieldPath<TFieldValues>;
  removedFromEnrichmentKey: FieldPath<TFieldValues>;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  errorMessage?: string;
  returnKeyType?: TextInputProps['returnKeyType'];
}) => {
  const value = useWatch({
    control,
    name: valueKey,
  });

  const label = useWatch({
    control,
    name: labelKey,
  });

  const refValue = useRef(value);
  const refLabel = useRef(label);

  const { field: removedFromEnrichment } = useController({
    control,
    name: removedFromEnrichmentKey,
  });

  useEffect(() => {
    if (refValue.current !== value || refLabel.current !== label) {
      removedFromEnrichment.onChange(true);
    }
    refValue.current = value;
    refLabel.current = label;
  }, [value, removedFromEnrichment, label]);

  return (
    <ContactEditField
      control={control}
      labelKey={labelKey}
      valueKey={valueKey}
      deleteField={() => remove(index)}
      keyboardType={keyboardType}
      labelValues={labelValues}
      placeholder={placeholder}
      multiline={multiline}
      autoCapitalize={autoCapitalize}
      errorMessage={errorMessage}
      returnKeyType={returnKeyType}
    />
  );
};
