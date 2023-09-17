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

const ContactCardEditModalSocials = ({
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
    name: 'socials',
  });

  const intl = useIntl();

  return (
    <>
      {fields.map((social, index) => (
        <ContactCardEditModalField
          deleteButtonRect={deleteButtonRect}
          deleted={deleted}
          openDeleteButton={openDeleteButton}
          closeDeleteButton={closeDeleteButton}
          key={social.id}
          control={control}
          valueKey={`socials.${index}.social`}
          selectedKey={`socials.${index}.selected`}
          deleteField={() => remove(index)}
          keyboardType="default"
          placeholder={intl.formatMessage({
            defaultMessage: 'Enter a social profile',
            description: 'Placeholder for social profile inside contact card',
          })}
        />
      ))}
      <View>
        <PressableNative
          style={styles.addButton}
          onPress={() => {
            append({ social: '', selected: true });
          }}
        >
          <Icon icon="add_filled" style={{ tintColor: colors.green }} />
          <Text variant="smallbold">
            <FormattedMessage
              defaultMessage="Add social profile"
              description="Add social profile to the contact card"
            />
          </Text>
        </PressableNative>
      </View>
    </>
  );
};

export default ContactCardEditModalSocials;
