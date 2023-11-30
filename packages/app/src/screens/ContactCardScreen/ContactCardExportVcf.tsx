import { useIntl } from 'react-intl';
import ReactNativeBlobUtil from 'react-native-blob-util';
import ShareCommand from 'react-native-share';
import { graphql, useFragment } from 'react-relay';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import { buildVCard } from '@azzapp/shared/vCardHelpers';
import Button from '#ui/Button';
import type { ContactCardExportVcf_card$key } from '@azzapp/relay/artifacts/ContactCardExportVcf_card.graphql';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';

const ContactCardExportVcf = ({
  userName,
  profile: profileKey,
}: {
  userName: string;
  profile: ContactCardExportVcf_card$key;
}) => {
  const profile = useFragment(
    graphql`
      fragment ContactCardExportVcf_card on Profile {
        contactCard {
          firstName
          lastName
          urls {
            address
            selected
          }
          socials {
            url
            label
            selected
          }
        }
        serializedContactCard {
          data
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
        const { vCard } = buildVCard(
          userName,
          profile.serializedContactCard.data,
          profile.contactCard as Pick<ContactCard, 'socials' | 'urls'>,
        );
        const docPath = ReactNativeBlobUtil.fs.dirs.CacheDir;
        const filePath = `${docPath}/${userName}.vcf`;
        try {
          await ReactNativeBlobUtil.fs.writeFile(
            filePath,
            vCard.toString(),
            'utf8',
          );

          await ShareCommand.open({
            title:
              formatDisplayName(
                profile.contactCard?.firstName,
                profile.contactCard?.lastName,
              ) ?? '',
            url: `file://${filePath}`,
            type: 'text/vcard',
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
