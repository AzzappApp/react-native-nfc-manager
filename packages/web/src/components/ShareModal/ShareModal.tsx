'use client';
import dynamic from 'next/dynamic';
import { forwardRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { Modal, type ModalProps } from '#ui';
import styles from './ShareModal.css';
import ShareModalContent from './ShareModalContent';
import type { ModalActions } from '#ui/Modal';

type ShareModalProps = Omit<ModalProps, 'children'> & {
  link: string;
};

const AppIntlProvider = dynamic(() => import('../AppIntlProvider'), {
  ssr: false,
});

// eslint-disable-next-line react/display-name
const ShareModal = forwardRef<ModalActions, ShareModalProps>((props, ref) => {
  const { link, ...others } = props;

  return (
    <AppIntlProvider>
      <Modal ref={ref} {...others}>
        <div className={styles.header}>
          <span className={styles.title}>
            <FormattedMessage
              defaultMessage="Share"
              id="XabmbX"
              description="Share modal title"
            />
          </span>
        </div>
        <ShareModalContent link={link} />
      </Modal>
    </AppIntlProvider>
  );
});

export default ShareModal;
