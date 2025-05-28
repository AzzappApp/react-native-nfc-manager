import { Fragment, useEffect, useRef } from 'react';
import { useController, useFieldArray, useWatch } from 'react-hook-form';
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
import type { contactFormValues } from '#helpers/contactHelpers';
import type { Control } from 'react-hook-form';

const ContactEditUrls = ({
  control,
}: {
  control: Control<contactFormValues>;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'urls',
  });

  const styles = useStyleSheet(contactEditStyleSheet);

  return (
    <>
      {fields.map((url, index) => (
        <Fragment key={url.id}>
          <ContactEditUrlFieldWithEnrichment
            key={url.id}
            control={control}
            remove={remove}
            index={index}
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

export const ContactEditUrlFieldWithEnrichment = ({
  control,
  index,
  remove,
}: {
  control: Control<contactFormValues>;
  index: number;
  remove: (index: number) => void;
}) => {
  const intl = useIntl();
  const value = useWatch({
    control,
    name: `urls.${index}.url`,
  });

  const refValue = useRef(value);

  const { field: removedFromEnrichment } = useController({
    control,
    name: `urls.${index}.removedFromEnrichment`,
  });

  useEffect(() => {
    if (refValue.current !== value) {
      removedFromEnrichment.onChange(true);
    }
    refValue.current = value;
  }, [value, removedFromEnrichment]);

  return (
    <ContactEditField
      control={control}
      valueKey={`urls.${index}.url`}
      deleteField={() => remove(index)}
      keyboardType="url"
      placeholder={intl.formatMessage({
        defaultMessage: 'Enter a URL',
        description:
          'ContactEditUrls  - Placeholder for URL inside contact card',
      })}
      autoCapitalize="none"
      errorMessage={intl.formatMessage({
        defaultMessage: 'Please enter a valid url',
        description:
          'ContactEditUrls - Error message when a url is wrongly formatted',
      })}
      returnKeyType="done"
      trim
    />
  );
};

export default ContactEditUrls;
