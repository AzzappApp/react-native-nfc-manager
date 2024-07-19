import { useIntl } from 'react-intl';
import ShareCommand from 'react-native-share';
import { graphql, useFragment } from 'react-relay';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import Button from '#ui/Button';
import type { ContactCardExportVcf_card$key } from '#relayArtifacts/ContactCardExportVcf_card.graphql';

export type ContactCardExportVcfProps = {
  profile: ContactCardExportVcf_card$key;
};

const ContactCardExportVcf = ({
  profile: profileKey,
}: {
  profile: ContactCardExportVcf_card$key;
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
    <Button
      label={intl.formatMessage({
        defaultMessage: 'Share',
        description: 'Share button label',
      })}
      onPress={async () => {
        const title =
          formatDisplayName(
            profile.contactCard?.firstName,
            profile.contactCard?.lastName,
          ) ?? '';
        try {
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
    />
  );
};

export default ContactCardExportVcf;
