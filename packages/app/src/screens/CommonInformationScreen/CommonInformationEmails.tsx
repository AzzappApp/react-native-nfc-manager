import { useFieldArray } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { colors } from '#theme';
import ContactEditField from '#components/Contact/ContactEditField';
import {
  contactEditStyleSheet,
  useContactEmailLabels,
} from '#helpers/contactHelpers';
import { useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { CommonInformationForm } from './CommonInformationSchema';
import type { Control } from 'react-hook-form';

const CommonInformationEmails = ({
  control,
}: {
  control: Control<CommonInformationForm>;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'emails',
  });

  const intl = useIntl();

  const labelValues = useContactEmailLabels();

  const styles = useStyleSheet(contactEditStyleSheet);

  return (
    <>
      {fields.map((email, index) => (
        <ContactEditField
          key={email.id}
          control={control}
          labelKey={`emails.${index}.label`}
          valueKey={`emails.${index}.address`}
          deleteField={() => remove(index)}
          keyboardType="email-address"
          autoCapitalize="none"
          labelValues={labelValues}
          placeholder={intl.formatMessage({
            defaultMessage: 'Enter an email',
            description: 'Placeholder for email inside contact card',
          })}
          errorMessage={intl.formatMessage({
            defaultMessage: 'Please enter a valid email',
            description:
              'Edit Common Information - Error message when email is invalid',
          })}
          returnKeyType="done"
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
              defaultMessage="Add email address"
              description="Add email address to the contact card"
            />
          </Text>
        </PressableNative>
      </View>
    </>
  );
};

export default CommonInformationEmails;
