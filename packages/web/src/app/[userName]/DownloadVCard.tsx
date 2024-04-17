'use client';
import cx from 'classnames';
import { decompressFromEncodedURIComponent } from 'lz-string';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { buildVCardFromSerializedContact } from '@azzapp/shared/vCardHelpers';
import { CloseIcon } from '#assets';
import { ButtonIcon } from '#ui';
import { updateContactCardScanCounter } from '#app/actions/statisticsAction';
import Avatar from '#ui/Avatar/Avatar';
import LinkButton from '#ui/Button/LinkButton';
import styles from './DownloadVCard.css';
import type { WebCard } from '@azzapp/data';

const DownloadVCard = ({
  webCard,
  onClose,
}: {
  webCard: WebCard;
  onClose?: (data: { token?: string; avatarUrl?: string }) => void;
}) => {
  const searchParams = useSearchParams();

  const [fileUrl, setFileUrl] = useState<string | undefined>();

  const [opened, setOpened] = useState(false);

  const [contact, setContact] = useState<{
    firstName: string;
    lastName: string;
    company: string;
    avatarUrl?: string;
  }>();

  const [token, setToken] = useState('');

  useEffect(() => {
    const compressedContactCard = searchParams.get('c');
    if (!compressedContactCard) {
      return;
    }

    let contactData: string;
    let signature: string;
    try {
      [contactData, signature] = JSON.parse(
        decompressFromEncodedURIComponent(compressedContactCard),
      );
    } catch {
      return;
    }

    if (contactData && signature) {
      fetch('/api/verifySign', {
        body: JSON.stringify({
          signature,
          data: contactData,
          salt: webCard.userName,
        }),
        method: 'POST',
      })
        .then(async res => {
          if (res.status === 200) {
            const additionalData = await res.json();

            if (additionalData.avatarUrl) {
              const data = await fetch(additionalData.avatarUrl);
              const blob = await data.arrayBuffer();
              const base64 = Buffer.from(blob).toString('base64');

              additionalData.avatar = {
                type: data.headers.get('content-type')?.split('/')[1] ?? 'png',
                base64,
              };
            }

            const { vCard, contact } = await buildVCardFromSerializedContact(
              webCard.userName,
              contactData,
              additionalData,
            );

            if (contact.webCardId === webCard.id) {
              setContact({ ...contact, avatarUrl: additionalData.avatarUrl });
              const file = new Blob([vCard.toString()], { type: 'text/vcard' });
              const fileURL = URL.createObjectURL(file);
              setFileUrl(fileURL);
              setOpened(true);
              updateContactCardScanCounter(contact.profileId);
              setToken(additionalData.token);
            }
          }
        })
        .catch(() => void 0);
    }
  }, [webCard.userName, webCard.id, searchParams]);

  const handleClose = () => {
    setOpened(false);
    if (onClose) {
      onClose({ token });
    }
  };

  return (
    <div
      id="contactCard"
      className={opened ? styles.openedOverlay : styles.overlay}
      onClick={event => {
        if ('id' in event.target && event.target.id === 'contactCard') {
          handleClose();
        }
      }}
      role="button"
    >
      <div
        className={opened ? styles.openedDialog : styles.dialog}
        role="dialog"
        aria-label="Modal with contact card download link"
      >
        <div className={styles.avatarContainer}>
          {webCard.isMultiUser && contact ? (
            contact?.avatarUrl ? (
              <Avatar
                variant="image"
                url={contact.avatarUrl}
                alt={
                  `${contact.firstName ?? ''}  ${contact.lastName ?? ''}`.trim() ||
                  contact.company ||
                  webCard.userName
                }
              />
            ) : (
              <Avatar
                variant="initials"
                initials={`${contact.firstName?.length ?? 0 > 0 ? contact.firstName[0] : ''}${contact.lastName?.length ?? 0 > 0 ? contact.lastName[0] : ''}`}
              />
            )
          ) : null}
        </div>
        <span
          className={cx(
            styles.message,
            webCard.isMultiUser ? styles.messageContainsAvatars : '',
          )}
        >{`Add ${
          contact
            ? `${
                `${contact.firstName ?? ''}  ${
                  contact.lastName ?? ''
                }`.trim() ||
                contact.company ||
                webCard.userName
              } to your contacts`
            : ''
        }`}</span>

        {fileUrl && (
          <LinkButton
            size="medium"
            href={fileUrl}
            download={`${webCard.userName}.vcf`}
          >
            Save Contact Card
          </LinkButton>
        )}

        <ButtonIcon
          onClick={handleClose}
          size={30}
          Icon={CloseIcon}
          className={styles.closeButton}
        />
      </div>
    </div>
  );
};

export default DownloadVCard;
