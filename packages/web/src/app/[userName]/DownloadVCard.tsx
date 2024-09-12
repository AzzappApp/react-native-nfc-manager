'use client';
import cx from 'classnames';
import { decompressFromEncodedURIComponent } from 'lz-string';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { buildVCardFromSerializedContact } from '@azzapp/shared/vCardHelpers';
import { CloseIcon } from '#assets';
import { ButtonIcon } from '#ui';
import { updateContactCardScanCounter } from '#app/actions/statisticsAction';

import Avatar from '#ui/Avatar/Avatar';
import DownloadVCardLinkButton from '#ui/Button/DownloadVCardLinkButton';
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

  const handleClose = () => {
    setOpened(false);

    if (onClose) {
      onClose({ token });
    }
  };

  const handleAnimationEnd = useCallback(() => {
    if (!opened) {
      setClosing(true);
    }
  }, [opened]);

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
            defaultMessage: 'Modal with contact card download link',
            id: 'aumcS0',
            description: 'Download vCard modal aria label',
          })}
        >
          <div className={styles.avatarContainer}>
            {webCard.isMultiUser && contact ? (
              contact?.avatarUrl ? (
                <Avatar
                  variant="image"
                  url={contact.avatarUrl}
                  alt={
                    `${contact.firstName ?? ''}  ${contact.lastName ?? ''}`.trim() ||
                    contact.company ||
                    webCard.userName
                  }
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
                userName: contact
                  ? `${webCard.firstName ?? ''}  ${
                      webCard.lastName ?? ''
                    }`.trim() ||
                    webCard.companyName ||
                    webCard.userName
                  : '',
              }}
            />
          </span>

          {fileUrl && (
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
          )}

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
