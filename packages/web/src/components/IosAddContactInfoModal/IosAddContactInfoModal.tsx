'use client';

import dynamic from 'next/dynamic';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import important from '@azzapp/web/public/important@3x.png';
import { Modal, type ModalProps } from '#ui';
import LinkButton from '#ui/Button/LinkButton';
import styles from './IosAddContactInfoModal.css';
import type { ModalActions } from '#ui/Modal';

const AppIntlProvider = dynamic(() => import('../AppIntlProvider'), {
  ssr: false,
});

type IosAddContactInfoModalProps = Omit<ModalProps, 'children'> & {
  onConfirm: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

// eslint-disable-next-line react/display-name
const IosAddContactInfoModal = forwardRef<
  ModalActions,
  IosAddContactInfoModalProps
>(({ onConfirm }, ref) => {
  const intl = useIntl();
  const internalRef = useRef<ModalActions>(null);

  useImperativeHandle(ref, () => ({
    close: () => {
      internalRef.current?.close();
    },
    open: () => {
      internalRef.current?.open();
    },
  }));

  const { innerHeight: height } = window;

  return (
    <AppIntlProvider>
      <Modal ref={internalRef} hideCloseButton disableClickOutside>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: height - 80,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 'auto',
              width: '100%',
              background: `url('${important.src}')`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div className={styles.bottomContainer}>
            <span className={styles.title}>
              {intl.formatMessage({
                defaultMessage: 'Important!',
                id: 'yUigRZ',
                description:
                  'Important! label in ios add contact information modal',
              })}
            </span>
            <span className={styles.subtitle}>
              {intl.formatMessage({
                defaultMessage: 'Click on « Create new contact »,not « Done »',
                id: '7x5NHn',
                description:
                  'informative label in ios add contact information modal',
              })}
            </span>
            <LinkButton
              size="medium"
              onClick={onConfirm}
              className={styles.buttonLink}
            >
              <FormattedMessage
                defaultMessage="Create new contact"
                id="spJduZ"
                description="Save contact with AppClip modal message"
              />
            </LinkButton>
          </div>
        </div>
      </Modal>
    </AppIntlProvider>
  );
});

export default IosAddContactInfoModal;
