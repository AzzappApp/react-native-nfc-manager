import { useIntl } from 'react-intl';
import { getArrayBufferForBlob } from 'react-native-blob-jsi-helper';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { fromByteArray } from 'react-native-quick-base64';
import ShareCommand from 'react-native-share';
import { graphql, useFragment } from 'react-relay';
import { formatDisplayName } from '@azzapp/shared/stringHelpers';
import { buildVCardFromSerializedContact } from '@azzapp/shared/vCardHelpers';
import Button from '#ui/Button';
import type { ContactCardExportVcf_card$key } from '#relayArtifacts/ContactCardExportVcf_card.graphql';

export type ContactCardExportVcfProps = {
  userName: string;
  profile: ContactCardExportVcf_card$key;
};

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
        webCard {
          commonInformation {
            socials {
              url
              label
            }
            urls {
              address
            }
          }
          coverAvatarUrl
        }
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
        serializedContactCard
        avatar {
          exportUri: uri(width: 720, pixelRatio: 1, extension: jpg)
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
        let avatar: { base64: string; type: string } | undefined = undefined;
        if (profile.avatar?.exportUri || profile.webCard.coverAvatarUrl) {
          const avatarData = await fetch(
            profile.avatar?.exportUri ?? profile.webCard.coverAvatarUrl!,
          );
          const avatarBlob = await avatarData.blob();
          const base64 = fromByteArray(getArrayBufferForBlob(avatarBlob));
          avatar = {
            type:
              avatarData.headers.get('content-type')?.split('/')[1] ?? 'png',
            base64,
          };
        }

        const { vCard } = await buildVCardFromSerializedContact(
          userName,
          profile.serializedContactCard,
          {
            urls: [
              ...(profile.webCard.commonInformation?.urls ?? []),
              ...(profile.contactCard?.urls ?? []),
            ],
            socials: [
              ...(profile.webCard.commonInformation?.socials ?? []),
              ...(profile.contactCard?.socials ?? []),
            ],
            avatar,
          },
        );
        const docPath = ReactNativeBlobUtil.fs.dirs.CacheDir;
        const filePath = `${docPath}/${userName}${profile.contactCard?.firstName?.trim() ? `-${profile.contactCard.firstName.trim()}` : ''}${profile.contactCard?.lastName?.trim() ? `-${profile.contactCard.lastName.trim()}` : ''}.vcf`;
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
