import { forwardRef } from 'react';
import { Button, Modal, type ModalProps } from '#ui';
import CoverRenderer from '#components/renderer/CoverRenderer';
import styles from './DownloadAppModal.css';
import type { ModalActions } from '#ui/Modal';
import type { Media, WebCard } from '@azzapp/data/domains';
import type { ForwardedRef } from 'react';

type DownloadAppModalProps = Omit<ModalProps, 'children'> & {
  media: Media;
  webCard: WebCard;
};

// eslint-disable-next-line react/display-name
const DownloadAppModal = forwardRef(
  (props: DownloadAppModalProps, ref: ForwardedRef<ModalActions>) => {
    const { media, webCard, ...others } = props;

    return (
      <Modal ref={ref} {...others}>
        <div className={styles.coverWrapper}>
          <CoverRenderer webCard={webCard} media={media} />
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{webCard.nbPosts}</span>
            <span className={styles.statCategory}>Posts</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{webCard.nbFollowers}</span>
            <span className={styles.statCategory}>Followers</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{webCard.nbFollowings}</span>
            <span className={styles.statCategory}>Following</span>
          </div>
        </div>
        <div className={styles.footer}>
          <span className={styles.footerTitle}>
            Stay connected to {webCard.userName}
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
