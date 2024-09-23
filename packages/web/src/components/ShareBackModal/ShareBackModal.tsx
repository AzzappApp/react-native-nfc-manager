'use client';

import { sendGAEvent } from '@next/third-parties/google';
import cx from 'classnames';
import dynamic from 'next/dynamic';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { ShareBackIcon } from '#assets';
import { Modal, type ModalProps } from '#ui';

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
  isMultiUser?: boolean;
  initials: string;
};

// eslint-disable-next-line react/display-name
const ShareBackModal = forwardRef<ModalActions, ShareBackModalProps>(
  (props, ref) => {
    const { name, avatarUrl, token, userId, webcardId, isMultiUser, initials } =
      props;

    const internalRef = useRef<ModalActions>(null);

    useImperativeHandle(ref, () => ({
      close: () => {
        internalRef.current?.close();
      },
      open: () => {
        internalRef.current?.open();
      },
    }));

    return (
      <AppIntlProvider>
        <Modal ref={internalRef}>
          <div
            className={cx(
              styles.header,
              isMultiUser ? styles.headerContainsAvatars : '',
            )}
          >
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
            <span className={styles.title}>
              <FormattedMessage
                defaultMessage="Share your details with"
                id="vkuk13"
                description="Share back modal title"
              />
            </span>
            <span className={styles.title}>{name}</span>
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
              internalRef.current?.close();
            }}
          />
        </Modal>
      </AppIntlProvider>
    );
  },
);

export default ShareBackModal;
