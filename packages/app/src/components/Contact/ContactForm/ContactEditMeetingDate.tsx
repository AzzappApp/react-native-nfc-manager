import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { Controller } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { Platform, View } from 'react-native';
import { contactEditStyleSheet } from '#helpers/contactHelpers';
import { useStyleSheet } from '#helpers/createStyles';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { contactFormValues } from '#helpers/contactHelpers';
import type { Control } from 'react-hook-form';

const ContactEditMeetingDate = ({
  control,
}: {
  control: Control<contactFormValues>;
}) => {
  const styles = useStyleSheet(contactEditStyleSheet);

  return (
    <Controller
      control={control}
      name="meetingDate"
      render={({ field: { onChange, value } }) => (
        <View style={styles.field}>
          <Text variant="smallbold" style={styles.fieldTitle}>
            <FormattedMessage
              defaultMessage="Meeting date"
              description="Meeting date registered for the contact card"
            />
          </Text>
          {Platform.OS === 'android' ? (
            <PressableNative
              onPress={() => {
                DateTimePickerAndroid.open({
                  value: !value ? new Date() : value,
                  onChange: (_, date) => {
                    if (date) {
                      onChange(date);
                    }
                  },
                  mode: 'date',
                });
              }}
            >
              <Text variant="medium">
                {value ? (
                  value.toLocaleDateString()
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
              value={!value ? new Date() : value}
              onChange={(event, date) => {
                if (date) {
                  onChange(date);
                }
              }}
              style={styles.input}
              mode="date"
              display="default"
              maximumDate={new Date()}
            />
          )}
        </View>
      )}
    />
  );
};

export default ContactEditMeetingDate;
