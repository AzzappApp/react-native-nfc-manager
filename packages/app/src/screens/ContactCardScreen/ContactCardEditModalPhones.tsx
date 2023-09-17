import { useMemo } from 'react';
import { useFieldArray } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, type LayoutRectangle } from 'react-native';
import { colors } from '#theme';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import ContactCardEditModalField from './ContactCardEditModalField';
import styles from './ContactCardEditModalStyles';
import type { ContactCardEditForm } from './ContactCardEditModalSchema';
import type { Control } from 'react-hook-form';

const ContactCardEditModalPhones = ({
  control,
  openDeleteButton,
  deleted,
  deleteButtonRect,
  closeDeleteButton,
}: {
  control: Control<ContactCardEditForm>;
  openDeleteButton: (changeEvent: LayoutRectangle) => void;
  deleted: boolean;
  deleteButtonRect: LayoutRectangle | null;
  closeDeleteButton: () => void;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'phoneNumbers',
  });

  const intl = useIntl();

  const labelValues = useMemo(
    () => [
      {
        key: 'Home',
        value: intl.formatMessage({
          defaultMessage: 'Home',
          description:
            '"Home" value as type for a phone number in Contact Card edition',
        }),
      },
      {
        key: 'Work',
        value: intl.formatMessage({
          defaultMessage: 'Work',
          description:
            '"Work" value as type for a phone number in Contact Card edition',
        }),
      },
      {
        key: 'Mobile',
        value: intl.formatMessage({
          defaultMessage: 'Mobile',
          description:
            '"Mobile" value as type for a phone number in Contact Card edition',
        }),
      },
      {
        key: 'Main',
        value: intl.formatMessage({
          defaultMessage: 'Main',
          description:
            '"Main" value as type for a phone number in Contact Card edition',
        }),
      },
      {
        key: 'Fax',
        value: intl.formatMessage({
          defaultMessage: 'Fax',
          description:
            '"Fax" value as type for a phone number in Contact Card edition',
        }),
      },
      {
        key: 'Other',
        value: intl.formatMessage({
          defaultMessage: 'Other',
          description:
            '"Other" value as type for a phone number in Contact Card edition',
        }),
      },
    ],
    [intl],
  );

  return (
    <>
      {fields.map((phone, index) => (
        <ContactCardEditModalField
          deleteButtonRect={deleteButtonRect}
          deleted={deleted}
          openDeleteButton={openDeleteButton}
          closeDeleteButton={closeDeleteButton}
          key={phone.id}
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
