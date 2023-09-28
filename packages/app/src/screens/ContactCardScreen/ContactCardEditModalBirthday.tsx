import { useController } from 'react-hook-form';
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

const ContactCardEditModalBirthdays = ({
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
  const { field } = useController({
    control,
    name: 'birthday',
  });

  const intl = useIntl();

  return (
    <>
      {field.value && (
        <ContactCardEditModalField
          deleteButtonRect={deleteButtonRect}
          deleted={deleted}
          openDeleteButton={openDeleteButton}
          closeDeleteButton={closeDeleteButton}
          control={control}
          valueKey={`birthday.birthday`}
          selectedKey={`birthday.selected`}
          deleteField={() => field.onChange(null)}
          keyboardType="default"
          placeholder={intl.formatMessage({
            defaultMessage: 'Enter a birthday',
            description: 'Placeholder for birthday inside contact card',
          })}
        />
      )}
      {!field.value && (
        <View>
          <PressableNative
            style={styles.addButton}
            onPress={() => {
              field.onChange({ birthday: '', selected: true });
            }}
          >
            <Icon icon="add_filled" style={{ tintColor: colors.green }} />
            <Text variant="smallbold">
              <FormattedMessage
                defaultMessage="Add birthday"
                description="Add birthday to the contact card"
              />
            </Text>
          </PressableNative>
        </View>
      )}
    </>
  );
};

export default ContactCardEditModalBirthdays;
