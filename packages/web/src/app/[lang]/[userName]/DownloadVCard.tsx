'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { buildVCard } from '@azzapp/shared/vCardHelpers';

const DownloadVCard = ({
  profileId,
  userName,
}: {
  profileId: string;
  userName: string;
}) => {
  const searchParams = useSearchParams();

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
              const link = document.createElement('a');
              link.href = fileURL;
              link.download = `${userName}.vcf`;
              link.click();
              link.remove();
            }
          }
        })
        .catch(() => void 0);
    }
  }, [profileId, searchParams, userName]);

  return null;
};

export default DownloadVCard;
