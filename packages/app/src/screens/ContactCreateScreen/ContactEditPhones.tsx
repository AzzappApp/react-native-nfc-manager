import { Fragment } from 'react';
import { useFieldArray } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { getLocales } from 'react-native-localize';
import { colors } from '#theme';
import ContactPhoneField from '#components/Contact/ContactEditPhoneField';
import {
  contactEditStyleSheet,
  useContactPhoneLabels,
} from '#helpers/contactHelpers';
import { useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Separation from '#ui/Separation';
import Text from '#ui/Text';
import type { ContactFormValues } from './ContactSchema';
import type { Control } from 'react-hook-form';

const ContactEditPhones = ({
  control,
}: {
  control: Control<ContactFormValues>;
}) => {
  const locales = getLocales();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'phoneNumbers',
  });

  const intl = useIntl();

  const labelValues = useContactPhoneLabels();

  const styles = useStyleSheet(contactEditStyleSheet);

  return (
    <>
      {fields.map((phone, index) => (
        <Fragment key={phone.id}>
          <ContactPhoneField
            control={control}
            labelKey={`phoneNumbers.${index}.label`}
            valueKey={`phoneNumbers.${index}.number`}
            countryCodeKey={`phoneNumbers.${index}.countryCode`}
            deleteField={() => remove(index)}
            keyboardType="phone-pad"
            labelValues={labelValues}
            placeholder={intl.formatMessage({
              defaultMessage: 'Phone number',
              description: 'Placeholder for phone number inside contact card',
            })}
          />
          <Separation small />
        </Fragment>
      ))}
      <View>
        <PressableNative
          testID="add-phone-button"
          style={styles.addButton}
          onPress={() =>
            append({
              label: 'Home',
              number: '',
              countryCode: locales[0].countryCode,
              selected: true,
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

export default ContactEditPhones;
