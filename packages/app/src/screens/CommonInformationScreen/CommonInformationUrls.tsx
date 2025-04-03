import { useFieldArray } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { colors } from '#theme';
import ContactEditField from '#components/Contact/ContactEditField';
import { contactEditStyleSheet } from '#helpers/contactHelpers';
import { useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Text from '#ui/Text';
import type { CommonInformationForm } from './CommonInformationSchema';
import type { Control } from 'react-hook-form';

const CommonInformationUrls = ({
  control,
}: {
  control: Control<CommonInformationForm>;
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
        <ContactEditField
          key={url.id}
          control={control}
          valueKey={`urls.${index}.address`}
          deleteField={() => remove(index)}
          autoCapitalize="none"
          keyboardType="url"
          placeholder={intl.formatMessage({
            defaultMessage: 'Enter a URL',
            description:
              'CommonInformationUrls - Placeholder for URL inside contact card',
          })}
          errorMessage={intl.formatMessage({
            defaultMessage: 'Please enter a valid url',
            description:
              'CommonInformationUrls - Error message when a url is wrongly formatted',
          })}
          trim
          returnKeyType="done"
        />
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
              description="CommonInformationUrls - Add URL to the contact card"
            />
          </Text>
        </PressableNative>
      </View>
    </>
  );
};

export default CommonInformationUrls;
