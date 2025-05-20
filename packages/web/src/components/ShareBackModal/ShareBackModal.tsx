'use client';

import { sendGAEvent } from '@next/third-parties/google';
import cx from 'classnames';
import dynamic from 'next/dynamic';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { ShareBackIcon } from '#assets';
import { Modal, type ModalProps } from '#ui';

import ContactSteps from '#components/ContactSteps';
import Avatar from '#ui/Avatar/Avatar';
import styles from './ShareBackModal.css';
import ShareBackModalForm from './ShareBackModalForm';
import type { ModalActions } from '#ui/Modal';

const AppIntlProvider = dynamic(() => import('../AppIntlProvider'), {
  ssr: false,
});

type ShareBackModalProps = Omit<ModalProps, 'children'> & {
  name: string;
  avatarUrl?: string;
  token: string;
  userId: string;
  webcardId: string;
  initials: string;
  onClose: () => void;
};

// eslint-disable-next-line react/display-name
const ShareBackModal = forwardRef<ModalActions, ShareBackModalProps>(
  (props, ref) => {
    const { name, avatarUrl, token, userId, webcardId, initials, onClose } =
      props;

    const internalRef = useRef<ModalActions | null>(null);

    useImperativeHandle(ref, () => ({
      close: () => {
        internalRef.current?.close();
      },
      open: () => {
        internalRef.current?.open();
      },
    }));

    const setInternalRef = useCallback((node: ModalActions | null) => {
      if (node) {
        internalRef.current = node;
      }
    }, []);

    return (
      <AppIntlProvider>
        <Modal
          ref={setInternalRef}
          className={styles.shareBackModal}
          onClose={onClose}
          disableClickOutside
        >
          <div className={cx(styles.header)}>
            <div className={styles.avatarContainer}>
              <>
                <Avatar variant="icon" icon={<ShareBackIcon />} />
                {avatarUrl ? (
                  <Avatar variant="image" url={avatarUrl} alt={name} />
                ) : (
                  <Avatar variant="initials" initials={initials} />
                )}
              </>
            </div>
            <ContactSteps step={1} />
            <div className={styles.titleContainer}>
              <span className={styles.title}>
                <FormattedMessage
                  defaultMessage="Share your contact details with"
                  id="Y5FzDH"
                  description="Share back modal title"
                />
              </span>
              <span className={styles.title}>{name}</span>
            </div>
          </div>

          <ShareBackModalForm
            token={token}
            userId={userId}
            webcardId={webcardId}
            onSuccess={() => {
              sendGAEvent('event', 'shareback', {
                event_category: 'Form',
                event_label: 'ShareBackForm',
                value: 'Submit',
              });
              onClose();
              internalRef.current?.close();
            }}
          />
        </Modal>
      </AppIntlProvider>
    );
  },
);

export default ShareBackModal;
