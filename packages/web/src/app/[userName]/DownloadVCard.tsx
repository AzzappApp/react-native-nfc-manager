'use client';
import cx from 'classnames';
import { decompressFromEncodedURIComponent } from 'lz-string';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { buildVCardFromSerializedContact } from '@azzapp/shared/vCardHelpers';
import { CloseIcon } from '#assets';
import { ButtonIcon } from '#ui';
import { updateContactCardScanCounter } from '#app/actions/statisticsAction';

import Avatar from '#ui/Avatar/Avatar';
import DownloadVCardLinkButton from '#ui/Button/DownloadVCardLinkButton';
import LinkButton from '#ui/Button/LinkButton';
import styles from './DownloadVCard.css';
import type { WebCard } from '@azzapp/data';

const AppIntlProvider = dynamic(
  () => import('../../components/AppIntlProvider'),
  {
    ssr: false,
  },
);
const DownloadVCard = ({
  webCard,
  onClose,
}: {
  webCard: WebCard;
  onClose?: (data: { token?: string; avatarUrl?: string }) => void;
}) => {
  const searchParams = useSearchParams();

  const [fileUrl, setFileUrl] = useState<string | undefined>();

  const [opened, setOpened] = useState(false);
  const [closing, setClosing] = useState(true);

  const [contact, setContact] = useState<{
    firstName: string;
    lastName: string;
    company: string;
    avatarUrl?: string;
  }>();

  const [token, setToken] = useState('');

  const [appClipIsSupported, setAppClipIsSupported] = useState(false);

  useEffect(() => {
    setAppClipIsSupported(isAppClipSupported());
  }, []);

  useEffect(() => {
    const compressedContactCard = searchParams.get('c');
    if (!compressedContactCard) {
      return;
    }

    let contactData: string;
    let signature: string;
    try {
      [contactData, signature] = JSON.parse(
        decompressFromEncodedURIComponent(compressedContactCard),
      );
    } catch {
      return;
    }

    if (contactData && signature) {
      fetch('/api/verifySign', {
        body: JSON.stringify({
          signature,
          data: contactData,
          salt: webCard.userName,
        }),
        method: 'POST',
      })
        .then(async res => {
          if (res.status === 200) {
            const additionalData = await res.json();

            if (additionalData.avatarUrl) {
              const data = await fetch(additionalData.avatarUrl);
              const blob = await data.arrayBuffer();
              const base64 = Buffer.from(blob).toString('base64');

              additionalData.avatar = {
                type: data.headers.get('content-type')?.split('/')[1] ?? 'png',
                base64,
              };
            }

            const { vCard, contact } = await buildVCardFromSerializedContact(
              webCard.userName,
              contactData,
              additionalData,
            );

            if (contact.webCardId === webCard.id) {
              const isIE = !!(window as any)?.StyleMedia;

              setContact({ ...contact, avatarUrl: additionalData.avatarUrl });
              const file = new Blob([vCard.toString()], {
                type: isIE ? 'application/octet-stream' : 'text/vcard',
              });
              const fileURL = URL.createObjectURL(file);
              setFileUrl(fileURL);
              setOpened(true);
              setClosing(false);
              updateContactCardScanCounter(contact.profileId);
              setToken(additionalData.token);
            }
          }
        })
        .catch(() => void 0);
    }
  }, [webCard.userName, webCard.id, searchParams]);

  const handleClose = useCallback(() => {
    setOpened(false);

    if (onClose) {
      onClose({ token });
    }
  }, [onClose, token]);

  const handleAnimationEnd = useCallback(() => {
    if (!opened) {
      setClosing(true);
    }
  }, [opened]);

  const intl = useIntl();
  const [appClipWasOpen, setAppClipWasOpen] = useState(false);
  const showAppClip = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      console.log('opening appclip');
      e.preventDefault();
      const appClipUrl = `${process.env.NEXT_PUBLIC_APPLE_APP_CLIP_URL}&url=${encodeURIComponent(window.location.href)}`;

      // Open the App Clip URL
      setAppClipWasOpen(true);
      window.location.href = appClipUrl;
    },
    [],
  );
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('App Clip is closed or user navigated away');
        // Show the shareback here
        if (appClipWasOpen) {
          handleClose();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [appClipWasOpen, handleClose]);

  const displayName = useMemo(() => {
    if (contact) {
      if (contact.firstName || contact.lastName) {
        return `${contact.firstName ?? ''}  ${contact.lastName ?? ''}`.trim();
      }
      if (contact.company) {
        return contact.company;
      }
    }
    if (webCard.firstName || webCard.lastName) {
      return `${webCard.firstName ?? ''}  ${webCard.lastName ?? ''}`.trim();
    }
    if (webCard.companyName) {
      return webCard.companyName;
    }
    return webCard.userName;
  }, [
    contact,
    webCard.companyName,
    webCard.firstName,
    webCard.lastName,
    webCard.userName,
  ]);

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
            defaultMessage: 'Modal with contact card download link',
            id: 'aumcS0',
            description: 'Download vCard modal aria label',
          })}
        >
          <div className={styles.avatarContainer}>
            {contact ? (
              contact?.avatarUrl ? (
                <Avatar
                  variant="image"
                  url={contact.avatarUrl}
                  alt={displayName}
                />
              ) : (
                <Avatar
                  variant="initials"
                  initials={`${contact.firstName?.length ?? 0 > 0 ? contact.firstName[0] : ''}${contact.lastName?.length ?? 0 > 0 ? contact.lastName[0] : ''}`}
                />
              )
            ) : null}
          </div>
          <span className={cx(styles.message)}>
            <FormattedMessage
              defaultMessage="Add {userName} to your contacts"
              id="5AubE3"
              description="Download vCard modal message"
              values={{
                userName: displayName,
              }}
            />
          </span>
          {appClipIsSupported ? (
            <LinkButton size="medium" onClick={showAppClip}>
              <FormattedMessage
                defaultMessage="Save Contact Card"
                id="TiZK4B"
                description="Save contact with AppClip modal message"
              />
            </LinkButton>
          ) : fileUrl ? (
            <DownloadVCardLinkButton
              size="medium"
              href={fileUrl}
              download={`${webCard.userName}${contact?.firstName.trim() ? `-${contact.firstName.trim()}` : ''}${contact?.lastName.trim() ? `-${contact.lastName.trim()}` : ''}.vcf`}
              userName={webCard.userName}
            >
              <FormattedMessage
                defaultMessage="Save Contact Card"
                id="a4m505"
                description="Download vCard modal message"
              />
            </DownloadVCardLinkButton>
          ) : null}

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

export default DownloadVCard;

const isAppClipSupported = () => {
  if (!process.env.NEXT_PUBLIC_APPLE_APP_ENABLED) {
    return false;
  }
  const userAgent = navigator.userAgent.toLowerCase();

  const isIOS = /iphone|ipad/.test(userAgent);
  const iosVersionMatch = userAgent.match(/os (\d+)_/);
  const iosVersion = iosVersionMatch ? parseInt(iosVersionMatch[1], 10) : 0;
  return isIOS && iosVersion >= 16.4; //opening appclip from link only supported after 16.4, open from another app is supported from 17.0
};
