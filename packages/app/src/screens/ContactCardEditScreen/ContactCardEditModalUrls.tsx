import { Fragment } from 'react';
import { useFieldArray } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { colors } from '#theme';
import ContactCardEditModalField from '#components/ContactCard/ContactCardEditField';
import { contactCardEditModalStyleSheet } from '#helpers/contactCardHelpers';
import { useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Separation from '#ui/Separation';
import Text from '#ui/Text';
import type { ContactCardFormValues } from './ContactCardSchema';
import type { Control } from 'react-hook-form';

const ContactCardEditModalUrls = ({
  control,
}: {
  control: Control<ContactCardFormValues>;
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
        <Fragment key={url.id}>
          <ContactCardEditModalField
            control={control}
            valueKey={`urls.${index}.address`}
            deleteField={() => remove(index)}
            keyboardType="url"
            autoCapitalize="none"
            placeholder={intl.formatMessage({
              defaultMessage: 'Enter a URL',
              description:
                'ContactCardEditModalUrls  - Placeholder for URL inside contact card',
            })}
            errorMessage={intl.formatMessage({
              defaultMessage: 'Please enter a valid url',
              description:
                'ContactCardEditModalUrls - Error message when a url is wrongly formatted',
            })}
            trim
          />
          <Separation small />
        </Fragment>
      ))}
      <View>
        <PressableNative
          style={styles.addButton}
          onPress={() => {
            append({ address: '' });
          }}
        >
          <Icon icon="add_filled" style={{ tintColor: colors.green }} />
          <Text variant="smallbold">
            <FormattedMessage
              defaultMessage="Add URL"
              description="ContactCardEditModalUrls  - Add URL to the contact card"
            />
          </Text>
        </PressableNative>
      </View>
    </>
  );
};

export default ContactCardEditModalUrls;
