'use client';

import cx from 'classnames';
import { forwardRef } from 'react';
import { ShareBackIcon } from '#assets';
import { Modal, type ModalProps } from '#ui';

import styles from './ShareBackModal.css';
import ShareBackModalForm from './ShareBackModalForm';
import type { ModalActions } from '#ui/Modal';

type ShareBackModalProps = Omit<ModalProps, 'children'> & {
  fullname: string;
  avatarUrl?: string;
  token: string;
  userId: string;
  isMultiUser?: boolean;
  initials: string;
};

// eslint-disable-next-line react/display-name
const ShareBackModal = forwardRef<ModalActions, ShareBackModalProps>(
  (props, ref) => {
    const { fullname, avatarUrl, token, userId, isMultiUser, initials } = props;

    return (
      <Modal ref={ref}>
        <div
          className={cx(
            styles.header,
            isMultiUser ? styles.headerContainsAvatars : '',
          )}
        >
          <div className={styles.avatarContainer}>
            {isMultiUser ? (
              <>
                <div className={styles.avatarWrapper}>
                  <div className={styles.iconWrapper}>
                    <ShareBackIcon />
                  </div>
                </div>
                {avatarUrl ? (
                  <div className={styles.avatarWrapper}>
                    <img
                      className={styles.avatarImage}
                      src={avatarUrl}
                      alt={fullname}
                      width="70"
                      height="70"
                    />
                  </div>
                ) : (
                  <div className={styles.avatarWrapper}>
                    <span className={styles.avatarInitials}>{initials}</span>
                  </div>
                )}
              </>
            ) : null}
          </div>
          <span className={styles.title}>Share yours details with</span>
          <span className={styles.title}>{fullname}</span>
        </div>

        <ShareBackModalForm token={token} userId={userId} />
      </Modal>
    );
  },
);

export default ShareBackModal;
