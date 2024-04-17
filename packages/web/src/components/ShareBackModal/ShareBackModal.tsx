'use client';

import cx from 'classnames';
import { forwardRef } from 'react';
import { ShareBackIcon } from '#assets';
import { Modal, type ModalProps } from '#ui';

import Avatar from '#ui/Avatar/Avatar';
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
                <Avatar variant="icon" icon={<ShareBackIcon />} />
                {avatarUrl ? (
                  <Avatar variant="image" url={avatarUrl} alt={fullname} />
                ) : (
                  <Avatar variant="initials" initials={initials} />
                )}
              </>
            ) : null}
          </div>
          <span className={styles.title}>Share your details with</span>
          <span className={styles.title}>{fullname}</span>
        </div>

        <ShareBackModalForm token={token} userId={userId} />
      </Modal>
    );
  },
);

export default ShareBackModal;
