import { useIntl } from 'react-intl';
import ShareCommand from 'react-native-share';
import { graphql, useFragment } from 'react-relay';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import { buildUserUrlWithKey } from '@azzapp/shared/urlHelpers';
import { logEvent } from '#helpers/analytics';
import useContactCardAccess from '#hooks/useContactCardAccess';
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
      fragment ContactCardExportVcf_card on Profile {
        contactCard {
          firstName
          lastName
        }
        ...useContactCardAccess_profile
      }
    `,
    profileKey,
  );

  const contactCardAccessData = useContactCardAccess(profile);

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
            contactCardAccessData?.webCard?.userName &&
            publicKey &&
            contactCardAccessData?.contactCardAccessId
          ) {
            const contactCardUrl = buildUserUrlWithKey({
              userName: contactCardAccessData.webCard.userName,
              key: publicKey,
              contactCardAccessId: contactCardAccessData.contactCardAccessId,
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
