import { useIntl } from 'react-intl';
import ShareCommand from 'react-native-share';
import { graphql, useFragment } from 'react-relay';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import { buildUserUrlWithKey } from '@azzapp/shared/urlHelpers';
import { logEvent } from '#helpers/analytics';
import LargeButton from '#ui/LargeButton';
import type { ContactCardExportVcf_card$key } from '#relayArtifacts/ContactCardExportVcf_card.graphql';
import type { ColorSchemeName, ViewStyle } from 'react-native';

export type ContactCardExportVcfProps = {
  profile: ContactCardExportVcf_card$key;
};

const ContactCardExportVcf = ({
  profile: profileKey,
  publicKey,
  appearance,
  style,
}: {
  publicKey?: string;
  profile: ContactCardExportVcf_card$key;
  appearance?: ColorSchemeName;
  style?: ViewStyle;
}) => {
  const profile = useFragment(
    graphql`
      fragment ContactCardExportVcf_card on Profile
      @argumentDefinitions(
        deviceId: { type: "String!", provider: "qrCodeDeviceId.relayprovider" }
      ) {
        webCard {
          userName
        }
        contactCard {
          firstName
          lastName
        }
        contactCardAccessId(deviceId: $deviceId)
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
          if (
            profile.webCard?.userName &&
            publicKey &&
            profile.contactCardAccessId
          ) {
            const contactCardUrl = buildUserUrlWithKey({
              userName: profile.webCard?.userName,
              key: publicKey,
              contactCardAccessId: profile.contactCardAccessId,
            });
            await ShareCommand.open({
              title,
              subject: title,
              message: contactCardUrl,
              failOnCancel: false,
            });
          }
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
