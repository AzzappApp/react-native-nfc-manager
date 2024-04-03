'use client';
import { decompressFromEncodedURIComponent } from 'lz-string';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { buildVCard } from '@azzapp/shared/vCardHelpers';
import { updateContactCardScanCounter } from '#app/actions/statisticsAction';
import LinkButton from '#ui/Button/LinkButton';
import styles from './DownloadVCard.css';
import type { WebCard } from '@azzapp/data';

const DownloadVCard = ({ webCard }: { webCard: WebCard }) => {
  const searchParams = useSearchParams();

  const [fileUrl, setFileUrl] = useState<string | undefined>();

  const [opened, setOpened] = useState(false);

  const [contact, setContact] = useState<{
    firstName: string;
    lastName: string;
    company: string;
  }>();

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

            const { vCard, contact } = await buildVCard(
              webCard.userName,
              contactData,
              additionalData,
            );

            if (contact.webCardId === webCard.id) {
              setContact(contact);
              const file = new Blob([vCard.toString()], { type: 'text/vcard' });
              const fileURL = URL.createObjectURL(file);
              setFileUrl(fileURL);
              setOpened(true);
              updateContactCardScanCounter(contact.profileId);
            }
          }
        })
        .catch(() => void 0);
    }
  }, [webCard.userName, webCard.id, searchParams]);

  return (
    <div
      id="contactCard"
      className={opened ? styles.openedOverlay : styles.overlay}
      onClick={event => {
        if ('id' in event.target && event.target.id === 'contactCard') {
          setOpened(false);
        }
      }}
      role="button"
    >
      <div
        className={opened ? styles.openedDialog : styles.dialog}
        role="dialog"
        aria-label="Modal with contact card download link"
      >
        <span className={styles.message}>{`You can download the Contact Card ${
          contact
            ? `of ${
                `${contact.firstName ?? ''}  ${
                  contact.lastName ?? ''
                }`.trim() ||
                contact.company ||
                webCard.userName
              }   🎉`
            : ''
        }`}</span>

        {fileUrl && (
          <LinkButton
            size="medium"
            href={fileUrl}
            download={`${webCard.userName}.vcf`}
          >
            Download the Contact Card
          </LinkButton>
        )}

        <button
          className={styles.closeButton}
          onClick={() => {
            setOpened(false);
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default DownloadVCard;
