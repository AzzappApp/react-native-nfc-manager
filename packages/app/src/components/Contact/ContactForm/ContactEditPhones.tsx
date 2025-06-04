import { Fragment, useEffect, useRef } from 'react';
import { useController, useFieldArray, useWatch } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { getLocales } from 'react-native-localize';
import { colors } from '#theme';
import ContactEditPhoneField from '#components/Contact/ContactEditPhoneField';
import {
  contactEditStyleSheet,
  useContactPhoneLabels,
} from '#helpers/contactHelpers';
import { useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Separation from '#ui/Separation';
import Text from '#ui/Text';
import type { contactFormValues } from '#helpers/contactHelpers';
import type { Control } from 'react-hook-form';

const ContactEditPhones = ({
  control,
}: {
  control: Control<contactFormValues>;
}) => {
  const locales = getLocales();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'phoneNumbers',
  });

  const styles = useStyleSheet(contactEditStyleSheet);

  return (
    <>
      {fields.map((phone, index) => (
        <Fragment key={phone.id}>
          <ContactEditPhoneFieldWithEnrichment
            control={control}
            remove={remove}
            index={index}
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

export const ContactEditPhoneFieldWithEnrichment = ({
  control,
  index,
  remove,
}: {
  control: Control<contactFormValues>;
  index: number;
  remove: (index: number) => void;
}) => {
  const labelValues = useContactPhoneLabels();
  const intl = useIntl();

  const value = useWatch({
    control,
    name: `phoneNumbers.${index}.number`,
  });

  const label = useWatch({
    control,
    name: `phoneNumbers.${index}.label`,
  });

  const country = useWatch({
    control,
    name: `phoneNumbers.${index}.countryCode`,
  });

  const refValue = useRef(value);
  const refLabel = useRef(label);
  const refCountry = useRef(country);

  const { field: removedFromEnrichment } = useController({
    control,
    name: `phoneNumbers.${index}.removedFromEnrichment`,
  });

  useEffect(() => {
    if (
      refValue.current !== value ||
      refLabel.current !== label ||
      refCountry.current !== country
    ) {
      removedFromEnrichment.onChange(true);
    }
    refValue.current = value;
    refLabel.current = label;
    refCountry.current = country;
  }, [value, removedFromEnrichment, label, country]);

  return (
    <ContactEditPhoneField
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
  );
};

export default ContactEditPhones;
