'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Button } from '#ui';
import DownloadAppModal from '#components/DownloadAppModal';
import CoverPreview from '#components/renderer/CoverRenderer/CoverPreview';
import styles from './CommentFeedHeader.css';
import type { ModalActions } from '#ui/Modal';
import type { Media, Profile } from '@azzapp/data/domains';

type CommentFeedHeaderProps = {
  profile: Profile;
  media: Media;
};

const CommentFeedHeader = (props: CommentFeedHeaderProps) => {
  const { profile, media } = props;
  const download = useRef<ModalActions>(null);

  return (
    <>
      <div className={styles.feedHeader}>
        <Link
          href={`/${profile.userName}`}
          className={styles.feedHeaderProfile}
        >
          {media && (
            <div
              style={{
                marginRight: 5,
                borderRadius: 3,
                overflow: 'hidden',
                width: '20px',
                height: '32px',
              }}
            >
              <CoverPreview media={media} profile={profile} />
            </div>
          )}
          <span>{profile.userName}</span>
        </Link>
        <Button onClick={() => download.current?.open()} size="small">
          Follow
        </Button>
      </div>
      <DownloadAppModal ref={download} media={media} profile={profile} />
    </>
  );
};

export default CommentFeedHeader;
