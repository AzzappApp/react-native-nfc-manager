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

const ContactCardEditModalUrls = ({
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
    name: 'urls',
  });

  const intl = useIntl();

  const styles = useStyleSheet(contactCardEditModalStyleSheet);

  return (
    <>
      {fields.map((url, index) => (
        <ContactCardEditModalField
          deleteButtonRect={deleteButtonRect}
          deleted={deleted}
          openDeleteButton={openDeleteButton}
          closeDeleteButton={closeDeleteButton}
          key={url.id}
          control={control}
          valueKey={`urls.${index}.address`}
          selectedKey={`urls.${index}.selected`}
          deleteField={() => remove(index)}
          keyboardType="url"
          placeholder={intl.formatMessage({
            defaultMessage: 'Enter a URL',
            description: 'Placeholder for URL inside contact card',
          })}
        />
      ))}
      <View>
        <PressableNative
          style={styles.addButton}
          onPress={() => {
            append({ address: '', selected: true });
          }}
        >
          <Icon icon="add_filled" style={{ tintColor: colors.green }} />
          <Text variant="smallbold">
            <FormattedMessage
              defaultMessage="Add URL"
              description="Add URL to the contact card"
            />
          </Text>
        </PressableNative>
      </View>
    </>
  );
};

export default ContactCardEditModalUrls;
