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
import { Platform, View } from 'react-native';
import { formatDateToYYYYMMDD } from '@azzapp/shared/timeHelpers';
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
  title,
}: {
  labelKey?: FieldPath<TFieldValues>;
  deleteField: () => void;
  valueKey: FieldPath<TFieldValues>;
  selectedKey?: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  labelValues?: Array<{ key: string; value: string }>;
  onChangeLabel?: (label: string) => void;
  title: string;
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
        render={({ field: { onChange, value } }) => {
          return (
            <View style={styles.item}>
              <Text variant="smallbold">{title}</Text>
              {Platform.OS === 'android' ? (
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
                          onChange(formatDateToYYYYMMDD(date));
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
                  onChange={(event, date) => {
                    if (date) {
                      onChange(formatDateToYYYYMMDD(date));
                    }
                  }}
                  style={styles.input}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                />
              )}
            </View>
          );
        }}
      />
    </ContactCardEditFieldWrapper>
  );
};

const stylesheet = createStyleSheet(appearance => ({
  ...buildContactCardModalStyleSheet(appearance),
  item: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 6,
    marginTop: 2,
  },
}));

export default ContactCardEditDateField;
