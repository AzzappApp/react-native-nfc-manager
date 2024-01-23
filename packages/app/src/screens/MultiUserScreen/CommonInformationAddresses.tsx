import { useFieldArray } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { colors } from '#theme';
import ContactCardEditModalField from '#components/ContactCard/ContactCardEditField';
import { useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import {
  contactCardEditModalStyleSheet,
  useContactCardAddressLabels,
} from '../../helpers/contactCardHelpers';
import type { CommonInformationForm } from './CommonInformationSchema';
import type { Control } from 'react-hook-form';

const CommonInformationAddresses = ({
  control,
}: {
  control: Control<CommonInformationForm>;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'addresses',
  });

  const intl = useIntl();

  const styles = useStyleSheet(contactCardEditModalStyleSheet);

  const labelValues = useContactCardAddressLabels();

  return (
    <>
      {fields.map((address, index) => (
        <ContactCardEditModalField
          key={address.id}
          control={control}
          labelKey={`addresses.${index}.label`}
          valueKey={`addresses.${index}.address`}
          deleteField={() => remove(index)}
          keyboardType="default"
          labelValues={labelValues}
          placeholder={intl.formatMessage({
            defaultMessage: 'Enter an adress',
            description: 'Placeholder for adress inside contact card',
          })}
        />
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

export default CommonInformationAddresses;
