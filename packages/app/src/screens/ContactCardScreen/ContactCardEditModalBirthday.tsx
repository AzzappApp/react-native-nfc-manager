import { useController } from 'react-hook-form';
import { FormattedMessage } from 'react-intl';
import { View } from 'react-native';
import { colors } from '#theme';
import ContactCardEditDateField from '#components/ContactCard/ContactCardEditDateField';
import { contactCardEditModalStyleSheet } from '#helpers/contactCardHelpers';
import { useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { ContactCardEditFormValues } from './ContactCardEditModalSchema';
import type { Control } from 'react-hook-form';

const ContactCardEditModalBirthdays = ({
  control,
}: {
  control: Control<ContactCardEditFormValues>;
}) => {
  const { field } = useController({
    control,
    name: 'birthday',
  });

  const styles = useStyleSheet(contactCardEditModalStyleSheet);

  return (
    <>
      {field.value && (
        <ContactCardEditDateField
          control={control}
          valueKey={`birthday.birthday`}
          selectedKey={`birthday.selected`}
          deleteField={() => field.onChange(null)}
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
