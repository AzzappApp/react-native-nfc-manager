import { Controller } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { buildContactStyleSheet } from '#helpers/contactHelpers';
import { createStyleSheet, useStyleSheet } from '#helpers/createStyles';
import Separation from '#ui/Separation';
import Text from '#ui/Text';
import TextInput from '#ui/TextInput';
import type { ContactCardFormValues } from './ContactCardSchema';
import type { Control } from 'react-hook-form';

const ContactCardEditModalName = ({
  control,
  isFirstnameMandatory,
}: {
  control: Control<ContactCardFormValues>;
  isFirstnameMandatory?: boolean;
}) => {
  const styles = useStyleSheet(styleSheet);
  const intl = useIntl();

  return (
    <>
      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <View style={styles.field}>
            <Text variant="smallbold" style={styles.fieldTitle}>
              <FormattedMessage
                defaultMessage="First name"
                description="First name registered for the contact card"
              />
              {isFirstnameMandatory && <Text>*</Text>}
            </Text>
            <TextInput
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              style={styles.input}
              clearButtonMode="while-editing"
              autoCapitalize="sentences"
              autoComplete="given-name"
              placeholder={intl.formatMessage({
                defaultMessage: 'Enter a first name',
                description: 'Placeholder for first name inside contact card',
              })}
              ref={ref}
            />
          </View>
        )}
      />
      <Separation small />
      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <View style={styles.field}>
            <Text variant="smallbold" style={styles.fieldTitle}>
              <FormattedMessage
                defaultMessage="Last name"
                description="Last name field registered for the contact card"
              />
            </Text>
            <TextInput
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              style={styles.input}
              clearButtonMode="while-editing"
              autoCapitalize="sentences"
              autoComplete="name-family"
              placeholder={intl.formatMessage({
                defaultMessage: 'Enter a last name',
                description: 'Placeholder for last name contact card',
              })}
              ref={ref}
            />
          </View>
        )}
      />
      <Separation small />
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <View style={styles.field}>
            <Text variant="smallbold" style={styles.fieldTitle}>
              <FormattedMessage
                defaultMessage="Title"
                description="Job title field registered for the contact card"
              />
            </Text>
            <TextInput
              value={value ?? ''}
              onChangeText={onChange}
              onBlur={onBlur}
              style={styles.input}
              clearButtonMode="while-editing"
              placeholder={intl.formatMessage({
                defaultMessage: 'Enter a title',
                description: 'Placeholder for title inside contact card',
              })}
              ref={ref}
            />
          </View>
        )}
      />
    </>
  );
};

const styleSheet = createStyleSheet(appearance => ({
  ...buildContactStyleSheet(appearance),
}));

export default ContactCardEditModalName;
