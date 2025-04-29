import { Fragment } from 'react';
import { useFieldArray } from 'react-hook-form';
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
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'socials',
  });

  const intl = useIntl();

  const styles = useStyleSheet(contactEditStyleSheet);

  return (
    <>
      {fields.map((social, index) => (
        <Fragment key={social.id}>
          <ContactEditField
            control={control}
            labelKey={`socials.${index}.label`}
            valueKey={`socials.${index}.url`}
            labelValues={SOCIAL_NETWORK_LINKS_LABELS}
            deleteField={() => remove(index)}
            keyboardType="default"
            placeholder={intl.formatMessage({
              defaultMessage: 'Enter a social profile',
              description: 'Placeholder for social profile inside contact card',
            })}
            onChangeLabel={label => {
              update(index, {
                label,
                url:
                  SOCIAL_NETWORK_LINKS.find(
                    socialLink => socialLink.id === label,
                  )?.mask ?? '',
              });
            }}
            returnKeyType="done"
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

export default ContactEditSocials;
