'use client';

import { useRouter } from 'next/navigation';
import { useRef, useEffect } from 'react';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import CoverRenderer from '#components/renderer/CoverRenderer';
import { MAX_COVER_WIDTH } from '#components/renderer/CoverRenderer/CoverRenderer.css';
import { isAppClipSupported } from '#helpers/userAgent';
import useDimensions from '#hooks/useDimensions';
import DownloadVCard from '../DownloadVCard';
import styles from './CoverPreview.css';
import type { WebCard, Media } from '@azzapp/data';
import type { ContactCard } from '@azzapp/shared/contactCardHelpers';

type CoverPreviewProps = {
  webCard: WebCard;
  media: Media;
  handleCloseDownloadVCard: () => void;
  contactCard: ContactCard;
  contactData: {
    profileId: string;
    token: string;
    displayName: string;
    avatarUrl?: string;
  } | null;
};

const CoverPreview = ({
  webCard,
  media,
  contactCard,
  contactData,
  handleCloseDownloadVCard,
}: CoverPreviewProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const dim = useDimensions(ref);
  const router = useRouter();
  const appClipIsSupported = isAppClipSupported();
  const coverSize = getCoverSize(dim?.width, dim?.height);
  const wasHidden = useRef(false);

  useEffect(() => {
    if (!appClipIsSupported) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App Clip was opened
        wasHidden.current = true;
      } else if (wasHidden.current) {
        // App Clip was closed and we're back to the web page
        wasHidden.current = false;
        // Get current URL and remove /share and query parameters
        const currentUrl = window.location.href;
        const urlWithoutShare = currentUrl.replace('/share/', '/');
        const urlWithoutParams = urlWithoutShare.split('?')[0];

        // Use Next.js router for navigation
        router.push(`${urlWithoutParams}?source=share`);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log('remove');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [appClipIsSupported, router]);

  return (
    <div className={styles.coverPreviewContainer}>
      <div ref={ref} className={styles.coverContainer}>
        <div className={styles.cover}>
          <CoverRenderer
            width={coverSize.width}
            webCard={webCard}
            media={media}
            contentClass={styles.coverContentClass}
            priority
          />
        </div>
      </div>
      {contactData && (
        <DownloadVCard
          userName={webCard.userName!}
          onClose={handleCloseDownloadVCard}
          step={0}
          contactCard={contactCard}
          contactData={contactData}
          startOpen
        />
      )}
    </div>
  );
};

export default CoverPreview;

const getCoverSize = (targetWidth = 0, targetHeight = 0, ratio = 0.6) => {
  const maxWidth = Math.min(targetWidth, MAX_COVER_WIDTH);
  let width = maxWidth * ratio;
  let height = width / COVER_RATIO;

  if (height > targetHeight) {
    height = targetHeight * ratio;
    width = height * COVER_RATIO;
  }

  return { width, height };
};
