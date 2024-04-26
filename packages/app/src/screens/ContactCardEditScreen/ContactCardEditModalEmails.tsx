import { Fragment } from 'react';
import { useFieldArray } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { colors } from '#theme';
import ContactCardEditModalField from '#components/ContactCard/ContactCardEditField';
import {
  contactCardEditModalStyleSheet,
  useContactCardEmailLabels,
} from '#helpers/contactCardHelpers';
import { useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Separation from '#ui/Separation';
import Text from '#ui/Text';
import type { ContactCardEditFormValues } from './ContactCardEditModalSchema';
import type { Control } from 'react-hook-form';

const ContactCardEditModalEmails = ({
  control,
}: {
  control: Control<ContactCardEditFormValues>;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'emails',
  });

  const intl = useIntl();

  const labelValues = useContactCardEmailLabels();

  const styles = useStyleSheet(contactCardEditModalStyleSheet);

  return (
    <>
      {fields.map((email, index) => (
        <Fragment key={email.id}>
          <ContactCardEditModalField
            control={control}
            labelKey={`emails.${index}.label`}
            valueKey={`emails.${index}.address`}
            selectedKey={`emails.${index}.selected`}
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
                'Edit Contact Card - Error message when an email is wrongly formatted',
            })}
          />
          <Separation small />
        </Fragment>
      ))}
      <View>
        <PressableNative
          style={styles.addButton}
          onPress={() => {
            append({
              label: 'Home',
              address: '',
              selected: true,
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

export default ContactCardEditModalEmails;
