'use client';

import { useEffect, useState, forwardRef } from 'react';
import { Button, Modal, type ModalProps } from '#ui';
import { loadProfileStats } from '#app/actions/profileActions';
import CloudinaryImage from '#ui/CloudinaryImage';
import styles from './DownloadAppModal.css';
import type { ModalActions } from '#ui/Modal';
import type { Media, Profile } from '@azzapp/data/domains';
import type { ForwardedRef } from 'react';

type DownloadAppModalProps = Omit<ModalProps, 'children'> & {
  media: Media;
  profile: Profile;
};

type Stats = {
  posts: number;
  followers: number;
  following: number;
};

// eslint-disable-next-line react/display-name
const DownloadAppModal = forwardRef(
  (props: DownloadAppModalProps, ref: ForwardedRef<ModalActions>) => {
    const { media, profile, ...others } = props;

    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
      async function loadStats() {
        const { nbFollowers, nbPosts, nbFollowings } = await loadProfileStats(
          profile.id,
        );
        setStats({
          posts: nbPosts,
          followers: nbFollowers,
          following: nbFollowings,
        });
      }

      void loadStats();
    }, [profile.id]);

    return (
      <Modal ref={ref} {...others}>
        <div className={styles.coverWrapper}>
          <CloudinaryImage
            mediaId={media.id}
            videoThumbnail={media.kind === 'video'}
            alt="cover"
            fill
            className={styles.cover}
          />
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats?.posts}</span>
            <span className={styles.statCategory}>Posts</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats?.followers}</span>
            <span className={styles.statCategory}>Followers</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{stats?.following}</span>
            <span className={styles.statCategory}>Following</span>
          </div>
        </div>
        <div className={styles.footer}>
          <span className={styles.footerTitle}>
            Stay connected to {profile.userName}
          </span>
          <span className={styles.footerText}>
            Access digital profile, albums, posts...
          </span>
          <Button.Link
            href={process.env.NEXT_PUBLIC_DOWNLOAD_MOBILE_APP}
            className={styles.footerButton}
          >
            Get Azzapp Mobile Application
          </Button.Link>
        </div>
      </Modal>
    );
  },
);

export default DownloadAppModal;
