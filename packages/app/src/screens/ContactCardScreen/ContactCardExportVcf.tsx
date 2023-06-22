import { fromGlobalId } from 'graphql-relay';
import { useIntl } from 'react-intl';
import ReactNativeBlobUtil from 'react-native-blob-util';
import ShareCommand from 'react-native-share';
import { graphql, useFragment } from 'react-relay';
import VCard from 'vcard-creator';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import Button from '#ui/Button';
import type { ContactCardExportVcf_card$key } from '@azzapp/relay/artifacts/ContactCardExportVcf_card.graphql';

const ContactCardExportVcf = ({
  profileId,
  contactCard: contactCardKey,
}: {
  profileId: string;
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
        const vcard = new VCard();

        const id = fromGlobalId(profileId).id;

        vcard.addUID(id);

        vcard.addName(contactCard.lastName ?? '', contactCard.firstName ?? '');

        vcard.addCompany(contactCard.company ?? '');

        vcard.addJobtitle(contactCard.title ?? '');

        contactCard.emails
          ?.filter(m => m.selected)
          .forEach(email => {
            vcard.addEmail(
              email.address,
              email.label === 'Main'
                ? 'type=PREF'
                : `type=${email.label.toLocaleUpperCase()}`,
            );
          });

        contactCard.phoneNumbers
          ?.filter(p => p.selected)
          .forEach(phone => {
            vcard.addPhoneNumber(
              phone.number,
              phone.label === 'Main'
                ? 'type=PREF'
                : phone.label === 'Mobile'
                ? 'type=CELL'
                : `type=${phone.label.toLocaleUpperCase()}`,
            );
          });

        const docPath = ReactNativeBlobUtil.fs.dirs.CacheDir;
        const filePath = `${docPath}/${id}.vcf`;
        try {
          await ReactNativeBlobUtil.fs.writeFile(
            filePath,
            vcard.toString(),
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
