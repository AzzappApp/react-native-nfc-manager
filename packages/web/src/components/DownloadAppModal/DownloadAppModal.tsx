import Image from 'next/image';
import { forwardRef } from 'react';
import { FormattedMessage } from 'react-intl';
import env from '#env';
import { Button, Modal, type ModalProps } from '#ui';
import dlIos from '#assets/images/icon_iOS.png';
import dlAndroid from '#assets/images/icon_Play_Store.png';
import CoverRenderer from '#components/renderer/CoverRenderer';
import styles from './DownloadAppModal.css';
import type { ModalActions } from '#ui/Modal';
import type { Media, WebCard } from '@azzapp/data';
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
          <CoverRenderer
            webCard={webCard}
            media={media}
            style={{
              boxShadow: '0px 0px 20px 0px rgba(0, 0, 0, 0.20)',
            }}
            width={125}
          />
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
          <div className={styles.footerButtons}>
            <Button.Link
              href={env.NEXT_PUBLIC_DOWNLOAD_IOS_APP}
              className={styles.footerButton}
            >
              <Image src={dlIos} alt="ios logo" width={24} />
              <FormattedMessage
                defaultMessage="iOS"
                id="IohNeB"
                description="Download link for iOS"
              />
            </Button.Link>
            <Button.Link
              href={env.NEXT_PUBLIC_DOWNLOAD_ANDROID_APP}
              className={styles.footerButton}
            >
              <Image src={dlAndroid} alt="android logo" width={24} />
              <FormattedMessage
                defaultMessage="Android"
                id="iaXPLY"
                description="Download link for android"
              />
            </Button.Link>
          </div>
        </div>
      </Modal>
    );
  },
);

export default DownloadAppModal;
