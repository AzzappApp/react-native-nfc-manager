import { Fragment, useEffect, useRef } from 'react';
import { useController, useFieldArray, useWatch } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import {
  SOCIAL_NETWORK_LINKS,
  SOCIAL_NETWORK_LINKS_LABELS,
} from '@azzapp/shared/socialLinkHelpers';
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

const ContactEditSocials = ({
  control,
}: {
  control: Control<contactFormValues>;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'socials',
  });

  const styles = useStyleSheet(contactEditStyleSheet);

  return (
    <>
      {fields.map((social, index) => (
        <Fragment key={social.id}>
          <ContactEditSocialFieldWithEnrichment
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
            append({
              url: SOCIAL_NETWORK_LINKS[0].mask,
              label: SOCIAL_NETWORK_LINKS[0].id,
            });
          }}
        >
          <Icon icon="add_filled" style={{ tintColor: colors.green }} />
          <Text variant="smallbold">
            <FormattedMessage
              defaultMessage="Add social profile"
              description="Add social profile to the contact card"
            />
          </Text>
        </PressableNative>
      </View>
    </>
  );
};

export const ContactEditSocialFieldWithEnrichment = ({
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
    name: `socials.${index}.url`,
  });

  const label = useWatch({
    control,
    name: `socials.${index}.label`,
  });

  const refValue = useRef(value);
  const refLabel = useRef(label);

  const { field: removedFromEnrichment } = useController({
    control,
    name: `socials.${index}.removedFromEnrichment`,
  });

  const { field: labelUrl } = useController({
    control,
    name: `socials.${index}.url`,
  });

  useEffect(() => {
    if (refValue.current !== value || refLabel.current !== label) {
      if (refLabel.current !== label) {
        labelUrl.onChange(
          SOCIAL_NETWORK_LINKS.find(socialLink => socialLink.id === label)
            ?.mask ?? '',
        );
      }
      removedFromEnrichment.onChange(true);
    }
    refValue.current = value;
    refLabel.current = label;
  }, [value, removedFromEnrichment, label, labelUrl]);

  return (
    <ContactEditField
      control={control}
      labelKey={`socials.${index}.label`}
      valueKey={`socials.${index}.url`}
      deleteField={() => remove(index)}
      keyboardType="default"
      labelValues={SOCIAL_NETWORK_LINKS_LABELS}
      placeholder={intl.formatMessage({
        defaultMessage: 'Enter a social profile',
        description: 'Placeholder for social profile inside contact card',
      })}
      returnKeyType="done"
    />
  );
};

export default ContactEditSocials;
