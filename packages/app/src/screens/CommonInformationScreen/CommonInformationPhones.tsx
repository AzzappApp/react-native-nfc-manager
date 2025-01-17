import { useFieldArray } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { getLocales } from 'react-native-localize';
import { colors } from '#theme';
import ContactCardEditPhoneField from '#components/ContactCard/ContactCardEditPhoneField';
import {
  contactCardEditModalStyleSheet,
  useContactCardPhoneLabels,
} from '#helpers/contactCardHelpers';
import { useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { CommonInformationForm } from './CommonInformationSchema';
import type { Control } from 'react-hook-form';

const CommonInformationPhones = ({
  control,
}: {
  control: Control<CommonInformationForm>;
}) => {
  const locales = getLocales();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'phoneNumbers',
  });

  const intl = useIntl();

  const labelValues = useContactCardPhoneLabels();

  const styles = useStyleSheet(contactCardEditModalStyleSheet);

  return (
    <>
      {fields.map((phone, index) => (
        <ContactCardEditPhoneField
          key={phone.id}
          control={control}
          labelKey={`phoneNumbers.${index}.label`}
          valueKey={`phoneNumbers.${index}.number`}
          countryCodeKey={`phoneNumbers.${index}.countryCode`}
          deleteField={() => remove(index)}
          keyboardType="phone-pad"
          labelValues={labelValues}
          placeholder={intl.formatMessage({
            defaultMessage: 'Enter a phone number',
            description: 'Placeholder for phone number inside contact card',
          })}
        />
      ))}
      <View>
        <PressableNative
          testID="add-phone-button"
          style={styles.addButton}
          onPress={() =>
            append({
              label: 'Home',
              countryCode: locales[0].countryCode,
              number: '',
            })
          }
        >
          <Icon icon="add_filled" style={{ tintColor: colors.green }} />
          <Text variant="smallbold">
            <FormattedMessage
              defaultMessage="Add phone"
              description="Add phone number to the contact card"
            />
          </Text>
        </PressableNative>
      </View>
    </>
  );
};

export default CommonInformationPhones;
