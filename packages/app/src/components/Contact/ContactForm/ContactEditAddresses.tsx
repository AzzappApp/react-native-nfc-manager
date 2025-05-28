import { Fragment } from 'react';
import { useFieldArray } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { colors } from '#theme';
import { useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Separation from '#ui/Separation';
import Text from '#ui/Text';
import {
  contactEditStyleSheet,
  useContactAddressLabels,
} from '../../../helpers/contactHelpers';
import { ContactEditFieldWithEnrichment } from './ContactEditFieldWithEnrichement';
import type { contactFormValues } from '../../../helpers/contactHelpers';
import type { Control } from 'react-hook-form';

const ContactEditAddresses = ({
  control,
}: {
  control: Control<contactFormValues>;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'addresses',
  });

  const intl = useIntl();

  const styles = useStyleSheet(contactEditStyleSheet);

  const labelValues = useContactAddressLabels();

  return (
    <>
      {fields.map((address, index) => (
        <Fragment key={address.id}>
          <ContactEditFieldWithEnrichment
            index={index}
            control={control}
            labelKey={`addresses.${index}.label`}
            valueKey={`addresses.${index}.address`}
            removedFromEnrichmentKey={`addresses.${index}.removedFromEnrichment`}
            remove={remove}
            keyboardType="default"
            labelValues={labelValues}
            placeholder={intl.formatMessage({
              defaultMessage: 'Enter an adress',
              description: 'Placeholder for adress inside contact card',
            })}
            multiline
          />
          <Separation small />
        </Fragment>
      ))}
      <View>
        <PressableNative
          style={styles.addButton}
          onPress={() => {
            append({
              label: 'Home',
              address: '',
            });
          }}
        >
          <Icon icon="add_filled" style={{ tintColor: colors.green }} />
          <Text variant="smallbold">
            <FormattedMessage
              defaultMessage="Add address"
              description="Add address to the contact card"
            />
          </Text>
        </PressableNative>
      </View>
    </>
  );
};

export default ContactEditAddresses;
