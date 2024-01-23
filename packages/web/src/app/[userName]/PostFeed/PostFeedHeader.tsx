'use client';
import { useRef } from 'react';
import { CloseIcon, ShareIcon } from '#assets';
import { generateShareProfileLink } from '#helpers';
import { Button, ButtonIcon } from '#ui';
import DownloadAppModal from '#components/DownloadAppModal';
import ShareModal from '#components/ShareModal';
import styles from './PostFeed.css';
import type { ModalActions } from '#ui/Modal';
import type { Media, WebCard } from '@azzapp/data/domains';

type PostFeedHeaderProps = {
  webCard: WebCard;
  postsCount: number;
  media: Media;
  onClose?: () => void;
};

const PostFeedHeader = (props: PostFeedHeaderProps) => {
  const { webCard, postsCount, media, onClose } = props;
  const share = useRef<ModalActions>(null);
  const download = useRef<ModalActions>(null);

  return (
    <div style={{ position: 'relative' }}>
      <div className={styles.header}>
        <ButtonIcon
          Icon={CloseIcon}
          onClick={onClose}
          className={styles.close}
          aria-label="close"
        />
        <div className={styles.headerData}>
          <span className={styles.headerName}>{webCard.userName}</span>
          <span className={styles.headerPostsCount}>{postsCount} posts</span>
          <Button
            onClick={() => download.current?.open()}
            size="small"
            className={styles.headerButton}
          >
            Follow
          </Button>
        </div>
        <ButtonIcon
          Icon={ShareIcon}
          aria-label="Share post"
          onClick={() => share.current?.open()}
        />
      </div>
      <DownloadAppModal ref={download} webCard={webCard} media={media} />
      <ShareModal
        ref={share}
        link={generateShareProfileLink(webCard.userName)}
      />
    </div>
  );
};

export default PostFeedHeader;
