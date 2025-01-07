'use client';

import { useRef } from 'react';
import { COVER_RATIO } from '@azzapp/shared/coverHelpers';
import CoverRenderer from '#components/renderer/CoverRenderer';
import { MAX_COVER_WIDTH } from '#components/renderer/CoverRenderer/CoverRenderer.css';
import useDimensions from '#hooks/useDimensions';
import DownloadVCard from '../DownloadVCard';
import styles from './WebCardPreview.css';
import type { WebCard, Media } from '@azzapp/data';

type WebCardPreviewProps = {
  webCard: WebCard;
  media: Media;
  cardBackgroundColor: string;
  handleCloseDownloadVCard: ({ token }: { token?: string }) => void;
};

const WebCardPreview = ({
  webCard,
  media,
  handleCloseDownloadVCard,
}: WebCardPreviewProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const dim = useDimensions(ref);

  const coverSize = getCoverSize(dim?.width, dim?.height);

  return (
    <div className={styles.webCardPreviewContainer}>
      <div ref={ref} className={styles.coverContainer}>
        <div className={styles.cover}>
          <CoverRenderer
            width={coverSize.width}
            webCard={webCard}
            media={media}
            priority
          />
        </div>
      </div>
      <DownloadVCard
        webCard={webCard}
        onClose={handleCloseDownloadVCard}
        step={0}
        startOpen
      />
    </div>
  );
};

export default WebCardPreview;

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
