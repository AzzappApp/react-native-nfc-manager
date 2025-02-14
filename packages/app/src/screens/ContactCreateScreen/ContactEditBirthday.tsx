import { useController } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { colors } from '#theme';
import ContactDateField from '#components/Contact/ContactEditDateField';
import { contactEditStyleSheet } from '#helpers/contactHelpers';
import { useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { ContactFormValues } from './ContactSchema';
import type { Control } from 'react-hook-form';

const ContactEditBirthday = ({
  control,
}: {
  control: Control<ContactFormValues>;
}) => {
  const { field } = useController({
    control,
    name: 'birthday',
  });
  const intl = useIntl();

  const styles = useStyleSheet(contactEditStyleSheet);

  return (
    <>
      {field.value && (
        <ContactDateField
          control={control}
          valueKey="birthday.birthday"
          deleteField={() => field.onChange(null)}
          title={intl.formatMessage({
            defaultMessage: 'Birthday',
            description: 'Contact Card Birthday title',
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

export default ContactEditBirthday;
