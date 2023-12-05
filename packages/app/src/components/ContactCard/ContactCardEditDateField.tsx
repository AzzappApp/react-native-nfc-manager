import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { Platform } from 'react-native';
import { buildContactCardModalStyleSheet } from '#helpers/contactCardHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import ContactCardEditFieldWrapper from './ContactCardEditFieldWrapper';

const ContactCardEditDateField = <TFieldValues extends FieldValues>({
  labelKey,
  deleteField,
  valueKey,
  selectedKey,
  control,
  labelValues,
  onChangeLabel,
}: {
  labelKey?: FieldPath<TFieldValues>;
  deleteField: () => void;
  valueKey: FieldPath<TFieldValues>;
  selectedKey?: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  labelValues?: Array<{ key: string; value: string }>;
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
        render={({ field: { onChange, value } }) =>
          Platform.OS === 'android' ? (
            <PressableNative
              style={{
                marginLeft: 'auto',
              }}
              onPress={() => {
                DateTimePickerAndroid.open({
                  value:
                    !value || isNaN(Date.parse(value))
                      ? new Date()
                      : new Date(Date.parse(value)),
                  onChange: (_, date) => {
                    if (date) {
                      onChange(date.toISOString());
                    }
                  },
                  mode: 'date',
                });
              }}
            >
              <Text variant="medium">
                {value && !isNaN(Date.parse(value)) ? (
                  new Date(Date.parse(value)).toLocaleDateString()
                ) : (
                  <FormattedMessage
                    defaultMessage="Select a date"
                    description="default message for date picker"
                  />
                )}
              </Text>
            </PressableNative>
          ) : (
            <DateTimePicker
              value={
                !value || isNaN(Date.parse(value))
                  ? new Date()
                  : new Date(Date.parse(value))
              }
              onChange={(_, date) => date && onChange(date.toISOString())}
              style={styles.input}
              mode="date"
              display="default"
              maximumDate={new Date()}
            />
          )
        }
      />
    </ContactCardEditFieldWrapper>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  ...buildContactCardModalStyleSheet(appearance),
}));

export default ContactCardEditDateField;
