'use client';
import cx from 'classnames';
import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { CloseIcon } from '#assets';
import { ButtonIcon } from '#ui';
import LinkButton from '#ui/Button/LinkButton';
import styles from './DownloadVCard.css';

const AppIntlProvider = dynamic(
  () => import('../../components/AppIntlProvider'),
  {
    ssr: false,
  },
);
const AppClipLoadButton = () => {
  const [opened, setOpened] = useState(true);
  const [closing, setClosing] = useState(true);

  const handleClose = () => {
    setOpened(false);
  };

  const handleAnimationEnd = useCallback(() => {
    if (!opened) {
      setClosing(true);
    }
  }, [opened]);

  const showAppClip = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const appClipUrl = `https://appclip.apple.com/id?p=com.azzapp.app-dev.Clip&url=${encodeURIComponent(window.location.href)}`;

      // Open the App Clip URL
      window.location.href = appClipUrl;
    },
    [],
  );

  const intl = useIntl();

  return (
    <AppIntlProvider>
      <div
        id="contactCard"
        className={cx(styles.overlay, {
          [styles.openedOverlay]: opened || !closing,
        })}
        onClick={event => {
          if ('id' in event.target && event.target.id === 'contactCard') {
            handleClose();
          }
        }}
        role="button"
      >
        <div
          className={cx(
            styles.dialog,

            {
              [styles.closedDialog]: !opened,
            },
          )}
          onTransitionEnd={handleAnimationEnd}
          role="dialog"
          aria-label={intl.formatMessage({
            defaultMessage: 'Modal with AppClip link',
            id: 'XBfpVR',
            description: 'Launch AppClip aria label',
          })}
        >
          <LinkButton size="medium" onClick={showAppClip}>
            <FormattedMessage
              defaultMessage="Save Contact Card"
              id="TiZK4B"
              description="Save contact with AppClip modal message"
            />
          </LinkButton>

          <ButtonIcon
            onClick={handleClose}
            size={30}
            Icon={CloseIcon}
            className={styles.closeButton}
          />
        </div>
      </div>
    </AppIntlProvider>
  );
};

export default AppClipLoadButton;
