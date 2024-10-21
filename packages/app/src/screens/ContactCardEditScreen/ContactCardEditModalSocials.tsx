import { Fragment } from 'react';
import { useFieldArray } from 'react-hook-form';
import { FormattedMessage, useIntl } from 'react-intl';
import { View } from 'react-native';
import { SOCIAL_NETWORK_LINKS } from '@azzapp/shared/socialLinkHelpers';
import { colors } from '#theme';
import ContactCardEditModalField from '#components/ContactCard/ContactCardEditField';
import {
  contactCardEditModalStyleSheet,
  useSocialLinkLabels,
} from '#helpers/contactCardHelpers';
import { useStyleSheet } from '#helpers/createStyles';
import Icon from '#ui/Icon';
import PressableNative from '#ui/PressableNative';
import Separation from '#ui/Separation';
import Text from '#ui/Text';
import type { ContactCardEditFormValues } from './ContactCardEditModalSchema';
import type { Control } from 'react-hook-form';

const ContactCardEditModalSocials = ({
  control,
}: {
  control: Control<ContactCardEditFormValues>;
}) => {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'socials',
  });

  const intl = useIntl();

  const labelValues = useSocialLinkLabels();

  const styles = useStyleSheet(contactCardEditModalStyleSheet);

  return (
    <>
      {fields.map((social, index) => (
        <Fragment key={social.id}>
          <ContactCardEditModalField
            control={control}
            labelKey={`socials.${index}.label`}
            valueKey={`socials.${index}.url`}
            labelValues={labelValues}
            deleteField={() => remove(index)}
            keyboardType="default"
            placeholder={intl.formatMessage({
              defaultMessage: 'Enter a social profile',
              description: 'Placeholder for social profile inside contact card',
            })}
            onChangeLabel={label => {
              update(index, {
                selected: social.selected,
                label,
                url:
                  SOCIAL_NETWORK_LINKS.find(
                    socialLink => socialLink.id === label,
                  )?.mask ?? '',
              });
            }}
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

export default ContactCardEditModalSocials;
