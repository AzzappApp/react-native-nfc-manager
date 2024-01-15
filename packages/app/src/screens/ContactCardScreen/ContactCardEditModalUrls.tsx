import { useFieldArray } from 'react-hook-form';
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
import type { Control, FieldErrors } from 'react-hook-form';

const ContactCardEditModalUrls = ({
  control,
  errors,
}: {
  control: Control<ContactCardEditFormValues>;
  errors?: FieldErrors<ContactCardEditFormValues>;
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
          key={url.id}
          control={control}
          valueKey={`urls.${index}.address`}
          selectedKey={`urls.${index}.selected`}
          deleteField={() => remove(index)}
          keyboardType="url"
          autoCapitalize="none"
          placeholder={intl.formatMessage({
            defaultMessage: 'Enter a URL',
            description: 'Placeholder for URL inside contact card',
          })}
          errorMessage={
            errors?.urls?.[index]?.root
              ? intl.formatMessage({
                  defaultMessage: 'Please enter a valid url',
                  description:
                    'Edit Contact Card - Error message when a url is wrongly formatted',
                })
              : undefined
          }
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
