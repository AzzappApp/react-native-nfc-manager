'use client';
import { forwardRef } from 'react';
import { Modal, type ModalProps } from '#ui';
import styles from './ShareModal.css';
import ShareModalContent from './ShareModalContent';
import type { ModalActions } from '#ui/Modal';

type ShareModalProps = Omit<ModalProps, 'children'> & {
  link: string;
};

// eslint-disable-next-line react/display-name
const ShareModal = forwardRef<ModalActions, ShareModalProps>((props, ref) => {
  const { link, ...others } = props;

  return (
    <Modal ref={ref} {...others}>
      <div className={styles.header}>
        <span className={styles.title}>Share</span>
      </div>
      <ShareModalContent link={link} />
    </Modal>
  );
});

export default ShareModal;
