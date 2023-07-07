import { useIntl } from 'react-intl';
import ReactNativeBlobUtil from 'react-native-blob-util';
import ShareCommand from 'react-native-share';
import { graphql, useFragment } from 'react-relay';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import { buildVCard } from '@azzapp/shared/vCardHelpers';
import Button from '#ui/Button';
import type { ContactCardExportVcf_card$key } from '@azzapp/relay/artifacts/ContactCardExportVcf_card.graphql';

const ContactCardExportVcf = ({
  userName,
  contactCard: contactCardKey,
}: {
  userName: string;
  contactCard: ContactCardExportVcf_card$key;
}) => {
  const contactCard = useFragment(
    graphql`
      fragment ContactCardExportVcf_card on ContactCard {
        id
        firstName
        lastName
        title
        company
        emails {
          label
          address
          selected
        }
        phoneNumbers {
          label
          number
          selected
        }
        serializedContactCard {
          data
        }
      }
    `,
    contactCardKey,
  );

  const intl = useIntl();

  return (
    <Button
      label={intl.formatMessage({
        defaultMessage: 'Share',
        description: 'Share button label',
      })}
      onPress={async () => {
        const vCard = buildVCard(contactCard.serializedContactCard.data);

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
              formatDisplayName(contactCard.firstName, contactCard.lastName) ??
              '',
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
