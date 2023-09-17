'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { buildVCard } from '@azzapp/shared/vCardHelpers';
import LinkButton from '#ui/Button/LinkButton';
import styles from './DownloadVCard.css';
import type { Profile } from '@azzapp/data/domains';

const DownloadVCard = ({
  profile,
  profileId,
  userName,
}: {
  profile: Profile;
  profileId: string;
  userName: string;
}) => {
  const searchParams = useSearchParams();

  const [fileUrl, setFileUrl] = useState<string | undefined>();

  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const contactCard = searchParams.get('c');
    const signature = searchParams.get('s');

    if (contactCard && signature) {
      fetch('/api/verifySign', {
        body: JSON.stringify({
          signature,
          data: contactCard,
          salt: userName,
        }),
        method: 'POST',
      })
        .then(res => {
          if (res.status === 200) {
            const vCard = buildVCard(decodeURI(contactCard));

            if (contactCard.startsWith(profileId)) {
              const file = new Blob([vCard.toString()], { type: 'text/vcard' });
              const fileURL = URL.createObjectURL(file);
              setFileUrl(fileURL);
              setOpened(true);
            }
          }
        })
        .catch(() => void 0);
    }
  }, [profileId, searchParams, userName]);

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
      >
        <span
          className={styles.message}
        >{`You can download the contact card of ${
          `${profile.firstName ?? ''}  ${profile.lastName ?? ''}`.trim() ||
          profile.companyName
        }   🎉`}</span>

        <LinkButton size="medium" href={fileUrl} download={`${userName}.vcf`}>
          Download the contact card
        </LinkButton>

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
