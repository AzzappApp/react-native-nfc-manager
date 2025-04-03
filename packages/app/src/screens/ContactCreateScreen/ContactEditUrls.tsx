import { Fragment } from 'react';
import { useFieldArray } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { colors } from '#theme';
import ContactEditField from '#components/Contact/ContactEditField';
import { contactEditStyleSheet } from '#helpers/contactHelpers';
import { useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Separation from '#ui/Separation';
import Text from '#ui/Text';
import type { ContactFormValues } from './ContactSchema';
import type { Control } from 'react-hook-form';

const ContactEditUrls = ({
  control,
}: {
  control: Control<ContactFormValues>;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'urls',
  });

  const intl = useIntl();

  const styles = useStyleSheet(contactEditStyleSheet);

  return (
    <>
      {fields.map((url, index) => (
        <Fragment key={url.id}>
          <ContactEditField
            control={control}
            valueKey={`urls.${index}.url`}
            deleteField={() => remove(index)}
            keyboardType="url"
            autoCapitalize="none"
            placeholder={intl.formatMessage({
              defaultMessage: 'Enter a URL',
              description:
                'ContactEditUrls  - Placeholder for URL inside contact card',
            })}
            errorMessage={intl.formatMessage({
              defaultMessage: 'Please enter a valid url',
              description:
                'ContactEditUrls - Error message when a url is wrongly formatted',
            })}
            trim
            returnKeyType="done"
          />
          <Separation small />
        </Fragment>
      ))}
      <View>
        <PressableNative
          style={styles.addButton}
          onPress={() => {
            append({ url: '' });
          }}
        >
          <Icon icon="add_filled" style={{ tintColor: colors.green }} />
          <Text variant="smallbold">
            <FormattedMessage
              defaultMessage="Add URL"
              description="ContactEditUrls  - Add URL to the contact card"
            />
          </Text>
        </PressableNative>
      </View>
    </>
  );
};

export default ContactEditUrls;
