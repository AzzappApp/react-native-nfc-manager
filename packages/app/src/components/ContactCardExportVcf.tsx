import { useIntl } from 'react-intl';
import ShareCommand from 'react-native-share';
import { graphql, useFragment } from 'react-relay';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import { logEvent } from '#helpers/analytics';
import LargeButton from '#ui/LargeButton';
import type { ContactCardExportVcf_card$key } from '#relayArtifacts/ContactCardExportVcf_card.graphql';
import type { ColorSchemeName, ViewStyle } from 'react-native';

export type ContactCardExportVcfProps = {
  profile: ContactCardExportVcf_card$key;
};

const ContactCardExportVcf = ({
  profile: profileKey,
  appearance,
  style,
}: {
  profile: ContactCardExportVcf_card$key;
  appearance?: ColorSchemeName;
  style?: ViewStyle;
}) => {
  const profile = useFragment(
    graphql`
      fragment ContactCardExportVcf_card on Profile {
        contactCardUrl
        contactCard {
          firstName
          lastName
        }
      }
    `,
    profileKey,
  );

  const intl = useIntl();
  return (
    <LargeButton
      appearance={appearance}
      icon="share"
      onPress={async () => {
        const title =
          formatDisplayName(
            profile.contactCard?.firstName,
            profile.contactCard?.lastName,
          ) ?? '';
        try {
          logEvent('share_contact_card');
          await ShareCommand.open({
            title,
            subject: title,
            message: profile.contactCardUrl,
            failOnCancel: false,
          });
        } catch (e) {
          console.error(e);
        }
      }}
      title={intl.formatMessage({
        defaultMessage: 'Share',
        description: 'Share button label',
      })}
      style={style}
    />
  );
};

export default ContactCardExportVcf;
