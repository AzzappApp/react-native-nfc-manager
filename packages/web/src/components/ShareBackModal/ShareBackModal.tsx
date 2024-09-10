'use client';

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
  fullname: string;
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
    const {
      fullname,
      avatarUrl,
      token,
      userId,
      webcardId,
      isMultiUser,
      initials,
    } = props;

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
              {isMultiUser ? (
                <>
                  <Avatar variant="icon" icon={<ShareBackIcon />} />
                  {avatarUrl ? (
                    <Avatar variant="image" url={avatarUrl} alt={fullname} />
                  ) : (
                    <Avatar variant="initials" initials={initials} />
                  )}
                </>
              ) : null}
            </div>
            <span className={styles.title}>
              <FormattedMessage
                defaultMessage="Share your details with"
                id="vkuk13"
                description="Share back modal title"
              />
            </span>
            <span className={styles.title}>{fullname}</span>
          </div>

          <ShareBackModalForm
            token={token}
            userId={userId}
            webcardId={webcardId}
            onSuccess={() => {
              internalRef.current?.close();
            }}
          />
        </Modal>
      </AppIntlProvider>
    );
  },
);

export default ShareBackModal;
