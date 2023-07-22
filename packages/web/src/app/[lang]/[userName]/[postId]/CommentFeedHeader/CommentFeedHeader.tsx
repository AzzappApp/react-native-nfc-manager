'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Button } from '#ui';
import DownloadAppModal from '#components/DownloadAppModal';
import CloudinaryImage from '#ui/CloudinaryImage';
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
            <CloudinaryImage
              mediaId={media.id}
              videoThumbnail={media.kind === 'video'}
              alt="cover"
              width={20}
              height={32}
              style={{
                objectFit: 'cover',
                marginRight: 5,
                borderRadius: 3,
              }}
            />
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
