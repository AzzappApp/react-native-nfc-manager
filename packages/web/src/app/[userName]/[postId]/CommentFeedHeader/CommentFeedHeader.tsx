import Link from 'next/link';
import { useRef } from 'react';
import { Button } from '#ui';
import DownloadAppModal from '#components/DownloadAppModal';
import CoverRenderer from '#components/renderer/CoverRenderer';
import styles from './CommentFeedHeader.css';
import type { ModalActions } from '#ui/Modal';
import type { Media, WebCard } from '@azzapp/data/domains';

type CommentFeedHeaderProps = {
  webCard: WebCard;
  media: Media;
};

const CommentFeedHeader = (props: CommentFeedHeaderProps) => {
  const { webCard, media } = props;
  const download = useRef<ModalActions>(null);

  return (
    <>
      <div className={styles.feedHeader}>
        <Link
          href={`/${webCard.userName}`}
          className={styles.feedHeaderProfile}
        >
          {media && (
            <div className={styles.feedHeaderProfileCover}>
              <CoverRenderer
                width={20}
                media={media}
                webCard={webCard}
                staticCover
              />
            </div>
          )}
          <span>{webCard.userName}</span>
        </Link>
        <Button onClick={() => download.current?.open()} size="small">
          Follow
        </Button>
      </div>
      <DownloadAppModal ref={download} media={media} webCard={webCard} />
    </>
  );
};

export default CommentFeedHeader;
