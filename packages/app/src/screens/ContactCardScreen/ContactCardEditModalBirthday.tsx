import { useController } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { colors } from '#theme';
import ContactCardEditModalField from '#components/ContactCard/ContactCardEditField';
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

  const intl = useIntl();

  const styles = useStyleSheet(contactCardEditModalStyleSheet);

  return (
    <>
      {field.value && (
        <ContactCardEditModalField
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
