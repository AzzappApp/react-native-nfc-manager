import { useMemo } from 'react';
import { useFieldArray } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View, type LayoutRectangle } from 'react-native';
import { colors } from '#theme';
import { useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import ContactCardEditModalField from './ContactCardEditModalField';
import { contactCardEditModalStyleSheet } from './ContactCardEditModalStyles';
import type { ContactCardEditForm } from './ContactCardEditModalSchema';
import type { Control } from 'react-hook-form';

const ContactCardEditModalPhones = ({
  control,
  deleted,
  openDeleteButton,
  deleteButtonRect,
  closeDeleteButton,
}: {
  control: Control<ContactCardEditForm>;
  deleted: boolean;
  openDeleteButton: (changeEvent: LayoutRectangle) => void;
  deleteButtonRect: LayoutRectangle | null;
  closeDeleteButton: () => void;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'emails',
  });

  const intl = useIntl();

  const labelValues = useMemo(
    () => [
      {
        key: 'Home',
        value: intl.formatMessage({
          defaultMessage: 'Home',
          description:
            '"Home" value as type for an email in Contact Card edition',
        }),
      },
      {
        key: 'Work',
        value: intl.formatMessage({
          defaultMessage: 'Work',
          description:
            '"Work" value as type for an email in Contact Card edition',
        }),
      },
      {
        key: 'Main',
        value: intl.formatMessage({
          defaultMessage: 'Main',
          description:
            '"Main" value as type for an email in Contact Card edition',
        }),
      },

      {
        key: 'Other',
        value: intl.formatMessage({
          defaultMessage: 'Other',
          description:
            '"Other" value as type for an email in Contact Card edition',
        }),
      },
    ],
    [intl],
  );

  const styles = useStyleSheet(contactCardEditModalStyleSheet);

  return (
    <>
      {fields.map((email, index) => (
        <ContactCardEditModalField
          deleteButtonRect={deleteButtonRect}
          deleted={deleted}
          openDeleteButton={openDeleteButton}
          closeDeleteButton={closeDeleteButton}
          key={email.id}
          control={control}
          labelKey={`emails.${index}.label`}
          valueKey={`emails.${index}.address`}
          selectedKey={`emails.${index}.selected`}
          deleteField={() => remove(index)}
          keyboardType="email-address"
          labelValues={labelValues}
          placeholder={intl.formatMessage({
            defaultMessage: 'Enter an email',
            description: 'Placeholder for email inside contact card',
          })}
        />
      ))}
      <View>
        <PressableNative
          style={styles.addButton}
          onPress={() => {
            append({ label: 'Home', address: '', selected: true });
          }}
        >
          <Icon icon="add_filled" style={{ tintColor: colors.green }} />
          <Text variant="smallbold">
            <FormattedMessage
              defaultMessage="Add email address"
              description="Add email address to the contact card"
            />
          </Text>
        </PressableNative>
      </View>
    </>
  );
};

export default ContactCardEditModalPhones;
