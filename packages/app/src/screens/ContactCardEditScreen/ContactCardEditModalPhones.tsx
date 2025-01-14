import { Fragment } from 'react';
import { useFieldArray } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { colors } from '#theme';
import ContactCardEditModalField from '#components/ContactCard/ContactCardEditField';
import {
  contactCardEditModalStyleSheet,
  useContactCardPhoneLabels,
} from '#helpers/contactCardHelpers';
import { useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Separation from '#ui/Separation';
import Text from '#ui/Text';
import type { ContactCardFormValues } from './ContactCardSchema';
import type { Control } from 'react-hook-form';

const ContactCardEditModalPhones = ({
  control,
}: {
  control: Control<ContactCardFormValues>;
}) => {
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
        <Fragment key={phone.id}>
          <ContactCardEditModalField
            control={control}
            labelKey={`phoneNumbers.${index}.label`}
            valueKey={`phoneNumbers.${index}.number`}
            selectedKey={`phoneNumbers.${index}.selected`}
            deleteField={() => remove(index)}
            keyboardType="phone-pad"
            labelValues={labelValues}
            placeholder={intl.formatMessage({
              defaultMessage: 'Enter a phone number',
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
          onPress={() => append({ label: 'Home', number: '', selected: true })}
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

export default ContactCardEditModalPhones;
